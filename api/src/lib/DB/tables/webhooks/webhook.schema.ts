import { z } from 'zod';
import dayjs from '@lib/dayjs';

export const zWebhookFilterSchema = z.array(
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
			'in_ip_range',
		]),
		/** The value to compare against */
		value: z.any(),
		/** Whether to negate the filter */
		not: z.boolean().nullish(),
	}),
);
export type WebhookFilter = z.infer<typeof zWebhookFilterSchema>;

/** The configuration for a webhook */
export const zWebhookSchema = z.object({
	/** The ULID of the user the webhook is for */
	id: z.ulid(),
	/** A unique name to identify the webhook */
	name: z.string(),
	/** The ID of the subject to trigger this webhook for */
	subject_id: z.string(),
	/** A list of event types to trigger the webhook */
	events: z.array(z.string()).min(1),
	/** The URL to send the webhook to */
	url: z.url(),
	/** The HTTP method to use when sending the webhook (default: POST) */
	method: z.enum(['GET', 'POST']).default('POST'),
	/** Headers can be any arbitrary object - this will merge with the default headers */
	headers: z.object({}).catchall(z.string()).nullish(),
	/** The body can be any arbitrary JSON object - this will merge with the default body */
	body: z.object({}).catchall(z.any()).nullish(),
	/** An optional set of filters to determine when the webhook should be triggered */
	filters: z.array(zWebhookFilterSchema),
	/** Set to TRUE to enable the webhook (default: false) */
	active: z.boolean().default(false),
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

export type Webhook = z.infer<typeof zWebhookSchema>;
