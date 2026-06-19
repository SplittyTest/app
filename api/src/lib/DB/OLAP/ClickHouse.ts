import { ClickHouseClientConfigOptions, createClient, ClickHouseClient } from '@clickhouse/client';
import { isPlainObject, merge } from 'lodash-es';
import log from '@lib/Logger';
import { ExpandedTest, Metric, zEventSchema, zSessionSchema } from '@/types/schemas';
import { asyncForEach, asyncMap } from 'modern-async';
import { GetMetricSeriesDataParams, OLAPDB, SplitTestQueryResultRow } from '@/types/db';
import dayjs from '@lib/dayjs';
import isArrayWithLength from '@/lib/Utils/isArrayWithLength';
import { session } from 'passport';

export class ClickHouse implements OLAPDB {
	client: ClickHouseClient;
	database: string;
	// data_types: {
	// 	[key: string]: Record<string, string>;
	// };

	constructor(ch_config: ClickHouseClientConfigOptions) {
		this.client = createClient(ch_config);
		this.database = ch_config.database as string;

		// // Create a placeholder for table info
		// this.data_types = {};

		const merged_config = merge({}, ch_config, {
			clickhouse_settings: {
				date_time_output_format: 'iso',
			},
		});
		this.client = createClient(merged_config);
	}

	// Get the min date for querying test data
	async getMinDate(params: {
		variation_id: string;
		rolling_window: number;
		rolling_window_type: string;
	}): Promise<Date> {
		if (params.rolling_window_type === 'views') {
			const query = `
                SELECT
                    min(created_at) AS min_date
                FROM sessions
                WHERE
                    has(variation_ids, { variation_id: String })
                LIMIT { rolling_window: Int32 }
            `;

			const query_params = {
				variation_id: params.variation_id,
				rolling_window: params.rolling_window,
			};
			try {
				const result = await this.client.query({
					query,
					query_params,
					format: 'JSONEachRow',
				});

				const result_json = await result.json<{ min_date: Date }>();
				return result_json[0].min_date;
			} catch (err) {
				log.error(err);
				throw err;
			}
		} else {
			const query = `
                SELECT NOW() - INTERVAL { rolling_window: UInt32 } days AS min_date
            `;

			const query_params = {
				rolling_window: params.rolling_window,
			};
			try {
				const result = await this.client.query({
					query,
					query_params,
					format: 'JSONEachRow',
				});

				const result_json = await result.json<{ min_date: Date }>();
				return result_json[0].min_date;
			} catch (err) {
				log.error(err);
				throw err;
			}
		}
	}

	// Get the views result
	async getViews(params: { variation_id: string; min_date: Date; segments?: string[] }) {
		try {
			// Figure out segmentation
			let select_fields = '';
			let group_by = '';
			const grouping: string[] = [];
			if (Array.isArray(params.segments) && params.segments.length) {
				params.segments.forEach((segment, index) => {
					const aliases = ['segment_a', 'segment_b', 'segment_c'];
					select_fields += `CAST(data.${segment} AS String) AS ${aliases[index]},\n`;
					grouping.push(aliases[index]);
				});

				if (grouping.length) {
					group_by = `GROUP BY CUBE(${grouping.join(', ')})`;
				}
			} else {
				select_fields = "'' AS segment_a,";
			}

			// Get all sessions as views
			const views_query = `
                SELECT
                    ${select_fields}
                    count(id) AS views
                FROM ${this.database}.sessions
                WHERE
                    has(variation_ids, { variation_id: String })
                    AND created_at > { min_date: DateTime }
                ${group_by}
            `;
			const result = await this.client.query({
				query: views_query,
				query_params: {
					variation_id: params.variation_id,
					min_date: dayjs(params.min_date).format('YYYY-MM-DD hh:mm:ss'),
				},
				format: 'JSONEachRow',
			});

			const views_result = (await result.json()) as SplitTestQueryResultRow[];
			log.trace('Views result:', views_result);

			return views_result;
		} catch (err) {
			log.error(err);
			throw err;
		}
	}

	// Get the events result
	async getEvents(params: {
		variation_id: string;
		min_date: Date;
		event_type: string;
		strategy: string;
		segments?: string[];
		session_strategy?: string;
	}) {
		try {
			// How should we count events based on the session_strategy?
			// multiple: count all events
			// unique_sum: count unique events based on the event's unique_id, but sum the value of all events for the session
			// unique_avg: count unique events based on the event's unique_id, but average the value of all events for the session
			// unique_median: count unique events based on the event's unique_id, but take the median value of all events for the session
			// unique_first: count unique events based on the event's unique_id, but use the value of the first event for the session
			// unique_last: count unique events based on the event's unique_id, but overwrite value with the most recent event for the session

			// Segmentation
			let select_fields = '';
			let group_by = '';
			const grouping: string[] = [];
			if (Array.isArray(params.segments) && params.segments.length) {
				params.segments.forEach((segment, index) => {
					const aliases = ['segment_a', 'segment_b', 'segment_c'];
					select_fields += `CAST(data.${segment} AS String) AS ${aliases[index]},\n`;
					grouping.push(aliases[index]);
				});

				if (grouping.length) {
					group_by = `GROUP BY CUBE(${grouping.join(', ')})`;
				}
			} else {
				select_fields = "'' AS segment_a,";
			}

			// Pre-aggregate events based on session_strategy
			let event_values_query = `
				SELECT
					min(created_at) AS ts,
					session_id,
					data,
					count() AS count,
					sum(value) AS value
				FROM ${this.database}.events
				WHERE
					has(variation_ids, { variation_id: String })
					AND type = { event_type: String }
					AND created_at > { min_date: DateTime }
				GROUP BY session_id, data
				ORDER BY ts ASC
			`;
			if (params.session_strategy) {
				switch (params.session_strategy) {
					case 'unique_first':
						event_values_query = `
								SELECT
									min(created_at) AS ts,
									session_id,
									data,
									uniqExact(session_id) AS count,
									argMin(value, created_at) AS value
								FROM ${this.database}.events
								WHERE
									has(variation_ids, { variation_id: String })
									AND type = { event_type: String }
									AND created_at > { min_date: DateTime }
								GROUP BY session_id, data
								ORDER BY ts ASC
							`;
						break;
					case 'unique_last':
						event_values_query = `
							SELECT
								min(created_at) AS ts,
								session_id,
								data,
								uniqExact(session_id) AS count,
								argMax(value, created_at) AS value
							FROM ${this.database}.events
							WHERE
								has(variation_ids, { variation_id: String })
								AND type = { event_type: String }
								AND created_at > { min_date: DateTime }
							GROUP BY session_id, data
							ORDER BY ts ASC
						`;
						break;
					case 'unique_sum':
						event_values_query = `
							SELECT
								min(created_at) AS ts,
								session_id,
								data,
								uniqExact(session_id) AS count,
								sum(value) AS value
							FROM ${this.database}.events
							WHERE
								has(variation_ids, { variation_id: String })
								AND type = { event_type: String }
								AND created_at > { min_date: DateTime }
							GROUP BY session_id, data
							ORDER BY ts ASC
						`;
						break;
					case 'unique_avg':
						event_values_query = `
							SELECT
								min(created_at) AS ts,
								session_id,
								data,
								uniqExact(session_id) AS count,
								avg(value) AS value
							FROM ${this.database}.events
							WHERE
								has(variation_ids, { variation_id: String })
								AND type = { event_type: String }
								AND created_at > { min_date: DateTime }
							GROUP BY session_id, data
							ORDER BY ts ASC
						`;
						break;
					case 'unique_median':
						event_values_query = `
							SELECT
								min(created_at) AS ts,
								session_id,
								data,
								uniqExact(session_id) AS count,
								median(value) AS value
							FROM ${this.database}.events
							WHERE
								has(variation_ids, { variation_id: String })
								AND type = { event_type: String }
								AND created_at > { min_date: DateTime }
							GROUP BY session_id, data
							ORDER BY ts ASC
						`;
						break;
				}
			}

			// Get all events as events
			let query_strategy = params.strategy;
			if (params.strategy === 'rate') {
				query_strategy = 'sum';
			}
			const events_query = `
				WITH EventValues AS (
					${event_values_query}
				)
                SELECT
                    ${select_fields}
                    count AS events,
                    ${query_strategy}(value) AS event_value,
                    stddevPop(value) AS standard_deviation
                FROM EventValues
                ${group_by}
            `;

			const result = await this.client.query({
				query: events_query,
				query_params: {
					variation_id: params.variation_id,
					event_type: params.event_type,
					min_date: dayjs(params.min_date).format('YYYY-MM-DD hh:mm:ss'),
				},
				format: 'JSONEachRow',
			});

			const events_result = (await result.json()) as SplitTestQueryResultRow[];
			log.trace('events result:', events_result);

			return events_result;
		} catch (err) {
			log.error(err);
			throw err;
		}
	}

	// Get series data for a test and metric, segmented by provided segments
	async getTestSeriesData(test: ExpandedTest, metric: Metric, segments: string[]) {
		// Interval is based on length of range
		// How long has the test been running?
		const ended_at = test.ended_at ? dayjs(test.ended_at) : dayjs();
		const days_running = ended_at.diff(test.started_at, 'days', true);

		let interval = '10 minutes';
		let fill_interval = 'toIntervalMinute(10)';
		if (days_running > 90) {
			interval = '1 week';
			fill_interval = 'toIntervalWeek(1)';
		} else if (days_running > 30) {
			interval = '3 days';
			fill_interval = 'toIntervalDay(3)';
		} else if (days_running > 7) {
			interval = '1 day';
			fill_interval = 'toIntervalDay(1)';
		} else if (days_running > 2) {
			interval = '6 hours';
			fill_interval = 'toIntervalHour(6)';
		} else if (days_running > 1) {
			interval = '1 hour';
			fill_interval = 'toIntervalHour(1)';
		}

		// Determine the conversion functions
		let event_calculations = '';
		let query_calculations = '';
		if (metric.strategy === 'rate') {
			event_calculations = `
				sum(sum(value)) OVER (ORDER BY ts ASC) AS raw_event_value
			`;
			query_calculations = `
				(missing_events * { default_value: Float32 }) AS missing_event_value,
				(raw_event_value + missing_event_value) AS filled_event_value,
				(raw_event_value / views) AS variation_score,
				(filled_event_value / filled_views) AS filled_variation_score
			`;
		} else if (metric.strategy === 'avg') {
			event_calculations = `
				avgWeighted(avg(value), events) OVER (ORDER BY ts ASC) AS raw_event_value
			`;
			query_calculations = `
				{ default_value: Float32 } AS missing_event_value,
				(((raw_event_value * events) + (missing_event_value * missing_events)) / filled_events) AS filled_event_value,
				raw_event_value AS variation_score,
				filled_event_value AS filled_variation_score
			`;
		} else if (metric.strategy === 'sum') {
			event_calculations = `
				sum(sum(value)) OVER (ORDER BY ts ASC) AS raw_event_value
			`;
			query_calculations = `
				(missing_events * { default_value: Float32 }) AS missing_event_value,
				(raw_event_value + missing_event_value) AS filled_event_value,
				raw_event_value AS variation_score,
				filled_event_value AS filled_variation_score
			`;
		} else if (metric.strategy === 'median') {
			event_calculations = `
				medianWeighted(median(value), events) OVER (ORDER BY ts ASC) AS raw_event_value
			`;
			query_calculations = `
				{ default_value: Float32 } AS missing_event_value,
				if(events > missing_events, raw_event_value, missing_event_value) AS filled_event_value,
				raw_event_value AS variation_score,
				filled_event_value AS filled_variation_score
			`;
		}

		let segment_filters = '';
		const clean_segments = segments.filter((s) => s !== '');
		if (test.data_segments?.length && isArrayWithLength(clean_segments)) {
			test.data_segments.forEach((prop, index) => {
				if (segments[index] !== '') {
					segment_filters += `AND toString(data.${prop}) = '${segments[index]}'\n`;
				}
			});
		}

		// Get active variations from the test
		const variations = test.variations.filter((v) => {
			return v.status !== 'paused';
		});

		// Pre-aggregate events based on session_strategy
		let event_values_query = `
				SELECT
					min(created_at) AS ts,
					session_id,
					data,
					count() AS count,
					sum(value) AS value
				FROM ${this.database}.events
				WHERE
					created_at > { min_date: DateTime }
					AND type = { event_type: String }
					AND has(variation_ids, { variation_id: String })
					${segment_filters}
				GROUP BY session_id, data
				ORDER BY ts ASC
			`;
		if (metric.session_strategy) {
			switch (metric.session_strategy) {
				case 'unique_first':
					event_values_query = `
						SELECT
							min(created_at) AS ts,
							session_id,
							data,
							uniqExact(session_id) AS count,
							argMin(value, created_at) AS value
						FROM ${this.database}.events
						WHERE
							created_at > { min_date: DateTime }
							AND type = { event_type: String }
							AND has(variation_ids, { variation_id: String })
							${segment_filters}
						GROUP BY session_id, data
						ORDER BY ts ASC
					`;
					break;
				case 'unique_last':
					event_values_query = `
						SELECT
							min(created_at) AS ts,
							session_id,
							data,
							uniqExact(session_id) AS count,
							argMax(value, created_at) AS value
						FROM ${this.database}.events
						WHERE
							created_at > { min_date: DateTime }
							AND type = { event_type: String }
							AND has(variation_ids, { variation_id: String })
							${segment_filters}
						GROUP BY session_id, data
						ORDER BY ts ASC
					`;
					break;
				case 'unique_sum':
					event_values_query = `
						SELECT
							min(created_at) AS ts,
							session_id,
							data,
							uniqExact(session_id) AS count,
							sum(value) AS value
						FROM ${this.database}.events
						WHERE
							created_at > { min_date: DateTime }
							AND type = { event_type: String }
							AND has(variation_ids, { variation_id: String })
							${segment_filters}
						GROUP BY session_id, data
						ORDER BY ts ASC
					`;
					break;
				case 'unique_avg':
					event_values_query = `
						SELECT
							min(created_at) AS ts,
							session_id,
							data,
							uniqExact(session_id) AS count,
							avg(value) AS value
						FROM ${this.database}.events
						WHERE
							created_at > { min_date: DateTime }
							AND type = { event_type: String }
							AND has(variation_ids, { variation_id: String })
							${segment_filters}
						GROUP BY session_id, data
						ORDER BY ts ASC
					`;
					break;
				case 'unique_median':
					event_values_query = `
						SELECT
							min(created_at) AS ts,
							session_id,
							data,
							uniqExact(session_id) AS count,
							median(value) AS value
						FROM ${this.database}.events
						WHERE
							created_at > { min_date: DateTime }
							AND type = { event_type: String }
							AND has(variation_ids, { variation_id: String })
							${segment_filters}
						GROUP BY session_id, data
						ORDER BY ts ASC
					`;
					break;
			}
		}

		const results: Record<string, any> = {};
		await asyncForEach(
			variations,
			async (variation) => {
				const variation_stats_query = `
					WITH Sessions AS (
						SELECT
							DISTINCT toStartOfInterval(created_at, INTERVAL ${interval}) AS ts,
							sum(count()) OVER (ORDER BY ts ASC) AS views,
							greatest({ min_views: Int32 } - views, 0) AS missing_views,
							(views + missing_views) AS filled_views
						FROM ${this.database}.sessions FINAL
						WHERE
							created_at > { min_date: DateTime }
							AND has(variation_ids, { variation_id: String })
							${segment_filters}
						GROUP BY ts
						ORDER BY ts ASC WITH FILL STEP ${fill_interval}
							INTERPOLATE (views, missing_views, filled_views)
					),
					EventValues AS (
						${event_values_query}
					),
					Events AS (
						SELECT
							DISTINCT toStartOfInterval(ts, INTERVAL ${interval}) AS ts,
							sum(sum(count)) OVER (ORDER BY ts ASC) AS events,
							${event_calculations}
						FROM EventValues
						GROUP BY ts
						ORDER BY ts ASC WITH FILL STEP ${fill_interval}
							INTERPOLATE (events, raw_event_value)
					)
					SELECT
						s.ts AS ts,
						s.views AS views,
						s.missing_views AS missing_views,
						s.filled_views AS filled_views,
						e.events AS events,
						round(missing_views * { expected_decision_metric_rate: Float32 }) AS missing_events,
						(events + missing_events) AS filled_events,
						(events / views) AS rate,
						(filled_events) / (filled_views) AS filled_rate,
						${query_calculations}
					FROM Events e
					LEFT JOIN Sessions s ON s.ts = e.ts
				`;

				const result = await this.client.query({
					query: variation_stats_query,
					query_params: {
						default_value: metric.default_value,
						event_type: metric.event_type,
						expected_decision_metric_rate: test.expected_decision_metric_rate || 0,
						min_date: dayjs(test.started_at).format('YYYY-MM-DD hh:mm:ss'),
						min_views: test.min_views || 0,
						variation_id: variation.id,
					},
					format: 'JSONEachRow',
				});

				results[variation.id] = await result.json();
			},
			10,
		);

		return results;
	}

	// Get the possible segments for a metric
	async getMetricSegments(metric: Metric, date_range: [Date, Date]) {
		const query = `
			SELECT DISTINCT
				key AS property,
				groupArray(DISTINCT JSONExtractString(toString(data), key)) AS values
			FROM events
			ARRAY JOIN JSONAllPaths(data) AS key
			WHERE
				created_at BETWEEN { start_date: DateTime } AND { end_date: DateTime }
				AND type = { event_type: String }
			GROUP BY property
		`;

		const segment_results = await this.client.query({
			query,
			query_params: {
				event_type: metric.event_type,
				start_date: dayjs(date_range[0]).format('YYYY-MM-DD hh:mm:ss'),
				end_date: dayjs(date_range[1]).format('YYYY-MM-DD hh:mm:ss'),
			},
			format: 'JSONEachRow',
		});

		return (await segment_results.json()) as Record<string, any>[];
	}

	// Get series data for a specific-metric outside of test context, segmented by provided segments and date range
	// NOTE: We want to get all aggregated data for the given segments and also broken out by test variations if any
	async getMetricSeriesData(metric: Metric, params: GetMetricSeriesDataParams) {
		// Interval is based on length of range
		const start_date = dayjs(params.date_range[0]).format('YYYY-MM-DD hh:mm:ss');
		const end_date = dayjs(params.date_range[1]).format('YYYY-MM-DD hh:mm:ss');
		const time_range = dayjs(params.date_range[1]).diff(dayjs(params.date_range[0]), 'days', true);

		let interval = '10 minutes';
		let fill_interval = 'toIntervalMinute(10)';
		if (time_range > 90) {
			interval = '1 week';
			fill_interval = 'toIntervalWeek(1)';
		} else if (time_range > 30) {
			interval = '3 day';
			fill_interval = 'toIntervalDay(3)';
		} else if (time_range > 7) {
			interval = '1 day';
			fill_interval = 'toIntervalDay(1)';
		} else if (time_range > 2) {
			interval = '6 hours';
			fill_interval = 'toIntervalHour(6)';
		} else if (time_range > 1) {
			interval = '1 hour';
			fill_interval = 'toIntervalHour(1)';
		}

		// Group the results by variation_id or test_id if requested
		let grouping_select = '';
		let joined_grouping_select = '';
		let group_by = 'GROUP BY ts';
		let sessions_group_by = group_by;
		let joined_group_by = '';
		let partition_by = '';
		let join_on = 's.ts = e.ts';
		if (params.group_by) {
			grouping_select =
				params.group_by === 'variation_id'
					? 'arrayJoin(variation_ids) as variation_id,'
					: 'arrayJoin(test_ids) as test_id,';
			joined_grouping_select =
				params.group_by === 'variation_id' ? 'e.variation_id as variation_id,' : 'e.test_id as test_id,';
			group_by += `, ${params.group_by === 'variation_id' ? 'variation_id' : 'test_id'}`;
			sessions_group_by = group_by;
			joined_group_by = `GROUP BY ts, sessions, ts_sessions, events, ts_events, rate, ts_rate, e.raw_event_value, e.raw_ts_event_value, ${params.group_by === 'variation_id' ? 'variation_id' : 'test_id'}`;
			partition_by = params.group_by === 'variation_id' ? 'PARTITION BY variation_id ' : 'PARTITION BY test_id ';
			join_on += ` AND s.${params.group_by === 'variation_id' ? 'variation_id' : 'test_id'} = e.${params.group_by === 'variation_id' ? 'variation_id' : 'test_id'}`;
		}

		// Determine the conversion functions
		let event_calculations = '';
		let query_calculations = '';
		if (metric.strategy === 'rate') {
			event_calculations = `
				sum(sum(value)) OVER (${partition_by}ORDER BY ts ASC) AS raw_event_value,
				sum(value) AS raw_ts_event_value
			`;
			query_calculations = `
				(raw_event_value / sessions) AS variation_score,
				(raw_ts_event_value / ts_sessions) AS ts_variation_score
			`;
		} else if (metric.strategy === 'avg') {
			event_calculations = `
				avgWeighted(avg(value), ts_events) OVER (${partition_by}ORDER BY ts ASC) AS raw_event_value,
				avg(value) AS raw_ts_event_value
			`;
			query_calculations = `
				(raw_event_value / sessions) AS variation_score,
				(raw_ts_event_value / ts_sessions) AS ts_variation_score
			`;
		} else if (metric.strategy === 'sum') {
			event_calculations = `
				sum(sum(value)) OVER (${partition_by}ORDER BY ts ASC) AS raw_event_value,
				sum(value) AS raw_ts_event_value
			`;
			query_calculations = `
				(event_value / sessions) AS variation_score,
				(ts_event_value / ts_sessions) AS ts_variation_score
			`;
		} else if (metric.strategy === 'median') {
			event_calculations = `
				medianWeighted(median(value), ts_events) OVER (${partition_by}ORDER BY ts ASC) AS raw_event_value,
				median(value) AS raw_ts_event_value
			`;
			query_calculations = `
				(event_value / sessions) AS variation_score,
				(ts_event_value / ts_sessions) AS ts_variation_score
			`;
		}

		// Add where clauses for each of the given segments
		let segment_filters = '';
		if (isPlainObject(params.segments)) {
			Object.entries(params.segments).forEach(([key, value]) => {
				if (value !== '') {
					segment_filters += `AND data.${key} = '${value}'\n`;
				}
			});
		}

		// Only get stats for control
		if (params.control) {
			segment_filters += "AND arrayExists(x -> x LIKE '%-A', variation_ids)\n";
			group_by = 'GROUP BY ts';
			partition_by = '';
		}

		// ?? Return the number of sessions, tests served, and variations served for the metrics during the period
		const total_stats_query = `
			SELECT
				count() AS events,
				uniqArray(test_ids) as tests,
				uniqArray(variation_ids) as variations
			FROM splittytest.events
			WHERE
				created_at BETWEEN { start_date: DateTime } AND { end_date: DateTime }
				AND type = { event_type: String }
				AND subject_id = { subject_id: String }
				${segment_filters}
		`;

		// Pre-aggregate events based on session_strategy
		let event_values_group_by = `GROUP BY session_id, data`;
		if (params.group_by === 'variation_id') {
			event_values_group_by += ', variation_id';
		} else if (params.group_by === 'test_id') {
			event_values_group_by += ', test_id';
		}
		let event_values_query = `
				SELECT
					min(created_at) AS ts,
					session_id,
					data,
					${grouping_select}
					count() AS count,
					sum(value) AS value
				FROM ${this.database}.events
				WHERE
					created_at BETWEEN { start_date: DateTime } AND { end_date: DateTime }
					AND type = { event_type: String }
					AND subject_id = { subject_id: String }
					${segment_filters}
				${event_values_group_by}
				ORDER BY ts ASC
			`;
		if (metric.session_strategy) {
			switch (metric.session_strategy) {
				case 'unique_first':
					event_values_query = `
						SELECT
							min(created_at) AS ts,
							session_id,
							data,
							${grouping_select}
							uniqExact(session_id) AS count,
							argMin(value, created_at) AS value
						FROM ${this.database}.events
						WHERE
							created_at BETWEEN { start_date: DateTime } AND { end_date: DateTime }
							AND type = { event_type: String }
							AND subject_id = { subject_id: String }
							${segment_filters}
						${event_values_group_by}
						ORDER BY ts ASC
					`;
					break;
				case 'unique_last':
					event_values_query = `
						SELECT
							min(created_at) AS ts,
							session_id,
							data,
							${grouping_select}
							uniqExact(session_id) AS count,
							argMax(value, created_at) AS value
						FROM ${this.database}.events
						WHERE
							created_at BETWEEN { start_date: DateTime } AND { end_date: DateTime }
							AND type = { event_type: String }
							AND subject_id = { subject_id: String }
							${segment_filters}
						${event_values_group_by}
						ORDER BY ts ASC
					`;
					break;
				case 'unique_sum':
					event_values_query = `
						SELECT
							min(created_at) AS ts,
							session_id,
							data,
							${grouping_select}
							uniqExact(session_id) AS count,
							sum(value) AS value
						FROM ${this.database}.events
						WHERE
							created_at BETWEEN { start_date: DateTime } AND { end_date: DateTime }
							AND type = { event_type: String }
							AND subject_id = { subject_id: String }
							${segment_filters}
						${event_values_group_by}
						ORDER BY ts ASC
					`;
					break;
				case 'unique_avg':
					event_values_query = `
						SELECT
							min(created_at) AS ts,
							session_id,
							data,
							${grouping_select}
							uniqExact(session_id) AS count,
							avg(value) AS value
						FROM ${this.database}.events
						WHERE
							created_at BETWEEN { start_date: DateTime } AND { end_date: DateTime }
							AND type = { event_type: String }
							AND subject_id = { subject_id: String }
							${segment_filters}
						${event_values_group_by}
						ORDER BY ts ASC
					`;
					break;
				case 'unique_median':
					event_values_query = `
						SELECT
							min(created_at) AS ts,
							session_id,
							data,
							${grouping_select}
							uniqExact(session_id) AS count,
							median(value) AS value
						FROM ${this.database}.events
						WHERE
							created_at BETWEEN { start_date: DateTime } AND { end_date: DateTime }
							AND type = { event_type: String }
							AND subject_id = { subject_id: String }
							${segment_filters}
						${event_values_group_by}
						ORDER BY ts ASC
					`;
					break;
			}
		}

		const metric_series_query = `
			WITH Sessions AS (
				SELECT
					toStartOfInterval(created_at, INTERVAL ${interval}) AS ts,
					${grouping_select}
					sum(count()) OVER (${partition_by}ORDER BY ts ASC) AS sessions,
					count() AS ts_sessions
				FROM ${this.database}.sessions FINAL
				WHERE
					created_at BETWEEN { start_date: DateTime } AND { end_date: DateTime }
					AND subject_id = { subject_id: String }
					${segment_filters}
				${group_by}
				ORDER BY ts ASC WITH FILL STEP ${fill_interval}
					INTERPOLATE (sessions)
			),
			EventValues AS (
				${event_values_query}
			),
			Events AS (
				SELECT
					toStartOfInterval(ts, INTERVAL ${interval}) AS ts,
					${params.group_by === 'variation_id' ? 'variation_id,' : params.group_by === 'test_id' ? 'test_id,' : ''}
					sum(sum(count)) OVER (${partition_by}ORDER BY ts ASC) AS events,
					sum(count) AS ts_events,
					${event_calculations}
				FROM EventValues
				${group_by}, count
				ORDER BY ts ASC WITH FILL STEP ${fill_interval}
					INTERPOLATE (events, raw_event_value)
			)
			SELECT
				s.ts AS ts,
				${joined_grouping_select}
				s.sessions AS sessions,
				s.ts_sessions AS ts_sessions,
				e.events AS events,
				e.ts_events AS ts_events,
				round((events / sessions), 3) AS rate,
				round(ts_events / ts_sessions, 3) AS ts_rate,
				${query_calculations}
			FROM Events e
			LEFT JOIN Sessions s ON ${join_on}
			${joined_group_by}
			ORDER BY ts ASC
		`;

		const results = await Promise.all([
			this.client.query({
				query: total_stats_query,
				query_params: {
					event_type: metric.event_type,
					start_date,
					end_date,
					subject_id: metric.subject_id,
				},
				format: 'JSONEachRow',
			}),
			this.client.query({
				query: metric_series_query,
				query_params: {
					event_type: metric.event_type,
					start_date,
					end_date,
					subject_id: metric.subject_id,
				},
				format: 'JSONEachRow',
			}),
		]);

		return {
			stats: ((await results[0].json()) as Record<string, any>[])[0],
			series: (await results[1].json()) as Record<string, any>[],
		};
	}

	// Get the views for a test segment
	async getTestStats(test: ExpandedTest) {
		// Select the rolling type clause
		let rolling_type_days = '';
		let rolling_type_views = '';
		if (test.strategy === 'auto_optimize') {
			if (test.rolling_window_type === 'days') {
				rolling_type_days = 'AND created_at > NOW() - INTERVAL { rolling_window: UInt32 }';
			} else {
				rolling_type_views = 'ORDER BY created_at DESC LIMIT { rolling_window: UInt32 }';
			}
		}

		let grouping_clause = '';
		let segment_fields = "'segment' AS segment";
		const segments = test.data_segments;
		if (Array.isArray(segments) && segments.length > 0) {
			segment_fields = segments
				.map((segment) => {
					return `data.${segment} AS ${segment}`;
				})
				.join(',');

			const mapped_segments = segments.map((segment) => {
				return `data.${segment}`;
			});
			grouping_clause = `GROUP BY ${mapped_segments.join(', ')}`;
		}

		const test_stats: Record<string, any>[] = [];

		// Get stats for each variation
		await asyncForEach(test.variations, async (variation) => {
			// Get views for each segment
			const views_query = `
                    SELECT
                        '${variation.id}' AS variation_id,
                        ${segment_fields},
                        count(id) AS views,
                        min(created_at)
                    FROM sessions
                    WHERE
                        has(variation_ids, { variation_id: String })
                        ${rolling_type_days}
                    ${grouping_clause}
                    ${rolling_type_views}
            `;

			const views_query_params = {
				variation_id: variation.id,
				rolling_window: test.rolling_window,
			};

			const views_result = (await this.client.query({
				query: views_query,
				query_params: views_query_params,
			})) as unknown as Record<string, any>[];

			// Get events for each segment
			const full_results = await asyncMap(views_result, async (result_row) => {
				let segment_filters = '';
				if (Array.isArray(segments) && segments.length > 0) {
					segment_filters =
						'AND ' +
						segments
							?.map((segment) => {
								return `data.${segment} = '${result_row[segment]}'`;
							})
							.join(' AND ');
				}

				const events_query = `
                    SELECT
                        ${test.decision_metric.strategy}(value) AS event_value,
						stddevPop(value) AS standard_deviation
                    FROM events
                    WHERE
                        has(variation_ids, { variation_id: String })
                        AND type = '${test.decision_metric.event_type}'
                        AND created_at > { min_created_at: DateTime }
                        ${segment_filters}
                `;

				const events_query_params = {
					variation_id: variation.id,
					min_created_at: dayjs(test.started_at).format('YYYY-MM-DD hh:mm:ss'),
				};

				const events_result = (await this.client.query({
					query: events_query,
					query_params: events_query_params,
				})) as unknown as Record<string, any>[];
				if (Array.isArray(events_result) && events_result.length > 0) {
					result_row.event_value = events_result[0].event_value;
					result_row.standard_deviation = events_result[0].standard_deviation;
				}

				return result_row;
			});

			test_stats.push(...full_results);
		});

		return test_stats;
	}

	// Save an event to the Metrics DB
	async insertEvent(event: any) {
		try {
			const parsed_event = await zEventSchema.parseAsync(event);
			// Transform variations record to variation_ids array for ClickHouse
			const db_event = {
				...parsed_event,
				variation_ids: Object.values(parsed_event.variation_ids || {}),
				created_at: dayjs(parsed_event.created_at).format('YYYY-MM-DD HH:mm:ss'),
			};
			// remove variations key if it shouldn't be sent (though JSONEachRow might ignore extra keys if configured, safe to remove)
			delete (db_event as any).variations;

			return await this.client.insert({
				table: 'events',
				values: [db_event],
				format: 'JSONEachRow',
			});
		} catch (err) {
			log.warn('Unable to insert event', err);
		}
	}

	// Save a session to the Metrics DB
	async insertSession(session: any) {
		try {
			const parsed_session = await zSessionSchema.parseAsync(session);
			// Transform variation_ids record to array for ClickHouse
			const db_session = {
				...parsed_session,
				variation_ids: Object.values(parsed_session.variation_ids || {}),
				created_at: dayjs(parsed_session.created_at).format('YYYY-MM-DD HH:mm:ss'),
			};

			return await this.client.insert({
				table: 'sessions',
				values: [db_session],
				format: 'JSONEachRow',
			});
		} catch (err) {
			log.warn('Unable to insert session', err);
		}
	}

	async disconnect(): Promise<void> {
		await this.client.close();
	}
}

export default ClickHouse;
