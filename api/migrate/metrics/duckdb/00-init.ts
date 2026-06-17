import { Kysely } from 'kysely';
import { OLAPDB } from '../../../src/types/db';

// DuckDB doesn't have native JSON column type through Kysely, store JSON as text
// Arrays (e.g., test_ids, variation_ids) will also be stored as JSON strings.
export async function up(db: Kysely<OLAPDB>): Promise<void> {
	// events table
	await db.schema
		.createTable('events')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('session_id', 'text')
		.addColumn('type', 'text')
		.addColumn('test_ids', 'text') // JSON array string
		.addColumn('variation_ids', 'text') // JSON array string
		.addColumn('data', 'text') // JSON payload
		.addColumn('value', 'real')
		.addColumn('created_at', 'timestamptz', (col) => col.notNull())
		.execute();

	// sessions table
	await db.schema
		.createTable('sessions')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('subject_id', 'text')
		.addColumn('test_ids', 'text') // JSON array string
		.addColumn('variation_ids', 'text') // JSON array string
		.addColumn('data', 'text') // JSON payload
		.addColumn('created_at', 'timestamptz', (col) => col.notNull())
		.execute();
}
