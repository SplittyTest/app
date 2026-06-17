/* eslint-disable @typescript-eslint/no-empty-object-type */
import type {
	Alert,
	APIKey,
	Audience,
	Comment,
	Event,
	ExpandedTest,
	Metric,
	Session,
	Setting,
	StatusLog,
	Subject,
	Test,
	TestResult,
	User,
	Watcher,
	Webhook,
} from '@/types/schemas';
import { JSONColumnType } from 'kysely';
import { Section } from '@/lib/DB/tables/subjects/subject.schema';
import { InsertResult } from '@clickhouse/client';

export interface GetMetricSeriesDataParams {
	date_range: [Date, Date];
	segments: Record<string, any>;
	group_by?: 'variation_id' | 'test_id' | 'aggregate';
	control?: boolean;
}

export interface SplitTestQueryResultRow {
	segment_a: string;
	segment_b?: string;
	segment_c?: string;
	views?: number;
	conversions?: number;
	conversion_value?: number;
}

export interface OLAPDB {
	// init: () => Promise<void>;
	getMinDate: (params: {
		variation_id: string;
		rolling_window: number;
		rolling_window_type: string;
	}) => Promise<Date>;
	getViews: (params: {
		variation_id: string;
		min_date: Date;
		segments?: string[];
	}) => Promise<SplitTestQueryResultRow[]>;
	getEvents: (params: {
		variation_id: string;
		min_date: Date;
		event_type: string;
		strategy: string;
		segments?: string[];
		session_strategy?: string;
	}) => Promise<SplitTestQueryResultRow[]>;
	getTestSeriesData: (test: ExpandedTest, metric: Metric, segments: string[]) => Promise<Record<string, any>>;
	getTestStats: (test: ExpandedTest) => Promise<Record<string, any>[]>;
	getMetricSegments: (metric: Metric, date_range: [Date, Date]) => Promise<Record<string, any>>;
	getMetricSeriesData: (metric: Metric, params: GetMetricSeriesDataParams) => Promise<Record<string, any>>;
	insertEvent: (event: any) => Promise<InsertResult | undefined>;
	insertSession: (session: any) => Promise<InsertResult | undefined>;
	disconnect: () => Promise<void>;
}

export interface DBStore {
	alerts: AlertsTable;
	api_keys: APIKeysTable;
	audiences: AudiencesTable;
	comments: CommentsTable;
	settings: SettingsTable;
	status_logs: StatusLogsTable;
	subjects: SubjectsTable;
	tests: TestsTable;
	test_results: TestResultsTable;
	users: UsersTable;
	watchers: WatchersTable;
	webhooks: WebhooksTable;
}

interface SystemTablesTable {
	name: string;
	database: string;
}

interface SystemColumnsTable {
	table: string;
	name: string;
	type: string;
	database: string;
}

export interface DBMetrics {
	events: EventsTable;
	sessions: SessionsTable;
	// 'system.tables': SystemTablesTable;
	// 'system.columns': SystemColumnsTable;
}

export interface AlertsTable extends Alert {}
export interface APIKeysTable extends APIKey {}
export interface AudiencesTable extends Audience {}
export interface CommentsTable extends Comment {}
export interface EventsTable extends Event {}
export interface MetricsTable extends Metric {}
export interface SessionsTable extends Session {}
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
