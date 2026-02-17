import { db } from '$lib/server/db';
import { attendanceRecords, scrapeOrders } from '$lib/server/db/schema';
import { eq, and, gte, lte, desc, inArray } from 'drizzle-orm';
import type { AttendanceRecord } from '$lib/types';

export type AttendanceFilter = {
	userId: string;
	startDate?: string; // ISO date
	endDate?: string;
	category?: string;
	orderId?: string;
	period?: string;
};

// find the user's most recent completed scrape order
async function getLatestOrderId(userId: string): Promise<string | null> {
	const [row] = await db
		.select({ id: scrapeOrders.id })
		.from(scrapeOrders)
		.where(
			and(
				eq(scrapeOrders.userId, userId),
				inArray(scrapeOrders.status, ['complete', 'partial'])
			)
		)
		.orderBy(desc(scrapeOrders.completedAt))
		.limit(1);
	return row?.id ?? null;
}

// get filtered attendance records
export async function getAttendance(filter: AttendanceFilter): Promise<AttendanceRecord[]> {
	// default to latest completed order when no specific order requested
	const orderId = filter.orderId ?? (await getLatestOrderId(filter.userId));
	if (!orderId) return []; // no completed orders = no records

	const conditions = [
		eq(attendanceRecords.userId, filter.userId),
		eq(attendanceRecords.orderId, orderId)
	];

	if (filter.startDate) conditions.push(gte(attendanceRecords.date, filter.startDate));
	if (filter.endDate) conditions.push(lte(attendanceRecords.date, filter.endDate));
	if (filter.category) conditions.push(eq(attendanceRecords.category, filter.category));
	if (filter.period) conditions.push(eq(attendanceRecords.period, filter.period));

	const rows = await db
		.select({
			id: attendanceRecords.id,
			date: attendanceRecords.date,
			rawStatus: attendanceRecords.rawStatus,
			category: attendanceRecords.category,
			period: attendanceRecords.period,
			time: attendanceRecords.time,
			orderId: attendanceRecords.orderId
		})
		.from(attendanceRecords)
		.where(and(...conditions))
		.orderBy(desc(attendanceRecords.date));

	return rows;
}

// composite key for comparison — date + period handles multiple records per day
function compKey(r: AttendanceRecord): string {
	return `${r.date}|${r.period ?? ''}`;
}

// compare attendance between two scrape orders
export async function compareOrders(
	userId: string,
	orderIdA: string,
	orderIdB: string
): Promise<{
	added: AttendanceRecord[];
	removed: AttendanceRecord[];
	changed: Array<{ date: string; period: string | null; before: string; after: string }>;
}> {
	const [recordsA, recordsB] = await Promise.all([
		getAttendance({ userId, orderId: orderIdA }),
		getAttendance({ userId, orderId: orderIdB })
	]);

	const mapA = new Map(recordsA.map((r) => [compKey(r), r]));
	const mapB = new Map(recordsB.map((r) => [compKey(r), r]));

	const added: AttendanceRecord[] = [];
	const removed: AttendanceRecord[] = [];
	const changed: Array<{ date: string; period: string | null; before: string; after: string }> = [];

	for (const [key, rec] of mapB) {
		const old = mapA.get(key);
		if (!old) {
			added.push(rec);
		} else if (old.rawStatus !== rec.rawStatus) {
			// compare rawStatus (the actual scraped data) rather than the
			// category column, which is just a default classification
			changed.push({ date: rec.date, period: rec.period, before: old.rawStatus, after: rec.rawStatus });
		}
	}

	for (const [key, rec] of mapA) {
		if (!mapB.has(key)) removed.push(rec);
	}

	return { added, removed, changed };
}
