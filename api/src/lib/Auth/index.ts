import DB from '@lib/DB';
import { getPrefix, prefix } from '@lib/DB/tables/api_keys/api_key.schema';
import log from '@lib/Logger';
import { NextFunction, Response } from 'express';
import { omit } from 'lodash-es';
import passport from 'passport';

const PassportAuth = passport;

// Serialize the user to the session
PassportAuth.serializeUser((user: Express.User, callback: (err: any, id?: unknown) => void) => {
	callback(null, user.id);
});

// Deserialize the user from the session
PassportAuth.deserializeUser(async (user_id: string, callback) => {
	try {
		// Check for the API Key user
		// We use a static User ID here to determine if it's an API key request
		if (user_id.substring(0, 2) === prefix) {
			const api_key_prefix = getPrefix(user_id);
			const api_key = await DB.APIKeys.getByPrefix(api_key_prefix);

			// Sessions created with a deleted or suspended key stop working right away
			if (!api_key || api_key.status !== 'active') {
				return callback(null, false);
			}

			return callback(null, {
				id: api_key?.prefix,
				role: 'api',
				project_id: api_key?.project_id,
			});
		}

		// Get the user by ID
		const user = await DB.Users.getById(user_id);

		// Deleted, suspended or archived users are signed out on their next request
		if (!user || (user as any).status !== 'active') {
			return callback(null, false);
		}
		const safe_user = omit(user, ['password']);
		callback(null, safe_user);
	} catch (err) {
		log.error(err);
		callback(err);
	}
});

export function requireRole(required_role: 'viewer' | 'commenter' | 'tester' | 'admin' | 'api') {
	return async (req: Express.Request, res: Response, next: NextFunction) => {
		const user = req.user;

		// Check if a role is available
		if (!user) {
			return res.status(401).json({
				reason: 'No user in context',
				statusCode: 401,
			});
		}

		// Check for the appropriate permission level
		let granted = true;
		switch (required_role) {
			case 'admin':
				if (user.role !== 'admin') {
					granted = false;
				}
				break;
			case 'tester':
				if (!['tester', 'admin'].includes(user.role as string)) {
					granted = false;
				}
				break;
			case 'commenter':
				if (!['commenter', 'tester', 'admin'].includes(user.role as string)) {
					granted = false;
				}
				break;
			case 'viewer':
				if (!['viewer', 'commenter', 'tester', 'admin'].includes(user.role as string)) {
					granted = false;
				}
				break;
			default:
				// For some reason, the permission level does not exist
				granted = false;
				break;
		}

		if (granted) {
			return next();
		}

		return res.status(403).json({
			statusCode: 403,
			reason: 'The user did not have the required permissions',
			required_role,
			user_role: user.role,
			user_id: user?.id,
		});
	};
}

export { PassportAuth };
