import { db } from '$lib/server/db';
import { attendanceRecords } from '$lib/server/db/schema';
import { resolveCategory } from '$lib/categories';

// both the db and transaction objects expose .insert(), so we accept either
type DbLike = { insert: typeof db.insert };

// month name → number (1-indexed)
const MONTH_MAP: Record<string, number> = {
	January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
	July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
};

/**
 * normalize raw scraper attendance data and insert into DB.
 *
 * expects: { "MonthName": { month, year, dates: { dayNum: "pd,code[,time]|pd,code[,time]|..." } } }
 * accepts an optional transaction — uses it for inserts if provided, otherwise uses `db` directly.
 */
export async function normalizeAttendance(
	userId: string,
	orderId: string,
	rawAttendance: Record<string, unknown>,
	tx?: DbLike
): Promise<number> {
	const rows: Array<{
		userId: string;
		orderId: string;
		date: string;
		year: number;
		month: number;
		day: number;
		rawStatus: string;
		category: string;
		period: string | null;
		time: string | null;
	}> = [];

	for (const [, monthObj] of Object.entries(rawAttendance)) {
		if (!monthObj || typeof monthObj !== 'object') continue;
		const m = monthObj as Record<string, unknown>;

		const monthName = String(m.month ?? '');
		const yearStr = String(m.year ?? '');
		const dates = m.dates as Record<string, string> | undefined;

		const monthNum = MONTH_MAP[monthName];
		const year = parseInt(yearStr, 10);
		if (!monthNum || !year || !dates) continue;

		for (const [dayStr, eventsRaw] of Object.entries(dates)) {
			const day = parseInt(dayStr, 10);
			if (!day || !eventsRaw) continue;

			const isoDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

			// events are separated by |, each event is period,status[,time]
			const events = eventsRaw.split('|');
			for (const event of events) {
				const parts = event.split(',').map((s) => s.trim());
				if (parts.length < 2) continue;

				const period = parts[0] || null;
				const statusText = parts[1] ?? '';
				// time is anything after the status (e.g. "8:45:00 AM")
				const time = parts.length >= 3 ? parts.slice(2).join(',') : null;

				rows.push({
					userId,
					orderId,
					date: isoDate,
					year,
					month: monthNum,
					day,
					rawStatus: event,
					category: resolveCategory(event, null),
					period,
					time
				});
			}
		}
	}

	if (rows.length === 0) return 0;

	await (tx ?? db).insert(attendanceRecords).values(rows);
	return rows.length;
}
