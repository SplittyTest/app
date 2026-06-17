import { isUndefined } from 'lodash-es';

// Return true if a value is an array and has length
export default function isArrayWithLength(value: unknown, length?: number) {
	if (isUndefined(length)) {
		return Array.isArray(value) && value.length > 0;
	}
	return Array.isArray(value) && value.length === length;
}
