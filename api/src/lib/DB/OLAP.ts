import { ClickHouseClientConfigOptions } from '@clickhouse/client';
import config from 'config';
import { OLAPDB } from '@/types/db';
import ClickHouse from './OLAP/ClickHouse';
import DuckDB from './OLAP/DuckDB';

function createOLAPDB(): OLAPDB {
	switch (config.get('db.olap.type')) {
		case 'clickhouse':
			return new ClickHouse(config.get('db.olap.clickhouse') as ClickHouseClientConfigOptions);
		case 'duckdb':
			return new DuckDB(config.get('db.olap.duckdb.path') as string);
		default:
			throw new Error('Unsupported Metrics type');
	}
}

export default createOLAPDB();
