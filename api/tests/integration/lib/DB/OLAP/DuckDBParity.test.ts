import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdtempSync, rmSync } from 'fs';
import { ulid } from 'ulid';
import { DuckDB } from '../../../../../src/lib/DB/OLAP/DuckDB';

const CREATE_EVENTS = `CREATE TABLE events (id TEXT PRIMARY KEY, session_id TEXT, type TEXT, subject_id TEXT, test_ids TEXT, variation_ids TEXT, data TEXT, value REAL, created_at TIMESTAMPTZ NOT NULL)`;
const CREATE_SESSIONS = `CREATE TABLE sessions (id TEXT PRIMARY KEY, subject_id TEXT, test_ids TEXT, variation_ids TEXT, data TEXT, created_at TIMESTAMPTZ NOT NULL)`;

function run(conn: any, sql: string): Promise<void> {
	return new Promise((res, rej) => conn.run(sql, (e: Error) => (e ? rej(e) : res())));
}

// IMPORTANT: seed through the adapters with SCHEMA-VALID data.
// zEventSchema / zSessionSchema require ULIDs for id/session_id/test_ids and an
// ARRAY for variation_ids. Invalid data is silently swallowed by insertEvent/
// insertSession (they catch the zod error and no-op), which would seed nothing.
const TEST_ID = ulid();
const SUBJECT_ID = 'sub1';
const firstEventId = ulid();

describe('DuckDB ↔ ClickHouse parity', () => {
	let dir: string;
	let olap: DuckDB;

	beforeAll(async () => {
		dir = mkdtempSync(join(tmpdir(), 'duckdb-parity-'));
		olap = new DuckDB(join(dir, 'duck.db'));
		await run(olap.conn, CREATE_EVENTS);
		await run(olap.conn, CREATE_SESSIONS);

		const s1 = ulid(), s2 = ulid(), s3 = ulid();
		// Two variations (v1, v2), country segment, a deliberate empty 01:00 bucket (gap)
		await olap.insertSession({ id: s1, subject_id: SUBJECT_ID, test_ids: [TEST_ID], variation_ids: ['v1'], data: { country: 'US' }, created_at: new Date('2024-01-01T00:10:00Z') });
		await olap.insertSession({ id: s2, subject_id: SUBJECT_ID, test_ids: [TEST_ID], variation_ids: ['v2'], data: { country: 'CA' }, created_at: new Date('2024-01-01T00:30:00Z') });
		await olap.insertSession({ id: s3, subject_id: SUBJECT_ID, test_ids: [TEST_ID], variation_ids: ['v1'], data: { country: 'US' }, created_at: new Date('2024-01-01T02:05:00Z') });
		await olap.insertEvent({ id: firstEventId, session_id: s1, type: 'click', subject_id: SUBJECT_ID, test_ids: [TEST_ID], variation_ids: ['v1'], data: { country: 'US' }, value: 1, created_at: new Date('2024-01-01T00:15:00Z') });
		await olap.insertEvent({ id: ulid(), session_id: s2, type: 'click', subject_id: SUBJECT_ID, test_ids: [TEST_ID], variation_ids: ['v2'], data: { country: 'CA' }, value: 2, created_at: new Date('2024-01-01T00:35:00Z') });
		await olap.insertEvent({ id: ulid(), session_id: s3, type: 'click', subject_id: SUBJECT_ID, test_ids: [TEST_ID], variation_ids: ['v1'], data: { country: 'US' }, value: 5, created_at: new Date('2024-01-01T02:10:00Z') });
	});

	afterAll(async () => {
		await olap.disconnect();
		rmSync(dir, { recursive: true, force: true });
	});

	test('insertEvent persists subject_id', async () => {
		const rows = await new Promise<any[]>((res, rej) =>
			olap.conn.all(`SELECT subject_id FROM events WHERE id = '${firstEventId}'`, (e: Error, r: any[]) => (e ? rej(e) : res(r))),
		);
		expect(rows.length).toBe(1);
		expect(rows[0].subject_id).toBe('sub1');
	});

	test('getMetricSegments discovers data keys and their distinct values', async () => {
		const metric: any = { event_type: 'click' };
		const segments = (await olap.getMetricSegments(metric, [new Date('2000-01-01'), new Date('2100-01-01')])) as any[];
		const country = segments.find((s: any) => s.property === 'country');
		expect(country).toBeDefined();
		expect(country.values.sort()).toEqual(['CA', 'US']);
	});
});
