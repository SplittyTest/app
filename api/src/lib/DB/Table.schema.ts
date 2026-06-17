/* eslint-disable @typescript-eslint/no-empty-object-type */
import type {
	Alert,
	APIKey,
	Audience,
	Comment,
	Event,
	Metric,
	Setting,
	StatusLog,
	Subject,
	Section,
	Test,
	TestResult,
	User,
	Watcher,
	Webhook,
} from '@/types/schemas';
import { JSONColumnType } from 'kysely';

export interface DB {
	alerts: AlertsTable;
	api_keys: APIKeysTable;
	audiences: AudiencesTable;
	comments: CommentsTable;
	events: EventsTable;
	metrics: MetricsTable;
	settings: SettingsTable;
	status_logs: StatusLogsTable;
	subjects: SubjectsTable;
	tests: TestsTable;
	test_results: TestResultsTable;
	users: User;
	watchers: WatchersTable;
	webhooks: WebhooksTable;
}

export interface AlertsTable extends Alert {}

export interface APIKeysTable extends APIKey {}

export interface AudiencesTable extends Audience {}

export interface CommentsTable extends Comment {}

export interface EventsTable extends Event {}

export interface MetricsTable extends Metric {}

export type SettingsTable = Setting;

export interface StatusLogsTable extends StatusLog {}

export interface SubjectsTable extends Omit<Subject, 'sections' | 'data'> {
	data: JSONColumnType<any>;
	sections: JSONColumnType<Section[]>;
}

export interface TestsTable extends Test {}

export interface TestResultsTable extends TestResult {}

export interface UsersTable extends User {}

export interface WatchersTable extends Watcher {}

export interface WebhooksTable extends Webhook {}
