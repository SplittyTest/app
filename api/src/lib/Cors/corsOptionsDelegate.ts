import { CorsOptions } from 'cors';
import { Request } from 'express';

export function corsOptionsDelegate(req: Request, callback: (err: Error | null, cors_options: CorsOptions) => void) {
	const options: CorsOptions = {
		origin: false,
		credentials: true,
	};
	const domain_whitelist = req.auth?.domain_whitelist;
	const origin = req.header('Origin') as string;
	if (process.env.NODE_ENV === 'production') {
		if (domain_whitelist && (domain_whitelist.includes(origin) || domain_whitelist.includes('*'))) {
			options.origin = true;
		}
	} else {
		options.origin = true;
	}
	callback(null, options);
}
