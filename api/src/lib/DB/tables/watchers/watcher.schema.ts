import { z } from 'zod';
import dayjs from '@lib/dayjs';

/** The configuration for a test watcher */
export const zWatcherSchema = z.object({
	/** The ULID of the user the watcher is for */
	user_id: z.ulid(),
	/** The ULID of the test the watcher is for */
	test_id: z.ulid(),
	/** Which events to watch for */
	watch_events: z.array(z.enum(['status', 'comment', 'winner', 'failure'])),
	/** The types of alerts to receive */
	alert_types: z.array(z.enum(['email', 'app', 'sms'])),
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

export type Watcher = z.infer<typeof zWatcherSchema>;
