import { requireRole } from '@/lib/Auth';
import DB from '@lib/DB';
import Cache from '@lib/Cache';
import { Router } from 'express';
import { AuthError } from '@/lib/Errors/AuthError';
import { compareSync } from 'bcrypt';

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
			return res.status(200).json(user);
		})

		// Update a user
		.patch(requireRole('viewer'), async (req, res) => {
			if (req.user?.role !== 'admin' && req.params.id !== req.user?.id) {
				throw new AuthError("You don't have the required permissions to do that");
			}

			// Check if the user is trying to update their own record
			if (req.params.id === req.user?.id) {
				// If they are, prevent them from changing their role to something other than admin
				if (req.user.role === 'admin' && req.body.user.role !== 'admin') {
					delete req.body.user.role;
				}

				// Check if they are changing their password
				if (req.body.user.password) {
					// Check if the old password matches the current password
					const current_user = await DB.Users.getById(req.user.id);
					if (current_user && current_user.password) {
						if (!compareSync(req.body.user.old_password, current_user?.password)) {
							throw new AuthError('The current password was incorrect');
						}
					}

					// If it does, allow the password change to proceed, but delete the old_password field from the request body
					delete req.body.user.old_password;
				}
			}

			const result = await DB.Users.updateById(req.params.id, req.body.user);
			res.status(200).json(result);
		})

		// Delete a user
		.delete(requireRole('admin'), async (req, res) => {
			if (req.params.id === req.user?.id) {
				throw new AuthError("You can't delete your own user");
			}
			const result = await DB.Users.deleteById(req.params.id);
			res.status(200).json(result);
		});
}
