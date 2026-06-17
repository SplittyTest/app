import { describe, expect, test, beforeAll } from '@jest/globals';
import { RedisDict } from '../../../../src/lib/DB/Dict';
import { createClient } from 'redis';

describe('RedisDict', () => {
    let kv: RedisDict;
    let client: ReturnType<typeof createClient>;

    beforeAll(async () => {
        kv = new RedisDict({ url: 'redis://localhost:6379' });
        await kv.connect();
        client = createClient({ url: 'redis://localhost:6379' });
        await client.connect();
        await client.ping();
    });

    afterAll(async () => {
        await client.flushAll();
        await kv.disconnect();
        await client.quit();
    });

    test('connects to Redis', async () => {
        const pong = await kv.client.ping();
        expect(pong).toBe('PONG');
    });

    test('jsonGet() on non-existing key returns null', async () => {
        const value = await kv.jsonGet('non_existing_key');
        expect(value).toBeNull();
    });

    test('jsonGet() returns stored JSON value', async () => {
        await client.json.set('json_key', '$', { test: 'value' });
        const value = await kv.jsonGet('json_key');
        expect(value).toEqual({ test: 'value' });
    });

    test('jsonSet() stores JSON value', async () => {
        const res = await kv.jsonSet('json_set_key', '$', { foo: 'bar' });
        expect(res).toBe('OK');

        const value = await client.json.get('json_set_key');
        expect(value).toEqual({ foo: 'bar' });
    });

    test('exists() returns correct existence status', async () => {
        await client.set('exist_key', 'value');
        const exists = await kv.exists('exist_key');
        expect(exists).toBe(1);

        const notExists = await kv.exists('non_exist_key');
        expect(notExists).toBe(0);
    });

    test('lpush() and lpop() work correctly', async () => {
        await kv.lpush('list_key', ['a', 'b', 'c']);
        const value1 = await kv.lpop('list_key');
        expect(value1).toBe('c');
        const value2 = await kv.lpop('list_key');
        expect(value2).toBe('b');
    });

    test('rpush() and lpop() work correctly', async () => {
        await kv.rpush('list_key_r', ['1', '2', '3']);
        const value1 = await kv.lpop('list_key_r');
        expect(value1).toBe('1');
        const value2 = await kv.lpop('list_key_r');
        expect(value2).toBe('2');
    });

    test('lrem() removes specified elements', async () => {
        await kv.rpush('list_key_rem', ['x', 'y', 'x', 'z', 'x']);
        const removedCount = await kv.lrem('list_key_rem', 3, 'x');
        expect(removedCount).toBe(3);

        const remaining1 = await kv.lpop('list_key_rem');
        expect(remaining1).toBe('y');
        const remaining2 = await kv.lpop('list_key_rem');
        expect(remaining2).toBe('z');
        const remaining3 = await kv.lpop('list_key_rem');
        expect(remaining3).toBe(null);
    });

    test('lrange() retrieves correct range of elements', async () => {
        await kv.rpush('list_key_range', ['a', 'b', 'c', 'd', 'e']);
        const range = await kv.lrange('list_key_range', 1, 3);
        expect(range).toEqual(['b', 'c', 'd']);
    });

    test('del() removes the key', async () => {
        await client.set('key_to_delete', 'value');
        const delCount = await kv.del('key_to_delete');
        expect(delCount).toBe(1);

        const exists = await kv.exists('key_to_delete');
        expect(exists).toBe(0);
    });

    test('expire() sets expiration on key', async () => {
        await client.set('key_to_expire', 'value');
        const res = await kv.expire('key_to_expire', 1);
        expect(res).toBe(1);

        // Wait for 2 seconds to ensure the key expires
        await new Promise((r) => setTimeout(r, 2000));
        const exists = await kv.exists('key_to_expire');
        expect(exists).toBe(0);
    });
});
