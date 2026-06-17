import { z } from 'zod';
import dayjs from '@lib/dayjs';

export const zSectionSchema = z.object({
	/** A unique slug to identify the section */
	id: z.string().regex(/^[a-z0-9_]+$/),
	/** An optional description of the section */
	description: z.string().nullish(),
	/** Data that will be returned with tests for this section -- typically matches the current control (default: {}) */
	data: z.record(z.string().regex(/^[a-z0-9_]+$/), z.any()),
	/** An optional URL that can be used to preview the section */
	preview_url: z.preprocess((v) => (v === '' ? null : v), z.url().nullish()),
	/** Set the maximum number of tests can run in this section at any given time (default: 1) */
	max_concurrent_tests: z.number(),
	/** Set to FALSE to disable tests from running in this section (default: true) */
	testing_enabled: z.boolean(),
	/** If there are active tests, the frequency for skipping a test (default: 0) */
	skip_test_frequency: z.number(),
	/** Set to TRUE to archive this section (default: false) */
	archived: z.boolean().nullish(),
});

export type Section = z.infer<typeof zSectionSchema>;

/** A test subject (typically a website or app) */
export const zSubjectSchema = z.object({
	/** A unique slug that idenifies the subject */
	id: z.string().regex(/^[a-z0-9_]+$/),
	/** The type of subject being tested */
	type: z.enum(['website', 'app', 'other']),
	/** A human-readable name to identify the subject */
	name: z.string(),
	/** An optional description of the subject */
	description: z.string().nullish(),
	/** A collection of sections that can be tested */
	sections: z.array(zSectionSchema),
	/** Set the maximum number of tests can run for this subject at any given time (default: 99) */
	max_concurrent_tests: z.number(),
	/** Set to FALSE to disable tests from running for this subject (default: true) */
	testing_enabled: z.boolean(),
	/** Settings for the subject (nested object so we don't need to keep adding columns) */
	settings: z
		.object({
			// Set to TRUE to log events that are not being tracked in tests
			log_untracked_events: z.boolean().nullish(),
			// Set to TRUE to log events that do not have a metric defined
			log_unknown_events: z.boolean().nullish(),
			// Set to TRUE to log events for non-participants in tests
			unknown_events_idle_logging: z.boolean().nullish(),
			// Set the percentage of unknown events to log when tests are not active
			unknown_events_idle_logging_percentage: z.number().nullish(),
		})
		.catchall(z.any()),
	/** Set to TRUE to archive this subject (default: false) */
	archived: z.boolean().nullish(),
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

export type Subject = z.infer<typeof zSubjectSchema>;
