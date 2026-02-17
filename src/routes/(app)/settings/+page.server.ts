import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, attendanceRecords } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { encrypt } from '$lib/server/auth/crypto';
import { hashPassword, verifyPassword } from '$lib/server/auth/password';
import { extractCode, CATEGORY_IDS, DEFAULT_COLORS } from '$lib/categories';
import type { CategoryId } from '$lib/categories';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	const [full] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);

	// pull distinct raw status codes from attendance data
	const rawRows = await db
		.select({ rawStatus: attendanceRecords.rawStatus })
		.from(attendanceRecords)
		.where(eq(attendanceRecords.userId, user.id));

	const uniqueCodes = [...new Set(rawRows.map((r) => extractCode(r.rawStatus)).filter(Boolean))].sort();

	let categoryMap: Record<string, string> = {};
	if (full?.categoryMap) {
		try { categoryMap = JSON.parse(full.categoryMap) as Record<string, string>; } catch { /* ignore */ }
	}

	let categoryColors: Record<string, string> = {};
	if (full?.categoryColors) {
		try { categoryColors = JSON.parse(full.categoryColors) as Record<string, string>; } catch { /* ignore */ }
	}

	return {
		hacUsername: full?.hacUsername ?? '',
		hasHacPassword: !!(full?.hacPasswordEncrypted),
		categoryMap,
		categoryColors,
		uniqueCodes
	};
};

export const actions: Actions = {
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

		if (hacPassword) {
			const { ciphertext, iv } = encrypt(hacPassword);
			updates.hacPasswordEncrypted = ciphertext;
			updates.hacPasswordIv = iv;
		}

		await db.update(users).set(updates).where(eq(users.id, user.id));
		return { hacSuccess: true };
	},

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
	},

	// unified save for both category mappings and colors
	saveCategories: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { catError: 'Not authenticated' });

		const data = await request.formData();
		const rawMap = data.get('categoryMap')?.toString();
		const rawColors = data.get('categoryColors')?.toString();

		if (!rawMap) return fail(400, { catError: 'No mapping data provided' });

		let mapObj: Record<string, string>;
		try {
			mapObj = JSON.parse(rawMap) as Record<string, string>;
		} catch {
			return fail(400, { catError: 'Invalid mapping data' });
		}

		// validate: map values must be valid category ids
		for (const [, val] of Object.entries(mapObj)) {
			if (!CATEGORY_IDS.includes(val as CategoryId)) {
				return fail(400, { catError: `Invalid category: ${val}` });
			}
		}

		// validate colors if provided
		let colorsObj: Record<string, string> = {};
		if (rawColors) {
			try {
				colorsObj = JSON.parse(rawColors) as Record<string, string>;
			} catch {
				return fail(400, { catError: 'Invalid color data' });
			}
			// basic hex validation
			for (const [key, val] of Object.entries(colorsObj)) {
				if (!/^#[0-9a-fA-F]{6}$/.test(val)) {
					return fail(400, { catError: `Invalid color for ${key}: ${val}` });
				}
			}
		}

		await db
			.update(users)
			.set({
				categoryMap: JSON.stringify(mapObj),
				categoryColors: JSON.stringify(colorsObj),
				updatedAt: new Date()
			})
			.where(eq(users.id, user.id));

		return { catSuccess: true };
	}
};
