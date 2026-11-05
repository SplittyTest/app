import { OLAPDB, SplitTestQueryResultRow } from '@/types/db';
import { ExpandedTest, Metric, zEventSchema, zSessionSchema } from '@/types/schemas';
import dayjs from '@lib/dayjs';
import { assertSafeIdentifier } from '@/lib/Utils/assertSafeIdentifier';
import log from '@lib/Logger';
import { DuckDBConnection, DuckDBInstance, DuckDBType, INTEGER } from '@duckdb/node-api';

// Bind JS values the way the legacy `duckdb` package did: whole numbers as
// INTEGER, Dates as ISO strings, undefined as NULL. Everything else is inferred.
function bindParams(params: any[]): { values: any[]; types: (DuckDBType | undefined)[] } {
	const values: any[] = [];
	const types: (DuckDBType | undefined)[] = [];
	for (const p of params) {
		if (p instanceof Date) {
			values.push(p.toISOString());
			types.push(undefined);
		} else if (typeof p === 'number' && Number.isInteger(p) && Math.abs(p) <= 2147483647) {
			values.push(p);
			types.push(INTEGER);
		} else {
			values.push(p === undefined ? null : p);
			types.push(undefined);
		}
	}
	return { values, types };
}

// Large integer results (SUM, COUNT, HUGEINT) come back as bigint; convert them
// to numbers so rows stay JSON-serialisable and work with existing maths.
function normaliseRow(row: Record<string, any>): Record<string, any> {
	for (const key of Object.keys(row)) {
		if (typeof row[key] === 'bigint') row[key] = Number(row[key]);
	}
	return row;
}

async function runAll(conn: Promise<DuckDBConnection>, sql: string, params: any[] = []): Promise<any[]> {
	const { values, types } = bindParams(params);
	const reader = await (await conn).runAndReadAll(sql, values, types as any);
	return reader.getRowObjectsJS().map((row) => normaliseRow(row as Record<string, any>));
}

async function runExec(conn: Promise<DuckDBConnection>, sql: string, params: any[] = []): Promise<void> {
	const { values, types } = bindParams(params);
	await (await conn).run(sql, values, types as any);
}

export class DuckDB implements OLAPDB {
	instance?: DuckDBInstance;
	conn: Promise<DuckDBConnection>;
	path: string;

	constructor(path: string) {
		// Expect path from config: config.get('db.olap.duckdb.path')
		this.path = path;
		this.conn = (async () => {
			this.instance = await DuckDBInstance.create(path);
			return this.instance.connect();
		})();
		// Log startup failures; queries awaiting this.conn still see the error
		this.conn.catch((err) => log.error(err));
	}

	private variationFilter(): string {
		// list_contains(CAST(json_parse(variation_ids) AS LIST(VARCHAR)), ?)
		return 'list_contains(CAST(json_parse(variation_ids) AS LIST(VARCHAR)), ?)';
	}

	private segmentSelect(segments?: string[], aliases: string[] = ['segment_a', 'segment_b', 'segment_c']) {
		if (!segments || segments.length === 0) {
			return { select: "'' AS segment_a", groupBy: '' };
		}
		const mapped: string[] = [];
		const grouping: string[] = [];
		segments.forEach((segment, idx) => {
			const alias = aliases[idx];
			mapped.push(`COALESCE(CAST(json_extract(data, '$.${assertSafeIdentifier(segment)}') AS VARCHAR), '') AS ${alias}`);
			grouping.push(alias);
		});

		// Use CUBE for parity with ClickHouse
		const groupFields = grouping.join(', ');
		return { select: mapped.join(',\n'), groupBy: `GROUP BY CUBE(${groupFields})` };
	}

	async getMinDate(params: {
		variation_id: string;
		rolling_window: number;
		rolling_window_type: string;
	}): Promise<Date> {
		try {
			if (params.rolling_window_type === 'views') {
				const sql = `
					SELECT min(created_at) AS min_date
					FROM (
						SELECT created_at
						FROM sessions
						WHERE ${this.variationFilter()}
						ORDER BY created_at ASC
						LIMIT ?
					) sub
				`;
				const rows = await runAll(this.conn, sql, [params.variation_id, params.rolling_window]);
				if (rows.length && rows[0].min_date) return new Date(rows[0].min_date);
				return new Date();
			} else {
				// Days rolling window
				const sql = 'SELECT (now() - INTERVAL ? DAY) AS min_date';
				const rows = await runAll(this.conn, sql, [params.rolling_window]);
				if (rows.length && rows[0].min_date) return new Date(rows[0].min_date);
				return new Date();
			}
		} catch (err) {
			log.error(err);
			throw err;
		}
	}

	async getViews(params: {
		variation_id: string;
		min_date: Date;
		segments?: string[];
	}): Promise<SplitTestQueryResultRow[]> {
		try {
			const { select, groupBy } = this.segmentSelect(params.segments);
			const sql = `
				SELECT
					${select},
					CAST(COUNT(id) AS INTEGER) AS views
				FROM sessions
				WHERE ${this.variationFilter()} AND created_at > ?
				${groupBy}
			`;
			const rows = await runAll(this.conn, sql, [params.variation_id, dayjs(params.min_date).toISOString()]);
			// console.log('[DuckDB] getViews SQL:', sql);
			// console.log('[DuckDB] getViews Params:', [params.variation_id, dayjs(params.min_date).toISOString()]);
			// console.log('[DuckDB] getViews Rows:', rows);
			return rows as SplitTestQueryResultRow[];
		} catch (err) {
			log.error(err);
			throw err;
		}
	}

	async getEvents(params: {
		variation_id: string;
		min_date: Date;
		event_type: string;
		strategy: string;
		segments?: string[];
	}): Promise<SplitTestQueryResultRow[]> {
		try {
			const { select, groupBy } = this.segmentSelect(params.segments);
			// Map strategy 'rate' -> 'sum' similar to ClickHouse adapter
			let strategy = params.strategy === 'rate' ? 'sum' : params.strategy;
			if (!['sum', 'avg', 'min', 'max'].includes(strategy)) {
				strategy = 'sum';
			}
			const sql = `
				SELECT
					${select},
					CAST(COUNT(id) AS INTEGER) AS events,
					${strategy}(value) AS event_value,
					STDDEV_POP(value) AS standard_deviation
				FROM events
				WHERE ${this.variationFilter()} AND type = ? AND created_at > ?
				${groupBy}
			`;
			const rows = await runAll(this.conn, sql, [
				params.variation_id,
				params.event_type,
				dayjs(params.min_date).toISOString(),
			]);
			return rows as SplitTestQueryResultRow[];
		} catch (err) {
			log.error(err);
			throw err;
		}
	}

	async getTestStats(test: ExpandedTest): Promise<Record<string, any>[]> {
		const results: Record<string, any>[] = [];
		try {
			// Determine rolling window constraints
			let timeConstraint = '';
			if (test.strategy === 'auto_optimize') {
				if (test.rolling_window_type === 'days') {
					timeConstraint = 'AND created_at > (now() - INTERVAL ? DAY)';
				}
			}
			const segments: string[] | undefined = Array.isArray(test.data_segments) ? test.data_segments : undefined;
			const segmentAliases = segments
				? segments.map((_, i) => `segment_${String.fromCharCode(97 + i)}`)
				: ['segment_a'];
			const { select, groupBy } = this.segmentSelect(segments, segmentAliases);

			for (const variation of test.variations) {
				// Views per segment
				const viewsSql = `
					SELECT
						CAST(? AS VARCHAR) AS variation_id,
						${select},
						CAST(COUNT(id) AS INTEGER) AS views,
						MIN(created_at) AS min_created_at
					FROM sessions
					WHERE ${this.variationFilter()} ${timeConstraint}
					${groupBy}
				`;
				// Variation id + optional time window param
				// First param fills the selected variation_id, second the variation filter
				const paramsList: any[] = [variation.id, variation.id];
				if (timeConstraint) paramsList.push(test.rolling_window);
				const viewRows = await runAll(this.conn, viewsSql, paramsList);

				// For each segment row fetch events and calculate stats
				for (const row of viewRows) {
					let segmentFilters = '';
					if (segments && segments.length) {
						segmentFilters = segments
							.map((segment) => `AND CAST(json_extract(data, '$.${assertSafeIdentifier(segment)}') AS VARCHAR) = ?`)
							.join(' ');
					}
					const strategy = test.decision_metric.strategy === 'rate' ? 'sum' : test.decision_metric.strategy;
					const convSql = `
						SELECT
							${strategy}(value) AS value,
							STDDEV_POP(value) AS standard_deviation
						FROM events
						WHERE ${this.variationFilter()} AND type = ? AND created_at > ? ${segmentFilters}
					`;
					const convParams: any[] = [variation.id, test.decision_metric.event_type, row.min_created_at];
					if (segments && segments.length) {
						segments.forEach((segment) => convParams.push(row[`segment_${segment}`] || row[segment]));
					}
					const convRows = await runAll(this.conn, convSql, convParams);
					if (convRows.length) {
						row.event_value = convRows[0].value;
						row.standard_deviation = convRows[0].standard_deviation;
					}
					results.push(row);
				}
			}
			return results;
		} catch (err) {
			log.error(err);
			return results;
		}
	}

	async getTestSeriesData(test: ExpandedTest, metric: Metric, segments: string[]) {
		// Interval is based on length of range
		const ended_at = test.ended_at ? dayjs(test.ended_at) : dayjs();
		const days_running = ended_at.diff(test.started_at, 'days', true);

		let interval = '10 minutes';
		if (days_running > 7) {
			interval = '1 day';
		} else if (days_running > 2) {
			interval = '6 hours';
		} else if (days_running > 1) {
			interval = '1 hour';
		}

		// Determine the conversion functions.
		// DuckDB does not support WITH FILL natively. We implement raw query for now.
		let query_calculations = '';
		if (test.decision_metric.strategy === 'rate') {
			query_calculations = `
                SUM(sum_value) OVER (ORDER BY ts ASC) AS event_value,
                0 AS missing_event_value,
                SUM(sum_value) OVER (ORDER BY ts ASC) AS filled_event_value,
                (SUM(sum_value) OVER (ORDER BY ts ASC) / NULLIF(SUM(count_views) OVER (ORDER BY ts ASC), 0)) AS variation_score,
                (SUM(sum_value) OVER (ORDER BY ts ASC) / NULLIF(SUM(count_views) OVER (ORDER BY ts ASC), 0)) AS filled_variation_score
            `;
		} else {
			// Fallback for other strategies
			query_calculations = `
                SUM(sum_value) OVER (ORDER BY ts ASC) AS event_value,
                0 AS missing_event_value,
                SUM(sum_value) OVER (ORDER BY ts ASC) AS filled_event_value,
                SUM(sum_value) OVER (ORDER BY ts ASC) AS variation_score,
                SUM(sum_value) OVER (ORDER BY ts ASC) AS filled_variation_score
            `;
		}

		let segment_filters = '';
		const segment_params: string[] = [];
		if (test.data_segments?.length && segments.length > 0) {
			test.data_segments.forEach((prop, index) => {
				if (segments[index] !== undefined && segments[index] !== '') {
					segment_filters += `AND CAST(json_extract(data, '$.${assertSafeIdentifier(prop)}') AS VARCHAR) = ?\n`;
					segment_params.push(String(segments[index]));
				}
			});
		}

		const variations = test.variations.filter((v) => {
			return v.status !== 'paused';
		});

		const results: Record<string, any> = {};

		await Promise.all(
			variations.map(async (variation) => {
				const variation_stats_query = `
                SELECT
                    time_bucket(INTERVAL '${interval}', created_at) AS ts,
                    CAST(COUNT(DISTINCT session_id) AS INTEGER) AS count_views,
                    CAST(SUM(CASE WHEN type = ? THEN 1 ELSE 0 END) AS INTEGER) AS count_events,
                    SUM(CASE WHEN type = ? THEN value ELSE 0 END) AS sum_value
                FROM events
                WHERE
                    ${this.variationFilter()}
                    ${segment_filters}
                GROUP BY ts
                ORDER BY ts ASC
            `;

				const full_query = `
                SELECT
                    ts,
                    SUM(count_views) OVER (ORDER BY ts ASC) AS views,
                    0 AS missing_views, 
                    SUM(count_views) OVER (ORDER BY ts ASC) AS filled_views,
                    SUM(count_events) OVER (ORDER BY ts ASC) AS events,
                    0 AS missing_events,
                    SUM(count_events) OVER (ORDER BY ts ASC) AS filled_events,
                    (SUM(count_events) OVER (ORDER BY ts ASC) * 1.0 / NULLIF(SUM(count_views) OVER (ORDER BY ts ASC), 0)) AS rate,
                    (SUM(count_events) OVER (ORDER BY ts ASC) * 1.0 / NULLIF(SUM(count_views) OVER (ORDER BY ts ASC), 0)) AS filled_rate,
                    ${query_calculations}
                FROM (${variation_stats_query}) sub
            `;

				// Placeholders in order: the two CASE WHEN type = ? (event count and value), the variation filter,
				// then each segment filter
				const rows = await runAll(this.conn, full_query, [
					metric.event_type,
					metric.event_type,
					variation.id,
					...segment_params,
				]);

				results[variation.id] = rows;
			}),
		);

		return results;
	}

	async getMetricSegments(metric: Metric, date_range: [Date, Date]) {
		return [];
	}

	async getMetricSeriesData(metric: Metric, params: any) {
		return {};
	}

	async insertEvent(event: any) {
		try {
			const parsed = await zEventSchema.parseAsync(event);
			const row = {
				id: parsed.id,
				session_id: parsed.session_id,
				type: parsed.type,
				test_ids: JSON.stringify(parsed.test_ids),
				variation_ids: JSON.stringify(Object.values(parsed.variation_ids || {})),
				data: JSON.stringify(parsed.data),
				value: parsed.value,
				created_at: dayjs(parsed.created_at).toISOString(),
			};
			await runExec(
				this.conn,
				'INSERT INTO events (id, session_id, type, test_ids, variation_ids, data, value, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
				[
					row.id,
					row.session_id,
					row.type,
					row.test_ids,
					row.variation_ids,
					row.data,
					row.value,
					row.created_at,
				],
			);
			return undefined;
		} catch (err) {
			log.warn('Unable to insert event', err);
			return undefined;
		}
	}

	async insertSession(session: any) {
		try {
			const parsed = await zSessionSchema.parseAsync(session);
			const row = {
				id: parsed.id,
				project_id: parsed.project_id,
				test_ids: JSON.stringify(parsed.test_ids),
				variation_ids: JSON.stringify(Object.values(parsed.variation_ids || {})),
				data: JSON.stringify(parsed.data),
				created_at: dayjs(parsed.created_at).toISOString(),
			};
			await runExec(
				this.conn,
				'INSERT INTO sessions (id, project_id, test_ids, variation_ids, data, created_at) VALUES (?, ?, ?, ?, ?, ?)',
				[row.id, row.project_id, row.test_ids, row.variation_ids, row.data, row.created_at],
			);
			return undefined;
		} catch (err) {
			log.warn('Unable to insert session', err);
			return undefined;
		}
	}

	async disconnect(): Promise<void> {
		try {
			(await this.conn).closeSync();
			this.instance?.closeSync();
		} catch (err) {
			log.error(err);
		}
	}
}

export default DuckDB;
