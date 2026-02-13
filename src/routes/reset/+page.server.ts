import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, masterPassword } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '$lib/server/auth/password';
import { createSession, needsSetup } from '$lib/server/auth';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	if (await needsSetup()) redirect(302, '/setup');
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = data.get('username')?.toString().trim();
		const masterPw = data.get('masterPassword')?.toString();
		const newPassword = data.get('newPassword')?.toString();
		const confirmPassword = data.get('confirmPassword')?.toString();

		if (!username || !masterPw || !newPassword) {
			return fail(400, { error: 'All fields are required', username });
		}
		if (newPassword.length < 6) {
			return fail(400, { error: 'New password must be at least 6 characters', username });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'Passwords don\'t match', username });
		}

		// verify master password
		const [master] = await db.select().from(masterPassword).where(eq(masterPassword.id, 1)).limit(1);
		if (!master || !(await verifyPassword(masterPw, master.hash))) {
			return fail(400, { error: 'Invalid master password', username });
		}

		// find the user
		const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
		if (!user) {
			return fail(400, { error: 'User not found', username });
		}

		// update password
		const newHash = await hashPassword(newPassword);
		await db.update(users).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(users.id, user.id));

		await createSession(user.id, cookies);
		redirect(302, '/attendance');
	}
};
