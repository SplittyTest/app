import { PassportAuth } from '@/lib/Auth';
import DB from '@/lib/DB';
import Mail from '@/lib/Mail';
import config from 'config';
import { Router } from 'express';
import crypto from 'node:crypto';

export default function (router: Router) {
	// Log the user in
	router.post('/login', PassportAuth.authenticate('local'), async (req, res, next) => {
		// Return the user_id
		res.status(200).json({
			user: req.user,
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
	router.post('/send-password-reset-email', async (req, res, next) => {
		if (req.body.email) {
			const app_url = config.get('app.url') as string;

			// Get user by email address
			const user = await DB.Users.getByEmail(req.body.email);
			if (user) {
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
						url: `${app_url}/reset-password?user${user.id}=&token=${reset_token}`,
					},
				});
			}

			// Send an empty response
			res.status(204).send();
		}
	});

	// Reset a password
	router.post('/reset-password', async (req, res, next) => {
		const user_id: string = req.body?.user_id;
		if (user_id) {
			// Check if a reset token exists and matches
			const reset_token = await DB.Dict.get(`reset_password:${user_id}`);
			if (reset_token && reset_token === req.body?.token) {
				// Get user by ID
				const user = await DB.Users.getById(user_id);
				if (user) {
					// Update the user password
					const user = await DB.Users.updateById(user_id, {
						password: req.body.password,
					});

					if (user?.id) {
						return res.status(200).json({
							user: {
								id: user.id,
							},
						});
					}
				}
			}
		}
		throw new Error('Unable to reset password');
	});
}
