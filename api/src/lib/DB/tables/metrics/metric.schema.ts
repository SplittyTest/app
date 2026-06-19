import { z } from 'zod';
import dayjs from '@lib/dayjs';

export const zMetricSchema = z.object({
	/** The unique ID of the metric */
	id: z.ulid(),
	/** The unique ID of the subject associated with the metric */
	subject_id: z.string().regex(/^[a-z0-9_]+$/),
	/** A human-readable name for the metric */
	name: z.string(),
	/** An optional description of the metric */
	description: z.string().nullish(),
	/** A unique slug matching the event name to identify the metric */
	event_type: z.string().regex(/^[a-z0-9_]+$/),
	/** The strategy used to calculate the metric (default: 'rate') */
	strategy: z.enum(['rate', 'sum', 'avg', 'median']),
	/** The type of conversion number we want to output (default: 'number') */
	type: z.enum(['percent', 'number', 'currency']),
	/** The default value to use for this metric when no data is available (default: 1) */
	default_value: z.number(),
	/** The type of sorting to use when determining the winner (default: 'max') */
	sorting_type: z.enum(['max', 'min']),
	/** The strategy used to count sessions for this metric (default: 'multiple') */
	session_strategy: z
		.enum(['all', 'unique_first', 'unique_last', 'unique_sum', 'unique_avg', 'unique_median'])
		.default('all'),
	/** Set to TRUE to log events when tests are not running */
	idle_logging: z.boolean(),
	/** The percentage of events to log when tests are not running (as a decimal) */
	idle_logging_percentage: z.number(),
	/** The UTC date when the record was created */
	created_at: z
		.date()
		.or(z.string())
		.transform((v) => dayjs(v).utc().toDate())
		.nullish(),
	/** The UTC date when the record was last modified */
	modified_at: z
		.date()
		.or(z.string())
		.transform((v) => dayjs(v).utc().toDate())
		.nullish(),
});

export type Metric = z.infer<typeof zMetricSchema>;
