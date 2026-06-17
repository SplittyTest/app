import { z } from 'zod';
import dayjs from '@lib/dayjs';

/** A comment on a split test */
export const zCommentSchema = z.object({
	/** A ULID */
	id: z.ulid(),
	/** The ULID of the test the comment is for */
	test_id: z.ulid(),
	/** The ULID of the user that posted the comment */
	user_id: z.ulid(),
	/** The content of the comment */
	content: z.string(),
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

export type Comment = z.infer<typeof zCommentSchema>;
