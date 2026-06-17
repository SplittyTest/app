import log from '@/lib/Logger';
import { generateCrud } from '@/lib/Utils/generateCrud';
import { isArray, isUndefined } from 'lodash-es';
import { ulid } from 'ulid';
import { Webhook, zWebhookSchema } from './webhook.schema';

const table_name = 'webhooks';
const table_schema = zWebhookSchema;

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
	generateCrud<Webhook>(table_name, table_schema, {
		defaults: (v) => {
			if (isUndefined(v.id)) {
				v.id = ulid();
			}
			if (isUndefined(v.filters)) {
				v.filters = [];
			}
			if (isUndefined(v.created_at)) {
				v.created_at = new Date();
			}
			return v;
		},
		transformWrite: (v) => {
			try {
				if (!isUndefined(v.filters) && isArray(v.filters)) {
					v.filters.map((condition_group: any[]) => {
						if (isArray(condition_group)) {
							return condition_group.map((condition) => {
								try {
									condition.value = JSON.parse(condition.value);
								} catch (err) {
									// Could not parse as JSON, leave as is
								}
								return condition;
							});
						}
						return condition_group;
					});
					v.filters = JSON.stringify(v.filters);
				}
			} catch (err) {
				log.warn('Unable to stringify values', v);
			}
			return v;
		},
	});

export { deleteByFilter, deleteById, getAll, getByFilter, getById, insert, updateByFilter, updateById };
