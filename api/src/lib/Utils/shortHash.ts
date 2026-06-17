import { createHash } from 'node:crypto';

export default function shortHash(value: any) {
	return createHash('shake256', { outputLength: 4 }).update(value).digest('hex');
}
