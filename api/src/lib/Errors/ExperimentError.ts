import log from '@lib/Logger';

export interface ExperimentErrorDetails {
	statusCode?: number;
	reason?: string;
	silent?: boolean;
	subject_id?: string;
	section_id?: string;
	test_id?: string;
	metric_id?: string;
	variation_id?: string;
	session_id?: string;
}

export class ExperimentError extends Error {
	name: string;
	statusCode?: number;
	reason?: string;
	silent?: boolean;
	subject_id?: string;
	section_id?: string;
	test_id?: string;
	metric_id?: string;
	variation_id?: string;
	session_id?: string;

	constructor(message: string, details: ExperimentErrorDetails = {}) {
		super(message);
		this.name = 'ExperimentError';

		this.statusCode = details.statusCode || 500;
		if (details.reason) this.reason = details.reason;

		// Details about experiment errors
		if (details.subject_id) this.subject_id = details.subject_id;
		if (details.section_id) this.section_id = details.section_id;
		if (details.test_id) this.test_id = details.test_id;
		if (details.metric_id) this.metric_id = details.metric_id;
		if (details.variation_id) this.variation_id = details.variation_id;
		if (details.session_id) this.session_id = details.session_id;

		// Always log errors when they are thrown
		if (!details?.silent) {
			log.error(`${message}: ${details.reason}`);
		}
	}
}
