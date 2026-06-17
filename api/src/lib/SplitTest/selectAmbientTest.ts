import DB from '@lib/DB';

// Get the next available test from the ambient test queue
export async function selectAmbientTest(subject_id: string, section_id: string): Promise<string | null> {
    // Check if there are any ambient tests
    const list = await DB.Dict.lrange(`tests:ambient:${subject_id}:${section_id}`, 0, -1);

    // Just pick the first one for now (or strategy if multiple ambient tests exist?)
    // Basic implementation: Round robin or just first.
    // If we want consistent baselining, returning the first one is stable.
    if (list && list.length > 0) {
        return list[0];
    }

    return null;
}
