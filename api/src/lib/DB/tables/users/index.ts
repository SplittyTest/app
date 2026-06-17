import Store from '@lib/DB/Store';
import { User, zUserSchema } from './user.schema';
import Cache from '@/lib/Cache';
import { generateCrud } from '@/lib/Utils/generateCrud';
import { ulid } from 'ulid';

const table_name = 'users';
const table_schema = zUserSchema;

// ------------------------------------------------------------
// START CUSTOM METHODS

// Get a user by email address
export async function getByEmail(email: string) {
	// return (await Cache.get(`db:${table_name}:getByEmail:${email}`, async () => {
	const user = await Store.selectFrom(table_name).selectAll().where('email', '=', email).executeTakeFirst();
	return user || null;
	// })) as User | null;
}

// END CUSTOM METHODS
// ------------------------------------------------------------

// Generate the default crud routes
const { getById, getByFilter, getAll, insert, updateById, updateByFilter, deleteById, deleteByFilter } =
	generateCrud<User>(table_name, table_schema, {
		defaults: (v) => {
			if (!v.id) {
				v.id = ulid();
			}
			if (!v.created_at) {
				v.created_at = new Date();
			}
			return v;
		},
	});

export { getById, getByFilter, getAll, insert, updateById, updateByFilter, deleteById, deleteByFilter };
