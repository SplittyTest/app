// Validates a name before it is placed into SQL as an identifier (e.g. a JSON path segment).
// Values must never go through here — pass them as query parameters instead.
const SAFE_IDENTIFIER = /^[a-zA-Z0-9_$]+$/;

export function assertSafeIdentifier(name: unknown): string {
	if (typeof name !== 'string' || !SAFE_IDENTIFIER.test(name)) {
		const err: any = new Error('Invalid segment name');
		err.statusCode = 400;
		throw err;
	}
	return name;
}

export default assertSafeIdentifier;
