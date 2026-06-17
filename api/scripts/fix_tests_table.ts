import DB from '../src/lib/DB';
import { sql } from 'kysely';

async function run() {
	console.log('Dropping tests table...');
	await (DB.Store as any).schema.dropTable('tests').ifExists().execute();

	console.log('Creating tests table...');
	await (DB.Store as any).schema
		.createTable('tests')
		.addColumn('id', 'text', (col: any) => col.primaryKey())
		.addColumn('name', 'text', (col: any) => col.notNull())
		.addColumn('subject_id', 'text', (col: any) => col.notNull())
		.addColumn('section_id', 'text', (col: any) => col.notNull())
		.addColumn('preview_url', 'text')
		.addColumn('description', 'text')
		.addColumn('weight', 'integer', (col: any) => col.defaultTo(1))
		.addColumn('variations', 'jsonb', (col: any) => col.notNull())
		.addColumn('conversion_event', 'text', (col: any) => col.notNull())
		.addColumn('conversion_value_strategy', 'text', (col: any) => col.defaultTo('avg'))
		.addColumn('conversion_value_type', 'text', (col: any) => col.defaultTo('percent'))
		.addColumn('default_conversion_value', 'real', (col: any) => col.defaultTo(1))
		.addColumn('data_segments', 'jsonb')
		.addColumn('min_views', 'integer', (col: any) => col.defaultTo(1000))
		.addColumn('analysis', 'text', (col: any) => col.defaultTo('multi_arm_bandit'))
		.addColumn('auto_optimize', 'boolean', (col: any) => col.defaultTo(false))
		.addColumn('calculation_interval', 'integer', (col: any) => col.defaultTo(300))
		.addColumn('rolling_window_type', 'text', (col: any) => col.defaultTo('views'))
		.addColumn('rolling_window', 'integer', (col: any) => col.defaultTo(2000))
		.addColumn('exploration_percentage', 'real', (col: any) => col.defaultTo(0.1))
		.addColumn('min_conversion_views', 'integer', (col: any) => col.defaultTo(100))
		.addColumn('auto_pause_variations', 'boolean', (col: any) => col.defaultTo(true))
		.addColumn('losing_percentage_threshold', 'real', (col: any) => col.defaultTo(0.3))
		.addColumn('audience_id', 'text')
		.addColumn('status', 'text', (col: any) => col.defaultTo('queued'))
		.addColumn('started_at', 'timestamp')
		.addColumn('ended_at', 'timestamp')
		.addColumn('outcome', 'text')
		.addColumn('notes', 'text')
		.addColumn('created_by', 'text', (col: any) => col.notNull())
		.addColumn('created_at', 'timestamp', (col: any) => col.defaultTo(sql`now()`))
		.addColumn('modified_at', 'timestamp', (col: any) => col.defaultTo(sql`now()`))
		// Add additional columns as needed to match schema fully
		// .addColumn('winner_sorting_type', 'text', (col: any) => col.defaultTo('max')) // Based on Zod error earlier? Or maybe it's not in DB yet?
		// Wait, Zod error said "winner_sorting_type" invalid value. Does it map to a column?
		// Usually schema matches DB.
		// I will add it if it's in the payload I send.
		// It WAS in the payload. So I should add it.
		.addColumn('winner_sorting_type', 'text', (col: any) => col.defaultTo('max'))
		.addColumn('expected_conversion_rate', 'real')
		.execute();

	console.log('Tests table recreated successfully.');
	await DB.Store.destroy();
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
