import { CorsOptions } from 'cors';
import { Request } from 'express';

const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

export function corsOptionsDelegate(req: Request, callback: (err: Error | null, cors_options: CorsOptions) => void) {
	const options: CorsOptions = {
		origin: false,
		credentials: true,
	};
	const domain_whitelist = req.auth?.domain_whitelist;
	const origin = req.header('Origin') as string;
	const env = process.env.NODE_ENV;

	if (env === 'production') {
		if (domain_whitelist && (domain_whitelist.includes(origin) || domain_whitelist.includes('*'))) {
			options.origin = true;
		}
	} else if (env === 'dev' || env === 'test') {
		// Local development: the UI dev server runs on a different port
		options.origin = true;
	} else if (!req.path.startsWith('/api') || (origin && LOCAL_ORIGIN.test(origin))) {
		// NODE_ENV unset (e.g. the default docker-compose setup): keep the tracking endpoints open
		// cross-origin, but only let local origins make credentialed calls to the admin API
		options.origin = true;
	}
	callback(null, options);
}
