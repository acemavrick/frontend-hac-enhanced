import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

// format: salt:hash (both hex)
export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(SALT_LENGTH);
	const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
	return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const [saltHex, hashHex] = stored.split(':');
	if (!saltHex || !hashHex) return false;

	const salt = Buffer.from(saltHex, 'hex');
	const storedHash = Buffer.from(hashHex, 'hex');
	const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;

	return timingSafeEqual(storedHash, derived);
}
