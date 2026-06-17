import { z } from 'zod';
import bcrypt from 'bcrypt';
import dayjs from '@lib/dayjs';

export const zUserSchema = z.object({
	/** A ULID */
	id: z.ulid(),
	/** The user's first name */
	first_name: z.string(),
	/** The user's last name */
	last_name: z.string(),
	/** A unique email address */
	email: z.email(),
	/** A phone number for the user (used with MFA) */
	phone: z
		.string()
		.regex(/\d{10}/)
		.nullish(),
	/** An encrypted password */
	password: z.string().transform(async (v) => {
		return await bcrypt.hash(v, 12);
	}),
	/** The role assigned to the user (default: 'tester') */
	role: z.enum(['viewer', 'commenter', 'tester', 'admin', 'api']),
	/** TRUE if multi-factor authentication is active for this user (default: false) */
	mfa: z.boolean().default(false),
	/** The status of the current user (default: 'active') */
	status: z.enum(['active', 'suspended', 'archived']),
	/** The UTC timestamp of the user's last login */
	last_login: z
		.date()
		.or(z.string())
		.transform((v) => dayjs(v).utc().toDate())
		.nullish(),
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

export type User = z.infer<typeof zUserSchema>;
