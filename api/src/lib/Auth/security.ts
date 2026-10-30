import DB from '@lib/DB';
import log from '@lib/Logger';
import crypto from 'node:crypto';
import { NextFunction, Request, Response } from 'express';

/**
 * Fixed-window rate limiter backed by the KV store, so limits hold across app instances.
 * `key` picks what to count per request (e.g. client IP, or IP + email).
 */
export function rateLimit(options: {
	name: string;
	limit: number;
	window_seconds: number;
	key: (req: Request) => string;
}) {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			const counter_key = `ratelimit:${options.name}:${options.key(req)}`;
			const count = Number(await DB.Dict.client.incr(counter_key));
			if (count === 1) {
				await DB.Dict.expire(counter_key, options.window_seconds);
			}
			if (count > options.limit) {
				res.setHeader('Retry-After', String(options.window_seconds));
				return res.status(429).json({
					statusCode: 429,
					error: 'Too many attempts. Please wait a few minutes and try again.',
				});
			}
		} catch (err) {
			// Don't lock everyone out if the KV store has a hiccup
			log.warn({ err }, 'Rate limiter unavailable');
		}
		next();
	};
}

// Constant-time comparison for secrets such as reset tokens
export function safeEqual(a: unknown, b: unknown): boolean {
	if (typeof a !== 'string' || typeof b !== 'string') return false;
	const a_buf = Buffer.from(a);
	const b_buf = Buffer.from(b);
	return a_buf.length === b_buf.length && crypto.timingSafeEqual(a_buf, b_buf);
}

// Sign a user out everywhere (e.g. after a password change), optionally keeping one session
export async function destroyUserSessions(user_id: string, keep_session_id?: string) {
	let cursor = '0';
	do {
		const { cursor: next_cursor, keys } = await DB.Dict.scan(cursor, { MATCH: 'admin-session:*', COUNT: 1000 });
		cursor = String(next_cursor);
		for (const key of keys) {
			if (keep_session_id && key === `admin-session:${keep_session_id}`) continue;
			const raw = await DB.Dict.get(key);
			if (!raw) continue;
			try {
				if (JSON.parse(raw)?.passport?.user === user_id) {
					await DB.Dict.del(key);
				}
			} catch {
				// Not a JSON session; ignore
			}
		}
	} while (cursor !== '0');
}
