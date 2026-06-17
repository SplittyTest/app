import { generateCrud } from '@/lib/Utils/generateCrud';
import { TestResult, zTestResultSchema } from './test_result.schema';
import { calculateScores, SplitTestResult } from '@/lib/SplitTest/calculateScores';
import { groupBy, isArray, isUndefined, mapValues, omit } from 'lodash-es';
import Cache from '@lib/Cache';
import Store from '@lib/DB/Store';
import log from '@lib/Logger';

const table_name = 'test_results';
const table_schema = zTestResultSchema;

// ------------------------------------------------------------
// START CUSTOM METHODS

// Get and format test results by Test ID
export async function getByTestId(test_id: string) {
	return await Cache.get(`db:${table_name}:getByTestId:${test_id}`, async () => {
		const results = await Store.selectFrom(table_name).selectAll().where('test_id', '=', test_id).execute();

		if (results && results.length > 0) {
			// Format the results
			const segment_groups = groupBy(results, 'segment_hash');
			const mapped_segment_groups = mapValues(segment_groups, (segment_group) => {
				const variation_groups = groupBy(segment_group, 'variation_id');
				return mapValues(variation_groups, (result_row) => {
					return omit(result_row[0], ['test_id']);
				});
			});

			return mapped_segment_groups as unknown as SplitTestResult;
		}

		return await calculateScores(test_id);
	});
}

// END CUSTOM METHODS
// ------------------------------------------------------------

// Generate the default crud routes
const { getByFilter, getAll, insert, updateById, updateByFilter, deleteById, deleteByFilter } =
	generateCrud<TestResult>(table_name, table_schema, {
		transformWrite: (v) => {
			try {
				if (!isUndefined(v.conversion_range) && isArray(v.conversion_range)) {
					v.conversion_range = JSON.stringify(v.conversion_range);
				}
				if (!isUndefined(v.filled_conversion_range) && isArray(v.filled_conversion_range)) {
					v.filled_conversion_range = JSON.stringify(v.filled_conversion_range);
				}
				if (!isUndefined(v.variation_score_range) && isArray(v.variation_score_range)) {
					v.variation_score_range = JSON.stringify(v.variation_score_range);
				}
				if (!isUndefined(v.filled_variation_score_range) && isArray(v.filled_variation_score_range)) {
					v.filled_variation_score_range = JSON.stringify(v.filled_variation_score_range);
				}
			} catch (err) {
				log.warn('Unable to stringify JSON value', v.value);
			}
			return v;
		},
	});

export { getByFilter, getAll, insert, updateById, updateByFilter, deleteById, deleteByFilter };
