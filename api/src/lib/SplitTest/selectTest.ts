import DB from '@lib/DB';

// Get the next available test from the test queue
// We then move that test to then end of the list so it doesn't get picked too often
export async function selectTest(subject_id: string, section_id: string): Promise<string | null> {
	// Get all tests in the queue
	const tests = [];

	// Check if the audience matches the test

	// The dictionary key contains a list of all the active tests for the given subject and section
	const selected_test_id = await DB.Dict.lpop(`tests:queue:${subject_id}:${section_id}`);

	if (selected_test_id) {
		await DB.Dict.rpush(`tests:queue:${subject_id}:${section_id}`, selected_test_id);
		return selected_test_id;
	}

	return null;
}
