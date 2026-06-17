import DB from '@/lib/DB';
import { Router } from 'express';
import { filterTraffic } from '@lib/Utils/filterTraffic';
import { participate } from './participate';
import { logEvent } from './logEvent';
import { PassportAuth } from '@/lib/Auth';
import { merge } from 'lodash-es';

export default async function (router: Router) {
	// Get session settings
	const settings: Record<string, any> = {
		filtered_ips: [],
	};
	const settings_from_db = await DB.Settings.getById(['filtered_ips']);
	if (settings_from_db) {
		merge(settings, settings_from_db);
	}

	// Optimization: Skip auth if session is valid from app.ts
	const authMiddleware = (req: any, res: any, next: any) => {
		if (req.isAuthenticated()) {
			return next();
		}
		PassportAuth.authenticate('headerapikey', { keepSessionInfo: true })(req, res, next);
	};

	// Session middleware (merge req.body.data into session)
	const sessionMiddleware = (req: any, res: any, next: any) => {
		if (req.body && req.body.data) {
			merge(req.session, { data: req.body.data });
		}
		next();
	};

	router.use(authMiddleware, filterTraffic(settings.filtered_ips), sessionMiddleware);

	// Participate in a test
	router.post('/participate', participate);

	// Log a session event
	router.post('/log-event', logEvent);
}
