import config from 'config';
import { RedisStore } from 'connect-redis';

export function createAdminSessionStore(kvClient: any) {
	switch (config.get('session.store')) {
		case 'redis':
			return new RedisStore({
				client: kvClient,
				prefix: 'admin-session:',
			});
		default:
			throw new Error('Unsupported KV type');
	}
}

export function createUserSessionStore(kvClient: any) {
	switch (config.get('session.store')) {
		case 'redis':
			return new RedisStore({
				client: kvClient,
				prefix: 'user-session:',
			});
		default:
			throw new Error('Unsupported KV type');
	}
}
