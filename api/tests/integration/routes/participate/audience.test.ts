import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';
import request from 'supertest';
import DB from '../../../../src/lib/DB';
import { initApp, login, LoginCreds, stopApp } from '../../utils';
import { Express } from 'express';
import { zAudienceSchema } from '../../../../src/lib/DB/tables/audiences/audience.schema';
import { zTestSchema } from '../../../../src/lib/DB/tables/tests/test.schema';
import { ulid } from 'ulid';
import bcrypt from 'bcrypt';

let app: Express;
beforeAll(async () => {
	app = await initApp();
});

afterAll(async () => {
	await stopApp();
});

describe('Participate Route with Audiences', () => {
	let creds: LoginCreds;
	const testId = ulid();
	const audienceId = 'mobile_users';
	const subjectId = 'test_subject';
	const sectionId = 'main_section';
	const keyPrefix = 'st-12345678';
	const fullKey = `${keyPrefix}-AABBCCDDEEFF`;

	beforeAll(async () => {
		creds = await login(app);

		// Cleanup
		await DB.Store.deleteFrom('test_results').execute();
		await DB.Store.deleteFrom('tests').execute();
		await DB.Store.deleteFrom('audiences').execute();
		await DB.Store.deleteFrom('api_keys').execute();

		// Create API Key
		const hashedKey = bcrypt.hashSync(fullKey, 10);
		await DB.Store.insertInto('api_keys')
			.values({
				key: hashedKey,
				name: 'Integr Test Key',
				prefix: keyPrefix,
				status: 'active',
			})
			.execute();

		// Create Audience
		await DB.Store.insertInto('audiences')
			.values({
				id: audienceId,
				name: 'Mobile Users',
				filters: JSON.stringify({ device: 'mobile' }),
			})
			.execute();

		// Create Test linked to Audience
		await DB.Store.insertInto('tests')
			.values({
				id: testId,
				name: 'Mobile Test',
				subject_id: subjectId,
				section_id: sectionId,
				audience_id: audienceId,
				variations: JSON.stringify([
					{ id: 'A', description: 'Control', data: {}, weight: 50, status: 'active' },
					{ id: 'B', description: 'Variant', data: {}, weight: 50, status: 'active' },
				]),
				conversion_event: 'click',
				status: 'active',
				created_by: ulid(),
				// Fill required defaults
				data_segments: JSON.stringify([]),
			} as any) // Cast any to bypass if types mismatch with DB
			.execute();

		// Clear queue and Add test to queue in Redis so it can be picked up
		await DB.Dict.del(`tests:queue:${subjectId}:${sectionId}`);
		await DB.Dict.rpush(`tests:queue:${subjectId}:${sectionId}`, testId);

		// Populate variations queue
		await DB.Dict.del(`test:${testId}:variations_queue:default`);
		await DB.Dict.rpush(`test:${testId}:variations_queue:default`, ['A', 'B']);
	});

	it('should assign variation if data matches audience', async () => {
		const res = await request(app)
			.post('/participate')
			.set('Authorization', `API-Key ${fullKey}`)
			.set('Cookie', creds.cookie)
			.send({
				subject_id: subjectId,
				section_id: sectionId,
				data: { device: 'mobile' },
			})
			.expect(200);

		expect(res.body.variation).toBeDefined();
		expect(['A', 'B']).toContain(res.body.variation.id);
	});

	it('should NOT assign variation if data does NOT match audience', async () => {
		const res = await request(app)
			.post('/participate')
			.set('Authorization', `API-Key ${fullKey}`)
			.set('Cookie', creds.cookie)
			.send({
				subject_id: subjectId,
				section_id: sectionId,
				data: { device: 'desktop' },
			})
			.expect(200);

		// Should be null or undefined
		expect(res.body.variation).toBeFalsy();
	});
});
