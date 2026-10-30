import { PassportAuth } from '@/lib/Auth';
import { destroyUserSessions, rateLimit, safeEqual } from '@/lib/Auth/security';
import DB from '@/lib/DB';
import Mail from '@/lib/Mail';
import config from 'config';
import { Router } from 'express';
import { omit } from 'lodash-es';
import crypto from 'node:crypto';

// Limits for unauthenticated auth endpoints
const loginLimiter = rateLimit({
	name: 'login',
	limit: 10,
	window_seconds: 15 * 60,
	key: (req) => `${req.ip}:${String(req.body?.email ?? '').toLowerCase()}`,
});
const loginIpLimiter = rateLimit({ name: 'login-ip', limit: 50, window_seconds: 15 * 60, key: (req) => String(req.ip) });
const resetLimiter = rateLimit({ name: 'reset', limit: 5, window_seconds: 15 * 60, key: (req) => String(req.ip) });

export default function (router: Router) {
	// Log the user in
	router.post('/login', loginIpLimiter, loginLimiter, PassportAuth.authenticate('local'), async (req, res, next) => {
		// Return the user (never the password hash)
		res.status(200).json({
			user: omit(req.user as Record<string, any>, ['password']),
		});
	});

	// Log the user out
	router.post('/logout', async (req, res, next) => {
		req.logout(() => {
			res.status(200).json({
				message: 'You have been logged out',
			});
		});
	});

	// Check auth credentials (should happen on every request)
	router.get('/auth', async (req, res, next) => {
		if (!req.isAuthenticated()) {
			return res.status(403).json({
				error: 'Access denied',
			});
		} else {
			res.status(200).json({
				user: req.user,
			});
		}
	});

	// Initiate a password reset
	router.post('/send-password-reset-email', resetLimiter, async (req, res, next) => {
		if (typeof req.body?.email === 'string' && req.body.email) {
			const app_url = config.get('app.url') as string;

			// Get user by email address
			const user = await DB.Users.getByEmail(req.body.email);
			if (user && user.status === 'active') {
				// Generate a reset token and save it to redis for 5 minutes
				const reset_token = crypto.randomBytes(32).toString('hex');
				await DB.Dict.setEx(`reset_password:${user.id}`, 300, reset_token);

				// Send an email with the reset token
				await Mail.send({
					to: [
						{
							name: `${user.first_name} ${user.last_name}`,
							email: user.email,
						},
					],
					from: config.get('email.from') as string,
					reply_to: config.get('email.reply_to') as string,
					subject: 'Reset Your Splitty Test Account Password',
					template: 'reset-password',
					data: {
						name: user.first_name,
						url: `${app_url}/reset-password?user=${encodeURIComponent(user.id)}&token=${reset_token}`,
					},
				});
			}
		}

		// Always respond the same way, so the endpoint doesn't reveal which emails have accounts
		res.status(204).send();
	});

	// Reset a password
	router.post('/reset-password', resetLimiter, async (req, res, next) => {
		const user_id = req.body?.user_id;
		const password = req.body?.password;
		if (typeof user_id === 'string' && user_id && typeof password === 'string' && password) {
			// Check if a reset token exists and matches
			const token_key = `reset_password:${user_id}`;
			const reset_token = await DB.Dict.get(token_key);
			if (reset_token && safeEqual(reset_token, req.body?.token)) {
				// Tokens are single-use
				await DB.Dict.del(token_key);

				const user = await DB.Users.getById(user_id);
				if (user) {
					const updated = await DB.Users.updateById(user_id, { password });
					if (updated?.id) {
						// Sign out every existing session for this user
						await destroyUserSessions(updated.id);
						return res.status(200).json({
							user: {
								id: updated.id,
							},
						});
					}
				}
			}
		}
		const err: any = new Error('Unable to reset password');
		err.statusCode = 400;
		throw err;
	});
}
