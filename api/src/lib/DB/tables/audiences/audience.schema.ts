import { z } from 'zod';
import dayjs from '@lib/dayjs';

export const zAudienceFilterSchema = z.array(
	z.object({
		/** The property to filter on */
		property: z.string(),
		/** The matching strategy to use for the filter */
		strategy: z.enum([
			'is_nil',
			'is_not_nil',
			'equals',
			'not_equals',
			'includes',
			'not_includes',
			'in',
			'not_in',
			'greater_than',
			'greater_than_equals',
			'less_than',
			'less_than_equals',
			'matches',
			'not_matches',
			'matches_all',
			'matches_none',
			'matches_any',
			'in_range',
			'between',
			'in_any_ip_range',
		]),
		/** The value to compare against */
		value: z.any(),
		/** Whether to negate the filter */
		not: z.boolean().nullish(),
	}),
);
export type AudienceFilter = z.infer<typeof zAudienceFilterSchema>;

export const zAudienceSchema = z.object({
	/** A unique slug to identify the audience */
	id: z.ulid(),
	/** A human-readable name to identify the audience */
	name: z.string(),
	/** An optional description of the audience */
	description: z.string().nullish(),
	/** The optional unique ID of the subject associated with the audience */
	subject_id: z.string().regex(/^[a-z0-9_]+$/),
	/** An array of filters to match against */
	filters: z.array(zAudienceFilterSchema),
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

export type Audience = z.infer<typeof zAudienceSchema>;
