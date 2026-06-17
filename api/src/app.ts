import { PassportAuth } from '@lib/Auth';
import AuthAPIKey from '@lib/Auth/strategies/apiKey';
import AuthLocal from '@lib/Auth/strategies/local';
import { corsOptionsDelegate } from '@lib/Cors/corsOptionsDelegate';
import DB from '@lib/DB';
import { AuthError } from '@lib/Errors/AuthError';
import log from '@lib/Logger';
import parseValues from '@lib/Utils/parseValues';
import cors from 'cors';
import 'dotenv/config';
import express, { json, NextFunction, Request, Response, urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import qs from 'qs';
import { ulid } from 'ulid';
import { createAdminSessionStore, createUserSessionStore } from './lib/DB/Session';
import { apiRoutes, experimentRoutes } from './routes';
import uiRoutes from './routes/ui';

export async function createApp(session_key: string): Promise<express.Express> {
	const app = express();
	const root = express.Router();
	const api = express.Router();
	const experiment = express.Router();

	app.set('trust proxy', 1);

	// Parse querystrings using QS
	app.set('query parser', (query_string: string) => {
		const query = qs.parse(query_string);
		return parseValues(query);
	});

	// Add all necessary middleware
	app.use(json({ strict: false }));
	app.use(urlencoded({ extended: true }));
	app.use(cookieParser());

	const PassportInit = PassportAuth.initialize();
	const PassportSession = PassportAuth.session();
	PassportAuth.use(AuthLocal);
	PassportAuth.use(AuthAPIKey);

	// Initialize and add the API routes
	api.use(
		session({
			cookie: {
				secure: process.env.NODE_ENV === 'production',
				maxAge: 86400 * 30 * 1000,
				path: '/api',
			},
			genid: (req) => {
				return ulid();
			},
			resave: false,
			saveUninitialized: false,
			secret: session_key,
			store: createAdminSessionStore(DB.Dict.client),
		}),
	);
	api.use(PassportInit);
	api.use(PassportSession);
	// Intelligent default: 1 hour for API sessions
	const API_SESSION_MAX_AGE = process.env.API_SESSION_MAX_AGE
		? parseInt(process.env.API_SESSION_MAX_AGE)
		: 3600 * 1000;

	api.use((req: Request, res: Response, next: NextFunction) => {
		// Optimization: Skip auth if session is already valid
		if (req.isAuthenticated()) {
			return next();
		}

		PassportAuth.authenticate('headerapikey', (err: any, user: any, info: any) => {
			if (err) return next(err);
			if (!user) return next(); // Or handle unauthenticated case here if strict

			// Manually log the user in to persist the session
			req.login(user, (loginErr) => {
				if (loginErr) return next(loginErr);

				// Set a shorter timeout for API sessions
				if (req.session && req.session.cookie) {
					req.session.cookie.maxAge = API_SESSION_MAX_AGE;
				}
				next();
			});
		})(req, res, next);
	});
	await apiRoutes(api);

	// Initialize and add the Experiment routes
	experiment.use(
		session({
			cookie: {
				secure: process.env.NODE_ENV === 'production',
				path: '/split-test',
				maxAge: 86400 * 30 * 1000,
				sameSite: 'none',
			},
			genid: (req) => {
				return ulid();
			},
			resave: false,
			saveUninitialized: false,
			secret: session_key,
			store: createUserSessionStore(DB.Dict.client),
		}),
	);
	experiment.use(PassportInit);
	experiment.use(PassportSession);
	await experimentRoutes(experiment);

	// Initialize and add the UI routes
	await uiRoutes(root);

	// Add the API router to the app
	app.use(cors(corsOptionsDelegate));
	app.use('/api', api);
	app.use('/split-test', experiment);
	app.use('/', root);

	// Error handler
	app.use((err: any, req: Request, res: Response, next: NextFunction) => {
		// Format the error to make it friendly
		// !!! NEED TO DO THIS

		// Log the user out if it was an auth error
		if (err instanceof AuthError && err.logout) {
			req.logout(() => {});
		}

		const response_data: Record<string, any> = {
			statusCode: err.statusCode || 500,
			error: err.message,
		};

		if (err.reason) response_data.reason = err.reason;

		res.status(err.statusCode || 500).json(response_data);
		log.error(err);
	});
	return app;
}
