import { z } from 'zod';
import dayjs from '@lib/dayjs';
import crypto from 'crypto';

export const prefix = 'st';

export function generateKey() {
	// 32 random bytes, base64url encoded, remove any '-' characters
	return crypto.randomBytes(32).toString('base64url').replace(/[-_]/g, '');
}

export function generatePrefix() {
	// 8 random bytes, hex encoded, remove any '-' characters
	return prefix + '-' + crypto.randomBytes(8).toString('hex').replace(/[-_]/g, '').substring(0, 8);
}

export function getPrefix(key: string) {
	// Get the first two segments of the key as the prefix
	return key.split('-').slice(0, 2).join('-');
}

/** An application setting */
export const zAPIKeySchema = z.object({
	/** A unique unhashed prefix to the API key for faster lookups */
	prefix: z.string().default(() => generatePrefix()),
	/** The hashed API key  */
	key: z.string().default(() => generateKey()),
	/** Name of the key */
	name: z.string(),
	/** The ID of the subject this API key is used for (this will be applied to all event data) */
	subject_id: z.string(),
	/** An array of whitelisted IP addresses or ranges that can send requests with this API key */
	ip_whitelist: z.array(z.union([z.ipv4(), z.ipv6(), z.cidrv4(), z.cidrv6()])).optional(),
	/** An array of domains to allow requests from */
	domain_whitelist: z.array(z.string()).optional(),
	/** The current status of the API key */
	status: z.enum(['active', 'suspended', 'archived']),
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

export type APIKey = z.infer<typeof zAPIKeySchema>;
