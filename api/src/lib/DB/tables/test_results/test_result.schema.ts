import z from 'zod';

// Formatted segment hashes
// This is what is returned in the app
/*
{
	[variation_id]: {
		[segment_hash]: {
			segment_a
			segment_b
			segment_c
			view_count
			filled_view_count
			conversion_count
			filled_conversion_count
			conversion_value
			filled_conversion_value
			conversion_rate
			filled_conversion_rate
			conversion_range
			filled_conversion_range
			variation_score
			filled_variation_score
		}
	}
}
*/

/** The segment results for a test variation */
export const zTestResultSchema = z.object({
	/** The ULID of the test this result row is for */
	test_id: z.ulid(),
	/** The ID of the variation this result is for */
	variation_id: z.string(),
	/** The hashed segment values */
	segment_hash: z.string(),
	/** The value of the first test segment or default */
	segment_a: z.string(),
	/** The value of the second test segment */
	segment_b: z.string().nullish(),
	/** The value of the third test segment */
	segment_c: z.string().nullish(),
	/** The number of actual views for the variation segment */
	view_count: z.number().int(),
	/** The number of actual conversion events for the variation segment */
	conversion_count: z.number().int(),
	/** The actual calculated conversion value using the test strategy */
	conversion_value: z.number(),
	/** The actual conversion rate */
	conversion_rate: z.number(),
	/** The actual high and low range of conversion values using standard error */
	conversion_range: z.tuple([z.number(), z.number()]),
	/** The actual variation score using the test strategy */
	variation_score: z.number(),
	/** The actual variation score using the test strategy */
	variation_score_range: z.tuple([z.number(), z.number()]),
	/** The mode of the variation when the test ended */
	mode: z.string().nullish(),
});
export type TestResult = z.infer<typeof zTestResultSchema>;
