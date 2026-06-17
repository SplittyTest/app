import { ExpandedTest, Metric } from '@/types/schemas';
import { SplitTestQueryResultRow, VariationResult } from './calculateScores';
import * as standardError from './standardError';
import log from '@lib/Logger';
import { round } from 'lodash-es';
export function calculateVariationScore(
	variation_id: string,
	segment_hash: string,
	segment_values: string[],
	views_row: SplitTestQueryResultRow,
	events_row: SplitTestQueryResultRow,
	test: ExpandedTest,
	metric: Metric,
) {
	const calculated_metric = metric || test.decision_metric;

	// Check if the variation has the minimum amount of views to make a decision
	const view_count = +(views_row.views || 0);
	const test_min_views = test.min_views;
	const test_min_decision_metric_views = test.min_decision_metric_views || 100;
	const has_min_views = view_count >= test_min_views;

	// Set the default rate from the actual data
	const event_value = +(events_row?.event_value || 0); // This is the current calculated sum, avg, etc
	let filled_event_value = event_value;
	const event_count = +(events_row?.events || 0);
	let filled_event_count = event_count;
	const event_rate = view_count > 0 ? event_count / view_count : 0;
	let filled_event_rate = event_rate;

	// This is the final number we want
	let variation_score = 0;
	let numerator = event_value;
	let filled_variation_score = 0;
	const filled_view_count = Math.max(test.min_views, view_count);

	const missing_view_count = Math.max(test_min_views - view_count, 0);
	const missing_event_count = Math.max(round(missing_view_count * test.expected_decision_metric_rate), 0);

	filled_event_count = event_count + missing_event_count;
	filled_event_rate = filled_event_count / test_min_views;

	if (!has_min_views) {
		log.debug(
			{
				view_count,
				event_value,
				event_rate,
				missing_view_count,
				missing_event_count,
				numerator,
			},
			'Filling variation stats with missing views',
		);
	}

	// Assume missing views converted at the expected rate so we can get a smooth curve towards the true rate
	if (calculated_metric.strategy === 'rate') {
		// Sum divided by views

		// Calculate the score
		variation_score = filled_variation_score = numerator / view_count;
		if (!has_min_views) {
			numerator = filled_event_value = event_value + missing_event_count * calculated_metric.default_value;
			filled_variation_score = numerator / filled_view_count;
		}
	} else if (calculated_metric.strategy === 'sum') {
		// Calculate the value score
		variation_score = filled_variation_score = event_value;
		if (!has_min_views) {
			filled_event_value = filled_variation_score =
				event_value + missing_event_count * calculated_metric.default_value;
		}
	} else if (calculated_metric.strategy === 'avg') {
		// Calculate the value and score
		variation_score = filled_variation_score = event_value;
		if (!has_min_views) {
			filled_event_value =
				(event_value * event_count + missing_event_count * calculated_metric.default_value) /
				(event_count + missing_event_count);
			filled_variation_score =
				(event_value + missing_event_count * calculated_metric.default_value) /
				(event_count + missing_event_count);
		}
	} else {
		// The score is already calculated from query
		variation_score = filled_variation_score = event_value;
		if (!has_min_views) {
			filled_variation_score = filled_event_value;
		}
	}

	// Add the values to the result set
	const result_row: VariationResult = {
		variation_id,
		segment_hash,
		segment_a: segment_values[0] || '',
		segment_b: segment_values[1] || '',
		segment_c: segment_values[2] || '',
		filled_view_count,
		view_count,
		filled_event_count,
		event_count,
		filled_event_value,
		event_value,
		filled_event_rate,
		event_rate,
		filled_event_range: [0, 1],
		event_range: [0, 1],
		filled_variation_score,
		variation_score,
		filled_variation_score_range: [0, 1],
		variation_score_range: [0, 1],
		mode: 'consideration',
	};

	// Change the mode of the variation if it has enough views but no events, it may be broken
	if (view_count >= test_min_decision_metric_views && event_count === 0) {
		// Something may be wrong with this variation, it has not yet converted
		result_row.mode = 'failed';
	}

	// Get the confidence interval of the test
	// This is a future feature we may want to add
	// const confidence_intervals = {
	// 	explore: 1.282
	// 	low: 1.645,
	// 	medium: 1.96,
	// 	high: 2.58,
	// };
	// const confidence = confidence_intervals[test.confidence_interval] || 1.96;
	const confidence = 2.58;

	// Calculate the true range
	const er = event_rate;
	const se = standardError.rate(er, view_count) * confidence;
	result_row.event_range = [er - se, er + se];

	// Calculate the filled range
	const filled_er = event_rate;
	const filled_se = standardError.rate(filled_er, filled_view_count) * confidence;
	result_row.filled_event_range = [filled_er - filled_se, filled_er + filled_se];

	// Calculate the variation score range
	const vs = variation_score;
	let vse = standardError[calculated_metric.strategy](events_row?.standard_deviation || 0, event_count) * confidence;
	if (calculated_metric.strategy === 'rate') {
		vse = standardError.avg(vs || 0, view_count || 0) * confidence;
	}
	result_row.variation_score_range = [vs - vse, vs + vse];

	// Calculate the filled variation score range
	const filled_vs = filled_variation_score || 0;
	let filled_vse =
		standardError[calculated_metric.strategy](events_row?.standard_deviation || 0, filled_event_count) * confidence;
	if (calculated_metric.strategy === 'rate') {
		filled_vse = standardError.avg(filled_vs || 0, filled_view_count) * confidence;
	}
	result_row.filled_variation_score_range = [filled_vs - filled_vse, filled_vs + filled_vse];

	return result_row;
}
