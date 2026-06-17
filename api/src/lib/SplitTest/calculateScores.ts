import DB from '@lib/DB';
import Logger from '@lib/Logger';
import { every, forIn, take } from 'lodash-es';
import { asyncForEach } from 'modern-async';
import hash from 'hash-it';
import { calculateVariationScore } from './calculateVariationScore';
import isArrayWithLength from '@lib/Utils/isArrayWithLength';
import { changeVariationStatus } from './changeVariationStatus';
import { getStrategy } from '../Analysis';
import { Metric } from '@/types/schemas';
import { sendWebhook } from '../Utils/webhook';

export interface VariationResult {
	variation_id: string;
	segment_hash: string;
	segment_a?: string;
	segment_b?: string;
	segment_c?: string;
	view_count: number;
	filled_view_count?: number;
	event_count: number;
	filled_event_count?: number;
	event_value: number;
	filled_event_value?: number;
	event_rate: number;
	filled_event_rate?: number;
	event_range: number[];
	filled_event_range?: number[];
	variation_score: number;
	filled_variation_score?: number;
	variation_score_range: number[];
	filled_variation_score_range?: number[];
	mode?: string;
}

export interface SegmentResult {
	[variation_id: string]: VariationResult;
}

export interface SplitTestResult {
	[segment_hash: string]: SegmentResult;
}

export interface SplitTestQueryResultRow {
	segment_a: string;
	segment_b?: string;
	segment_c?: string;
	views?: number;
	events?: number;
	event_value?: number;
	standard_deviation?: number;
}

// Calculate the conversion scores of all variations for a test
export async function calculateScores(test_id: string, metric_id?: string, alt_strategy?: string) {
	const log = Logger.child({
		method: 'calculateScores',
		test_id,
	});

	// Get the test details to understand the variations and segments we need to calculate for
	const test = await DB.Tests.getExpandedById(test_id);

	if (test) {
		// Get the metric details to understand the event type and strategy
		let metric: Metric = test?.decision_metric;
		if (metric_id) {
			const custom_metric = await DB.Metrics.getById(metric_id);
			if (custom_metric) {
				metric = custom_metric;
			}
		}

		const variations = test.variations;
		const all_segments: string[] = ['default']; // Default to all segments
		const results: SplitTestResult = {
			default: {},
		};

		// Flag if a test is segmented
		const is_segmented = isArrayWithLength(test.data_segments);

		await asyncForEach(
			variations,
			async (variation) => {
				const variation_id = variation.id;
				const min_date = await DB.OLAP.getMinDate({
					variation_id,
					rolling_window: test.rolling_window,
					rolling_window_type: test.rolling_window_type,
				});

				const views_result = await DB.OLAP.getViews({
					variation_id,
					min_date,
					segments: test.data_segments || [],
				});

				const strategy = alt_strategy || metric.strategy || 'rate';
				const events_result = await DB.OLAP.getEvents({
					variation_id,
					min_date,
					event_type: metric.event_type,
					strategy,
					segments: test.data_segments || [],
					session_strategy: metric.session_strategy,
				});

				// Calculate the values for each segment and save to redis
				if (is_segmented) {
					// The segment_hash is a hash-it hash of the array of segment values
					views_result.forEach((views_row) => {
						// Determine the hash
						const segment_values = take(
							[views_row.segment_a, views_row.segment_b, views_row.segment_c],
							test.data_segments?.length,
						) as string[];
						let segment_hash = hash(segment_values).toString();
						if (every(segment_values, (value) => value === '')) {
							segment_hash = 'default';
						}
						all_segments.push(segment_hash);

						// Log segment hash values to Dict for 30 days
						const hash_values: Record<string, any> = {};
						test.data_segments?.forEach((segment_property, index) => {
							hash_values[segment_property] = segment_values[index];
						});

						// Get the matching event value
						const events_row = events_result.find((events_result_row: any) => {
							const event_segment_values = take(
								[events_result_row.segment_a, events_result_row.segment_b, events_result_row.segment_c],
								test.data_segments?.length,
							) as string[];
							let events_row_segment_hash = hash(event_segment_values).toString();
							if (every(event_segment_values, (value) => value === '')) {
								events_row_segment_hash = 'default';
							}
							return events_row_segment_hash === segment_hash;
						});

						if (events_row) {
							// Calculate the stats for each segment
							const result_row = calculateVariationScore(
								variation_id,
								segment_hash,
								segment_values,
								views_row,
								events_row,
								test,
								metric,
							);

							if (!results[segment_hash]) {
								results[segment_hash] = {};
							}
							results[segment_hash][variation_id] = result_row;
						}
					});
				}

				// Always get the default segment
				let default_result = {
					variation_id,
					segment_hash: 'default',
					view_count: 0,
					event_count: 0,
					event_value: 0,
					event_rate: 0,
					event_range: [0, 1],
					variation_score: 0,
					variation_score_range: [0, 1],
				};

				default_result = calculateVariationScore(
					variation_id,
					'default',
					[],
					views_result[views_result.length - 1] || {
						segment_a: 'default',
						views: 0,
					},
					events_result[events_result.length - 1] || {
						segment_a: 'default',
						event_count: 0,
						event_value: 0,
					},
					test,
					metric,
				);

				results.default[variation_id] = default_result;
			},
			10,
		);

		// Pause a variation that has not converted after the minimum amount of views
		// We test this against the default segment since it has the most data
		if (test.auto_pause_variations && test.min_decision_metric_views && test.min_decision_metric_views > 0) {
			Object.values(results.default).forEach((variation) => {
				const view_count = variation.view_count;
				const event_count = variation.event_count || 0;
				if (view_count) {
					if (view_count >= test.min_decision_metric_views && event_count === 0) {
						changeVariationStatus(
							variation.variation_id,
							'paused',
							'No events after view threshold met',
							'SYSTEM',
						);

						// Pause the variation in all segments
						forIn(results, (segment_variations, segment_hash) => {
							results[segment_hash][variation.variation_id].mode = 'paused';
						});
					}
				}
			});
		}

		// All tests keep track of paused variations

		// Save results to Redis
		if (metric_id) {
			// Save to a specific key for this metric if the metric is custom (for decision metric, we can just save to the main results key)
			await DB.Dict.jsonSet(`test:${test_id}:results:${metric_id}`, '$', results);
		} else {
			await DB.Dict.jsonSet(`test:${test_id}:results`, '$', results);
		}

		// Auto optimize each variation by segment
		// Use the strategy to interpret results and optimize
		// (e.g. AutoOptimizeStrategy will sort into consideration/exploration)
		const strategy = getStrategy(test);
		await strategy.calculate(test_id);

		// Trigger a webhook
		sendWebhook('test_calculate', {
			subject_id: test.subject_id,
			test_id,
			results,
		});

		return results;
	} else {
		log.warn('Test was not found. Unable to calculate conversion rates.');
		return null;
	}
}
