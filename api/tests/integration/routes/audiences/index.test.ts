import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';
import { zAudienceSchema, Audience } from '../../../../src/lib/DB/tables/audiences/audience.schema';
import request from 'supertest';
import DB from '../../../../src/lib/DB';
import { initApp, login, LoginCreds, stopApp } from '../../utils';
import { Express } from 'express';

let app: Express;
beforeAll(async () => {
    app = await initApp();
});

afterAll(async () => {
    await stopApp();
});

describe('Audiences Routes', () => {
    let creds: LoginCreds;

    beforeAll(async () => {
        creds = await login(app);
    });

    describe('/audiences', () => {
        let audiences: Audience[] = [];

        beforeAll(async () => {
            // Clean up
            await DB.Store.deleteFrom('audiences').execute();

            audiences = [
                zAudienceSchema.parse({
                    id: 'audience_1',
                    name: 'Audience 1',
                    description: 'First audience',
                    filters: { country: 'US' },
                }),
                zAudienceSchema.parse({
                    id: 'audience_2',
                    name: 'Audience 2',
                    description: 'Second audience',
                    filters: { device: 'mobile' },
                }),
            ];

            await DB.Store.insertInto('audiences')
                .values(
                    audiences.map((audience) => ({
                        ...audience,
                        filters: JSON.stringify(audience.filters),
                    }))
                )
                .execute();
        });

        it('should list all audiences', async () => {
            const res = await request(app)
                .get('/api/audiences')
                .set('Cookie', creds.cookie)
                .expect(200);

            expect(res.body).toHaveLength(2);
            expect(res.body.map((a: any) => a.id).sort()).toEqual(['audience_1', 'audience_2']);
        });

        it('should create a new audience', async () => {
            const newAudience = {
                id: 'audience_3',
                name: 'Audience 3',
                description: 'Third audience',
                filters: { browser: 'chrome' },
            };

            const res = await request(app)
                .post('/api/audiences')
                .set('Cookie', creds.cookie)
                .send({ audience: newAudience })
                .expect(201);

            expect(res.body.id).toBe('audience_3');

            const dbAudience = await DB.Audiences.getById('audience_3');
            expect(dbAudience).toBeDefined();
            expect(dbAudience?.name).toBe('Audience 3');
        });

        it('should create a new audience with generated ID if not provided', async () => {
            const newAudience = {
                name: 'Audience No ID',
                description: 'Audience without ID',
                filters: { browser: 'firefox' },
            };

            const res = await request(app)
                .post('/api/audiences')
                .set('Cookie', creds.cookie)
                .send({ audience: newAudience })
                .expect(201);

            expect(res.body.id).toBeDefined();
            expect(res.body.id).not.toBeNull();
            expect(res.body.id).toMatch(/^[a-z0-9_]+$/);

            const dbAudience = await DB.Audiences.getById(res.body.id);
            expect(dbAudience).toBeDefined();
            expect(dbAudience?.name).toBe('Audience No ID');
        });
    });

    describe('/audiences/:id', () => {
        it('should get an audience by id', async () => {
            const res = await request(app)
                .get('/api/audiences/audience_1')
                .set('Cookie', creds.cookie)
                .expect(200);

            expect(res.body.id).toBe('audience_1');
            expect(res.body.name).toBe('Audience 1');
        });

        it('should update an audience', async () => {
            const res = await request(app)
                .patch('/api/audiences/audience_1')
                .set('Cookie', creds.cookie)
                .send({
                    audience: {
                        name: 'Updated Audience 1',
                    },
                })
                .expect(200);

            expect(res.body.name).toBe('Updated Audience 1');

            const dbAudience = await DB.Audiences.getById('audience_1');
            expect(dbAudience?.name).toBe('Updated Audience 1');
        });

        it('should delete an audience', async () => {
            await request(app)
                .delete('/api/audiences/audience_2')
                .set('Cookie', creds.cookie)
                .expect(200);

            const dbAudience = await DB.Audiences.getById('audience_2');
            expect(dbAudience).toBeNull();
        });
    });
});
