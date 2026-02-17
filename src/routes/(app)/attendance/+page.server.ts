import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getAttendance } from '$lib/server/attendance/queries';
import { normalizeRecords } from '$lib/attendance';
import { DEFAULT_COLORS, type CategoryId } from '$lib/categories';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { user } = await parent();

	const startDate = url.searchParams.get('start') ?? undefined;
	const endDate = url.searchParams.get('end') ?? undefined;
	const category = url.searchParams.get('category') ?? undefined;
	const period = url.searchParams.get('period') ?? undefined;

	const [rawRecords, userRow] = await Promise.all([
		getAttendance({ userId: user.id, startDate, endDate, category, period }),
		db.select({ categoryMap: users.categoryMap, categoryColors: users.categoryColors })
			.from(users).where(eq(users.id, user.id)).limit(1)
	]);

	let categoryMap: Record<string, string> = {};
	const rawMap = userRow[0]?.categoryMap;
	if (rawMap) {
		try { categoryMap = JSON.parse(rawMap) as Record<string, string>; } catch { /* ignore */ }
	}

	let categoryColors: Record<CategoryId, string> = { ...DEFAULT_COLORS };
	const rawColors = userRow[0]?.categoryColors;
	if (rawColors) {
		try {
			const parsed = JSON.parse(rawColors) as Record<string, string>;
			categoryColors = { ...DEFAULT_COLORS, ...parsed };
		} catch { /* ignore */ }
	}

	// normalize once in the loader — components get resolved categories
	const records = normalizeRecords(rawRecords, categoryMap);

	return {
		records,
		categoryColors,
		filters: { startDate, endDate, category, period }
	};
};
