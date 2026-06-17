import { ulid } from 'ulid';
import { z } from 'zod';
import dayjs from '@lib/dayjs';

/** A record of an individual session */
export const zSessionSchema = z.object({
	/** The ULID */
	id: z.ulid(),
	/** The ID of the subject the session is for */
	subject_id: z.string().nullish(),
	/** The ULIDs of tests run during the session */
	test_ids: z.array(z.ulid()).default([]),
	/** An array of variation IDs the user was served during their session */
	variation_ids: z.array(z.string()).default([]),
	/** Data to save to each event in the session */
	data: z.record(z.string(), z.any()).default({}),
	/** TRUE if the session is from a filtered IP address */
	filtered_ip: z.boolean().nullish().default(false),
	/** The UTC date when the record was created */
	created_at: z
		.date()
		.or(z.string())
		.transform((v) => dayjs(v).utc().toDate())
		.default(() => new Date()),
});
export type Session = z.infer<typeof zSessionSchema>;

export const zSessionSchemaWithDefaults = zSessionSchema.transform((v) => {
	if (!v.id) {
		v.id = ulid();
	}
	if (!v.created_at) {
		v.created_at = new Date();
	}
	return v;
});
