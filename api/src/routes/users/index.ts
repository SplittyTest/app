import { requireRole } from '@/lib/Auth';
import { destroyUserSessions } from '@/lib/Auth/security';
import DB from '@lib/DB';
import Cache from '@lib/Cache';
import { Router } from 'express';
import { AuthError } from '@/lib/Errors/AuthError';
import { compareSync } from 'bcrypt';
import { omit, pick } from 'lodash-es';

export default function (router: Router) {
	router
		.route('/users')

		// Get the list of users
		.get(requireRole('admin'), async (req, res) => {
			if (req.query.refresh) {
				await Cache.clean('db:users:getAll');
			}
			const users = await DB.Users.getAll();
			res.status(200).json(
				users.map((user) => {
					// @ts-ignore
					delete user.password;
					return user;
				}),
			);
		})

		// Insert a new user
		.post(requireRole('admin'), async (req, res) => {
			const user = await DB.Users.insert(req.body.user);

			if (user) {
				if (Array.isArray(user)) {
					return res.status(201).json(
						user.map((row) => {
							return {
								id: row.id,
							};
						}),
					);
				} else {
					return res.status(201).json({
						id: user.id,
					});
				}
			}
			return res.status(200).json({});
		});

	router
		.route('/users/options')

		// Get the list of users
		.get(requireRole('viewer'), async (req, res) => {
			const users = await DB.Users.getAll();
			res.status(200).json(
				users.map((user) => {
					return {
						label: user.first_name + ' ' + user.last_name,
						value: user.id,
					};
				}),
			);
		});

	router
		.route('/users/:id')

		// Get a single user
		.get(requireRole('viewer'), async (req, res) => {
			// Limit the request to the current user
			if (req.user?.role !== 'admin' && req.params.id !== req.user?.id) {
				return res.status(200).json({});
			}

			const user = await DB.Users.getById(req.params.id);
			return res.status(200).json(user ? omit(user, ['password']) : null);
		})

		// Update a user
		.patch(requireRole('viewer'), async (req, res) => {
			const is_admin = req.user?.role === 'admin';
			const is_self = req.params.id === req.user?.id;
			if (!is_admin && !is_self) {
				throw new AuthError("You don't have the required permissions to do that");
			}

			const input = { ...(req.body?.user ?? {}) };

			// Only these fields can ever be changed through this endpoint
			const allowed_fields = is_admin
				? ['first_name', 'last_name', 'email', 'phone', 'password', 'role', 'status', 'mfa']
				: ['first_name', 'last_name', 'email', 'phone', 'password', 'mfa'];
			const update: Record<string, any> = pick(input, allowed_fields);

			if (is_self) {
				// Admins can't demote or suspend themselves (prevents locking everyone out)
				delete update.role;
				delete update.status;

				// Changing your own password requires the current password
				if (update.password) {
					const current_user = await DB.Users.getById(req.user!.id);
					if (
						!current_user?.password ||
						typeof input.old_password !== 'string' ||
						!compareSync(input.old_password, current_user.password)
					) {
						throw new AuthError('The current password was incorrect');
					}
				}
			}

			const result = await DB.Users.updateById(req.params.id, update);

			// A password change signs the user out of their other sessions (or all of them, if an admin changed it)
			if (result && update.password) {
				await destroyUserSessions(req.params.id, is_self ? req.sessionID : undefined);
			}
			res.status(200).json(result ? omit(result, ['password']) : null);
		})

		// Delete a user
		.delete(requireRole('admin'), async (req, res) => {
			if (req.params.id === req.user?.id) {
				throw new AuthError("You can't delete your own user");
			}
			const result = await DB.Users.deleteById(req.params.id);
			res.status(200).json(result ? omit(result, ['password']) : null);
		});
}
