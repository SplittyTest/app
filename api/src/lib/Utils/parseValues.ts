import { isPlainObject, mapValues } from 'lodash-es';

// Used for parsing querystrings
export default function parseValues(query: any): unknown {
	try {
		if (isPlainObject(query)) {
			return mapValues(query, (value) => {
				if (isPlainObject(value)) {
					return parseValues(value);
				} else if (Array.isArray(value)) {
					return value.map((i: unknown) => {
						return parseValues(i);
					});
				}
				return JSON.parse(value);
			});
		} else {
			return JSON.parse(query);
		}
	} catch (err) {
		return query;
	}
}
