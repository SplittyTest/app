import { beforeAll, afterAll, describe, it } from '@jest/globals';
import { zSettingSchema, Setting } from '../../../../src/lib/DB/tables/settings/setting.schema';
import { asyncForEach } from 'modern-async';
import request from 'supertest';
import DB from '../../../../src/lib/DB';
import { sql } from 'kysely';
import { initApp, login, LoginCreds, stopApp } from '../../utils';
import { Express } from 'express';
import z from 'zod';

let app: Express;
beforeAll(async () => {
    app = await initApp();

});

afterAll(async () => {
    await stopApp();
});

describe('Settings Routes', () => {
    let creds: LoginCreds;

    beforeAll(async () => {
        creds = await login(app)
    });

    describe('/settings', () => {
        let settings: Setting[] = [];

        beforeAll(async () => {
            settings = [
                zSettingSchema.parse({
                    id: 'locale',
                    value: { a: 'test' },
                }),
                zSettingSchema.parse({
                    id: 'currency',
                    value: { b: 'test2' }
                }),
            ]

            await DB.Store.insertInto("settings").values(
                settings.map(setting => ({
                    ...setting,
                    value: JSON.stringify(setting.value)
                }))
            ).execute();

        });

        afterAll(async () => {
            await asyncForEach(settings, async (setting: Setting) => {
                await DB.Store.deleteFrom("settings").where(sql.ref("id"), "=", setting.id).execute();
            });

            await DB.Store.destroy();
        });

        it('GET /settings should return {id: value} for all settings', async () => {
            const res = await request(app)
                .get("/api/settings")
                .set('Cookie', creds.cookie)
                .expect(200)

            // console.log(res.body);
            // expect(Object.entries(res.body).length).toBe(settings.length);
            // Object.values(res.body).forEach((setting: unknown) => {
            //     z.object({
            //         id: z.any()
            //     }).parse(setting);
            // });
        });

        it('GET /settings/:id should return a single {id: value} if it exists', async () => {
            const res = await request(app)
                .get('/api/settings/locale')
                .set('Cookie', creds.cookie)
                .expect(200);

            z.object({
                id: z.any()
            }).parse(res.body);
        });

        it('PATCH /settings/:id should update a setting', async () => {
            const update = {
                id: 'locale',
                value: { b: 'test' },
            }
            const res = await request(app)
                .patch('/api/settings/locale')
                .set('Cookie', creds.cookie)
                .send(update)
                .expect(200)

            zSettingSchema.parse(res.body);

            const got = await DB.Store.selectFrom("settings").selectAll().where(sql.ref("id"), "=", "locale").executeTakeFirst();
            expect(got).toMatchObject(update)
        });

        it('DELETE /settings/:id should delete a setting', async () => {
            const test_setting = { id: "abc", value: { test: "this" } }
            settings.push(test_setting);
            await DB.Store.insertInto("settings").values(test_setting).execute();

            const res = await request(app)
                .delete('/api/settings/abc')
                .set('Cookie', creds.cookie)
                .send(test_setting)
                .expect(200)

            const got = await DB.Store.selectFrom("settings").selectAll().where(sql.ref("id"), "=", "abc").executeTakeFirst();
            expect(got).toBeUndefined();
        });
    });

});