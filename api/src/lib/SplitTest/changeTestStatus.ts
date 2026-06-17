import { Test, TestResult } from '@/types/schemas';
import DB from '@lib/DB';
import { ExperimentError } from '@lib/Errors/ExperimentError';
import log from '@lib/Logger';
import isArrayWithLength from '@lib/Utils/isArrayWithLength';
import { sendWebhook } from '@lib/Utils/webhook';
import { forIn } from 'lodash-es';
import { asyncForEach } from 'modern-async';
import { ulid } from 'ulid';
import { addTestToQueue } from './addTestToQueue';
import { removeTestFromQueue } from './removeTestFromQueue';

export async function changeTestStatus(test: Test, new_status: Test['status'], user_id?: string) {
	const timestamp = new Date();

	// DEBUG
	log.debug(`changeTestStatus: ${test.id} Status: ${test.status} -> ${new_status}`);

	// Start a pending test
	if (new_status === 'active' && test.status === 'pending') {
		// Get the test subject
		const subject = await DB.Subjects.getById(test.subject_id);
		const active_subject_tests = await DB.Tests.getByFilter((eb: any) =>
			eb.and([eb('subject_id', '=', test.subject_id), eb('status', '=', 'active')]),
		);

		// Check if the test can be activated for the subject
		if (active_subject_tests.length >= (subject?.max_concurrent_tests || 1)) {
			throw new ExperimentError('Max concurrent test limit reached for subject', {
				test_id: test?.id,
				subject_id: test.subject_id,
				section_id: test.section_id,
			});
		}

		// Check if the test can activate for the section
		const active_section_tests = active_subject_tests.filter((subject_test) => {
			return subject_test.section_id === test.section_id;
		});
		const section = subject?.sections.find((sec) => {
			return sec.id === test.section_id;
		});
		if (active_section_tests.length >= (section?.max_concurrent_tests || 1)) {
			throw new ExperimentError('Max concurrent test limit reached for section', {
				test_id: test?.id,
				subject_id: test.subject_id,
				section_id: test.section_id,
			});
		}

		// Add the test to the active tests list
		await addTestToQueue(test.id);

		// Create a list with active variations to loop through (delete the key first to ensure it is clean)
		await DB.Dict.unlink(`test:${test.id}:variations_queue:default`);
		await asyncForEach(test.variations, async (variation) => {
			log.debug(`[changeTestStatus] Processing variation: ${JSON.stringify(variation)}`);
			if (variation.status === 'active') {
				await DB.Dict.rpush(
					`test:${test.id}:variations_queue:default`,
					Array(variation.weight || 1).fill(variation.id),
				);
			}
		});

		// Update the test status
		await DB.Tests.updateById(test.id, {
			status: new_status,
			started_at: timestamp,
		});

		// Update the status logs
		DB.StatusLogs.insert({
			id: ulid(),
			test_id: test?.id,
			type: 'test',
			data: {
				status: 'active',
				user_id,
			},
			created_at: timestamp,
		}).catch((err) => {
			log.error(
				{
					test_id: test?.id,
					status: 'active',
				},
				'Unable to update the status logs',
				err,
			);
		});
	}

	// Pause an active test
	else if (new_status === 'paused' && test.status === 'active') {
		// Remove the test from the active tests list
		await removeTestFromQueue(test.id);

		// (!) Do not delete the test variation queue, we want to pick back up where we started

		// Update the test status
		await DB.Tests.updateById(test.id, {
			status: 'paused',
		});

		// Update the status logs
		DB.StatusLogs.insert({
			id: ulid(),
			test_id: test?.id,
			type: 'test',
			data: {
				status: 'paused',
				user_id,
			},
			created_at: timestamp,
		}).catch((err) => {
			log.error(
				{
					test_id: test?.id,
					status: 'paused',
				},
				'Unable to update the status logs',
				err,
			);
		});
	}

	// Unpause a paused test
	else if (new_status === 'active' && test.status === 'paused') {
		// Add the test back into the active queue
		await addTestToQueue(test.id);

		// Update the test status
		await DB.Tests.updateById(test.id, {
			status: 'active',
		});

		// Update the status logs
		DB.StatusLogs.insert({
			id: ulid(),
			test_id: test?.id,
			type: 'test',
			data: {
				status: 'unpaused',
				user_id,
			},
			created_at: timestamp,
		}).catch((err) => {
			log.error(
				{
					test_id: test?.id,
					status: 'unpaused',
				},
				'Unable to update the status logs',
				err,
			);
		});
	}

	// Stop an active or paused test
	else if (new_status === 'complete' && (test.status === 'active' || test.status === 'paused')) {
		// Save the results to the DB
		const test_results = await DB.Dict.jsonGet(`test:${test.id}:results`);
		if (test_results) {
			const test_result_rows: TestResult[] = [];
			forIn(test_results, (segment_row, segment_hash) => {
				forIn(segment_row, (variation_row, variation_id) => {
					const merged_row = {
						test_id: test.id,
						variation_id,
						segment_hash,
						...variation_row,
					};
					test_result_rows.push(merged_row);
				});
			});
			await DB.TestResults.insert(test_result_rows);
		}

		// Remove the test from the active tests list
		await removeTestFromQueue(test.id);

		// Delete all keys associated with the test
		const test_keys = await DB.Dict.getKeys(`test:${test.id}:*`);
		if (isArrayWithLength(test_keys)) {
			await DB.Dict.unlink(...test_keys);
		}

		// Update the test status
		await DB.Tests.updateById(test.id, {
			status: 'complete',
			ended_at: timestamp,
		});

		// Update the status logs
		DB.StatusLogs.insert({
			id: ulid(),
			test_id: test?.id,
			type: 'test',
			data: {
				status: 'complete',
				user_id,
			},
			created_at: timestamp,
		}).catch((err) => {
			log.error(
				{
					test_id: test?.id,
					status: 'complete',
				},
				'Unable to update the status logs',
				err,
			);
		});
	}

	// Archive a pending or complete test
	else if (new_status === 'archived' && (test.status === 'pending' || test.status === 'complete')) {
		// Update the test status
		await DB.Tests.updateById(test.id, {
			status: 'archived',
		});

		// Update the status logs
		DB.StatusLogs.insert({
			id: ulid(),
			test_id: test?.id,
			type: 'test',
			data: {
				status: 'archived',
				user_id,
			},
			created_at: timestamp,
		}).catch((err) => {
			log.error(
				{
					test_id: test?.id,
					status: 'archived',
				},
				'Unable to update the status logs',
				err,
			);
		});
	}

	// Unarchive an archived test
	else if (new_status === 'complete' && test.status === 'archived') {
		// Update the test status
		await DB.Tests.updateById(test.id, {
			status: 'complete',
		});

		// Update the status logs
		DB.StatusLogs.insert({
			id: ulid(),
			test_id: test?.id,
			type: 'test',
			data: {
				status: 'complete',
				user_id,
			},
			created_at: timestamp,
		}).catch((err) => {
			log.error(
				{
					test_id: test?.id,
					status: 'complete',
				},
				'Unable to update the status logs',
				err,
			);
		});
	}

	// Throw an error if the status could not be changed
	else {
		throw new ExperimentError('Test status cannot be changed', {
			test_id: test.id,
			reason: `Changing a test with the status '${test.status}' to '${new_status}' is not allowed`,
		});
	}

	// Send a webhook
	sendWebhook('test_status', {
		subject_id: test.subject_id,
		test_id: test.id,
		test,
		old_status: test.status,
		new_status: new_status,
	});

	// Clear the subject list cache
	DB.Dict.del('db:subjects:getList').catch((err) => {
		log.warn('Unable to clear cache key for subject list');
	});

	return {
		status: new_status,
		timestamp,
	};
}
