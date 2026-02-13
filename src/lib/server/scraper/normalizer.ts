import { db } from '$lib/server/db';
import { attendanceRecords } from '$lib/server/db/schema';

type AttendanceCategory = 'present' | 'absent' | 'tardy' | 'other';

type ParsedRecord = {
	date: string;
	rawStatus: string;
	category: AttendanceCategory;
	period: string | null;
	time: string | null;
};

/**
 * parse a raw HAC attendance status string into structured data.
 *
 * !! PLACEHOLDER — fill in with real parsing logic once scraper
 * output format is finalized. the scraper returns month-keyed
 * objects with comma-delimited strings like "2,Tardy,8:45:00 AM".
 *
 * for now, does a best-effort naive classification.
 */
function parseRawStatus(rawStatus: string): { category: AttendanceCategory; period: string | null; time: string | null } {
	const lower = rawStatus.toLowerCase();

	// try to split comma-delimited format: "period,status,time"
	const parts = rawStatus.split(',').map((s) => s.trim());

	let period: string | null = null;
	let time: string | null = null;
	let category: AttendanceCategory = 'other';

	if (parts.length >= 2) {
		period = parts[0] || null;
		const statusPart = parts[1]?.toLowerCase() ?? '';

		if (statusPart.includes('tardy')) category = 'tardy';
		else if (statusPart.includes('absent')) category = 'absent';
		else if (statusPart.includes('present')) category = 'present';

		if (parts[2]) time = parts[2];
	} else {
		// fallback: single string classification
		if (lower.includes('tardy')) category = 'tardy';
		else if (lower.includes('absent')) category = 'absent';
		else if (lower.includes('present')) category = 'present';
	}

	return { category, period, time };
}

/**
 * normalize raw scraper attendance data and insert into DB.
 *
 * expects the attendance portion of the scraper response — typically
 * an object keyed by month names, each containing day entries.
 * the exact shape depends on the scraper; adapt parseMonthData() as needed.
 */
export async function normalizeAttendance(
	userId: string,
	orderId: string,
	rawAttendance: Record<string, unknown>
): Promise<number> {
	const records: ParsedRecord[] = [];

	// iterate month keys (e.g. "January 2026", "February 2026")
	for (const [monthKey, entries] of Object.entries(rawAttendance)) {
		if (!Array.isArray(entries)) continue;

		for (const entry of entries) {
			if (typeof entry !== 'object' || !entry) continue;
			const e = entry as Record<string, unknown>;

			// expect { date: "2026-01-15", status: "2,Tardy,8:45:00 AM" }
			// adapt field names based on actual scraper output
			const date = String(e.date ?? e.Date ?? '');
			const status = String(e.status ?? e.Status ?? e.rawStatus ?? '');

			if (!date || !status) continue;

			const parsed = parseRawStatus(status);
			records.push({ date, rawStatus: status, ...parsed });
		}
	}

	if (records.length === 0) return 0;

	// batch insert
	const rows = records.map((r) => {
		const [y, m, d] = r.date.split('-').map(Number);
		return {
			userId,
			orderId,
			date: r.date,
			year: y,
			month: m,
			day: d,
			rawStatus: r.rawStatus,
			category: r.category,
			period: r.period,
			time: r.time
		};
	});

	await db.insert(attendanceRecords).values(rows);
	return rows.length;
}
