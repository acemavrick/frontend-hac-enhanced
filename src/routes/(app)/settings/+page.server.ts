import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt } from '$lib/server/auth/crypto';
import { hashPassword, verifyPassword } from '$lib/server/auth/password';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	// load full user record to check if HAC creds are set
	const [full] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);

	return {
		hacUsername: full?.hacUsername ?? '',
		hasHacPassword: !!(full?.hacPasswordEncrypted)
	};
};

export const actions: Actions = {
	// save HAC credentials
	saveHac: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { hacError: 'Not authenticated' });

		const data = await request.formData();
		const hacUsername = data.get('hacUsername')?.toString().trim();
		const hacPassword = data.get('hacPassword')?.toString();

		if (!hacUsername) {
			return fail(400, { hacError: 'HAC username is required' });
		}

		const updates: Record<string, unknown> = {
			hacUsername,
			updatedAt: new Date()
		};

		// only re-encrypt if a new password was provided
		if (hacPassword) {
			const { ciphertext, iv } = encrypt(hacPassword);
			updates.hacPasswordEncrypted = ciphertext;
			updates.hacPasswordIv = iv;
		}

		await db.update(users).set(updates).where(eq(users.id, user.id));

		return { hacSuccess: true };
	},

	// change account password
	changePassword: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { pwError: 'Not authenticated' });

		const data = await request.formData();
		const currentPassword = data.get('currentPassword')?.toString();
		const newPassword = data.get('newPassword')?.toString();
		const confirmPassword = data.get('confirmPassword')?.toString();

		if (!currentPassword || !newPassword) {
			return fail(400, { pwError: 'All password fields are required' });
		}
		if (newPassword.length < 6) {
			return fail(400, { pwError: 'New password must be at least 6 characters' });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { pwError: 'Passwords don\'t match' });
		}

		const [full] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
		if (!full || !(await verifyPassword(currentPassword, full.passwordHash))) {
			return fail(400, { pwError: 'Current password is incorrect' });
		}

		const hash = await hashPassword(newPassword);
		await db.update(users).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(users.id, user.id));

		return { pwSuccess: true };
	}
};
