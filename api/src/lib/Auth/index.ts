import { NextFunction, Request, Response } from 'express';
import DB from '@lib/DB';
import { omit } from 'lodash-es';
import log from '@lib/Logger';
import passport from 'passport';
import { getPrefix, prefix } from '@lib/DB/tables/api_keys/api_key.schema';

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

			if (!api_key) {
				return callback(new Error('API Key not found'));
			}

			return callback(null, {
				id: api_key?.prefix!,
				role: 'api',
				subject_id: api_key?.subject_id,
			});
		}

		// Get the user by ID
		const user = await DB.Users.getById(user_id);
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
