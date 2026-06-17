import { beforeAll, describe, expect, it, afterAll, beforeEach, afterEach } from '@jest/globals';
import { initApp, stopApp, getAdminIds, login, users } from '../../utils';
import DB from '../../../../src/lib/DB';
import { ulid } from 'ulid';
import { sql } from 'kysely';
import { Alert, zAlertSchema } from '../../../../src/lib/DB/tables/alerts/alert.schema';
import { Express } from 'express-serve-static-core';
import request from 'supertest';

let app: Express;
beforeAll(async () => {
    app = await initApp();
});

afterAll(async () => {
    await stopApp();
})

describe('Alerts Routes', () => {
    let admin_ids: string[] | undefined;
    let alerts: Alert[] | undefined;
    let cookie: string | undefined;


    beforeEach(async () => {
        admin_ids = await getAdminIds();

        alerts = admin_ids.map(id => {
            return zAlertSchema.parse({
                id: ulid(),
                user_id: id,
                test_id: ulid(),
                event: 'winner',
                content: 'content',
                status: 'unread',
            })
        })

        await DB.Store.insertInto("alerts").values(alerts).execute();

        const user_info = await login(app);
        cookie = user_info.cookie;
    });

    afterEach(async () => {
        await DB.Store.deleteFrom("alerts").where(sql.ref('id'), "in", alerts?.map(alert => alert.id)).execute();
    });

    describe('GET /alerts', () => {
        it('you can get the alerts if have the right roles', async () => {
            const res = await request(app)
                .get('/api/alerts')
                .set('Cookie', cookie!)
                .expect(200);

            const body = res.body;
            expect(Array.isArray(body)).toBe(true);

            const ids_found = new Set();
            body.forEach((rec: any) => {
                expect(() => zAlertSchema.parse(rec)).not.toThrow();
                ids_found.add(rec.user_id);
            });

            expect(ids_found.size).toBe(1);
        });

        it('returns empty array if user has no alerts', async () => {
            // Create a viewer user with no alerts

            // Simulate login for viewer
            const user_info = await login(app, {
                email: 'viewer1@splittytest.com',
                password: 'password1',
                remember: false,
            });
            const res = await request(app)
                .get('/api/alerts')
                .set('Cookie', user_info.cookie)
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(0);
        });

        it('returns 401 if not authenticated', async () => {
            const res = await request(app)
                .get('/api/alerts')
                .expect(401);
        });
    });

    describe('GET /alerts/:id', () => {
        it('returns the alert if user owns it', async () => {
            const alert = alerts![0];
            const res = await request(app)
                .get(`/api/alerts/${alert.id}`)
                .set('Cookie', cookie!)
                .expect(200);

            expect(res.body).toMatchObject(alert);
        });

        it('returns null if user does not own the alert', async () => {
            const user_info = await login(app, users.viewer_1);
            const alert = alerts![0];
            const res = await request(app)
                .get(`/api/alerts/${alert.id}`)
                .set('Cookie', user_info.cookie)
                .expect(200);

            expect(res.body).toBeNull();
        });
    });

    describe('PATCH /alerts/:id', () => {
        it('updates the alert if user owns it', async () => {
            const alert = alerts![0];
            await request(app)
                .patch(`/api/alerts/${alert.id}`)
                .set('Cookie', cookie!)
                .send({ alert: { status: 'read' } })
                .expect(200);

            //@ts-ignore
            const rec = await DB.Store.selectFrom("alerts").select("status").where(sql.ref("id"), "=", alert.id).executeTakeFirst();
            expect(rec?.status).toBe('read');
        });

        it('does not update alert if user does not own it', async () => {
            const user_info = await login(app, users.viewer_1);
            const alert = alerts![0];
            await request(app)
                .patch(`/api/alerts/${alert.id}`)
                .set('Cookie', user_info.cookie)
                .send({ alert: { status: 'unread' } })
                .expect(404);
        });
    });

    describe('DELETE /alerts/:id', () => {
        it('deletes the alert if user owns it', async () => {
            const alert = alerts![0];
            const res = await request(app)
                .delete(`/api/alerts/${alert.id}`)
                .set('Cookie', cookie!)
                .expect(200);

            expect(res.body).toBeTruthy();
            // Confirm deletion
            const check = await DB.Alerts.getById(alert.id);
            expect(check).toBeNull();
        });

        it('does not delete alert if user does not own it', async () => {

            const user_info = await login(app, users.viewer_1);
            const alert = alerts![1];
            const res = await request(app)
                .delete(`/api/alerts/${alert.id}`)
                .set('Cookie', user_info.cookie)
                .expect(404);

            // Should not delete, so alert still exists
            const check = await DB.Alerts.getById(alert.id);
            expect(check).not.toBeNull();
        });
    });
});