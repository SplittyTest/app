import { beforeAll, describe, expect, it, jest, afterAll, afterEach, beforeEach } from '@jest/globals';
import { initApp, stopApp, login, users, LoginCreds } from '../../utils';
import { Express } from 'express-serve-static-core';
import request, { Response } from 'supertest';
import DB from '../../../../src/lib/DB';
import { sql } from 'kysely';
import omit from 'lodash-es/omit';
import { APIKey, getPrefix, zAPIKeySchema } from '../../../../src/lib/DB/tables/api_keys/api_key.schema';
import { blob } from 'stream/consumers';


let app: Express;
beforeAll(async () => {
    app = await initApp();
});

afterAll(async () => {
    await stopApp();
})


describe('API_Keys Routes', () => {
    let creds: LoginCreds

    jest.retryTimes(5)

    beforeAll(async () => {
        creds = await login(app)
    });

    describe('GET /api-keys', () => {
        let fake_keys: APIKey[];

        beforeAll(async () => {
            fake_keys = [
                zAPIKeySchema.parse({
                    key: 'test1',
                    prefix: 'test',
                    name: 'test1',
                    status: 'active'
                }),
                zAPIKeySchema.parse({
                    key: 'test2',
                    prefix: 'test2',
                    name: 'test2',
                    status: 'active',
                    ip_whitelist: ['0.0.0.0'],
                    domain_whitelist: ['https://splittest.com'],
                }),
            ];

            await DB.Store.insertInto("api_keys").values(fake_keys).execute();
        });

        afterAll(async () => {
            await DB.Store.deleteFrom("api_keys").where(sql.ref("key"), 'in', fake_keys.map(key => key.key)).execute()
        });

        it('should return api keys without the key or prefix', async () => {
            const res = await request(app)
                .get("/api/api-keys")
                .set('Cookie', creds.cookie)
                .expect(200)

            // there may be more than 2 keys since they can be added in later tests
            expect(res.body.length).toBeGreaterThanOrEqual(2);
            res.body.forEach((b: any) => {
                expect(b.prefix).not.toBeDefined()
                expect(b.key).not.toBeDefined();
            });

        });
    });

    describe('POST /api-keys', () => {
        let prefix: string;

        afterEach(async () => {
            await DB.Store.deleteFrom("api_keys").where(sql.ref("prefix"), "=", prefix!).execute();
        })

        it('should allow you to create an API key if youre an admin', async () => {
            let res: Response;
            res = await request(app)
                .post('/api/api-keys')
                .send({
                    name: 'test',
                })
                .set('Cookie', creds.cookie)
                .expect(201);

            expect(res.body.key).toBeDefined();
            expect(res.body.key.split('-').length).toBe(3);


            prefix = res.body.key.split('-').slice(0, 2).join('-');
        });

        it('should allow you to add whitelisted IPs', async () => {
            const base: Record<string, any> = {
                name: 'test',
                ip_whitelist: ['0.0.0.0'],
                domain_whitelist: ['https://google.com'],
            }
            const res = await request(app)
                .post('/api/api-keys')
                .set('Cookie', creds.cookie)
                .send(base)
                .expect(201);

            expect(res.body.key).toBeDefined();
            base.key = res.body.key

            prefix = res.body.key.split('-').slice(0, 2).join('-');
            const got = await DB.Store.selectFrom("api_keys").selectAll().where(sql.ref("prefix"), "=", prefix).executeTakeFirst();
            expect(omit(got, 'key')).toMatchObject(omit(base, 'key'));
        });

        it('shouldnt be allowed if youre not an admin', async () => {
            const creds = await login(app, users.viewer_1);

            await request(app)
                .post('/api/api-keys')
                .set('Cookie', creds.cookie)
                .expect(403)
        });
    });

    describe('PATCH /api-keys/:key', () => {
        let api_key: string;
        let prefix: string;

        beforeAll(async () => {
            const res = await request(app)
                .post('/api/api-keys')
                .send({
                    name: 'test',
                })
                .set('Cookie', creds.cookie)
                .expect(201);

            api_key = res.body.key;
            prefix = getPrefix(api_key);
        });

        afterAll(async () => {
            await DB.Store.deleteFrom("api_keys").where(sql.ref("prefix"), "=", prefix).execute();
        });

        it('should be allowed to update properties of the key', async () => {
            await request(app)
                .patch(`/api/api-keys/${api_key}`)
                .send({
                    ip_whitelist: ['https://example.com']
                })
                .set('Cookie', creds.cookie)
                .expect(200);

            const got = await DB.Store.selectFrom("api_keys").selectAll().where(sql.ref("prefix"), "=", prefix).executeTakeFirst() as APIKey;
            expect(got?.ip_whitelist).toEqual(['https://example.com'])
        });

        it('should fail if you provide a bad key', async () => {
            await request(app)
                .patch('/api/api-keys/st-badkey-format')
                .send({
                    ip_whitelist: ['https://blah.com'],
                })
                .set('Cookie', creds.cookie)
                .expect(400)

            await request(app)
                .patch('/api/api-keys/ab-badkey-format')
                .send({
                    ip_whitelist: ['https://blah.com'],
                })
                .set('Cookie', creds.cookie)
                .expect(400)
        });
    });

    describe('DELETE /api-keys/:key', () => {
        let api_key: string;
        let prefix: string;

        beforeEach(async () => {
            const res = await request(app)
                .post('/api/api-keys')
                .send({
                    name: 'test',
                })
                .set('Cookie', creds.cookie)
                .expect(201);

            api_key = res.body.key;
            prefix = getPrefix(api_key);
        });

        afterAll(async () => {
            await DB.Store.deleteFrom("api_keys").where(sql.ref("prefix"), "=", prefix).execute();
        });

        it('should delete an api key if youre an admin and its an actual key', async () => {
            // the key exists
            let got = await DB.Store.selectFrom("api_keys").selectAll().where(sql.ref("prefix"), "=", prefix).executeTakeFirst();
            expect(got).toBeDefined();

            await request(app)
                .delete(`/api/api-keys/${api_key}`)
                .set('Cookie', creds.cookie)
                .expect(200)

            got = await DB.Store.selectFrom("api_keys").selectAll().where(sql.ref("prefix"), "=", prefix).executeTakeFirst();
            expect(got).not.toBeDefined()
        });
    });
});
