import { generateCrud } from '@/lib/Utils/generateCrud';
import { APIKey, generateKey, generatePrefix, getPrefix, prefix, zAPIKeySchema } from './api_key.schema';
import { isUndefined } from 'lodash-es';
import bcrypt from 'bcrypt';
import Cache from '@lib/Cache';
import Store from '@lib/DB/Store';

const table_name = 'api_keys';
const table_schema = zAPIKeySchema;

// ------------------------------------------------------------
// START CUSTOM METHODS

// Get an API key by the prefix
export async function getByPrefix(prefix: string) {
	return (await Cache.get(`db:${table_name}:getByPrefix:${prefix}`, async () => {
		const api_key = await Store.selectFrom(table_name).selectAll().where('prefix', '=', prefix).executeTakeFirst();
		return api_key || null;
	})) as APIKey | null;
}

// Update an API key
export async function updateByPrefix(prefix: string, data: Partial<APIKey>): Promise<APIKey | null> {
	data.modified_at = new Date();

	const update_schema = table_schema.partial();
	const parsed_data = await update_schema.parseAsync(data);

	// Delete the prefix because we never want to update it
	delete parsed_data.prefix;

	// Delete the key if we don't want to update it
	if (!data.key) {
		delete parsed_data.key;
	}

	const result = await Store.updateTable(table_name)
		.set(parsed_data as any)
		.where('prefix', '=', prefix)
		.returningAll()
		.executeTakeFirst();

	// Clean any cache keys
	await Cache.clean(`db:${table_name}:*`);

	return (result as APIKey) || null;
}

// Delete an API key
export async function deleteByPrefix(prefix: string): Promise<APIKey | null> {
	const result = await Store.deleteFrom(table_name).where('prefix', '=', prefix).returningAll().executeTakeFirst();

	// Clean any cache keys
	await Cache.clean(`db:${table_name}:*`);

	return (result as APIKey) || null;
}

// Check if the key is valid
export async function validateKey(key: string): Promise<APIKey> {
	if (!key.startsWith(prefix)) {
		throw new Error('Invalid API-key');
	}
	const key_prefix = getPrefix(key);

	const api_key = await getByPrefix(key_prefix);
	if (!api_key) {
		throw new Error('Key does not exist');
	}
	if (!bcrypt.compareSync(key, api_key.key)) {
		throw new Error('Invalid key');
	}

	return api_key;
}

// END CUSTOM METHODS
// ------------------------------------------------------------

// Generate the default crud routes
const { getByFilter, getAll, insert, updateByFilter, deleteById, deleteByFilter } = generateCrud<APIKey>(
	table_name,
	table_schema,
	{
		defaults: (v) => {
			if (isUndefined(v.prefix)) {
				v.prefix = generatePrefix();
			}
			if (isUndefined(v.key)) {
				v.key = generateKey();
			}
			if (isUndefined(v.created_at)) {
				v.created_at = new Date();
			}
			return v;
		},
	},
);

export { getByFilter, getAll, insert, updateByFilter, deleteById, deleteByFilter };
