// day-level grouping for attendance records
// multiple period-events per date → one "day" with the worst category

import { resolveCategory, type CategoryId } from './categories';
import type { AttendanceRecord, NormalizedRecord } from './types';

// priority order — worst wins
const SEVERITY: CategoryId[] = ['absent', 'tardy', 'excused', 'other', 'present'];

export type DayGroup = {
	date: string;
	category: CategoryId;
	records: NormalizedRecord[];
};

// resolve raw DB records into NormalizedRecords using the user's category map.
// called once in the page loader so components don't need the map.
export function normalizeRecords(
	records: AttendanceRecord[],
	categoryMap: Record<string, string>
): NormalizedRecord[] {
	return records.map((r) => ({
		...r,
		category: resolveCategory(r.rawStatus, categoryMap)
	}));
}

// group records by date and assign each day the worst category
export function groupByDay(records: NormalizedRecord[]): DayGroup[] {
	const byDate = new Map<string, NormalizedRecord[]>();
	for (const r of records) {
		const arr = byDate.get(r.date);
		if (arr) arr.push(r);
		else byDate.set(r.date, [r]);
	}

	const days: DayGroup[] = [];
	for (const [date, recs] of byDate) {
		const cats = recs.map((r) => r.category);
		// pick worst (lowest index in SEVERITY)
		let worst: CategoryId = 'present';
		let worstIdx = SEVERITY.length;
		for (const c of cats) {
			const idx = SEVERITY.indexOf(c);
			if (idx < worstIdx) {
				worstIdx = idx;
				worst = c;
			}
		}
		days.push({ date, category: worst, records: recs });
	}

	// sort descending by date (matches query order)
	return days.sort((a, b) => (a.date > b.date ? -1 : 1));
}

// count days by category
export function daySummary(days: DayGroup[]) {
	const counts = { total: days.length, present: 0, absent: 0, tardy: 0, excused: 0, other: 0 };
	for (const d of days) {
		counts[d.category]++;
	}
	return counts;
}
