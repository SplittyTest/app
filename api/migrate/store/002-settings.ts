import { Kysely, sql } from 'kysely';
import { DB } from '../../src/lib/DB/Table.schema';
import { Setting, zSettingSchema } from '../../src/lib/DB/tables/settings/setting.schema';
import { ulid } from 'ulid';
import { asyncMap } from 'modern-async';

const settings: Setting[] = [
	{
		id: 'locale',
		value: 'en-US',
	},
	{
		id: 'currency',
		value: 'USD',
	},
	{
		id: 'filtered_ips',
		value: [],
	},
];

export async function up(db: Kysely<DB>): Promise<void> {
	const parsed_settings = await asyncMap(settings, async (s: Setting) => {
		return await zSettingSchema.parseAsync(s);
	});

	await db.insertInto('settings').values(parsed_settings).execute();
}

export async function down(db: Kysely<DB>): Promise<void> {
	await db.deleteFrom('settings').where(
		'id',
		'in',
		settings.map((s: Setting) => s.id),
	);
}
