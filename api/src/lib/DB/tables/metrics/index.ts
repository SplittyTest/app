import { generateCrud } from '@lib/Utils/generateCrud';
import { Metric, zMetricSchema } from './metric.schema';
import Cache from '@/lib/Cache';
import Store from '../../Store';
import { isUndefined } from 'lodash-es';

const table_name = 'metrics';
const table_schema = zMetricSchema;

// ------------------------------------------------------------
// START CUSTOM METHODS

// Get a metric by the subject and event_type
export async function getByEventType(subject_id: string, event_type: string): Promise<Metric | null> {
	return (await Cache.get(`db:metrics:getByEventType:${subject_id}:${event_type}`, async () => {
		return await Store.selectFrom(table_name)
			.selectAll()
			.where('event_type', '=', event_type)
			.where('subject_id', '=', subject_id)
			.executeTakeFirst();
	})) as Metric | null;
}

// END CUSTOM METHODS
// ------------------------------------------------------------

// Generate the default crud routes
const { getById, getByFilter, getAll, insert, updateById, updateByFilter, deleteById } = generateCrud<Metric>(
	table_name,
	table_schema,
	{
		defaults: (v) => {
			if (isUndefined(v.strategy)) {
				v.strategy = 'rate';
			}
			if (isUndefined(v.type)) {
				v.type = 'number';
			}
			if (isUndefined(v.default_value)) {
				v.default_value = 1;
			}
			if (isUndefined(v.sorting_type)) {
				v.sorting_type = 'max';
			}
			if (isUndefined(v.created_at)) {
				v.created_at = new Date();
			}
			return v;
		},
	},
);

export { getById, getByFilter, getAll, insert, updateById, updateByFilter, deleteById };
