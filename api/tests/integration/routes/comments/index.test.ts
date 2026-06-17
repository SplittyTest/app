import request from 'supertest';
import { Express } from 'express-serve-static-core';
import { beforeAll, describe, expect, it, afterAll } from '@jest/globals';
import DB from '../../../../src/lib/DB';
import { sql } from 'kysely';
import { initApp, stopApp, sleep, getAdminIds, login } from '../../utils';
import { Comment, zCommentSchema } from '../../../../src/lib/DB/tables/comments/comment.schema';
import { ulid } from 'ulid';



let app: Express;
beforeAll(async () => {
    app = await initApp();
});

afterAll(async () => {
    await stopApp();
});

describe('Comments Routes', () => {
    let comments: Comment[] | undefined;
    let admin_ids: string[];
    let cookie: string | undefined;

    beforeAll(async () => {
        admin_ids = await getAdminIds();
        comments = admin_ids.map(admin_id => {
            return zCommentSchema.parse({
                id: ulid(),
                test_id: ulid(),
                user_id: admin_id,
                content: 'some content',
            });
        });


        const user_info = await login(app);
        cookie = user_info.cookie

        await DB.Store.insertInto("comments").values(comments).execute();
    });

    afterAll(async () => {
        await DB.Store.deleteFrom("comments").where(sql.ref("id"), "in", comments?.map(comment => comment.id)).execute();
    })

    describe('/comments', () => {
        it('GET should return all comments for an admin user', async () => {
            const res = await request(app)
                .get('/api/comments')
                .set('Cookie', cookie!)
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(2);
            res.body.forEach((comment: Comment) => {
                expect(() => zCommentSchema.parse(comment)).not.toThrow();
            });
        });

        it('POST should insert a new comment', async () => {
            const new_comment = zCommentSchema.parse({
                id: ulid(),
                test_id: ulid(),
                content: 'nice comment',
            });
            comments?.push(new_comment);

            const res = await request(app)
                .post('/api/comments')
                .set('Cookie', cookie!)
                .send({ comment: new_comment })
                .expect(200);

            expect(res.body).toMatchObject(new_comment);
        });
    });

    describe('/comments/:id', () => {
        it('GET should return a single comment by id', async () => {
            const comment = comments![0];

            const res = await request(app)
                .get(`/api/comments/${comment.id}`)
                .set('Cookie', cookie!)
                .expect(200);

            expect(res.body).toMatchObject(comment);
        });

        it('PATCH should update a comment by id', async () => {
            const comment = comments![0];
            const updated_content = 'updated content';
            const res = await request(app)
                .patch(`/api/comments/${comment.id}`)
                .set('Cookie', cookie!)
                .send({ comment: { content: updated_content } })
                .expect(200);

            await sleep(500);
            const got = await DB.Store.selectFrom("comments").selectAll().where(sql.ref('id'), '=', comment.id).execute() as Comment[];
            expect(got[0].content).toBe(updated_content);
        });

        it('DELETE should delete a comment by id', async () => {
            const comment = comments![0];
            await request(app)
                .delete(`/api/comments/${comment.id}`)
                .set('Cookie', cookie!)
                .expect(200);

            const res = await DB.Store.selectFrom("comments").selectAll().where(sql.ref("id"), "=", comment.id).execute();
            expect(res.length).toBe(0);
        });
    });
});