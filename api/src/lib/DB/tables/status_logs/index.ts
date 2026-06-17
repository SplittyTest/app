import { generateCrud } from '@/lib/Utils/generateCrud';
import { StatusLog, zStatusLogSchema } from './status_log.schema';
import { ulid } from 'ulid';
import log from '@/lib/Logger';
import { isPlainObject, isUndefined } from 'lodash-es';
import { getAll as getAllUsers } from '../users';
import Store from '../../Store';

const table_name = 'status_logs';
const table_schema = zStatusLogSchema;

// ------------------------------------------------------------
// START CUSTOM METHODS

export async function insert(data: StatusLog | StatusLog[]) {
	await rawInsert(data);

	// Trigger alert
}

// Get the most recent status log for a test
export async function getMostRecentByTestId(test_id: string) {
	return await Store.selectFrom(table_name)
		.selectAll()
		.where('test_id', '=', test_id)
		.where('type', '=', 'test')
		.orderBy('created_at', 'desc')
		.executeTakeFirst();
}

// Get all status logs for a test
export async function getByTestId(test_id: string) {
	const users = await getAllUsers();
	const status_logs = await Store.selectFrom(table_name)
		.selectAll()
		.where('test_id', '=', test_id)
		.orderBy('created_at', 'desc')
		.execute();

	return status_logs.map((status_log) => {
		status_log.data.user_name = 'System';
		if (status_log?.data?.user_id) {
			const user = users.find((u) => {
				return u.id === status_log?.data?.user_id;
			});
			if (user) {
				status_log.data.user_name = user.first_name + ' ' + user.last_name;
			}
		}
		return status_log;
	});
}

// END CUSTOM METHODS
// ------------------------------------------------------------

// Generate the default crud routes
const {
	getById,
	getByFilter,
	getAll,
	insert: rawInsert,
	updateById,
	updateByFilter,
	deleteById,
	deleteByFilter,
} = generateCrud<StatusLog>(table_name, table_schema, {
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
			if (!isUndefined(v.data) && isPlainObject(v.data)) {
				v.data = JSON.stringify(v.data);
			}
		} catch (err) {
			log.warn('Unable to stringify values', v);
		}
		return v;
	},
});

export { getById, getByFilter, getAll, updateById, updateByFilter, deleteById, deleteByFilter };
