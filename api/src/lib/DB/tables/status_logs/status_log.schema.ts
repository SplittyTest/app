import dayjs from '@lib/dayjs';
import { z } from 'zod';

export const zStatusLogDataSchema = z
	.object({
		/** The variation_id that changed modes or status */
		variation_id: z.string().optional(),
		/** The mode that was changed to */
		mode: z.string().optional(),
		/** The status that was changed to */
		status: z.string().optional(),
		/** Additional info for the status change */
		reason: z.string().optional(),
		/** The ID of the user that initiated the action */
		user_id: z.string().ulid().optional(),
	})
	.partial()
	.catchall(z.any());

/** Schema for status log data */
export type StatusLogData = z.infer<typeof zStatusLogDataSchema>;

/** A log for a status change on a test or variation */
export const zStatusLogSchema = z.object({
	/** A ULID */
	id: z.string().ulid(),
	/** The ULID of the test this status log is for */
	test_id: z.string().ulid(),
	/** The type of asset whose status changed */
	type: z.enum(['test', 'variation']),
	/** Data details about the status change */
	data: zStatusLogDataSchema,
	/** A timestamp of the status change */
	created_at: z
		.date()
		.or(z.string())
		.transform((v) => dayjs(v).utc().toDate()),
});

export type StatusLog = z.infer<typeof zStatusLogSchema>;
