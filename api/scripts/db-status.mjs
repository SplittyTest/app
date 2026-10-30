// Prints the state of the Postgres store database: applied migrations, tables, columns and row counts.
// Usage (from the api folder): node scripts/db-status.mjs
import 'dotenv/config';
import config from 'config';
import pg from 'pg';

const pg_config = config.get('db.store.postgres');
const client = new pg.Client(pg_config);

try {
	await client.connect();
	console.log(`Connected to ${pg_config.database} on ${pg_config.host}:${pg_config.port}\n`);

	const has_migrations = await client.query(
		"SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kysely_migration'",
	);
	console.log('Applied migrations:');
	if (has_migrations.rowCount) {
		const { rows } = await client.query('SELECT name, timestamp FROM kysely_migration ORDER BY name');
		for (const row of rows) console.log(`  ${row.name}  (${row.timestamp})`);
	} else {
		console.log('  (no kysely_migration table)');
	}

	const { rows: columns } = await client.query(`
		SELECT table_name, column_name, data_type
		FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name NOT LIKE 'kysely_%'
		ORDER BY table_name, ordinal_position
	`);
	const tables = {};
	for (const col of columns) (tables[col.table_name] ??= []).push(`${col.column_name}:${col.data_type}`);

	console.log('\nTables:');
	for (const [table, cols] of Object.entries(tables)) {
		const { rows } = await client.query(`SELECT count(*)::int AS n FROM "${table}"`);
		console.log(`  ${table} (${rows[0].n} rows)\n    ${cols.join(', ')}`);
	}
} catch (err) {
	console.error('Could not read the database:', err.message);
	process.exitCode = 1;
} finally {
	await client.end().catch(() => {});
}
