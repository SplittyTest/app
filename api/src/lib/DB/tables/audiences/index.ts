import { generateCrud } from '@lib/Utils/generateCrud';
import { zAudienceSchema, Audience } from './audience.schema';
import { isArray, isUndefined } from 'lodash-es';
import log from '@lib/Logger';
import { ulid } from 'ulid';

const table_name = 'audiences';
const table_schema = zAudienceSchema;

// ------------------------------------------------------------
// START CUSTOM METHODS

// ADD CUSTOM METHODS HERE

// END CUSTOM METHODS
// ------------------------------------------------------------

const { getById, getByFilter, getAll, insert, updateById, updateByFilter, deleteById } = generateCrud<Audience>(
	table_name,
	table_schema,
	{
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
	},
);

export { getById, getByFilter, getAll, insert, updateById, updateByFilter, deleteById };
