import { isbot } from 'isbot';
import ipRangeCheck from 'ip-range-check';
import log from '@lib/Logger';
import { NextFunction, Request, Response } from 'express';
import { isPlainObject } from 'lodash-es';

// Check if traffic is from a filtered IP or bot
export function filterTraffic(filtered_ips: string[]) {
	return (req: Request, res: Response, next: NextFunction) => {
		// Return no content for bots
		const is_bot = isbot(req.get('User-Agent'));
		if (is_bot && process.env.NODE_ENV === 'production') {
			log.debug(
				{
					path: req.path,
					ua: req.get('User-Agent'),
				},
				'Ignoring bot traffic',
			);
			res.status(204).send();
			return;
		}

		// Mark filtered traffic in the request
		if (req.ip) {
			req.filtered_ip = req.session.filtered_ip = ipRangeCheck(req.ip!, filtered_ips);

			// Merge the IP address into the session data
			if (req.body.data && isPlainObject(req.body.data)) {
				req.body.data.$ip = req.ip;
			}
		}

		next();
	};
}
