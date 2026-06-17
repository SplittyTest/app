import { createClient, RedisArgument, RedisClientOptions, SetOptions } from 'redis';
import config from 'config';
import { ScanOptions } from '@redis/client/dist/lib/commands/SCAN';

export interface DictDB {
	client: any;
	connect(): Promise<void>;
	del(key: string): Promise<number>;
	disconnect(): Promise<void>;
	exists(key: string): Promise<number>;
	expire(key: string, seconds: number): Promise<number | null>;
	get(key: string): Promise<string | null>;
	getKeys(pattern: string): Promise<string[]>;
	jsonGet(key: string): Promise<Record<string, any> | any[] | null>;
	jsonSet(key: string, path: string, value: any): Promise<'OK' | null>;
	lpop(key: string): Promise<string | null>;
	lpush(key: string, values: string | string[]): Promise<number>;
	lrange(key: string, start: number, stop: number): Promise<string[]>;
	lrem(key: string, count: number, value: string): Promise<number>;
	ping(): Promise<void>;
	rpush(key: string, values: string | string[]): Promise<number>;
	scan(cursor: RedisArgument, options?: ScanOptions | undefined): Promise<{ cursor: string; keys: string[] }>;
	set(key: string, value: any, options?: SetOptions): Promise<string | null>;
	setEx(key: string, seconds: number, value: any): Promise<'OK'>;
	unlink(...keys: string[]): Promise<number>;
}

export class RedisDict implements DictDB {
	client: ReturnType<typeof createClient>;

	constructor(cfg: RedisClientOptions) {
		// The Redis client is initialized in src/lib/DB/Redis.ts
		this.client = createClient(cfg);
	}

	// Ping the redis instance
	async ping(): Promise<void> {
		const pong = await this.client.ping();
		if (pong !== 'PONG') {
			throw new Error('Redis ping failed');
		}
		return;
	}

	// Do a non-blocking scan of the keys
	async scan(cursor: RedisArgument, options?: ScanOptions | undefined): Promise<{ cursor: string; keys: string[] }> {
		return await this.client.scan(cursor, options);
	}

	// Get all keys using non-blocking scan
	async getKeys(pattern: string) {
		const keys: string[] = [];
		let cursor = '0';
		do {
			const { cursor: next_cursor, keys: scan_keys } = await this.client.scan(cursor, {
				MATCH: pattern,
				COUNT: 1000,
			});
			cursor = next_cursor;
			keys.push(...scan_keys);
		} while (cursor > '0');
		return keys;
	}

	// Get a key value
	async get(key: string): Promise<string | null> {
		return await this.client.get(key);
	}

	// Set a key value
	async set(key: string, value: any, options?: SetOptions): Promise<string | null> {
		return await this.client.set(key, value, options);
	}

	// Set a key value with an expiration in seconds
	async setEx(key: string, seconds: number, value: any): Promise<'OK'> {
		return await this.client.setEx(key, seconds, value);
	}

	// Get and parse JSON value stored at key
	async jsonGet(key: string): Promise<Record<string, any> | any[] | null> {
		try {
			return (await this.client.json.get(key)) as Record<string, any> | any[] | null;
		} catch (err) {
			return null;
		}
	}

	// Set JSON value to a key
	async jsonSet(key: string, path: string, value: any): Promise<'OK' | null> {
		return (await this.client.json.set(key, path, value)) as 'OK' | null;
	}

	// Check if a key exists
	async exists(key: string): Promise<number> {
		return await this.client.exists(key);
	}

	// Push a value to the end of a list
	async rpush(key: string, values: string | string[]): Promise<number> {
		if (Array.isArray(values)) {
			return await this.client.rPush(key, values);
		}
		return await this.client.rPush(key, values);
	}

	// Push a value to the start of a list
	async lpush(key: string, values: string | string[]): Promise<number> {
		if (Array.isArray(values)) {
			return await this.client.lPush(key, values);
		}
		return await this.client.lPush(key, values);
	}

	// Remove and return a value from the start of a list
	async lpop(key: string): Promise<string | null> {
		return await this.client.lPop(key);
	}

	// Remove a value from the list (0: remove all elements)
	async lrem(key: string, count: number, value: string): Promise<number> {
		return await this.client.LREM(key, count, value);
	}

	// Return a range of elements from a list as an array ([0, -1]: for all elements)
	async lrange(key: string, start: number, stop: number): Promise<string[]> {
		return await this.client.lRange(key, start, stop);
	}

	// Delete a key immediately
	async del(key: string): Promise<number> {
		return await this.client.del(key);
	}

	// Delete a key eventually
	async unlink(...keys: string[]): Promise<number> {
		return await this.client.unlink(keys);
	}

	// Set the expiration on a key
	async expire(key: string, seconds: number): Promise<number | null> {
		return await this.client.expire(key, seconds);
	}

	// Connect to the DB instance
	async connect(): Promise<void> {
		if (!this.client.isOpen) {
			await this.client.connect();
		}
	}

	// Disconnect from the DB instance
	async disconnect(): Promise<void> {
		if (this.client.isOpen) {
			await this.client.quit();
		}
	}
}

function createDictDB(): DictDB {
	switch (config.get('db.dict.type')) {
		case 'redis':
			return new RedisDict(config.get('db.dict.redis') as RedisClientOptions);
		default:
			throw new Error('Unsupported Dictionary type');
	}
}

export default createDictDB();
