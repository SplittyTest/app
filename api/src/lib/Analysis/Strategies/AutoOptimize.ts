import { AnalysisStrategy } from '../Strategy';
import { Session, Test, Variation } from '@/types/schemas';
import DB from '@/lib/DB';
import { ExperimentError } from '@/lib/Errors/ExperimentError';
import hash from 'hash-it';
import { isNil, sortBy } from 'lodash-es';
import { SplitTestResult } from '@/lib/SplitTest/calculateScores';
import isArrayWithLength from '@/lib/Utils/isArrayWithLength';
import Logger from '@/lib/Logger';
import { ulid } from 'ulid';
import { hasConfidence } from '@/lib/Utils/stats';
import { sendWebhook } from '@/lib/Utils/webhook';

const log = Logger.child({ module: 'AutoOptimizeStrategy' });

export class AutoOptimizeStrategy implements AnalysisStrategy {
	async calculate(test_id: string): Promise<void> {
		// Logic moved from calculateScores.ts for auto_optimize
		const results = (await DB.Dict.jsonGet(`test:${test_id}:results`)) as SplitTestResult;
		const test = await DB.Tests.getById(test_id);

		if (!test || !results) return;

		const variations_in_consideration: Record<string, string[]> = {};
		const variations_in_exploration: Record<string, string[]> = {};
		const paused_variations: Record<string, string[]> = {};

		const previously_paused =
			((await DB.Dict.jsonGet(`test:${test_id}}:variations:paused`)) as Record<string, string[]>) || {};
		const previously_considered =
			((await DB.Dict.jsonGet(`test:${test_id}}:variations:consideration`)) as Record<string, string[]>) || {};
		const previously_explored =
			((await DB.Dict.jsonGet(`test:${test_id}}:variations:exploration`)) as Record<string, string[]>) || {};

		function logStatusChange(variation_id: string, segment: string, mode: string, conversion_rate: number) {
			sendWebhook('variation_mode', {
				subject_id: test!.subject_id,
				test_id,
				variation_id,
				segment,
				mode,
				conversion_rate,
				timestamp: new Date(),
				strategy: 'auto_optimize',
			});

			DB.StatusLogs.insert([
				{
					id: ulid(),
					test_id,
					type: 'variation',
					data: {
						variation_id,
						segment: segment || 'default',
						mode,
						conversion_rate,
					},
					created_at: new Date(),
				},
			]).catch((status_log_err) => {
				log.warn(
					{
						test_id,
						variation_id,
						segment,
					},
					'Unable to log status change for variation',
					status_log_err,
				);
			});
		}

		const decision_metric = await DB.Metrics.getById(test.decision_metric_id);

		// Change the mode of variations based on their performance compared to the best performing variation and the exploration threshold
		Object.keys(results).forEach((segment_hash) => {
			const variations = Object.values(results[segment_hash]);

			// Sort by variation score
			const sorted_results = sortBy(variations, 'variation_score');
			if (decision_metric && decision_metric.sorting_type === 'max') {
				sorted_results.reverse();
			}
			if (sorted_results.length === 0) return;

			const best_performing_variation = sorted_results[0];

			sorted_results.forEach((variation_result_row) => {
				let mode = 'consideration';
				const variation_id = variation_result_row.variation_id;

				// Check if the variation is below the pause threshold compared to the best performing variation
				const has_pause_confidence = hasConfidence(
					[best_performing_variation.event_value, best_performing_variation.view_count],
					[variation_result_row.event_value, variation_result_row.view_count],
					test.confidence_interval,
				);

				if (has_pause_confidence) {
					mode = 'paused';

					if (Array.isArray(paused_variations[segment_hash])) {
						paused_variations[segment_hash].push(variation_id);
					} else {
						paused_variations[segment_hash] = [variation_id];
					}

					// Log change
					if (
						isArrayWithLength(previously_paused[segment_hash]) &&
						!previously_paused[segment_hash].includes(variation_id)
					) {
						logStatusChange(variation_id, segment_hash, mode, variation_result_row.variation_score);
					}
				} else {
					// Check if the variation is below the exploration threshold compared to the best performing variation
					const has_exploration_confidence = hasConfidence(
						[best_performing_variation.event_value, best_performing_variation.view_count],
						[variation_result_row.event_value, variation_result_row.view_count],
						test.exploration_threshold,
					);

					if (has_exploration_confidence) {
						mode = 'exploration';
						if (Array.isArray(variations_in_exploration[segment_hash])) {
							variations_in_exploration[segment_hash].push(variation_id);
						} else {
							variations_in_exploration[segment_hash] = [variation_id];
						}

						// Log change
						if (
							isArrayWithLength(previously_explored[segment_hash]) &&
							!previously_explored[segment_hash].includes(variation_id)
						) {
							logStatusChange(variation_id, segment_hash, mode, variation_result_row.variation_score);
						}
					}

					// Place the variation in consideration if it is not paused or in exploration
					else {
						mode = 'consideration';
						if (Array.isArray(variations_in_consideration[segment_hash])) {
							variations_in_consideration[segment_hash].push(variation_id);
						} else {
							variations_in_consideration[segment_hash] = [variation_id];
						}

						// Log change
						if (
							isArrayWithLength(previously_considered[segment_hash]) &&
							!previously_considered[segment_hash].includes(variation_id)
						) {
							logStatusChange(variation_id, segment_hash, mode, variation_result_row.variation_score);
						}
					}
				}

				// Update result in memory (optional, depending on if we save it back)
				results[segment_hash][variation_id].mode = mode;
			});
		});

		await DB.Dict.jsonSet(`test:${test_id}:variations:consideration`, '$', variations_in_consideration);
		await DB.Dict.jsonSet(`test:${test_id}:variations:exploration`, '$', variations_in_exploration);
		await DB.Dict.jsonSet(`test:${test_id}:variations:paused`, '$', paused_variations);
		await DB.Dict.jsonSet(`test:${test_id}:results`, '$', results);
	}

	async selectVariation(test: Test, session: Session): Promise<Variation> {
		// Get active variations
		let variation_option_ids: string[] = test.variations.filter((v) => v.status === 'active').map((v) => v.id);

		// Figure out the segment for segmented tests or use the default segment
		let segment_hash = 'default';
		if (Array.isArray(test.data_segments) && test.data_segments.length) {
			const session_segment = test.data_segments
				.map((segment_key) => {
					return session.data[segment_key];
				})
				.filter((segment_value) => {
					return !isNil(segment_value);
				});
			segment_hash = hash(session_segment).toString();
		}

		// Create a new segment queue if one does not exist
		const default_queue_key = `test:${test.id}:variations_queue:default`;
		const variation_queue_key = `test:${test.id}:variations_queue:${segment_hash}`;
		const segment_queue_exists = await DB.Dict.exists(variation_queue_key);
		if (!segment_queue_exists) {
			const default_queue = await DB.Dict.lrange(default_queue_key, 0, -1);
			await DB.Dict.rpush(variation_queue_key, default_queue);
		}

		// Get exploration variations by chance
		if (Math.random() < test.exploration_percentage) {
			let hash = segment_hash;

			// Get exploration variations
			const exploration_variations = (await DB.Dict.jsonGet(`test:${test.id}:variations:exploration`)) as Record<
				string,
				string[]
			>;

			if (!exploration_variations || !exploration_variations[hash]) {
				hash = 'default';
			}

			if (exploration_variations && exploration_variations[hash]) {
				const exploration_variation_ids = variation_option_ids.filter((variation_id: string) => {
					return exploration_variations[hash].includes(variation_id);
				});

				// Only replace possible variations if there are some in exploration mode
				if (exploration_variation_ids.length > 0) {
					variation_option_ids = exploration_variation_ids;
				}
			}
		}

		// Get a variation in consideration
		else {
			let hash = segment_hash;

			// Get consideration variations
			const consideration_variations = (await DB.Dict.jsonGet(
				`test:${test.id}:variations:consideration`,
			)) as Record<string, string[]>;

			if (!consideration_variations || !consideration_variations[hash]) {
				hash = 'default';
			}

			if (consideration_variations && consideration_variations[hash]) {
				const consideration_variation_ids = variation_option_ids.filter((variation_id: string) => {
					return consideration_variations[hash].includes(variation_id);
				});

				if (consideration_variation_ids.length > 0) {
					variation_option_ids = consideration_variation_ids;
				}
			}
		}

		// Check if any variations are active
		if (!variation_option_ids.length) {
			throw new ExperimentError('No available variations', {
				test_id: test.id,
			});
		}

		// Get the least recently seen variation that is in the queue to show
		const test_variations_queue = (await DB.Dict.lrange(variation_queue_key, 0, -1)) as string[];
		const variation_index = test_variations_queue.findIndex((variation_id) => {
			return variation_option_ids.includes(variation_id);
		});

		// Select the first matching variation we find in the list
		const selected_variation_id = test_variations_queue[variation_index];

		// Move the variation_id to the end of the list
		await DB.Dict.lrem(variation_queue_key, 1, selected_variation_id);
		await DB.Dict.rpush(variation_queue_key, selected_variation_id);

		const selected_variation = test.variations.find((v) => {
			return v.id === selected_variation_id;
		});

		if (!selected_variation) {
			throw new ExperimentError('Selected variation did not exist', {
				test_id: test.id,
				variation_id: selected_variation_id,
			});
		}

		return selected_variation;
	}
}
