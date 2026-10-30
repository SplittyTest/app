import { Project } from '@/types/schemas';
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
	const test_queue_exists = await DB.Dict.exists(`tests:queue:${test.project_id}:${test.section_id}`);
	if (!test_queue_exists) {
		// Get the project and check if testing is enabled
		const project = await DB.Projects.getById(test.project_id);

		// Placeholder for the section
		let section: Project['sections'][0] | undefined;

		if (!project) {
			throw new ExperimentError('Test project was not found', {
				project_id: test.project_id,
			});
		} else {
			section = project.sections.find((section) => {
				return test.section_id === section.id;
			});

			if (!section) {
				throw new ExperimentError('Section was not found', {
					project_id: test.project_id,
					section_id: test.section_id,
				});
			}
		}

		// Add skip entries to the test queue
		if (section.skip_test_frequency > 0) {
			const skip_entries: string[] = new Array(section.skip_test_frequency).fill('SKIP');
			await DB.Dict.lpush(`tests:queue:${test.project_id}:${test.section_id}`, skip_entries);
		}
	}

	// Add the test_id to the list of active tests for the project and section
	// An entry is added for each weight
	const entries: string[] = new Array(test.weight).fill(test.id);
	await DB.Dict.lpush(`tests:queue:${test.project_id}:${test.section_id}`, entries);
	log.info(
		{
			test_id,
			project_id: test.project_id,
			section_id: test.section_id,
			weight: test.weight,
		},
		'Test added to queue',
	);
}
