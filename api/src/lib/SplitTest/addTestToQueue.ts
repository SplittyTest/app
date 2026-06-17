import { Subject } from '@/types/schemas';
import DB from '@lib/DB';
import { ExperimentError } from '@lib/Errors/ExperimentError';
import log from '@lib/Logger';

export async function addTestToQueue(test_id: string) {
	// Get the test
	const test = await DB.Tests.getById(test_id);

	if (!test) {
		throw new ExperimentError('A test with the given ID does not exist', {
			test_id,
		});
	}

	// Check if any tests were previously running
	const test_queue_exists = await DB.Dict.exists(`tests:queue:${test.subject_id}:${test.section_id}`);
	if (!test_queue_exists) {
		// Get the subject and check if testing is enabled
		const subject = await DB.Subjects.getById(test.subject_id);

		// Placeholder for the section
		let section: Subject['sections'][0] | undefined;

		if (!subject) {
			throw new ExperimentError('Test subject was not found', {
				subject_id: test.subject_id,
			});
		} else {
			section = subject.sections.find((section) => {
				return test.section_id === section.id;
			});

			if (!section) {
				throw new ExperimentError('Section was not found', {
					subject_id: test.subject_id,
					section_id: test.section_id,
				});
			}
		}

		// Add skip entries to the test queue
		if (section.skip_test_frequency > 0) {
			const skip_entries: string[] = new Array(section.skip_test_frequency).fill('SKIP');
			await DB.Dict.lpush(`tests:queue:${test.subject_id}:${test.section_id}`, skip_entries);
		}
	}

	// Add the test_id to the list of active tests for the subject and section
	// An entry is added for each weight
	const entries: string[] = new Array(test.weight).fill(test.id);
	await DB.Dict.lpush(`tests:queue:${test.subject_id}:${test.section_id}`, entries);
	log.info(
		{
			test_id,
			subject_id: test.subject_id,
			section_id: test.section_id,
			weight: test.weight,
		},
		'Test added to queue',
	);
}
