import 'dotenv/config';
import * as path from 'path';
import { promises as fs } from 'fs';
import config from 'config';
import { Kysely } from 'kysely';
import { Migrator, type Migration, type MigrationProvider } from 'kysely/migration';

// Loads migration files with require() so ts-node compiles them. Kysely's FileMigrationProvider uses a
// native import(), which skips ts-node and makes Node load the .ts files as ES modules, where imports
// without file extensions (e.g. '../../src/lib/DB/Table.schema') fail to resolve.
class RequireMigrationProvider implements MigrationProvider {
	constructor(private folder: string) {}

	async getMigrations(): Promise<Record<string, Migration>> {
		const migrations: Record<string, Migration> = {};
		const files = (await fs.readdir(this.folder)).sort();
		for (const file of files) {
			if (!/\.(ts|js|cjs|mts|mjs)$/.test(file) || file.endsWith('.d.ts')) continue;
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const migration = require(path.join(this.folder, file));
			migrations[file.replace(/\.[^.]+$/, '')] = migration.default ?? migration;
		}
		return migrations;
	}
}
import DB from '../src/lib/DB';
import { assert } from 'console';
import { type DB as DBType } from '../src/lib/DB/Table.schema';
import { OLAPDB as OLAPDBType } from '../src/types/db';
import { ClickhouseDialect } from '@founderpath/kysely-clickhouse';
import { DuckDBInstance } from '@duckdb/node-api';
import { DuckDbDialect } from '@oorabona/kysely-duckdb';

// Migrations that were renamed after some databases had already run them under the old name.
// Kysely stops with "corrupted migrations" when a recorded name has no file, so the records are renamed first.
const renamed_migrations: Record<string, Record<string, string>> = {
	store: {
		'002-user-set': '002-settings',
	},
};

async function renameLegacyMigrations(db: Kysely<any>, renames: Record<string, string>) {
	const tables = await db.introspection.getTables({ withInternalKyselyTables: true });
	if (!tables.some((t) => t.name === 'kysely_migration')) return;

	for (const [old_name, new_name] of Object.entries(renames)) {
		const existing = await db
			.selectFrom('kysely_migration')
			.select('name')
			.where('name', 'in', [old_name, new_name])
			.execute();
		const names = existing.map((row) => row.name);
		if (names.includes(old_name) && !names.includes(new_name)) {
			await db.updateTable('kysely_migration').set({ name: new_name }).where('name', '=', old_name).execute();
			console.log(`renamed migration record "${old_name}" to "${new_name}"`);
		}
	}
}

async function migrateToLatest() {
	const migrator_type = config.get('migrator.type');
	assert(migrator_type, 'You must define migrator.type');

	let migration_dir: string;
	let db: Kysely<DBType> | Kysely<OLAPDBType>;
	switch (migrator_type) {
		case 'store':
			migration_dir = 'store';
			db = DB.Store;
			break;

		case 'olap':
			const olap_type = config.get('db.olap.type');
			let dialect: any;
			switch (olap_type) {
				case 'clickhouse':
					migration_dir = 'metrics/clickhouse';
					dialect = new ClickhouseDialect({
						options: config.get('db.olap.clickhouse'),
					});
					break;
				case 'duckdb':
					migration_dir = 'metrics/duckdb';
					// Cast to any to bridge differing private 'db' fields from duplicate @duckdb/node-api versions.
					const database: any = await DuckDBInstance.create(config.get('db.olap.duckdb.path'));
					dialect = new DuckDbDialect({
						database,
					});
					break;
				default:
					throw new Error(`db.olap.type = ${olap_type} not configured`);
			}

			// Initialize the metrics database connection.
			db = new Kysely<OLAPDBType>({
				dialect,
			});

			break;
		default:
			throw new Error(`migrator.type = ${migrator_type} not configured`);
	}

	if (renamed_migrations[migration_dir]) {
		await renameLegacyMigrations(db as Kysely<any>, renamed_migrations[migration_dir]);
	}

	const migrator = new Migrator({
		db,
		// This needs to be an absolute path.
		provider: new RequireMigrationProvider(path.join(__dirname, migration_dir)),
	});

	const { error, results } = await migrator.migrateToLatest();

	results?.forEach((it) => {
		if (it.status === 'Success') {
			console.log(`migration "${it.migrationName}" was executed successfully`);
		} else if (it.status === 'Error') {
			console.error(`failed to execute migration "${it.migrationName}"`);
		}
	});

	if (error) {
		console.error('failed to migrate');
		console.error(error);
		process.exit(1);
	}
}

migrateToLatest();
