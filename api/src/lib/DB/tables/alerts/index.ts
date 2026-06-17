import { generateCrud } from '@/lib/Utils/generateCrud';
import { Alert, zAlertSchema } from './alert.schema';
import { ulid } from 'ulid';
import { isUndefined } from 'lodash-es';

const table_name = 'alerts';
const table_schema = zAlertSchema;

// ------------------------------------------------------------
// START CUSTOM METHODS

// EXAMPLE
// export async function getByEmail(email: string) {
//     return (await Cache.get(`db:${table_name}:getByEmail:${email}`, async () => {
//         const user = await Store.selectFrom(table_name).selectAll().where('email', '=', email).executeTakeFirst();
//         return user || null;
//     })) as User | null;
// }

// END CUSTOM METHODS
// ------------------------------------------------------------

// Generate the default crud routes
const { getById, getByFilter, getAll, insert, updateById, updateByFilter, deleteById, deleteByFilter } =
	generateCrud<Alert>(table_name, table_schema, {
		defaults: (v) => {
			if (isUndefined(v.id)) {
				v.id = ulid();
			}
			if (isUndefined(v.created_at)) {
				v.created_at = new Date();
			}
			return v;
		},
	});

export { getById, getByFilter, getAll, insert, updateById, updateByFilter, deleteById, deleteByFilter };
