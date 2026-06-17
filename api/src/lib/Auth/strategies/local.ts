import DB from '@/lib/DB';
import log from '@lib/Logger';
import { AuthError } from '@/lib/Errors/AuthError';
import { compareSync } from 'bcrypt';
import { IVerifyOptions, Strategy as LocalStrategy } from 'passport-local';

async function verify(
	username: string,
	password: string,
	callback: (error: any, user?: Express.User | false, options?: IVerifyOptions) => void,
) {
	try {
		if (!username || !password) {
			return callback(
				new AuthError('Invalid Login', {
					statusCode: 401,
					reason: 'Missing user or password',
				}),
			);
		}

		// Get the user by email address
		const user = await DB.Users.getByEmail(username);

		if (user) {
			// Verify the password
			const valid_password = compareSync(password, user?.password);
			if (!valid_password) {
				throw new AuthError('Invalid user or password', {
					logout: true,
				});
			}

			// Update the last_login user property
			await DB.Users.updateById(user.id, { last_login: new Date() }).catch((err) => {
				log.warn({ user_id: user.id }, 'Unable to update the last login date for user', err);
			});

			return callback(null, user);
		} else {
			throw new AuthError('Invalid user or password', {
				logout: true,
			});
		}
	} catch (err) {
		log.child({
			email: username,
			err,
		}).info('Not found in DB');
		callback(err);
	}
}

const AuthLocal = new LocalStrategy(
	{
		usernameField: 'email',
	},
	verify,
);
export default AuthLocal;
