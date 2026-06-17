import { Session, User as SchemaUser, APIKey as SchemaAPIKey } from './schemas';

declare global {
	namespace Express {
		export interface User {
			id: string;
			role: string;
			subject_id?: string;
		}

		export interface Request {
			auth?: {
				domain_whitelist: string[];
			};
			context?: {
				user?: Partial<SchemaUser>;
				api_key?: Partial<SchemaAPIKey>;
			};
			filtered_ip?: boolean;
			ip?: string;
			query: {
				[x: string]: any;
				filter?: any;
			};
			session?: Session;
			subject_id?: string;
			user?: User;
			sessionID: string;
		}
	}
}

declare module 'express-session' {
	interface SessionData {
		filtered_ip?: boolean;
		passport: {
			user?: Partial<SchemaUser>;
		};
		subject_id?: string;
		test_ids: string[];
		user_session: Session;
		[key: string]: any;
	}
}
