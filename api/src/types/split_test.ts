import { z } from 'zod';

// Params for serving a new test
export const zSplitTestParams = z.object({
	/** The subject the test is for */
	subject_id: z
		.string()
		.regex(/^[a-z0-9_]+$/)
		.optional(),
	/** The section of the subject the test is for */
	section_id: z.string().regex(/^[a-z0-9_]+$/),
	/** Arbitrary data to log to the session with events */
	data: z.record(z.string(), z.any()),
	/** A specific test to participate in (must match the section and subject) */
	test_id: z.string().ulid().nullish(),
	/** A specific variation to return (must match the section and subject) */
	variation_id: z.string().nullish(),
	/** Set to true to bypass logging a test view */
	ignore: z.boolean().nullish(),
});

export type SplitTest = z.infer<typeof zSplitTestParams>;
