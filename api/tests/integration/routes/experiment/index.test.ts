// import request from 'supertest';
// import { Express } from 'express-serve-static-core';
import { beforeAll, describe, expect, it, afterAll } from '@jest/globals';
// import DB from '../../../../src/lib/DB';
// import { sql } from 'kysely';
// import { initApp, stopApp, sleep, LoginCreds, login } from '../../utils';
// import { APIKey, zAPIKeySchema } from '../../../../src/lib/DB/tables/api_keys/api_key.schema';
// import { type ExperimentTest } from '../../../../src/types/'
// import { omit } from 'lodash-es';
// import { Project, zProjectSchema } from '../../../../src/lib/DB/tables/projects/project.schema';
// import { ulid } from 'ulid';


// let app: Express;
// beforeAll(async () => {
//     app = await initApp();
// });

// afterAll(async () => {
//     await stopApp();
// });

// describe('Expirement Routes', () => {
//     let api_key: APIKey;
//     let full_key: string;
//     let creds: LoginCreds;
//     let project: Project;

//     beforeAll(async () => {
//         api_key = zAPIKeySchema.parse({
//             name: 'test',
//             domain_whitelist: ['https://google.com'],
//             status: 'active',
//         });

//         creds = await login(app);

//         const res = await request(app)
//             .post('/api/api-keys')
//             .send(omit(api_key, ['key', 'prefix']))
//             .set('Cookie', creds.cookie)
//             .expect(201);

//         full_key = res.body.key;

//         project = zProjectSchema.parse({
//             id: 'abc',
//             name: 'test project',
//             type: 'website',
//             sections: [{
//                 id: 'def',
//                 data: {
//                     test: 'data'
//                 },
//                 max_concurrent_tests: 2,
//                 testing_enabled: true,
//                 skip_test_weight: 0,
//                 description: "somethig"
//             }],
//             data: {
//                 test: 'data'
//             },
//             max_concurrent_tests: 2,
//             testing_enabled: true,
//         })

//         await DB.Store.insertInto("projects").values({ ...project, sections: JSON.stringify(project.sections), data: JSON.stringify(project.data) }).execute()
//     });

//     afterAll(async () => {
//         await DB.Store.deleteFrom("api_keys").where(sql.ref("name"), "=", "test").execute();
//         await DB.Store.deleteFrom("projects").where(sql.ref("id"), "=", "abc").execute();
//     })

//     describe('POST /participate', () => {
//         it('should return 204 if there are no active tests', async () => {
//             const experiment: ExperimentTest = {
//                 project_id: 'abc',
//                 section_id: 'def',
//                 data: {
//                     my: 'data'
//                 },
//             }

//             // await request(app)
//             //     .post('/participate')
//             //     .set('Authorization', `API-Key ${full_key}`)
//             //     .send(experiment)
//             //     .expect(204);
//         });
//     })
// });

describe('test', () => {
    it('pass', () => {
        expect(1 + 1).toBe(2);
    })
})