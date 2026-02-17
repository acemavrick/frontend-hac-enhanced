/**
 * decrypt scraper output encrypted with AES-256-GCM + PBKDF2.
 * wire format: salt(32) || nonce(12) || ciphertext || gcm_tag(16)
 *
 * mirrors hac-scraper/crypto.py exactly.
 */

import { createDecipheriv, pbkdf2Sync } from 'node:crypto';

const SALT_LEN = 32;
const NONCE_LEN = 12;
const KEY_LEN = 32;
const TAG_LEN = 16;
const KDF_ITERATIONS = 600_000;

function deriveKey(password: string, salt: Buffer): Buffer {
	return pbkdf2Sync(password, salt, KDF_ITERATIONS, KEY_LEN, 'sha256');
}

export function decryptScraperOutput(password: string, encrypted: Buffer): Buffer {
	const salt = encrypted.subarray(0, SALT_LEN);
	const nonce = encrypted.subarray(SALT_LEN, SALT_LEN + NONCE_LEN);
	const tagStart = encrypted.length - TAG_LEN;
	const ciphertext = encrypted.subarray(SALT_LEN + NONCE_LEN, tagStart);
	const tag = encrypted.subarray(tagStart);

	const key = deriveKey(password, salt);

	const decipher = createDecipheriv('aes-256-gcm', key, nonce);
	decipher.setAuthTag(tag);

	const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
	return decrypted;
}
