import { flatten, get, intersection, isNil, isUndefined } from 'lodash-es';
import { Audience } from '@/types/schemas';
import ipRangeCheck from 'ip-range-check';
import isArrayWithLength from './isArrayWithLength';

export function filterMatch(target: any, conditions: Audience['filters']) {
	if (!isArrayWithLength(conditions)) {
		return true;
	}
	return conditions.some((condition_group) => {
		return condition_group.every((condition) => {
			const property = get(target, condition.property);
			const result = strategies[condition.strategy](property, condition.value);

			if (condition.not) {
				return !result;
			}
			return result;
		});
	});
}

// ------------------------------------------------------------
// STRATEGIES

const strategies: Record<string, (property: any | any[], value: any | any[]) => boolean> = {
	equals: (property: any, value: any) => {
		return property === value;
	},
	is_undefined: (property: any, value: any) => {
		return isUndefined(property);
	},
	is_null: (property: any, value: any) => {
		return property === null;
	},
	is_nil: (property: any) => {
		return isNil(property);
	},
	less_than: (property: number, value: number) => {
		if (['number', 'string'].includes(typeof value)) return property < value;
		return false;
	},
	less_than_or_equals: (property: number, value: number) => {
		if (['number', 'string'].includes(typeof value)) return property <= value;
		return false;
	},
	greater_than: (property: number, value: number) => {
		if (['number', 'string'].includes(typeof value)) return property > value;
		return false;
	},
	greater_than_or_equals: (property: number, value: number) => {
		if (['number', 'string'].includes(typeof value)) return property >= value;
		return false;
	},
	between: (property: number, value: [number, number]) => {
		if (
			isArrayWithLength(value, 2) &&
			['number', 'string'].includes(typeof value[0]) &&
			['number', 'string'].includes(typeof value[1])
		) {
			return property > value[0] && property < value[1];
		}
		return false;
	},
	within: (property: number, value: [number, number]) => {
		if (
			isArrayWithLength(value, 2) &&
			['number', 'string'].includes(typeof value[0]) &&
			['number', 'string'].includes(typeof value[1])
		) {
			return property >= value[0] && property <= value[1];
		}
		return false;
	},
	wildcard: (property: string, value: string) => {
		if (typeof value === 'string') {
			const replaced = value.replace(/\*/g, '.*');
			const pattern = new RegExp(`^${replaced}$`);
			return pattern.test(property);
		}
		return false;
	},
	matches: (property: any, value: string) => {
		if (typeof value === 'string') {
			const pattern = new RegExp(value);
			return pattern.test(property);
		}
		return false;
	},
	matches_some: (property: any, value: string[]) => {
		if (value.every((v) => typeof v === 'string')) {
			return value.some((v) => {
				const pattern = new RegExp(v);
				return pattern.test(property);
			});
		}
		return false;
	},
	matches_all: (property: any, value: string[]) => {
		if (value.every((v) => typeof v === 'string')) {
			return value.every((v: string) => {
				const pattern = new RegExp(v);
				return pattern.test(property);
			});
		}
		return false;
	},
	includes: (property: any[], value: any[]) => {
		if (Array.isArray(value)) {
			return value.includes(property);
		}
		return false;
	},
	intersects: (property: any[], value: any[]) => {
		if (Array.isArray(value)) {
			return intersection(value, property).length > 0;
		}
		return false;
	},
	in_any_ip_range: (property: string, value: any[]) => {
		const ranges = flatten([value]);
		if (isArrayWithLength(ranges) && value.every((v) => typeof v === 'string')) {
			return ipRangeCheck(property, ranges);
		}
		return false;
	},
};

// END STRATEGIES
// ------------------------------------------------------------
