import { z } from 'zod';

/** An application setting */
export const zSettingSchema = z.object({
	/** A unique string ID for the setting */
	id: z.string().regex(/^[a-z0-9_]+$/),
	/** Any type of JSON value */
	value: z.any(),
});

export type Setting = z.infer<typeof zSettingSchema>;

// Setting schemas are described here
// export interface EventSettings {
// 	// Add settings definitions here
// }
