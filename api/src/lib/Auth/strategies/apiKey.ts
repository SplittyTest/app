import { validateKey } from '@/lib/DB/tables/api_keys';
import { AuthError } from '@/lib/Errors/AuthError';
import { APIKey } from '@/types/schemas';
import log from '@lib/Logger';
import ipRangeCheck from 'ip-range-check';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';

type VerifyCallback = (err: Error | null, user?: any, info?: any) => void;

async function verify(key: string, callback: VerifyCallback, req?: Express.Request) {
	try {
		if (!key) {
			throw new AuthError('The API-key was missing');
		}

		// Get the API-Key
		let api_key: APIKey | undefined;
		try {
			api_key = await validateKey(key);
		} catch (err) {
			log.warn(err);
			callback(err as Error);
		}

		// Check if the API-key is active
		if (api_key!.status !== 'active') {
			throw new AuthError('Invalid API-Key', {
				statusCode: 401,
				reason: 'The API-key has been suspended',
			});
		}

		if (req) {
			// Check if the request came from a whitelisted IP address
			if (!req.ip || (Array.isArray(api_key!.ip_whitelist) && !ipRangeCheck(req.ip, api_key!.ip_whitelist))) {
				throw new AuthError('Invalid IP', {
					statusCode: 401,
					reason: 'The request came from an invalid IP address',
				});
			}

			// Add the whitelisted domains to the req context for cors
			req.auth = {
				domain_whitelist: api_key!.domain_whitelist ?? [],
			};

			// Add the subject_id to the request context for logging and other purposes
			req.subject_id = api_key!.subject_id;
			req.session.subject_id = api_key!.subject_id;
		}

		return callback(null, { id: api_key?.prefix, role: 'api', subject_id: api_key?.subject_id });
	} catch (err) {
		log.error(err);
		callback(err as Error);
	}
}

const AuthAPIKey = new HeaderAPIKeyStrategy(
	{
		header: 'Authorization',
		prefix: 'API-Key ',
	},
	true,
	verify,
);
export default AuthAPIKey;
