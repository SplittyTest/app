import { beforeAll, describe, expect, it } from '@jest/globals';
import DB from '../../../../src/lib/DB';
import { User, zUserSchema } from '../../../../src/lib/DB/tables/users/user.schema';
import { ulid } from 'ulid';
import { sql } from 'kysely';
import { omit } from 'lodash';
import { zAPIKeySchema } from '../../../../src/lib/DB/tables/api_keys/api_key.schema';
import { zSubjectSchema } from '../../../../src/lib/DB/tables/subjects/subject.schema';
import { asyncForEach } from 'modern-async';

describe('Store', () => {
    describe('read', () => {
        it('select() works', async () => {
            const users = await DB.Store.selectFrom('users').selectAll().execute();


            expect(users.length).toBeGreaterThanOrEqual(1);

            await zUserSchema.parseAsync(users[0]);
        });

        it('select() works for arrays', async () => {
            const key = zAPIKeySchema.parse({
                key: 'abc',
                name: "key1",
                ip_whitelist: ['0.0.0.0'],
                domain_whitelist: ['https://google.com'],
                status: 'active',
            })
            await DB.Store.insertInto("api_keys").values(key).execute();

            const got = await DB.Store.selectFrom("api_keys").selectAll().where(sql.ref("key"), "=", 'abc').executeTakeFirst();
            expect(got).toMatchObject(key)
        });
    });

    describe('insert', () => {
        it('insert() works', async () => {
            try {
                const user = await zUserSchema.parseAsync({
                    id: ulid(),
                    email: 'test@splittytest.com',
                    role: 'tester',
                    first_name: 'test',
                    last_name: 'test',
                    mfa: false,
                    status: 'active',
                    password: 'mypassword',
                } as User)

                const results = await DB.Store.insertInto('users').values(user).execute();

                const got = await DB.Store.selectFrom('users')
                    .where(sql.ref('email'), '=', 'test@splittytest.com')
                    .selectAll()
                    .execute();

                expect(got[0]).toMatchObject({
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    mfa: user.mfa,
                    status: user.status,
                });

                await zUserSchema.parseAsync(got[0])

            } finally {
                await DB.Store.deleteFrom('users')
                    .where(sql.ref('email'), '=', 'test@splittytest.com').execute();
            }
        });

        it('insert() works with arrays', async () => {
            try {
                const apikey = await zAPIKeySchema.parseAsync({
                    key: ulid(),
                    name: "Test",
                    ip_whitelist: [
                        '127.0.0.1',
                        '0.0.0.0'
                    ],
                    domain_whitelist: [
                        'https://google.com'
                    ],
                    status: 'active',
                });

                await DB.Store.insertInto("api_keys").values(apikey).execute();

                const res = await DB.Store.selectFrom("api_keys").selectAll().where(sql.ref("key"), "=", apikey.key).executeTakeFirst();

                expect(res).toMatchObject(apikey);
            } finally {
                await DB.Store.deleteFrom("api_keys").execute();
            }
        });

        it('insert() works with json', async () => {
            try {
                const subjects = await zSubjectSchema.parseAsync({
                    id: "test_subject_1",
                    name: "Test Subject",
                    type: "website",
                    description: "A subject for testing",
                    sections: [
                        {
                            id: "section1",
                            description: "First section",
                            data: { foo: "bar" },
                            max_concurrent_tests: 2,
                            testing_enabled: true,
                            skip_test_weight: 0
                        }
                    ],
                    data: { key1: "value1", key2: 42 },
                    max_concurrent_tests: 5,
                    testing_enabled: true,
                });

                await DB.Store.insertInto("subjects").values({
                    ...subjects,
                    sections: JSON.stringify(subjects.sections),
                    data: JSON.stringify(subjects.data),
                }).execute();

                const res = await DB.Store.selectFrom("subjects").selectAll().where(sql.ref("id"), "=", subjects.id).executeTakeFirst();
                expect(res).toMatchObject(subjects);
            } finally {
                await DB.Store.deleteFrom("subjects").where(sql.ref("id"), "=", "test_subject_1").execute()
            }
        })
    });

    describe('update', () => {
        it('update() works', async () => {
            try {
                const user = await zUserSchema.parseAsync({
                    id: ulid(),
                    email: 'test@splittytest.com',
                    role: 'tester',
                    first_name: 'test',
                    last_name: 'test',
                    mfa: false,
                    status: 'active',
                    password: 'mypassword',
                } as User)

                await DB.Store.insertInto('users').values(user).execute();

                user.last_login = new Date();


                await DB.Store.updateTable('users')
                    .set(omit(user, 'id'))
                    .where(sql.ref('email'), '=', 'test@splittytest.com')
                    .execute();

                const got = await DB.Store.selectFrom('users')
                    .where(sql.ref('email'), '=', 'test@splittytest.com')
                    .selectAll()
                    .executeTakeFirst()

                if (!got) throw new Error('empty retrieval');
                const gotUser = await zUserSchema.parseAsync(got);
                expect(gotUser.last_login).toEqual(user.last_login);

            } finally {
                await DB.Store.deleteFrom('users')
                    .where(sql.ref('email'), '=', 'test@splittytest.com').execute();
            }
        });

        it('update() works with arrays', async () => {
            try {
                const apikey = await zAPIKeySchema.parseAsync({
                    key: ulid(),
                    name: "Test",
                    ip_whitelist: [
                        '127.0.0.1',
                        '0.0.0.0'
                    ],
                    domain_whitelist: [
                        'https://google.com'
                    ],
                    status: 'active',
                });

                await DB.Store.insertInto("api_keys").values(apikey).execute();

                let res = await DB.Store.selectFrom("api_keys").selectAll().where(sql.ref("key"), "=", apikey.key).executeTakeFirst();

                expect(res).toMatchObject(apikey);


                apikey.domain_whitelist = [
                    ...(apikey.domain_whitelist ?? []),
                    'https://apple.com',
                ]

                await DB.Store.updateTable('api_keys').set(apikey).where(sql.ref('key'), '=', apikey.key).execute();

                res = await DB.Store.selectFrom("api_keys").selectAll().executeTakeFirst();
                expect(res).toMatchObject(apikey);

            } finally {
                await DB.Store.deleteFrom("api_keys").execute();
            }
        })
    })
});
