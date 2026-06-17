import { generateCrud } from '@/lib/Utils/generateCrud';
import { Setting, zSettingSchema } from './setting.schema';
import { ZodDiscriminatedUnion, ZodObject } from 'zod';
import log from '@/lib/Logger';
import { isUndefined } from 'lodash-es';
import isArrayWithLength from '@/lib/Utils/isArrayWithLength';
import Cache from '@/lib/Cache';
import Store from '../../Store';

const table_name = 'settings';
const table_schema = zSettingSchema;

// ------------------------------------------------------------
// START CUSTOM METHODS

// EXAMPLE
export async function getById(id: string | string[]) {
	if (isArrayWithLength(id)) {
		return await Cache.get([`db:${table_name}:getById`, id], async () => {
			const results = await Store.selectFrom(table_name).selectAll().where('id', 'in', id).execute();
			const settings: Record<string, any> = {};
			results.forEach((row: { id: string; value: any }) => {
				try {
					settings[row.id] = JSON.parse(row.value);
				} catch (err) {
					// log.warn(row, 'Unable to parse setting value', err);
					settings[row.id] = row.value;
				}
			});
			return settings;
		});
	} else {
		return await Cache.get(`db:${table_name}:getById:${id}`, async () => {
			const result = await Store.selectFrom(table_name).selectAll().where('id', '=', id).executeTakeFirst();
			const settings: Record<string, any> = {};
			if (result) {
				try {
					settings[result.id] = JSON.parse(result.value);
				} catch (err) {
					// log.warn(result, 'Unable to parse setting value', err);
					settings[result.id] = result.value;
				}
			}
			return settings;
		});
	}
}

// END CUSTOM METHODS
// ------------------------------------------------------------

// Generate the default crud routes
const { insert, updateById, deleteById } = generateCrud<Setting>(table_name, table_schema as unknown as ZodObject, {
	transformWrite: (v) => {
		if (!isUndefined(v.value)) {
			try {
				v.value = JSON.stringify(v.value);
			} catch (err) {
				log.warn('Unable to stringify JSON value', v.value);
			}
		}
		return v;
	},
});

export { insert, updateById, deleteById };
