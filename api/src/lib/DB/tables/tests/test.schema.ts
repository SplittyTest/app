import { z } from 'zod';
import dayjs from '@lib/dayjs';
import { zMetricSchema } from '../metrics/metric.schema';
import { zAudienceSchema } from '../audiences/audience.schema';
import { zSectionSchema, zSubjectSchema } from '../subjects/subject.schema';

/** A split test variation */
export const zVariationSchema = z.object({
	/** The test_id with a unique letter assignment for this variation (A is considered the control variation) */
	id: z.string(),
	/** A short description of this variation */
	description: z.string(),
	/** Data that is served with this variation */
	data: z.record(z.string(), z.any()),
	/** The weight for serving this variation to a test participant */
	weight: z.number().int().optional(),
	/** The status of the variation within the test */
	status: z.enum(['active', 'paused', 'archived']),
});
export type Variation = z.infer<typeof zVariationSchema>;

/** A split test */
export const zTestSchema = z.object({
	/** A ULID */
	id: z.ulid(),
	/** A human-readable name to identify this test */
	name: z.string(),
	/** The ULID of the subject this test is for */
	subject_id: z.string().regex(/^[a-z0-9_]+$/),
	/** The ID of the section the test is for (limited to those defined on the subject) */
	section_id: z.string().regex(/^[a-z0-9_]+$/),
	/** An optional but recommended description of this test */
	description: z.string().nullish(),
	/** The weight to give a test so it appears more frequently */
	weight: z.number().int().default(1),
	/** Optional audience rules to restrict test traffic */
	audiences: z
		.object({
			/** Audiences to include in this test */
			included: z.array(z.string()).default([]),
			/** Audiences to exclude from this test */
			excluded: z.array(z.string()).default([]),
		})
		.default({ included: [], excluded: [] }),
	/** A collection of the variations for this test */
	variations: z.array(zVariationSchema),
	/** The ID of the metric being used to make the decision */
	decision_metric_id: z.string(),
	/** For standard tests, the confidence interval to check for statistical significance */
	confidence_interval: z.number().default(0.95),
	/** The type of analysis algorithm to use (default: 'standard') */
	strategy: z.enum(['auto_optimize', 'standard']).default('standard'),
	/** Segments to use when determining the optimal conversion rate */
	data_segments: z
		.array(z.string().regex(/^[a-zA-Z0-9_$]+$/))
		.max(3)
		.nullish(),
	/** The minimum number of views before calculating true metrics (default: 1000) */
	min_views: z.number(),
	/** The expected value of the decision metric when running this test */
	expected_decision_metric_rate: z.number(),
	/** A list of metric IDs to collect data for */
	metrics: z.array(z.string()).default([]),
	/** The minimum interval of seconds at which to calculate conversion rates for a running test (default: 300) */
	calculation_interval: z.number(),
	/** The type of rolling window to use when determining conversion rate (default: 'none') */
	rolling_window_type: z.enum(['views', 'days', 'none']),
	/** The number of days or views to look back when determining the conversion rate during auto-optimization (default: 10000 (views)) */
	rolling_window: z.number(),
	/** The percentage of the time to allow sub-optimal variations to be served during auto-optimization (default: 0.1) */
	exploration_percentage: z.number(),
	/** The threshold for exploration during auto-optimization (default: 0.3) */
	exploration_threshold: z.number(),
	/** For standard unsegmented tests, automatically pause a variation if it is tanking (default: true) */
	auto_pause_variations: z.boolean(),
	/** If a variation does not have a conversion after this many views, pause it (default: 100) */
	min_decision_metric_views: z.number(),
	/** For standard tests, archive a variation if it is losing relative to control by this amount (default: 0.3) */
	losing_percentage_threshold: z.number(),
	/** The current status of the test (default: 'pending') */
	status: z.enum(['pending', 'active', 'paused', 'complete', 'archived']),
	/** The timestamp of when this test was started */
	started_at: z
		.date()
		.or(z.string())
		.transform((v) => dayjs(v).utc().toDate())
		.nullish(),
	/** The timestamp of when this test was ended */
	ended_at: z
		.date()
		.or(z.string())
		.transform((v) => dayjs(v).utc().toDate())
		.nullish(),
	/** The outcome of the test */
	outcome: z.enum(['win', 'loss', 'discard']).nullish(),
	/** Notes for the outcome of the test */
	notes: z.string().nullish(),
	/** The ID of the user that created the test */
	created_by: z.ulid(),
	/** The UTC date when the record was created */
	created_at: z
		.date()
		.or(z.string())
		.transform((v) => dayjs(v).utc().toDate()),
	/** The UTC date when the record was last modified */
	modified_at: z
		.date()
		.or(z.string())
		.transform((v) => dayjs(v).utc().toDate())
		.nullish(),
});
export type Test = z.infer<typeof zTestSchema>;

// When requesting the test, expanded data from relational IDs
export const zExpandedTestSchema = zTestSchema.extend({
	/** The subject this test is for */
	subject: zSubjectSchema,
	/** The section this test is for */
	section: zSectionSchema,
	/** The metric being used to make the decision */
	decision_metric: zMetricSchema,
	/** The metrics being collected for this test */
	metric_details: z.array(zMetricSchema),
	/** The included audiences being used to target this test */
	included_audiences: z.array(zAudienceSchema),
	/** The excluded audiences being used to target this test */
	excluded_audiences: z.array(zAudienceSchema),
});
export type ExpandedTest = z.infer<typeof zExpandedTestSchema>;

/** Only these filters are allowed when requesting tests */
export const zTestFilters = z
	.object({
		/** Get tests for a specific subject */
		subject_id: z.string(),
		/** Get tests for a specific section */
		section_id: z.string(),
		/** Get tests with one or more statuses */
		status: z.array(z.enum(['pending', 'active', 'paused', 'complete', 'archived'])),
		/** Get tests with a specific outcome */
		outcome: z.array(z.enum(['win', 'loss', 'discard'])),
		/** Get tests created by a specific user */
		created_by: z.array(z.string().ulid()),
		/** Get tests that ended within a specific date range */
		ended_at: z.tuple([
			z.date().or(z.string().transform((v) => dayjs(v).toDate())),
			z.date().or(z.string().transform((v) => dayjs(v).toDate())),
		]),
	})
	.partial();
export type TestFilters = z.infer<typeof zTestFilters>;
