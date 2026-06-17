import { createHash } from 'crypto';

const ULID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Derives a valid ULID-formatted string from an input string.
 * This is used to generate stable, valid User IDs for API Keys.
 * Note: The timestamp component of this ULID is artificial and derived from the hash.
 */
export function deriveUserId(input: string): string {
    const hash = createHash('sha256').update(input).digest();
    let res = '';
    // ULID is 26 characters
    for (let i = 0; i < 26; i++) {
        // Use the byte at position i%hash_length mixed with position index
        // to pick a character from the alphabet.
        // This ensures stability: same input -> same output.
        const val = hash[i % hash.length] + i;
        res += ULID_ALPHABET[val % ULID_ALPHABET.length];
    }
    return res;
}
