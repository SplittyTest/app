import { asyncForEach, asyncMap } from 'modern-async';
import { Metric } from '@/types/schemas';
import { deleteByFilter as deleteAlertsByFilter } from '../alerts';
import { deleteByFilter as deleteStatusLogsByFilter } from '../status_logs';
import { deleteByFilter as deleteWatchersByFilter } from '../watchers';
import { generateCrud } from '@/lib/Utils/generateCrud';
import { getById as getMetricById } from '../metrics';
import { getByTestId as getTestResultsByTestId } from '../test_results';
import { getMostRecentByTestId as getMostRecentStatusLogByTestId } from '../status_logs';
import { flatten, isArray, isNil, isUndefined, uniq } from 'lodash-es';
import { calculateScores, SplitTestResult } from '@/lib/SplitTest/calculateScores';
import { StatusLog } from '../status_logs/status_log.schema';
import { Test, ExpandedTest, TestFilters, zTestFilters, zTestSchema } from './test.schema';
import { ulid } from 'ulid';
import Cache from '@/lib/Cache';
import Dict from '../../Dict';
import isArrayWithLength from '@/lib/Utils/isArrayWithLength';
import log from '@/lib/Logger';
import Store from '../../Store';
import { sql } from 'kysely';
import { sendWebhook } from '@/lib/Utils/webhook';

const table_name = 'tests';
const table_schema = zTestSchema;

interface TestWithResults extends ExpandedTest {
	results?: SplitTestResult;
	status_log?: Partial<StatusLog>;
}

// ------------------------------------------------------------
// START CUSTOM METHODS

// Wrapped insert to trigger webhook
export async function insert(data: Test | Test[]): Promise<Test | Test[] | null> {
	const result = await defaultInsert(data);

	if (result) {
		asyncForEach(flatten([result]), async (test) => {
			sendWebhook('test_create', {
				subject_id: test.subject_id,
				test,
			});
		});
	}

	return result;
}

// Get a list of active test IDs
export async function getActiveIds() {
	return (await Cache.get<string[]>(`db:${table_name}:getActiveIds`, async () => {
		const tests = await Store.selectFrom(table_name).select(['id']).where('status', '=', 'active').execute();
		return tests.map((t) => t.id) || [];
	})) as string[];
}

// Get a count of active tests that are targeting a specific audience
export async function getActiveTestCountForAudience(audience_id: string) {
	return (await Cache.get<number>(`db:${table_name}:getActiveTestCountForAudience:${audience_id}`, async () => {
		const tests = await Store.selectFrom(table_name)
			.select(['id'])
			.where('status', '=', 'active')
			.where(sql<boolean>`audiences @> ${JSON.stringify({ included: [audience_id] })}::jsonb`)
			.execute();
		return tests.length || 0;
	})) as number;
}

// Get a single test with expanded details by ID
export async function getExpandedById(id: string) {
	return (await Cache.get(`db:${table_name}:getExpandedById:${id}`, async () => {
		const test = (await Store.selectFrom(table_name).selectAll().where('id', '=', id).executeTakeFirst()) as
			| Test
			| undefined;
		if (test) {
			// Get the subject and section
			const subject = await Store.selectFrom('subjects')
				.selectAll()
				.where('id', '=', test.subject_id)
				.executeTakeFirst();
			if (subject) {
				(test as any).subject = subject;

				const section = subject.sections?.find((s) => s.id === test.section_id);
				if (section) {
					(test as any).section = section;
				} else {
					(test as any).section = null;
				}
			}

			// Get the decision metric
			(test as any).decision_metric = {};
			const decision_metric = await Store.selectFrom('metrics')
				.selectAll()
				.where('id', '=', test!.decision_metric_id)
				.executeTakeFirst();
			if (decision_metric) {
				(test as any).decision_metric = decision_metric;
			}

			// Get additional metrics
			(test as any).metric_details = [];
			if (isArrayWithLength(test.metrics)) {
				const metrics = await Store.selectFrom('metrics')
					.selectAll()
					.where('id', 'in', test.metrics || [])
					.execute();
				if (metrics) {
					(test as any).metric_details = metrics;
				}
			}

			// Get the included audiences
			(test as any).included_audiences = [];
			if (isArrayWithLength(test.audiences.included)) {
				const included_audiences = await Store.selectFrom('audiences')
					.selectAll()
					.where('id', 'in', test.audiences.included)
					.execute();
				if (included_audiences) {
					(test as any).included_audiences = included_audiences;
				}
			}

			// Get the excluded audiences
			(test as any).excluded_audiences = [];
			if (isArrayWithLength(test.audiences.excluded)) {
				const excluded_audiences = await Store.selectFrom('audiences')
					.selectAll()
					.where('id', 'in', test.audiences.excluded)
					.execute();
				if (excluded_audiences) {
					(test as any).excluded_audiences = excluded_audiences;
				}
			}

			return test as any as ExpandedTest;
		}
		return null;
	})) as ExpandedTest | null;
}

// Get a list of all metrics that are tracked for the given tests
export async function getTrackedMetricsByTestIds(test_ids: string[]) {
	// Sort and stringify the test IDs to use as a cache key
	const cache_key = `db:${table_name}:getTrackedMetricsByTestIds:${test_ids.sort().join('|')}`;
	const metrics = (await Cache.get(cache_key, async () => {
		const results = await Store.selectFrom(table_name)
			.select(['decision_metric_id', 'metrics'])
			.where('id', 'in', test_ids)
			.execute();

		const metric_ids: string[] = [];
		results.forEach((row) => {
			if (row.decision_metric_id) {
				metric_ids.push(row.decision_metric_id);
			}
			if (isArrayWithLength(row.metrics)) {
				metric_ids.push(...row.metrics);
			}
		});

		return metric_ids;
	})) as string[];

	return metrics || [];
}

// Get a list of tests with added variation results and the most recent status log
export async function getList(filter_params?: TestFilters) {
	let filters = null;
	if (filter_params) {
		filters = await zTestFilters.parseAsync(filter_params);
	}

	let query = Store.selectFrom('tests as t');

	if (filters) {
		// Get tests for a specific subject
		if (filters.subject_id) {
			query = query.where('t.subject_id', '=', filters.subject_id);

			if (filters.section_id) {
				query = query.where('t.section_id', '=', filters.section_id);
			}
		}

		// Get tests with a specific status
		if (filters.status && isArrayWithLength(filters.status)) {
			query = query.where('t.status', 'in', filters.status);
		}

		// Get tests that ended within a specific date range
		if (filters.ended_at) {
			query = query.where('t.ended_at', '>=', filters.ended_at[0]).where('t.ended_at', '<=', filters.ended_at[1]);
		}
	}

	const tests = await query
		.leftJoin('subjects', 'subjects.id', 't.subject_id')
		.leftJoin('users', 'users.id', 't.created_by')
		.selectAll('t')
		.select([
			'subjects.name as subject_name',
			sql<string>`trim(concat(users.first_name, ' ', users.last_name))`.as('created_by_name'),
		])
		.orderBy('t.created_at', 'desc')
		.execute();

	// Get variation data for each test and merge it in
	const tests_with_variation_data = await asyncMap<Test, TestWithResults>(tests, async (test) => {
		const test_with_results: any = test;

		test_with_results.decision_metric = (await getMetricById(test.decision_metric_id)) as Metric;
		test_with_results.results = (await getResultsById(test.id, test.status)) as SplitTestResult;
		test_with_results.status_log = await getMostRecentStatusLogByTestId(test.id);

		return test_with_results as TestWithResults;
	});

	return tests_with_variation_data;
}

// Get the results for a test from the Store or Dict
export async function getResultsById(test_id: string, status?: string) {
	let test_status = status;
	if (!status) {
		const test = await getById(test_id);
		if (test) {
			test_status = test.status;
		}
	}

	let results: SplitTestResult | undefined;
	// Get the results from the DB if the test is complete
	if (test_status === 'complete' || test_status === 'archived') {
		results = (await getTestResultsByTestId(test_id)) as SplitTestResult;
	}

	// Get the results from Dict
	else {
		results = (await Dict.jsonGet(`test:${test_id}:results`)) as SplitTestResult;
		if (!results) {
			results = (await calculateScores(test_id)) || undefined;
		}
	}
	return results || {};
}

// Get the different segments for the test
export async function getSegments(results: SplitTestResult) {
	const segment_a: string[] = [];
	const segment_b: string[] = [];
	const segment_c: string[] = [];

	// Loop through the hashes and get all available values for each segment
	Object.keys(results).forEach((segment_hash) => {
		const v = Object.values(results[segment_hash])[0];

		if (segment_hash !== 'default') {
			if (!isNil(v.segment_a)) segment_a.push(v.segment_a);
			if (!isNil(v.segment_b)) segment_b.push(v.segment_b);
			if (!isNil(v.segment_c)) segment_c.push(v.segment_c);
		}
	});

	const options: any[][] = [];

	if (segment_a.length) options.push(uniq(segment_a).sort());
	if (segment_b.length) options.push(uniq(segment_b).sort());
	if (segment_c.length) options.push(uniq(segment_c).sort());

	// Return the values
	return options;
}

// Custom method to delete a test by ID
export async function deleteById(test_id: string, filter?: any) {
	// Throw an error if the test is active to prevent accidental deletion
	const test = await getById(test_id);
	if (test?.status === 'active') {
		throw new Error('Cannot delete an active test. Please stop the test before deleting.');
	}

	// Delete all alerts, status_logs, and watchers for the test
	let query: any = Store.deleteFrom(table_name).where('id', '=', test_id);

	// Conditionally add a filter
	if (filter) {
		query = query.where(filter);
	}

	query = query.returningAll();
	const result = await Store.transaction().execute(async (tx) => {
		const delete_result = await query.executeTakeFirst();
		if (delete_result && delete_result.id) {
			// Delete all alerts, status_logs, and watchers for the test
			await deleteAlertsByFilter((eb: any) => eb('test_id', '=', delete_result.id));
			await deleteStatusLogsByFilter((eb: any) => eb('test_id', '=', delete_result.id));
			await deleteWatchersByFilter((eb: any) => eb('test_id', '=', delete_result.id));
		}
		return delete_result;
	});

	// Clean any cache keys
	await Cache.clean(`db:${table_name}:*`);

	return result;
}

// Custom method to delete tests by filter
export async function deleteByFilter(filter: any) {
	const tests = await Store.selectFrom(table_name).select('id').where(filter).execute();
	if (isArrayWithLength(tests)) {
		await asyncForEach(
			tests,
			async (test) => {
				await deleteById(test.id);
			},
			20,
		);
	}

	// Clean any cache keys
	await Cache.clean(`db:${table_name}:*`);

	return tests;
}

// Delete all tests for a subject
export async function deleteBySubjectId(subject_id: string) {
	const tests = await getByFilter((eb: any) => eb('subject_id', '=', subject_id));
	if (isArrayWithLength(tests)) {
		await asyncForEach(
			tests,
			async (test) => {
				await deleteById(test.id);
			},
			20,
		);
	}

	// Clean any cache keys
	await Cache.clean(`db:${table_name}:*`);

	return tests;
}

// END CUSTOM METHODS
// ------------------------------------------------------------

// Generate the default crud routes
const {
	getById,
	getByFilter,
	getAll,
	insert: defaultInsert,
	updateById,
	updateByFilter,
} = generateCrud<Test>(table_name, table_schema, {
	defaults: (v) => {
		if (!v.id) {
			v.id = ulid();
		}
		if (!v.created_at) {
			v.created_at = new Date();
		}
		return v;
	},
	transformWrite: (v) => {
		try {
			// Sort the data_segments by property name
			if (isArrayWithLength(v.data_segments)) {
				v.data_segments = v.data_segments.sort();
			}
			if (!isUndefined(v.variations) && isArray(v.variations)) {
				v.variations = JSON.stringify(v.variations);
			}
		} catch (err) {
			log.warn('Unable to stringify JSON value', v.value);
		}
		return v;
	},
});

export { getById, getByFilter, getAll, updateById, updateByFilter };
