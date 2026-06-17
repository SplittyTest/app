import { ulid } from 'ulid';
import { z } from 'zod';
import dayjs from '@lib/dayjs';

/** A captured user event */
export const zEventSchema = z.object({
	/** A ULID */
	id: z.ulid(),
	/** A slug for the event */
	type: z.string().regex(/^[a-z0-9_]+$/),
	/** The ULID of the session that triggered this event (or create a new one) */
	session_id: z.ulid(),
	/** The ID of the subject this session is for */
	subject_id: z.string(),
	/** An array of test_ids that the user participated in during this session at the time the event was triggered */
	test_ids: z.array(z.ulid()),
	/** An array of variation IDs the user was served during their session */
	variation_ids: z.array(z.string()).default([]),
	/** Data associated with the session at the time the event was triggered */
	data: z.record(z.string(), z.any()).nullish(),
	/** The conversion value of the event */
	value: z.number().default(1),
	/** The UTC date when the record was created */
	created_at: z
		.date()
		.or(z.string())
		.transform((v) => dayjs(v).utc().toDate()),
});

export type Event = z.infer<typeof zEventSchema>;

export const zEventSchemaWithDefaults = zEventSchema.transform((v) => {
	if (!v.id) {
		v.id = ulid();
	}
	if (!v.created_at) {
		v.created_at = new Date();
	}
	return v;
});
