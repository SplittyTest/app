import Cache from '@/lib/Cache';
import DB from '@/lib/DB';
import { getTestVariationById, selectTest, selectTestVariation } from '@/lib/SplitTest';
import log from '@/lib/Logger';
import { zSplitTestParams } from '@/types/split_test';
import { Test, zSessionSchema } from '@/types/schemas';
import { NextFunction, Request, Response } from 'express';
import { intersection, isNil, merge, pick, sample, some, startsWith, uniq } from 'lodash-es';
import { matchAudience } from '@/lib/Utils/matchAudience';

async function getAvailableTestId(
	project_id: string,
	section_id: string,
	test_id: string | null | undefined,
	forced_test_exists: Test | undefined,
	session: any,
): Promise<string | null | undefined> {
	if (test_id && forced_test_exists) {
		return test_id;
	}
	if (session.test_ids.includes(`SKIP:${project_id}:${section_id}`)) {
		return 'SKIP';
	}
	return await selectTest(project_id, section_id);
}

// Check traffic against the test audience
async function ignoreTraffic(test_id: string, data: any): Promise<boolean> {
	if (test_id === 'SKIP') return false;

	const test = await DB.Tests.getExpandedById(test_id);

	// Check if traffic is included
	if (test && Array.isArray(test.audiences.included) && test.audiences.included.length > 0) {
		const audience_included = some(test.audiences.included, (audience: any[]) => matchAudience(data, audience));
		if (!audience_included) {
			return true;
		}
	}

	// Check if the traffic is explicitly excluded
	if (test && Array.isArray(test.audiences.excluded) && test.audiences.excluded.length > 0) {
		const audience_excluded = some(test.audiences.excluded, (audience: any[]) => matchAudience(data, audience));
		if (audience_excluded) {
			return true;
		}
	}

	return false;
}

async function logSessionMetrics(req: Request) {
	await DB.OLAP.insertSession({
		id: req.sessionID,
		// Sessions saved before the Subjects -> Projects rename have no project_id, so fall back to the API key's project
		project_id: (req.session as any).project_id ?? req.project_id ?? req.user?.project_id ?? null,
		test_ids: (req.session as any).test_ids ?? [],
		variation_ids: (req.session as any).variation_ids ?? {},
		data: (req.session as any).data ?? {},
		filtered_ip: (req.session as any).filtered_ip ?? null,
		created_at: (req.session as any).created_at ?? new Date(),
	});
}

function updateSessionWithSkip(req: Request, session: any, project_id: string, section_id: string) {
	const new_session = merge({}, session);
	new_session.test_ids = uniq(session.test_ids.concat([`SKIP:${project_id}:${section_id}`]));
	merge(req.session, new_session);
}

function updateSessionWithVariation(req: Request, session: any, test_id: string, variation_id: string) {
	const new_session = merge({}, session);
	new_session.test_ids = uniq(session.test_ids.concat([test_id]));
	new_session.variation_ids.push(variation_id);
	merge(req.session, new_session);
}

export async function participate(req: Request, res: Response, next: NextFunction): Promise<void> {
	let params;
	// Get a test that matches the project and section
	try {
		params = await zSplitTestParams.parseAsync(req.body);
	} catch (err) {
		log.error('Participate Parse Error:', err);
		throw err;
	}

	const { section_id, variation_id, data, ignore } = params;
	let { test_id } = params;
	const project_id = req.project_id || req.user?.project_id;
	let available_tests: string[] = await DB.Dict.lrange(`tests:queue:${project_id}:${section_id}`, 0, -1);

	// DEBUG LOG
	log.debug(
		`Participate: ${project_id}:${section_id} -> Queue Length: ${available_tests.length} | Items: ${JSON.stringify(available_tests)}`,
	);

	// Get a specific test (even if it is not active)
	let forced_test_exists: Test | undefined;
	if (test_id) {
		forced_test_exists = (await DB.Tests.getById(test_id)) || undefined;
		// An API key can only force tests that belong to its own project
		if (forced_test_exists && forced_test_exists.project_id !== project_id) {
			forced_test_exists = undefined;
			test_id = undefined;
		}
		if (forced_test_exists) {
			available_tests = [forced_test_exists.id];
		}
	}

	// Return empty response with status 204 if no active tests
	if (available_tests.length === 0) {
		res.status(204).send();
		return;
	}

	// 1. Force return a specific test variation
	if (variation_id) {
		// An API key can only preview variations of tests that belong to its own project
		const [variation_test_id] = variation_id.split('-');
		const variation_test = await DB.Tests.getById(variation_test_id);
		if (!variation_test || variation_test.project_id !== project_id) {
			res.status(204).send();
			return;
		}
		const variation = await Cache.get(`variations:${variation_id}`, async () => {
			return await getTestVariationById(variation_id as string);
		});
		// We do not want to log new sessions for forced variations, as this is typically used for previewing tests
		res.status(200).json({ test_id: null, variation: pick(variation, ['id', 'data']), session_id: null });
		return;
	}

	// Get the session from the cookie
	const session = await zSessionSchema.parseAsync(req.session);

	// Check for overlap in tests that were participated in
	const participations = intersection(session.test_ids, available_tests);
	if (participations.length > 0) {
		test_id = sample(participations);
	}

	// 2. Check for an existing experiment participation
	const existing_variation_id = session.variation_ids.find((v) => startsWith(v, test_id || 'DOES_NOT_EXIST'));
	if (!isNil(existing_variation_id)) {
		const variation = await Cache.get(`experiments:variations:${existing_variation_id}`, async () => {
			return await getTestVariationById(existing_variation_id);
		});
		if (!ignore) await logSessionMetrics(req);
		res.status(200).json({ test_id, variation: pick(variation, ['id', 'data']), session_id: req.sessionID });
		return;
	}

	// 3. Select a new test
	const selected_test_id = await getAvailableTestId(project_id!, section_id, test_id, forced_test_exists, session);

	if (!selected_test_id) {
		// No test selected
		if (!ignore) await logSessionMetrics(req);
		res.status(200).json({ test_id: null, variation: null, session_id: req.sessionID });
		return;
	}

	// 4. Filter test audiences
	if (await ignoreTraffic(selected_test_id, data)) {
		await logSessionMetrics(req);
		res.status(200).json({ test_id: null, variation: null, session_id: req.sessionID });
		return;
	}

	// 5. Handle Skip
	if (selected_test_id === 'SKIP') {
		log.debug(
			{
				project_id,
				section_id,
				session_id: session.id,
			},
			'Skipped test for this session',
		);

		if (!ignore) {
			updateSessionWithSkip(req, session, project_id!, section_id);
			await logSessionMetrics(req);
		}
		res.status(200).json({ test_id: null, variation: null, session_id: req.sessionID });
		return;
	}

	// 6. Select Variation
	const variation = await selectTestVariation(selected_test_id, session);

	log.debug('Variation selected for test', {
		project_id,
		section_id,
		test_id: selected_test_id,
		variation_id: variation.id,
	});

	if (!ignore) {
		updateSessionWithVariation(req, session, selected_test_id, variation.id!);
		await logSessionMetrics(req);
	}

	res.status(200).json({
		test_id: selected_test_id,
		variation: pick(variation, ['id', 'data']),
		session_id: req.sessionID,
	});
}
