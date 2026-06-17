import config from 'config';
import hash from 'hash-it';
import DB from '@lib/DB';
import log from '@lib/Logger';
import dayjs from '@lib/dayjs';
import { startsWith } from 'lodash-es';
import shortHash from '@lib/Utils/shortHash';
import isArrayWithLength from '../Utils/isArrayWithLength';

const cache_config = config.get('cache') as any;

class Cache {
	constructor() { }

	async get<T>(
		key: string | any[],
		fallback: () => Promise<T>,
		expiration?: string | number | Date,
	): Promise<T | null> {
		// Determine the key
		let cache_key = key;
		if (Array.isArray(key)) {
			cache_key = key
				.map((key_segment) => {
					if (typeof key_segment === 'object') {
						return hash(key_segment).toString();
					} else if (typeof key_segment === 'string' && startsWith(key_segment, '#')) {
						return shortHash(key_segment.substring(1));
					}
					return key_segment;
				})
				.join(':');
		}

		// Check redis for the value
		const result = (await DB.Dict.jsonGet(cache_key as string)) as { value: any } | null;
		if (result && result.value) {
			return result.value;
		}

		// The value was not cached, run the fallback function
		else {
			try {
				const fallback_result = await fallback();
				if (fallback_result) {
					// Save the fallback value to the cache
					await DB.Dict.jsonSet(cache_key as string, '$', {
						value: fallback_result,
					});

					let parsed_expiration = cache_config.expiration.default || 300;
					if (expiration) {
						if (typeof expiration !== 'number') {
							const now = new Date();
							parsed_expiration = dayjs(expiration).diff(now, 'seconds');
						} else {
							parsed_expiration = expiration;
						}
					}

					await DB.Dict.expire(cache_key as string, parsed_expiration);
				}
				return fallback_result;
			} catch (err) {
				log.warn(`Cache fallback for '${cache_key}' failed`, err);
			}
		}

		return null;
	}

	// Remove keys that match all the given patterns
	async clean(pattern: string) {
		let count = 0;
		let cursor = '0';
		do {
			const { cursor: next_cursor, keys: scan_keys } = await DB.Dict.scan(cursor, {
				MATCH: pattern,
				COUNT: 1000,
			});
			cursor = next_cursor;
			if (scan_keys.length > 0) {
				await DB.Dict.unlink(...scan_keys);
				count = count + scan_keys.length;
			}
		} while (cursor > '0');

		return count;
	}
}

export default new Cache();
