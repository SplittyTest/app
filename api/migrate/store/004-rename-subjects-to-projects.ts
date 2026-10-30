import { Kysely, sql } from 'kysely';
import config from 'config';

// Renames "subjects" to "projects": the table, every subject_id column, their indexes,
// and webhook filters that matched on the subject_id payload field.

const tables_with_column = ['api_keys', 'audiences', 'metrics', 'tests', 'webhooks'];

const indexes: { table: string; old_name: string; new_name: string; columns: [string, string][] }[] = [
	{ table: 'audiences', old_name: 'audiences_subject_id_idx', new_name: 'audiences_project_id_idx', columns: [['subject_id', 'project_id']] },
	{
		table: 'metrics',
		old_name: 'metrics_event_type_subject_id_idx',
		new_name: 'metrics_event_type_project_id_idx',
		columns: [['event_type', 'event_type'], ['subject_id', 'project_id']],
	},
	{
		table: 'tests',
		old_name: 'tests_subject_id_status_idx',
		new_name: 'tests_project_id_status_idx',
		columns: [['subject_id', 'project_id'], ['status', 'status']],
	},
	{
		table: 'tests',
		old_name: 'tests_subject_id_section_id_status_idx',
		new_name: 'tests_project_id_section_id_status_idx',
		columns: [['subject_id', 'project_id'], ['section_id', 'section_id'], ['status', 'status']],
	},
	{ table: 'webhooks', old_name: 'webhooks_subject_id_idx', new_name: 'webhooks_project_id_idx', columns: [['subject_id', 'project_id']] },
];

// Rewrite filter properties in a webhook's (nested) filter list
function renameFilterProperty(filters: any, from: string, to: string): any {
	if (Array.isArray(filters)) return filters.map((f) => renameFilterProperty(f, from, to));
	if (filters && typeof filters === 'object' && filters.property === from) return { ...filters, property: to };
	return filters;
}

async function renameWebhookFilters(db: Kysely<any>, from: string, to: string) {
	const rows = await db.selectFrom('webhooks').select(['id', 'filters']).execute();
	for (const row of rows) {
		const filters = typeof row.filters === 'string' ? JSON.parse(row.filters) : row.filters;
		const updated = renameFilterProperty(filters, from, to);
		if (JSON.stringify(updated) !== JSON.stringify(filters)) {
			await db
				.updateTable('webhooks')
				.set({ filters: JSON.stringify(updated) })
				.where('id', '=', row.id)
				.execute();
		}
	}
}

async function rename(db: Kysely<any>, direction: 'up' | 'down') {
	const [from_table, to_table] = direction === 'up' ? ['subjects', 'projects'] : ['projects', 'subjects'];
	const [from_col, to_col] = direction === 'up' ? ['subject_id', 'project_id'] : ['project_id', 'subject_id'];

	// Kysely's migrator already wraps each migration in a transaction where the database supports it
	await db.schema.alterTable(from_table).renameTo(to_table).execute();

	// Postgres keeps the primary key's old name after a table rename (SQLite doesn't name it)
	if (config.get('db.store.type') === 'postgres') {
		await sql`ALTER TABLE ${sql.table(to_table)} RENAME CONSTRAINT ${sql.ref(`${from_table}_pkey`)} TO ${sql.ref(`${to_table}_pkey`)}`.execute(db);
	}

	for (const table of tables_with_column) {
		await db.schema.alterTable(table).renameColumn(from_col, to_col).execute();
	}

	for (const index of indexes) {
		const [drop_name, create_name] = direction === 'up' ? [index.old_name, index.new_name] : [index.new_name, index.old_name];
		const columns = index.columns.map(([old_col, new_col]) => (direction === 'up' ? new_col : old_col));
		await db.schema.dropIndex(drop_name).ifExists().execute();
		await db.schema.createIndex(create_name).on(index.table).columns(columns).execute();
	}

	await renameWebhookFilters(db, from_col, to_col);
}

export async function up(db: Kysely<any>): Promise<void> {
	console.log('Renaming subjects to projects');
	await rename(db, 'up');
}

export async function down(db: Kysely<any>): Promise<void> {
	await rename(db, 'down');
}
