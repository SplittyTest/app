import { Kysely } from 'kysely';
import config from 'config';
import { ClickHouseClientConfigOptions, createClient } from '@clickhouse/client';
import { asyncForEach } from 'modern-async';
import { OLAPDB } from '../../../src/types/db';

export async function up(db: Kysely<OLAPDB>): Promise<void> {
	console.log('Running migrations for clickhouse');
	const cfg = config.get('db.olap') as Record<string, any>;
	const client = await createClient(cfg.clickhouse as ClickHouseClientConfigOptions);
	await client.ping();

	// await client.exec({
	//     query: 'CREATE DATABASE {db: String} IF NOT EXISTS',
	//     query_params: {
	//         db: cfg.database,
	//     },
	// });

	const tables = [
		`
CREATE TABLE IF NOT EXISTS
    events (
        \`id\` String DEFAULT generateULID (),
        \`session_id\` String,
        \`type\` String,
        \`subject_id\` String,
        \`test_ids\` Array(String),
        \`variation_ids\` Array(String),
        \`data\` JSON,
        \`value\` Float32,
        \`created_at\` DateTime DEFAULT now()
    )
ENGINE = MergeTree
PRIMARY KEY (id, created_at, session_id)
ORDER BY (id, created_at, session_id, type, test_ids, variation_ids)
PARTITION BY toYYYYMM(created_at)
SETTINGS index_granularity = 8192`,
		`
CREATE TABLE IF NOT EXISTS
        sessions (
            \`id\` String DEFAULT generateULID (),
            \`subject_id\` String,
            \`test_ids\` Array(String),
            \`variation_ids\` Array(String),
            \`data\` JSON,
            \`created_at\` DateTime DEFAULT now()
        )
    ENGINE = ReplacingMergeTree
    PRIMARY KEY (id, created_at, subject_id)
    ORDER BY (id, created_at, subject_id, test_ids, variation_ids)
    PARTITION BY toYYYYMM(created_at)
    SETTINGS index_granularity = 8192`,
	];

	asyncForEach(tables, async (query) => {
		await client.exec({
			query,
		});
	});
}
