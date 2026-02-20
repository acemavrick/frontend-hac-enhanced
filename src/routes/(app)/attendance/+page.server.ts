import { db } from '$lib/server/db';
import { users, attendanceNotes } from '$lib/server/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { getAttendance, getCompletedOrders } from '$lib/server/attendance/queries';
import { normalizeRecords } from '$lib/attendance';
import { DEFAULT_COLORS, type CategoryId } from '$lib/categories';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { user } = await parent();

	const startDate = url.searchParams.get('start') ?? undefined;
	const endDate = url.searchParams.get('end') ?? undefined;
	const category = url.searchParams.get('category') ?? undefined;
	const period = url.searchParams.get('period') ?? undefined;

	// order selection — comma-separated IDs or empty for latest
	const ordersParam = url.searchParams.get('orders');
	const selectedOrderIds = ordersParam ? ordersParam.split(',').filter(Boolean) : [];

	// fetch completed orders first so we can sort selectedOrderIds newest-first
	// (dedup uses array position to decide which order "wins")
	const [userRow, completedOrders] = await Promise.all([
		db.select({ categoryMap: users.categoryMap, categoryColors: users.categoryColors })
			.from(users).where(eq(users.id, user.id)).limit(1),
		getCompletedOrders(user.id)
	]);

	// reorder selected IDs to match completedOrders (newest-first) for dedup
	const orderRank = new Map(completedOrders.map((o, i) => [o.id, i]));
	const sortedOrderIds = [...selectedOrderIds].sort(
		(a, b) => (orderRank.get(a) ?? Infinity) - (orderRank.get(b) ?? Infinity)
	);

	const rawRecords = await getAttendance({
		userId: user.id,
		startDate,
		endDate,
		category,
		period,
		...(sortedOrderIds.length > 0 ? { orderIds: sortedOrderIds } : {})
	});

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

	// load notes for the same date range
	const noteConditions = [eq(attendanceNotes.userId, user.id)];
	if (startDate) noteConditions.push(gte(attendanceNotes.date, startDate));
	if (endDate) noteConditions.push(lte(attendanceNotes.date, endDate));

	const rawNotes = await db.select({ date: attendanceNotes.date, content: attendanceNotes.content })
		.from(attendanceNotes)
		.where(and(...noteConditions));

	const notes: Record<string, string> = {};
	for (const n of rawNotes) notes[n.date] = n.content;

	// serialize completedOrders for the client (Date → epoch ms)
	const serializedOrders = completedOrders.map((o) => ({
		id: o.id,
		source: o.source,
		tasks: o.tasks,
		createdAt: o.createdAt?.getTime() ?? null,
		completedAt: o.completedAt?.getTime() ?? null
	}));

	return {
		records,
		categoryColors,
		notes,
		filters: { startDate, endDate, category, period },
		completedOrders: serializedOrders,
		selectedOrderIds
	};
};
