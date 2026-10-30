import { generateCrud } from '@lib/Utils/generateCrud';
import { Project, zProjectSchema } from './project.schema';
import { isPlainObject, isUndefined } from 'lodash-es';
import { deleteByProjectId as deleteTestsByProjectId } from '../tests';
import log from '@lib/Logger';
import Cache from '@lib/Cache';
import Store from '@lib/DB/Store';
import { sql } from 'kysely';
import isArrayWithLength from '@/lib/Utils/isArrayWithLength';
import { asyncForEach } from 'modern-async';

const table_name = 'projects';
const table_schema = zProjectSchema;

// ------------------------------------------------------------
// START CUSTOM METHODS

// Get projects for the list page
export async function getList() {
	return (await Cache.get(`db:${table_name}:getList`, async () => {
		const projects = await Store.with('test_counts', (db) =>
			db
				.selectFrom('tests')
				.select((eb) => [
					'project_id',
					sql<number>`SUM(CASE WHEN ${eb.ref('status')} = 'active' OR ${eb.ref('status')} = 'paused' THEN 1 ELSE 0 END)`.as(
						'active_tests',
					),
					sql<number>`SUM(CASE WHEN ${eb.ref('status')} = 'pending' THEN 1 ELSE 0 END)`.as('pending_tests'),
					sql<number>`SUM(CASE WHEN ${eb.ref('status')} = 'complete' THEN 1 ELSE 0 END)`.as('complete_tests'),
				])
				.where('status', 'in', ['active', 'pending', 'complete'])
				.groupBy('project_id'),
		)
			.selectFrom('projects')
			.leftJoin('test_counts', 'test_counts.project_id', 'projects.id')
			.select([
				'projects.id as id',
				'projects.name as name',
				'projects.type as type',
				'projects.description as description',
				'projects.testing_enabled as testing_enabled',
				'projects.sections as sections',
				sql`COALESCE(test_counts.active_tests, 0)`.as('active_tests'),
				sql`COALESCE(test_counts.pending_tests, 0)`.as('pending_tests'),
				sql`COALESCE(test_counts.complete_tests, 0)`.as('complete_tests'),
			])
			.$assertType<any>()
			.execute();

		return projects || null;
	})) as Project[];
}

// Custom method to delete a project by ID
export async function deleteById(id: string, filter?: any) {
	// Delete all alerts, status_logs, and watchers for the test
	let query: any = Store.deleteFrom(table_name).where('id', '=', id);

	// Conditionally add a filter
	if (filter) {
		query = query.where(filter);
	}

	query = query.returningAll();
	const result = await Store.transaction().execute(async (tx) => {
		const delete_result = await query.executeTakeFirst();
		if (delete_result && delete_result.id) {
			// Delete all alerts, status_logs, and watchers for the test
			await deleteTestsByProjectId(id);
		}
		return delete_result;
	});

	// Clean any cache keys
	await Cache.clean(`db:${table_name}:*`);

	return result;
}

// Custom method to delete projects by filter
export async function deleteByFilter(filter: any) {
	const projects = await Store.selectFrom(table_name).select('id').where(filter).execute();
	if (isArrayWithLength(projects)) {
		await asyncForEach(
			projects,
			async (project) => {
				await deleteById(project.id);
			},
			20,
		);
	}

	// Clean any cache keys
	await Cache.clean(`db:${table_name}:*`);

	return projects;
}

// END CUSTOM METHODS
// ------------------------------------------------------------

// Generate the default crud routes
const { getById, getByFilter, getAll, insert, updateById, updateByFilter } = generateCrud<Project>(
	table_name,
	table_schema,
	{
		defaults: (v) => {
			if (isUndefined(v.data)) {
				v.data = {};
			}
			if (isUndefined(v.created_at)) {
				v.created_at = new Date();
			}
			return v;
		},
		transformWrite: (v) => {
			try {
				if (!isUndefined(v.data) && isPlainObject(v.data)) {
					v.data = JSON.stringify(v.data);
				}
				if (!isUndefined(v.sections)) {
					v.sections = JSON.stringify(v.sections);
				}
			} catch (err) {
				log.warn('Unable to stringify values', v);
			}
			return v;
		},
	},
);

export { getById, getByFilter, getAll, insert, updateById, updateByFilter };
