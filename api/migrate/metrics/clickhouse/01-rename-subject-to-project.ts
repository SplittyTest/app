import { Kysely } from 'kysely';
import config from 'config';
import { ClickHouseClientConfigOptions, createClient } from '@clickhouse/client';
import { OLAPDB } from '../../../src/types/db';

// Renames subject_id to project_id in the events and sessions tables.
//
// subject_id can be part of a table's primary key / sort key, and ClickHouse can't rename key
// columns, so each table is recreated with the new column name, the data is copied over, and the
// tables are swapped. The original table is kept as <table>_subject_backup until you drop it.
//
// Stop the app while this runs: events written during the copy would not be carried over.

const tables = ['events', 'sessions'];

export async function up(db: Kysely<OLAPDB>): Promise<void> {
	const cfg = config.get('db.olap') as Record<string, any>;
	const client_cfg = { ...(cfg.clickhouse as ClickHouseClientConfigOptions) };
	// Copying a large table can take a while
	client_cfg.request_timeout = 6 * 60 * 60 * 1000;
	const client = createClient(client_cfg);
	await client.ping();

	const database = client_cfg.database || 'default';

	for (const table of tables) {
		const columns = (await (
			await client.query({
				query: 'SELECT name FROM system.columns WHERE database = {database: String} AND table = {table: String}',
				query_params: { database, table },
				format: 'JSONEachRow',
			})
		).json()) as { name: string }[];
		const names = columns.map((c) => c.name);

		if (!names.includes('subject_id')) {
			console.log(`${table}: no subject_id column, skipping`);
			continue;
		}
		if (names.includes('project_id')) {
			throw new Error(`${table} has both subject_id and project_id columns; resolve this manually before migrating`);
		}

		const new_table = `${table}_project_new`;
		const backup_table = `${table}_subject_backup`;

		// Build the new table from the current definition, so engine, keys and settings stay the same
		const create_result = (await (
			await client.query({ query: `SHOW CREATE TABLE \`${database}\`.\`${table}\``, format: 'JSONEachRow' })
		).json()) as { statement: string }[];
		const statement = create_result[0].statement;
		const name_pattern = new RegExp(`^CREATE TABLE\\s+\`?${database}\`?\\.\`?${table}\`?`);
		if (!name_pattern.test(statement)) {
			throw new Error(`Unexpected CREATE TABLE statement for ${table}`);
		}
		const new_statement = statement
			.replace(name_pattern, `CREATE TABLE \`${database}\`.\`${new_table}\``)
			.replace(/\bsubject_id\b/g, 'project_id');

		console.log(`${table}: creating ${new_table}`);
		await client.command({ query: `DROP TABLE IF EXISTS \`${database}\`.\`${new_table}\`` });
		await client.command({ query: new_statement });

		// Copy by name so column order doesn't matter
		const select_list = names.map((n) => (n === 'subject_id' ? '`subject_id` AS `project_id`' : `\`${n}\``)).join(', ');
		const insert_list = names.map((n) => (n === 'subject_id' ? '`project_id`' : `\`${n}\``)).join(', ');
		console.log(`${table}: copying rows`);
		await client.command({
			query: `INSERT INTO \`${database}\`.\`${new_table}\` (${insert_list}) SELECT ${select_list} FROM \`${database}\`.\`${table}\``,
		});

		const count = async (t: string) =>
			Number(
				(
					(await (
						await client.query({ query: `SELECT count() AS c FROM \`${database}\`.\`${t}\``, format: 'JSONEachRow' })
					).json()) as { c: string }[]
				)[0].c,
			);
		const [old_count, new_count] = [await count(table), await count(new_table)];
		if (old_count !== new_count) {
			throw new Error(`${table}: copied ${new_count} of ${old_count} rows; leaving the original table in place`);
		}

		console.log(`${table}: swapping tables (${new_count} rows); original kept as ${backup_table}`);
		await client.command({
			query: `RENAME TABLE \`${database}\`.\`${table}\` TO \`${database}\`.\`${backup_table}\`, \`${database}\`.\`${new_table}\` TO \`${database}\`.\`${table}\``,
		});
	}

	await client.close();
}

export async function down(db: Kysely<OLAPDB>): Promise<void> {
	// Restore the backups made by up(), if they are still there
	const cfg = config.get('db.olap') as Record<string, any>;
	const client = createClient(cfg.clickhouse as ClickHouseClientConfigOptions);
	const database = (cfg.clickhouse as ClickHouseClientConfigOptions).database || 'default';
	for (const table of tables) {
		await client.command({
			query: `RENAME TABLE \`${database}\`.\`${table}\` TO \`${database}\`.\`${table}_project_rolled_back\`, \`${database}\`.\`${table}_subject_backup\` TO \`${database}\`.\`${table}\``,
		});
	}
	await client.close();
}
