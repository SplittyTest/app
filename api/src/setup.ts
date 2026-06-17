import config from 'config';
import { ClickHouseClientConfigOptions, createClient } from '@clickhouse/client';
import { create_events_sql } from '@lib/DB/tables/events/events.sql';
import { create_sessions_sql } from '@lib/DB/tables/sessions/sessions.sql';
import { asyncForEach } from 'modern-async';
import _ from 'lodash';
import log from '@lib/Logger';

const ch_config = config.get('db.metrics.clickhouse') as ClickHouseClientConfigOptions;
const a_config = config.get('db.metrics') as { databases: string[] };

const databases = a_config.databases || [];
const tables_sql = [create_events_sql, create_sessions_sql];

(async function () {
	try {
		// make sure that the connecting database exists
		ch_config.database = 'default';
		const ClickHouse = createClient(ch_config);
		// Create all databases first
		await asyncForEach(databases, async (db) => {
			log.info(`Switching to database: ${db}`);
			await ClickHouse.command({ query: `CREATE DATABASE IF NOT EXISTS ${db}` });
		});

		// Use lodash's flatMap to create a matrix of [db, table_sql]
		const matrix = _.flatMap(databases, (db) => tables_sql.map((table_sql) => [db, table_sql]));

		await asyncForEach(matrix, async ([db, create_table_sql]) => {
			const table_sql = create_table_sql.replace(/splittytest/g, db);
			log.info(`Creating table in ${db}...`);
			const result = await ClickHouse.query({ query: table_sql });
			if (result) {
				log.info(`Table created successfully in ${db}`);
			}
		});

		await ClickHouse.close();
	} catch (err) {
		log.error(err);
	}
})();
