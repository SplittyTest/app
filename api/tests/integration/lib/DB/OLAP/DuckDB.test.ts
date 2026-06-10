import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdtempSync, rmSync } from 'fs';
import { DuckDB } from '../../../../../src/lib/DB/OLAP/DuckDB';

// Minimal schema mirroring migrate/metrics/duckdb/00-init.ts
const CREATE_EVENTS = `CREATE TABLE events (id TEXT PRIMARY KEY, session_id TEXT, type TEXT, test_ids TEXT, variation_ids TEXT, data TEXT, value REAL, created_at TIMESTAMPTZ NOT NULL)`;
const CREATE_SESSIONS = `CREATE TABLE sessions (id TEXT PRIMARY KEY, subject_id TEXT, test_ids TEXT, variation_ids TEXT, data TEXT, created_at TIMESTAMPTZ NOT NULL)`;

function run(conn: any, sql: string, ...params: any[]): Promise<void> {
	return new Promise((res, rej) => conn.run(sql, ...params, (e: Error) => (e ? rej(e) : res())));
}

describe('DuckDB OLAP adapter', () => {
	let dir: string;
	let olap: DuckDB;

	beforeAll(async () => {
		dir = mkdtempSync(join(tmpdir(), 'duckdb-test-'));
		olap = new DuckDB(join(dir, 'duck.db'));
		// Create schema directly on the underlying connection
		await run(olap.conn, CREATE_EVENTS);
		await run(olap.conn, CREATE_SESSIONS);

		// Seed: one session + one event for variation 'v1', segment country=US
		// Insert via raw SQL to avoid ULID/schema validation (tests the query layer, not inserts)
		const now = new Date().toISOString();
		await run(
			olap.conn,
			`INSERT INTO sessions VALUES (?, ?, ?, ?, ?, ?)`,
			's1', 'subj1', '["t1"]', '["v1"]', '{"country":"US"}', now,
		);
		await run(
			olap.conn,
			`INSERT INTO events VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			'e1', 's1', 'click', '["t1"]', '["v1"]', '{"country":"US"}', 1, now,
		);
	});

	afterAll(async () => {
		await olap.disconnect();
		rmSync(dir, { recursive: true, force: true });
	});

	test('getViews returns the seeded view (no segments)', async () => {
		const rows = await olap.getViews({ variation_id: 'v1', min_date: new Date('2000-01-01') });
		expect(rows.length).toBeGreaterThan(0);
		expect(Number(rows[0].views)).toBe(1);
	});

	test('getViews with a segment extracts a clean (unquoted) segment value', async () => {
		const rows = await olap.getViews({ variation_id: 'v1', min_date: new Date('2000-01-01'), segments: ['country'] });
		const us = rows.find((r: any) => r.segment_a === 'US');
		expect(us).toBeDefined(); // would be '"US"' before the json_extract_string fix
	});

	test('getEvents runs and aggregates the seeded event', async () => {
		const rows = await olap.getEvents({
			variation_id: 'v1', min_date: new Date('2000-01-01'), event_type: 'click', strategy: 'sum',
		});
		expect(rows.length).toBeGreaterThan(0);
		expect(Number((rows[0] as any).event_value)).toBe(1);
	});

	test('getTestSeriesData runs without a SQL syntax error', async () => {
		const test: any = {
			started_at: new Date('2024-01-01'), ended_at: null, data_segments: [],
			decision_metric: { strategy: 'rate', event_type: 'click' },
			variations: [{ id: 'v1', status: 'active' }],
		};
		const metric: any = { event_type: 'click', strategy: 'rate' };
		const result = await olap.getTestSeriesData(test, metric, []);
		expect(result).toHaveProperty('v1');
		expect(Array.isArray(result.v1)).toBe(true);
	});
});
