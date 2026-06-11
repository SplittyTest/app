import { Kysely, sql } from 'kysely';
import { OLAPDB } from '../../../src/types/db';

// Adds subject_id to events for parity with the ClickHouse schema (used by
// subject-scoped metric queries). Sessions already has subject_id.
export async function up(db: Kysely<OLAPDB>): Promise<void> {
	await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS subject_id TEXT`.execute(db);
}

export async function down(db: Kysely<OLAPDB>): Promise<void> {
	await sql`ALTER TABLE events DROP COLUMN IF EXISTS subject_id`.execute(db);
}
