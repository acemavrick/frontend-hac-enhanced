import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, masterPassword } from '$lib/server/db/schema';
import { hashPassword } from '$lib/server/auth/password';
import { createSession, needsSetup } from '$lib/server/auth';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	// only accessible when no users exist
	if (!(await needsSetup())) redirect(302, '/login');
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		if (!(await needsSetup())) redirect(302, '/login');

		const data = await request.formData();
		const username = data.get('username')?.toString().trim();
		const password = data.get('password')?.toString();
		const confirmPassword = data.get('confirmPassword')?.toString();
		const masterPw = data.get('masterPassword')?.toString();

		if (!username || username.length < 2) {
			return fail(400, { error: 'Username must be at least 2 characters', username });
		}
		if (!password || password.length < 6) {
			return fail(400, { error: 'Password must be at least 6 characters', username });
		}
		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords don\'t match', username });
		}
		if (!masterPw || masterPw.length < 6) {
			return fail(400, { error: 'Master password must be at least 6 characters', username });
		}

		const passwordHash = await hashPassword(password);
		const masterHash = await hashPassword(masterPw);

		// create master password record
		await db.insert(masterPassword).values({ id: 1, hash: masterHash });

		// create first user
		const userId = crypto.randomUUID();
		await db.insert(users).values({
			id: userId,
			username,
			passwordHash
		});

		await createSession(userId, cookies);
		redirect(302, '/settings');
	}
};
