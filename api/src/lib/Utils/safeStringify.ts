import log from '@lib/Logger';

export default function safeStringify(value: unknown) {
	if (typeof value === 'object') {
		try {
			return JSON.stringify(value);
		} catch (err) {
			log.warn('Unable to stringify value', value);
		}
	}
	return value;
}
