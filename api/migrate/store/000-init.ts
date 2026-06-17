import { Kysely } from 'kysely';
import { DB } from '../../src/lib/DB/Table.schema';
import { jsonb, timestamptz, timestamptzDefaultNow, boolean, textArray } from '../utils';
import config from 'config';
import { sql } from 'kysely';

const dbType = config.get('db.store.type') as string;

export async function up(db: Kysely<DB>): Promise<void> {
	console.log('Running migrations for database type:', dbType);

	// Alerts table
	await db.schema
		.createTable('alerts')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('user_id', 'text', (col) => col.notNull())
		.addColumn('test_id', 'text', (col) => col.notNull())
		.addColumn('event', 'text', (col) => col.notNull())
		.addColumn('content', 'text', (col) => col.notNull())
		.addColumn('status', 'text', (col) => col.notNull())
		.addColumn('created_at', timestamptzDefaultNow(dbType))
		.addColumn('viewed_at', timestamptz(dbType))
		.execute();

	// Alerts indexes
	await db.schema.createIndex('alerts_user_id_idx').on('alerts').column('user_id').execute();
	await db.schema.createIndex('alerts_test_id_idx').on('alerts').column('test_id').execute();

	// API Keys table
	await db.schema
		.createTable('api_keys')
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('prefix', 'text', (col) => col.primaryKey())
		.addColumn('key', 'text', (col) => col.notNull())
		.addColumn('ip_whitelist', textArray(dbType))
		.addColumn('domain_whitelist', textArray(dbType))
		.addColumn('subject_id', 'text', (col) => col.notNull())
		.addColumn('status', 'text', (col) => col.notNull().defaultTo('active'))
		.addColumn('created_at', timestamptzDefaultNow(dbType))
		.addColumn('modified_at', timestamptzDefaultNow(dbType))
		.execute();

	// Audiences table
	await db.schema
		.createTable('audiences')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('description', 'text')
		.addColumn('subject_id', 'text', (col) => col.notNull())
		.addColumn('filters', jsonb(dbType), (col) => col.notNull())
		.addColumn('created_at', timestamptzDefaultNow(dbType))
		.addColumn('modified_at', timestamptzDefaultNow(dbType))
		.execute();

	// Audiences Indexes
	await db.schema.createIndex('audiences_subject_id_idx').on('audiences').column('subject_id').execute();

	// Comments table
	await db.schema
		.createTable('comments')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('test_id', 'text', (col) => col.notNull())
		.addColumn('user_id', 'text', (col) => col.notNull())
		.addColumn('content', 'text', (col) => col.notNull())
		.addColumn('created_at', timestamptzDefaultNow(dbType))
		.addColumn('modified_at', timestamptzDefaultNow(dbType))
		.execute();

	// Comments indexes
	await db.schema.createIndex('comments_test_id_idx').on('comments').column('test_id').execute();

	// Metrics table
	await db.schema
		.createTable('metrics')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('event_type', 'text', (col) => col.notNull())
		.addColumn('subject_id', 'text', (col) => col.notNull())
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('description', 'text')
		.addColumn('strategy', 'text', (col) => col.notNull().defaultTo('rate'))
		.addColumn('type', 'text', (col) => col.notNull().defaultTo('number'))
		.addColumn('default_value', 'double precision', (col) => col.notNull().defaultTo(1))
		.addColumn('sorting_type', 'text', (col) => col.notNull().defaultTo('max'))
		.addColumn('session_strategy', 'text', (col) => col.notNull().defaultTo('log_all'))
		.addColumn('idle_logging', boolean(dbType), (col) => col.defaultTo(false))
		.addColumn('idle_logging_percentage', 'double precision', (col) => col.notNull().defaultTo(1))
		.addColumn('created_at', timestamptzDefaultNow(dbType))
		.addColumn('modified_at', timestamptzDefaultNow(dbType))
		.execute();

	// Metrics indexes
	await db.schema
		.createIndex('metrics_event_type_subject_id_idx')
		.on('metrics')
		.columns(['event_type', 'subject_id'])
		.execute();

	// Settings table
	await db.schema
		.createTable('settings')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('value', jsonb(dbType))
		.execute();

	// Status Logs table
	await db.schema
		.createTable('status_logs')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('test_id', 'text', (col) => col.notNull())
		.addColumn('type', 'text', (col) => col.notNull())
		.addColumn('data', jsonb(dbType), (col) => col.notNull())
		.addColumn('created_at', timestamptzDefaultNow(dbType))
		.addColumn('modified_at', timestamptzDefaultNow(dbType))
		.execute();

	// Status Logs indexes
	await db.schema.createIndex('status_logs_test_id_idx').on('status_logs').column('test_id').execute();

	// Subjects table
	await db.schema
		.createTable('subjects')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('type', 'text', (col) => col.notNull())
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('description', 'text')
		.addColumn('sections', jsonb(dbType), (col) => col.notNull())
		.addColumn('max_concurrent_tests', 'integer', (col) => col.defaultTo(99))
		.addColumn('testing_enabled', boolean(dbType), (col) => col.defaultTo(true))
		.addColumn('settings', jsonb(dbType), (col) => col.notNull().defaultTo('{}'))
		.addColumn('archived', boolean(dbType), (col) => col.defaultTo(false))
		.addColumn('created_at', timestamptzDefaultNow(dbType))
		.addColumn('modified_at', timestamptzDefaultNow(dbType))
		.execute();

	// Tests table
	await db.schema
		.createTable('tests')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('subject_id', 'text', (col) => col.notNull())
		.addColumn('section_id', 'text', (col) => col.notNull())
		.addColumn('description', 'text')
		.addColumn('weight', 'integer', (col) => col.notNull().defaultTo(1))
		.addColumn('audiences', jsonb(dbType), (col) =>
			col.notNull().defaultTo(sql`'{"included": [], "excluded": []}'::jsonb`),
		)
		.addColumn('variations', jsonb(dbType), (col) => col.notNull())
		.addColumn('decision_metric_id', 'text', (col) => col.notNull())
		.addColumn('confidence_interval', 'double precision', (col) => col.notNull().defaultTo(0.95))
		.addColumn('strategy', 'text', (col) => col.notNull().defaultTo('standard'))
		.addColumn('data_segments', textArray(dbType), (col) => col.notNull().defaultTo(sql`ARRAY[]::text[]`))
		.addColumn('min_views', 'integer', (col) => col.notNull().defaultTo(1000))
		.addColumn('expected_decision_metric_rate', 'double precision', (col) => col.notNull().defaultTo(0))
		.addColumn('metrics', textArray(dbType), (col) => col.notNull().defaultTo(sql`ARRAY[]::text[]`))
		.addColumn('calculation_interval', 'integer', (col) => col.notNull().defaultTo(100))
		.addColumn('rolling_window_type', 'text', (col) => col.notNull().defaultTo('views'))
		.addColumn('rolling_window', 'integer', (col) => col.notNull().defaultTo(2000))
		.addColumn('exploration_percentage', 'double precision', (col) => col.notNull().defaultTo(0.1))
		.addColumn('exploration_threshold', 'double precision', (col) => col.notNull().defaultTo(0.7))
		.addColumn('auto_pause_variations', boolean(dbType), (col) => col.notNull().defaultTo(true))
		.addColumn('min_decision_metric_views', 'integer', (col) => col.notNull().defaultTo(100))
		.addColumn('losing_percentage_threshold', 'double precision', (col) => col.notNull().defaultTo(0.3))
		.addColumn('status', 'text', (col) => col.notNull().defaultTo('queued'))
		.addColumn('started_at', 'timestamptz')
		.addColumn('ended_at', 'timestamptz')
		.addColumn('outcome', 'text')
		.addColumn('notes', 'text')
		.addColumn('created_by', 'text', (col) => col.notNull())
		.addColumn('created_at', timestamptzDefaultNow(dbType))
		.addColumn('modified_at', timestamptzDefaultNow(dbType))
		.execute();

	// Tests indexes
	await db.schema.createIndex('tests_subject_id_status_idx').on('tests').columns(['subject_id', 'status']).execute();
	await db.schema
		.createIndex('tests_subject_id_section_id_status_idx')
		.on('tests')
		.columns(['subject_id', 'section_id', 'status'])
		.execute();
	await db.schema.createIndex('tests_created_by_idx').on('tests').column('created_by').execute();

	// Tests Results table
	await db.schema
		.createTable('test_results')
		.addColumn('test_id', 'text', (col) => col.notNull())
		.addColumn('variation_id', 'text', (col) => col.notNull())
		.addColumn('segment_hash', 'text', (col) => col.notNull())
		.addColumn('segment_a', 'text', (col) => col.notNull())
		.addColumn('segment_b', 'text')
		.addColumn('segment_c', 'text')
		.addColumn('view_count', 'integer', (col) => col.notNull().defaultTo(0))
		.addColumn('event_count', 'integer', (col) => col.notNull().defaultTo(0))
		.addColumn('event_value', 'double precision', (col) => col.notNull().defaultTo(0))
		.addColumn('event_rate', 'double precision', (col) => col.notNull().defaultTo(0))
		.addColumn('event_range', 'jsonb', (col) => col.notNull().defaultTo('[0, 0]'))
		.addColumn('variation_score', 'double precision', (col) => col.notNull().defaultTo(0))
		.addColumn('variation_score_range', jsonb(dbType), (col) => col.notNull().defaultTo('[0, 0]'))
		.addColumn('mode', 'text')
		.addPrimaryKeyConstraint('primary_key', ['test_id', 'variation_id', 'segment_hash'])
		.execute();

	// Test Results indexes
	await db.schema.createIndex('test_results_test_id_idx').on('test_results').column('test_id').execute();

	// Users table
	await db.schema
		.createTable('users')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('first_name', 'text', (col) => col.notNull())
		.addColumn('last_name', 'text', (col) => col.notNull())
		.addColumn('email', 'text', (col) => col.notNull())
		.addColumn('phone', 'text')
		.addColumn('password', 'text', (col) => col.notNull())
		.addColumn('role', 'text', (col) => col.notNull())
		.addColumn('mfa', boolean(dbType), (col) => col.notNull().defaultTo(false))
		.addColumn('status', 'text', (col) => col.notNull().defaultTo('active'))
		.addColumn('last_login', timestamptz(dbType))
		.addColumn('created_at', timestamptzDefaultNow(dbType))
		.addColumn('modified_at', timestamptzDefaultNow(dbType))
		.execute();

	// Users indexes
	await db.schema.createIndex('users_email_idx').on('users').column('email').execute();

	// Watchers table (composite PK)
	await db.schema
		.createTable('watchers')
		.addColumn('user_id', 'text', (col) => col.notNull())
		.addColumn('test_id', 'text', (col) => col.notNull())
		.addColumn('watch_events', jsonb(dbType), (col) => col.notNull())
		.addColumn('alert_types', jsonb(dbType), (col) => col.notNull())
		.addColumn('created_at', timestamptzDefaultNow(dbType))
		.addColumn('modified_at', timestamptzDefaultNow(dbType))
		.addPrimaryKeyConstraint('watchers_pkey', ['user_id', 'test_id'])
		.execute();

	// Watchers indexes
	await db.schema.createIndex('watchers_user_id_idx').on('watchers').column('user_id').execute();
	await db.schema.createIndex('watchers_test_id_idx').on('watchers').column('test_id').execute();

	// Webhooks table
	await db.schema
		.createTable('webhooks')
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('subject_id', 'text', (col) => col.notNull())
		.addColumn('events', textArray(dbType), (col) => col.notNull().defaultTo(sql`ARRAY[]::text[]`))
		.addColumn('url', 'text', (col) => col.notNull())
		.addColumn('method', 'text', (col) => col.notNull())
		.addColumn('headers', jsonb(dbType))
		.addColumn('body', jsonb(dbType))
		.addColumn('filters', jsonb(dbType), (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
		.addColumn('active', boolean(dbType), (col) => col.notNull().defaultTo(true))
		.addColumn('created_at', timestamptzDefaultNow(dbType))
		.addColumn('modified_at', timestamptzDefaultNow(dbType))
		.execute();

	// Webhooks indexes
	await db.schema.createIndex('webhooks_subject_id_idx').on('webhooks').column('subject_id').execute();
}

export async function down(db: Kysely<DB>): Promise<void> {}
