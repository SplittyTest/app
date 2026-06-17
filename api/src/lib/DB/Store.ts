import config from 'config';
import type { DB } from './Table.schema';
import {
	ColumnUpdateNode,
	Kysely,
	KyselyPlugin,
	PluginTransformQueryArgs,
	PluginTransformResultArgs,
	PostgresDialect,
	QueryResult,
	RootOperationNode,
	SqliteDialect,
	UnknownRow,
	UpdateQueryNode,
	ValueNode,
	ValuesNode,
} from 'kysely';
import { Pool, PoolConfig } from 'pg';
import Database from 'better-sqlite3';

/**
 * Kysely plugin that converts values for SQLite.
 */
class Sqliter implements KyselyPlugin {
	public transformQuery({ node, queryId }: PluginTransformQueryArgs): RootOperationNode {
		const transformValue = (v: any) => {
			if (typeof v === 'boolean') {
				return v ? 1 : 0;
			} else if (v instanceof Date) {
				return v.toISOString();
			} else if (Array.isArray(v)) {
				return JSON.stringify(v);
			} else if (v && typeof v === 'object') {
				return JSON.stringify(v);
			}
			return v;
		};

		switch (node.kind) {
			case 'UpdateQueryNode': {
				const n = node as UpdateQueryNode;

				return {
					...n,
					updates: n.updates?.map((update: ColumnUpdateNode) => ({
						...update,
						value: (() => {
							if ('value' in update.value) {
								return {
									kind: 'ValueNode',
									value: transformValue((update.value as ValueNode).value),
								};
							}
							return update.value;
						})(),
					})),
				};
			}
			case 'InsertQueryNode': {
				if (node.values) {
					if (node.values.kind === 'ValuesNode') {
						const n = node.values as ValuesNode;

						const t = {
							...node,
							values: {
								kind: 'ValuesNode',
								values: n.values.map((v) => {
									if (v.kind === 'PrimitiveValueListNode') {
										return {
											kind: 'PrimitiveValueListNode',
											values: v.values.map((v: any) => {
												return transformValue(v);
											}),
										};
									}
									return v;
								}),
							} as ValuesNode,
						};

						return t;
					}
				}
			}
		}

		return node;
	}

	public async transformResult({ result, queryId }: PluginTransformResultArgs): Promise<QueryResult<UnknownRow>> {
		function transformValues(obj: any): any {
			if (obj === 1) {
				return true;
			} else if (obj === 0) {
				return false;
			} else if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(obj)) {
				// Parse 'YYYY-MM-DD HH:mm:ss' as UTC
				const [datePart, timePart] = obj.split(' ');
				const [year, month, day] = datePart.split('-').map(Number);
				const [hour, minute, second] = timePart.split(':').map(Number);
				const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
				if (!isNaN(date.getTime())) {
					return date;
				}
				return obj;
			} else if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(obj)) {
				// Parse ISO string to Date
				const date = new Date(obj);
				if (!isNaN(date.getTime())) {
					return date;
				}
				return obj;
			} else if (Array.isArray(obj)) {
				return obj;
			}

			try {
				const res = JSON.parse(obj);

				// JSON.parse('111') or any number will return the number, we don't want
				// that in the case that it's a string like phone_number
				if (typeof obj === 'string' && typeof res === 'number') return obj;
				return res;
			} catch (e: any) {
				return obj;
			}
		}

		const rows = result.rows.map((row: any) => {
			return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, transformValues(value)]));
		});
		return {
			...result,
			rows,
		};
	}
}

function createStoreDB(): Kysely<DB> {
	let dialect: any;
	let plugins: KyselyPlugin[] = [];
	switch (config.get('db.store.type')) {
		case 'pg':
		case 'postgres':
		case 'postgresql': {
			const pool = new Pool(config.get('db.store.postgres') as PoolConfig);
			dialect = new PostgresDialect({ pool });
			break;
		}
		case 'sqlite': {
			const database = new Database(config.get('db.store.sqlite.path') as string);
			dialect = new SqliteDialect({ database });
			plugins = [...plugins, new Sqliter()];
			break;
		}
		default:
			throw new Error('Unsupported database type');
	}
	return new Kysely<DB>({
		dialect,
		plugins,
	});
}


export default createStoreDB();
