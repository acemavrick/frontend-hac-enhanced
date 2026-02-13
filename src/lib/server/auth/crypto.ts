import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { env } from '$env/dynamic/private';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
	const key = env.ENCRYPTION_KEY;
	if (!key || key.length !== 64) {
		throw new Error('ENCRYPTION_KEY must be a 64-char hex string (32 bytes)');
	}
	return Buffer.from(key, 'hex');
}

export function encrypt(plaintext: string): { ciphertext: string; iv: string } {
	const key = getKey();
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

	let encrypted = cipher.update(plaintext, 'utf8', 'hex');
	encrypted += cipher.final('hex');
	const authTag = cipher.getAuthTag().toString('hex');

	return {
		// store ciphertext + auth tag together
		ciphertext: encrypted + authTag,
		iv: iv.toString('hex')
	};
}

export function decrypt(ciphertext: string, ivHex: string): string {
	const key = getKey();
	const iv = Buffer.from(ivHex, 'hex');

	// split ciphertext and auth tag
	const authTag = Buffer.from(ciphertext.slice(-AUTH_TAG_LENGTH * 2), 'hex');
	const encryptedData = ciphertext.slice(0, -AUTH_TAG_LENGTH * 2);

	const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
	decipher.setAuthTag(authTag);

	let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
	decrypted += decipher.final('utf8');
	return decrypted;
}
