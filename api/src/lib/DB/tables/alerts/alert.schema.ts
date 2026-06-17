import { z } from 'zod';
import dayjs from '@lib/dayjs';

/** An alert about a split test */
export const zAlertSchema = z.object({
	/** A ULID */
	id: z.ulid(),
	/** The ULID of the user the alert is for */
	user_id: z.ulid(),
	/** The ULID of the test the alert is for */
	test_id: z.ulid(),
	/** The type of event the alert is for */
	event: z.enum(['status', 'comment', 'winner', 'failure']),
	/** The content of the alert */
	content: z.string(),
	/** The status of the alert */
	status: z.enum(['unread', 'read']),
	/** The UTC date when the record was created */
	created_at: z
		.date()
		.or(z.string())
		.transform((v) => dayjs(v).utc().toDate()).nullish(),
	/** The UTC date when the record was viewed */
	viewed_at: z
		.date()
		.or(z.string())
		.transform((v) => dayjs(v).utc().toDate())
		.nullish(),
});
export type Alert = z.infer<typeof zAlertSchema>;
