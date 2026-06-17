import config from "config";
import { createApp } from "../../src/app";
import { Express } from 'express-serve-static-core';
import request, { Test } from 'supertest';
import DB from "../../src/lib/DB";
import { sql } from "kysely";
import { getPrefix } from "../../src/lib/DB/tables/api_keys/api_key.schema";

const default_creds = {
    email: 'admin@splittytest.com',
    password: 'password',
    remember: false
}

export interface LoginCreds {
    cookie: string,
    id: string,
}

export const users = {
    viewer_1: {
        email: 'viewer1@splittytest.com',
        password: 'password1',
        remember: false,
    }
}

export async function initApp(): Promise<Express> {
    await DB.Dict.connect();

    return await createApp(config.get('session.key'));
}

export async function stopApp() {
    await DB.Metrics.disconnect();
    await DB.Dict.disconnect();
    await DB.Store.destroy();
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function login(
    app: Express,
    creds: Record<string, any> = default_creds,
): Promise<LoginCreds> {
    const got_users = await DB.Store.selectFrom('users').selectAll().where(sql.ref('email'), '=', creds.email).execute();

    const res = await request(app).post('/api/login').send(creds).expect(200);
    return {
        cookie: res.headers['set-cookie'][0],
        id: got_users[0].id,
    }
}

export async function getAdminIds(): Promise<string[]> {
    return (await DB.Store.selectFrom("users").select("id").where(sql.ref("role"), "=", "admin").orderBy('id', 'desc').execute()).map(rec => rec.id);
}

export async function apikey(
    app: Express,
    creds: Record<string, any> = default_creds,
): Promise<{ key: string, cleanup: () => Promise<void> }> {
    const got_users = await DB.Store.selectFrom('users').selectAll().where(sql.ref('email'), '=', creds.email).execute();
    const cookie_info = await login(app, creds);
    const res = await request(app).post('/api/api-keys').set('Cookie', cookie_info.cookie).send(creds).expect(201);

    const prefix = getPrefix(res.body.key);
    const cleanup = async () => {
        await DB.Store.deleteFrom('api_keys').where(sql.ref('prefix'), '=', prefix).execute();
    }
    return {
        key: res.body.key,
        cleanup,
    }
}   