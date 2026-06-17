import { AnalysisStrategy } from '../Strategy';
import { Session, Test, Variation } from '@/types/schemas';
import DB from '@/lib/DB';
import { ExperimentError } from '@/lib/Errors/ExperimentError';
import hash from 'hash-it';
import { isNil, sortBy } from 'lodash-es';
import { SplitTestResult } from '@/lib/SplitTest/calculateScores';
import { hasConfidence } from '@/lib/Utils/stats';

export class StandardStrategy implements AnalysisStrategy {
	async calculate(test_id: string): Promise<void> {
		// Determine the confidence interval for each variation
		const results = (await DB.Dict.jsonGet(`test:${test_id}:results`)) as SplitTestResult;
		const test = await DB.Tests.getById(test_id);

		if (!test || !results) return;

		Object.keys(results).forEach((segment_hash) => {
			const variations = Object.values(results[segment_hash]);

			// Sort by variation id to ensure control is first
			const sorted_results = sortBy(variations, 'variation_id');
			if (sorted_results.length === 0) return;

			const control_variation = sorted_results[0];
			sorted_results.forEach((variation) => {
				const variation_id = variation.variation_id;

				// Check if the variation score is significant compared to the control variation
				const has_confidence = hasConfidence(
					[control_variation.event_value, control_variation.view_count],
					[variation.event_value, variation.view_count],
					test.confidence_interval,
				);

				// Update result in memory (optional, depending on if we save it back)
				// We set it to "exploration" if it has confidence and "consideration" if it does not, but we don't automatically pause any variations in the standard strategy
				results[segment_hash][variation_id].mode = has_confidence ? 'exploration' : 'consideration';
			});
		});

		// Update the results
		await DB.Dict.jsonSet(`test:${test_id}:results`, '$', results);
	}

	async selectVariation(test: Test, session: Session): Promise<Variation> {
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

		const selected_variation_id = (await DB.Dict.lpop(variation_queue_key)) as string;

		if (selected_variation_id) {
			await DB.Dict.rpush(variation_queue_key, selected_variation_id);
		}

		// Update the default queue as well
		if (segment_hash !== 'default') {
			await DB.Dict.lrem(default_queue_key, 1, selected_variation_id);
			await DB.Dict.rpush(default_queue_key, selected_variation_id);
		}

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
