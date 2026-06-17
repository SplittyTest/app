import log from '@lib/Logger';

export interface AuthErrorDetails {
	logout?: boolean;
	reason?: string;
	required_role?: string;
	silent?: boolean;
	statusCode?: number;
	user_id?: string;
	user_role?: string;
}

export class AuthError extends Error {
	name: string;

	logout?: boolean;
	reason?: string;
	required_role?: string;
	silent?: boolean;
	statusCode?: number;
	user_id?: string;
	user_role?: string;

	constructor(message: string, details: AuthErrorDetails = {}) {
		super(message);
		this.name = 'AuthError';

		this.statusCode = details.statusCode || 401;
		if (details.reason) this.reason = details.reason;

		// Details about permission errors
		if (details.required_role) this.required_role = details.required_role;
		if (details.user_role) this.user_role = details.user_role;
		if (details.user_id) this.user_id = details.user_id;

		// Should we log the user out due to this error?
		if (details.logout) this.logout = details.logout;

		// Always log errors when they are thrown
		if (!details?.silent) {
			let error_message = `${message}`;
			if (details.reason) error_message += `: ${details.reason}`;
			log.error(error_message);
		}
	}
}
