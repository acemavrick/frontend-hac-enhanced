import { db } from '$lib/server/db';
import { attendanceRecords } from '$lib/server/db/schema';
import { eq, and, gte, lte, desc, sql, count } from 'drizzle-orm';

export type AttendanceFilter = {
	userId: string;
	startDate?: string; // ISO date
	endDate?: string;
	category?: string;
	orderId?: string;
};

export type AttendanceRecord = {
	id: string;
	date: string;
	rawStatus: string;
	category: string;
	period: string | null;
	time: string | null;
	orderId: string;
};

export type MonthlyStats = {
	month: number;
	year: number;
	present: number;
	absent: number;
	tardy: number;
	other: number;
	total: number;
};

// get filtered attendance records
export async function getAttendance(filter: AttendanceFilter): Promise<AttendanceRecord[]> {
	const conditions = [eq(attendanceRecords.userId, filter.userId)];

	if (filter.startDate) conditions.push(gte(attendanceRecords.date, filter.startDate));
	if (filter.endDate) conditions.push(lte(attendanceRecords.date, filter.endDate));
	if (filter.category) conditions.push(eq(attendanceRecords.category, filter.category));
	if (filter.orderId) conditions.push(eq(attendanceRecords.orderId, filter.orderId));

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

// monthly aggregation for charts
export async function getMonthlyStats(userId: string, startDate?: string, endDate?: string): Promise<MonthlyStats[]> {
	const conditions = [eq(attendanceRecords.userId, userId)];
	if (startDate) conditions.push(gte(attendanceRecords.date, startDate));
	if (endDate) conditions.push(lte(attendanceRecords.date, endDate));

	const rows = await db
		.select({
			year: attendanceRecords.year,
			month: attendanceRecords.month,
			category: attendanceRecords.category,
			cnt: count()
		})
		.from(attendanceRecords)
		.where(and(...conditions))
		.groupBy(attendanceRecords.year, attendanceRecords.month, attendanceRecords.category);

	// pivot into MonthlyStats objects
	const map = new Map<string, MonthlyStats>();

	for (const row of rows) {
		const key = `${row.year}-${row.month}`;
		if (!map.has(key)) {
			map.set(key, { year: row.year, month: row.month, present: 0, absent: 0, tardy: 0, other: 0, total: 0 });
		}
		const entry = map.get(key)!;
		const cat = row.category as keyof Pick<MonthlyStats, 'present' | 'absent' | 'tardy' | 'other'>;
		if (cat in entry) entry[cat] = row.cnt;
		entry.total += row.cnt;
	}

	return [...map.values()].sort((a, b) => a.year - b.year || a.month - b.month);
}

// compare attendance between two scrape orders
export async function compareOrders(
	userId: string,
	orderIdA: string,
	orderIdB: string
): Promise<{ added: AttendanceRecord[]; removed: AttendanceRecord[]; changed: Array<{ date: string; before: string; after: string }> }> {
	const [recordsA, recordsB] = await Promise.all([
		getAttendance({ userId, orderId: orderIdA }),
		getAttendance({ userId, orderId: orderIdB })
	]);

	const mapA = new Map(recordsA.map((r) => [r.date, r]));
	const mapB = new Map(recordsB.map((r) => [r.date, r]));

	const added: AttendanceRecord[] = [];
	const removed: AttendanceRecord[] = [];
	const changed: Array<{ date: string; before: string; after: string }> = [];

	for (const [date, rec] of mapB) {
		const old = mapA.get(date);
		if (!old) {
			added.push(rec);
		} else if (old.category !== rec.category) {
			changed.push({ date, before: old.category, after: rec.category });
		}
	}

	for (const [date, rec] of mapA) {
		if (!mapB.has(date)) removed.push(rec);
	}

	return { added, removed, changed };
}
