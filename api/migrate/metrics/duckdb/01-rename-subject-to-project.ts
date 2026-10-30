import { Kysely } from 'kysely';
import { OLAPDB } from '../../../src/types/db';

// Renames subject_id to project_id in the sessions table
export async function up(db: Kysely<OLAPDB>): Promise<void> {
	await db.schema.alterTable('sessions').renameColumn('subject_id', 'project_id').execute();
}

export async function down(db: Kysely<OLAPDB>): Promise<void> {
	await db.schema.alterTable('sessions').renameColumn('project_id', 'subject_id').execute();
}
