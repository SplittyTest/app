import 'dotenv/config';
import * as path from 'path';
import { promises as fs } from 'fs';
import config from 'config';
import { Migrator, FileMigrationProvider, Kysely } from 'kysely';
import DB from '../src/lib/DB';
import { assert } from 'console';
import { type DB as DBType } from '../src/lib/DB/Table.schema';
import { OLAPDB as OLAPDBType } from '../src/types/db';
import { ClickhouseDialect } from '@founderpath/kysely-clickhouse';
import { DuckDBInstance } from '@duckdb/node-api';
import { DuckDbDialect } from '@oorabona/kysely-duckdb';

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

	const migrator = new Migrator({
		db,
		provider: new FileMigrationProvider({
			fs,
			path,
			// This needs to be an absolute path.
			migrationFolder: path.join(__dirname, migration_dir),
		}),
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
