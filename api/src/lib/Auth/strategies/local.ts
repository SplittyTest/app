import DB from '@/lib/DB';
import log from '@lib/Logger';
import { AuthError } from '@/lib/Errors/AuthError';
import { compareSync } from 'bcrypt';
import { IVerifyOptions, Strategy as LocalStrategy } from 'passport-local';

// bcrypt hash of a random value, used when the email doesn't match any user
const DUMMY_HASH = '$2b$12$magmefwJvT8P0gs6M82CkuqBM/CmEOA1yjLhjUH2i.Cl3pUlOntme';

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

		// Always run a bcrypt comparison so response time doesn't reveal whether the email exists
		const valid_password = compareSync(String(password), user?.password || DUMMY_HASH);

		if (user) {
			// Verify the password, and only allow active accounts to sign in
			if (!valid_password || user.status !== 'active') {
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
		}).info('Login failed');
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
