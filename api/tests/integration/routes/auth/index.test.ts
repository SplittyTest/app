import request from 'supertest';
import { Express } from 'express-serve-static-core';
import { beforeAll, describe, expect, it, afterAll } from '@jest/globals';
import DB from '../../../../src/lib/DB';
import { sql } from 'kysely';
import { initApp, stopApp, sleep } from '../../utils';



let app: Express;
beforeAll(async () => {
    app = await initApp();
});

afterAll(async () => {
    await stopApp();
});

describe('Auth Routes', () => {
    describe('POST /api/login', () => {
        it('should fail login with invalid credentials', async () => {
            const res = await request(app)
                .post('/api/login')
                .send({ email: 'wrong', password: 'wrong', remember: false });
            expect(res.status).toBe(401);
        });

        it('should succeed login with valid credentials', async () => {
            const admin_user = await DB.Store.selectFrom("users").selectAll().where(sql.ref("email"), "=", "admin@splittytest.com").executeTakeFirst();
            expect(admin_user).toBeDefined();
            const res = await request(app)
                .post('/api/login')
                .send({ email: 'admin@splittytest.com', password: 'password', remember: false })
            expect(res.status).toBe(200);

            await sleep(500);
            const updated_admin_user = await DB.Store.selectFrom("users").selectAll().where(sql.ref("email"), "=", "admin@splittytest.com").executeTakeFirst();
            expect(updated_admin_user).toBeDefined();
            expect(admin_user!.last_login).not.toBe(updated_admin_user!.last_login)
        });
    });

    describe('POST /api/logout', () => {
        it('should log out and return message', async () => {
            const res = await request(app)
                .post('/api/logout');
            expect(res.status).toBe(200);
            expect(res.body.message).toBe('You have been logged out');
        });
    });
    // describe('GET /api/auth', () => {
    //     it('should return 401 if not authenticated', async () => {
    //         const res = await request(app)
    //             .get('/api/auth');
    //         expect(res.status).toBe(401);
    //     });
    //     // Add more tests for authenticated user if you have session setup
    // });
});
