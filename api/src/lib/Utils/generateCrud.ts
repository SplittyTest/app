import Store from '@lib/DB/Store';
import Cache from '@lib/Cache';
import { z } from 'zod';
import { ulid } from 'ulid';
import isArrayWithLength from './isArrayWithLength';
import { omit } from 'lodash';

export interface GenerateCrudOptions {
	defaults?: (v: any) => any;
	transformWrite?: (v: any) => any;
}

// Generate default methods for CRUD operations
export function generateCrud<T>(table: string, schema: z.ZodObject, options?: GenerateCrudOptions) {
	const table_name: any = table;
	const table_schema = schema;

	return {
		// Get a record by ID
		getById: async function (id: string): Promise<T | null> {
			return (await Cache.get(`db:${table_name}:getById:${id}`, async () => {
				const record = await Store.selectFrom(table_name).selectAll().where('id', '=', id).executeTakeFirst();
				return (record as T) || null;
			})) as T | null;
		},

		// Get records by filter
		getByFilter: async function (filter: any, hash?: any): Promise<T[]> {
			return (await Cache.get([`db:${table_name}:getByFilter`, hash || filter], async () => {
				let order_by: any[] | undefined;
				if ('created_at' in table_schema.shape) {
					order_by = ['created_at', 'desc'];
				}
				let query = Store.selectFrom(table_name).selectAll().where(filter);
				if (isArrayWithLength(order_by)) {
					query = query.orderBy(order_by![0], order_by![1]);
				}

				const records = await query.execute();
				return (records as T[]) || [];
			})) as T[];
		},

		// Get all records
		getAll: async function (): Promise<T[]> {
			return (await Cache.get(`db:${table_name}:getAll`, async () => {
				let order_by: any[] | undefined;
				if ('created_at' in table_schema.shape) {
					order_by = ['created_at', 'desc'];
				}
				let query = Store.selectFrom(table_name).selectAll();
				if (isArrayWithLength(order_by)) {
					query = query.orderBy(order_by![0], order_by![1]);
				}

				const records = await query.execute();
				return (records as T[]) || [];
			})) as T[];
		},

		// Insert one or more records
		insert: async function (data: T | T[]): Promise<T | T[] | null> {
			let insert_schema: z.ZodObject | z.ZodPipe = table_schema;
			if (options?.defaults) {
				data = options.defaults(data);
			}

			// Generate ULID if id is missing
			if (Array.isArray(data)) {
				data.forEach((item: any) => {
					if (!item.id) {
						item.id = ulid();
					}
				});
			} else {
				if (!(data as any).id) {
					(data as any).id = ulid();
				}
			}

			if (options?.transformWrite) {
				insert_schema = insert_schema.transform(options.transformWrite);
			}
			if (Array.isArray(data)) {
				const parsed_data = await z.array(insert_schema).parseAsync(data);

				const inserted_rows = await Store.insertInto(table_name).values(parsed_data).returningAll().execute();
				if (inserted_rows) {
					return inserted_rows.map((row) => {
						// @ts-ignore
						delete row.password;
						return row;
					}) as T;
				}
				return [];
			} else {
				const parsed_data = (await insert_schema.parseAsync(data)) as any;
				const inserted_row = await Store.insertInto(table_name)
					.values(parsed_data)
					.returningAll()
					.executeTakeFirst();
				if (inserted_row) {
					// @ts-ignore
					delete inserted_row.password;

					// Clean any cache keys
					await Cache.clean(`db:${table_name}:*`);

					return (inserted_row as T) || null;
				}
				return null;
			}
		},

		// Update a record
		updateById: async function (id: string, data: Partial<T>, filter?: any): Promise<T | null> {
			// Add a new modified_at date if it is in the schema
			if ('modified_at' in table_schema.shape) {
				// @ts-ignore
				data.modified_at = new Date().toISOString();
			}

			let update_schema: z.ZodObject | z.ZodPipe = table_schema.partial();
			if (options?.transformWrite) {
				update_schema = update_schema.transform(options.transformWrite);
			}
			const parsed_data = await update_schema.parseAsync(data);
			let query: any = Store.updateTable(table_name)
				.set(omit(parsed_data as any, 'id'))
				.where('id', '=', id);

			// Conditionally add a filter
			if (filter) {
				query = query.where(filter);
			}

			query = query.returningAll();
			const result = await query.executeTakeFirst();

			// Clean any cache keys
			await Cache.clean(`db:${table_name}:*`);

			return (result as T) || null;
		},

		// Update multiple records by filter
		updateByFilter: async function (filter: any, data: Partial<T>): Promise<T[]> {
			// Add a new modified_at date if it is in the schema
			if ('modified_at' in table_schema.shape) {
				// @ts-ignore
				data.modified_at = new Date();
			}

			let update_schema: z.ZodObject | z.ZodPipe = table_schema.partial();
			if (options?.transformWrite) {
				update_schema = update_schema.transform(options.transformWrite);
			}
			const parsed_data = await update_schema.parseAsync(data);
			const result = await Store.updateTable(table_name)
				.set(parsed_data as any)
				.where(filter)
				.returningAll()
				.execute();

			// Clean any cache keys
			await Cache.clean(`db:${table_name}:*`);

			return result as T[];
		},

		// Delete a record
		deleteById: async function (id: string, filter?: any): Promise<T | null> {
			let query: any = Store.deleteFrom(table_name).where('id', '=', id);

			// Conditionally add a filter
			if (filter) {
				query = query.where(filter);
			}

			query = query.returningAll();
			const result = await query.executeTakeFirst();

			// Clean any cache keys
			await Cache.clean(`db:${table_name}:*`);

			return (result as T) || null;
		},

		// Delete multiple records by filter
		deleteByFilter: async function (filter: any): Promise<T[]> {
			const result = await Store.deleteFrom(table_name).where(filter).returningAll().execute();

			// Clean any cache keys
			await Cache.clean(`db:${table_name}:*`);

			return result as T[];
		},
	};
}
