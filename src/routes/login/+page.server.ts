import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '$lib/server/auth/password';
import { createSession, needsSetup } from '$lib/server/auth';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { user, needsSetup: setup } = await parent();
	if (setup) redirect(302, '/setup');
	if (user) redirect(302, '/attendance');
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		if (await needsSetup()) redirect(302, '/setup');

		const data = await request.formData();
		const username = data.get('username')?.toString().trim();
		const password = data.get('password')?.toString();

		if (!username || !password) {
			return fail(400, { error: 'Username and password are required', username });
		}

		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.username, username))
			.limit(1);

		if (!user || !(await verifyPassword(password, user.passwordHash))) {
			return fail(400, { error: 'Invalid username or password', username });
		}

		await createSession(user.id, cookies);
		redirect(302, '/attendance');
	}
};
