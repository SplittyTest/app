import DB from '@lib/DB';
import { ExperimentError } from '@lib/Errors/ExperimentError';
import log from '@lib/Logger';

export async function removeTestFromQueue(test_id: string) {
	// Get the test
	const test = await DB.Tests.getById(test_id);

	if (!test) {
		throw new ExperimentError('A test with the given ID does not exist', {
			test_id,
		});
	}

	// Remove all values with the given test_id from the queue
	await DB.Dict.lrem(`tests:queue:${test.subject_id}:${test.section_id}`, 999, test_id);

	// Check if anything other than SKIPs remain
	const remaining_queue_items = await DB.Dict.lrange(`tests:queue:${test.subject_id}:${test.section_id}`, 0, -1);
	if (
		remaining_queue_items.every((item) => {
			return item === 'SKIP';
		})
	) {
		await DB.Dict.del(`tests:queue:${test.subject_id}:${test.section_id}`);
	}

	log.info(
		{
			test_id,
			subject_id: test.subject_id,
			section_id: test.section_id,
			weight: test.weight,
		},
		'Test removed from queue',
	);
}
