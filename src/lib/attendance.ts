// day-level grouping for attendance records
// multiple period-events per date → one "day" with the worst category

import { resolveCategory, type CategoryId } from './categories';
import type { AttendanceRecord, NormalizedRecord } from './types';

// priority order — worst wins
export const SEVERITY: CategoryId[] = ['absent', 'tardy', 'excused', 'other', 'present'];

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

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December'];

type MonthStats = { key: string; label: string; present: number; absent: number; tardy: number; excused: number; other: number; total: number };

// aggregate days into monthly buckets (sorted chronologically)
export function monthlyStats(days: DayGroup[]): MonthStats[] {
	const byMonth = new Map<string, MonthStats>();
	for (const d of days) {
		const key = d.date.slice(0, 7);
		if (!byMonth.has(key)) {
			const [y, m] = key.split('-').map(Number);
			byMonth.set(key, { key, label: `${MONTH_NAMES[m - 1]} ${y}`, present: 0, absent: 0, tardy: 0, excused: 0, other: 0, total: 0 });
		}
		const entry = byMonth.get(key)!;
		entry.total++;
		entry[d.category]++;
	}
	return [...byMonth.values()].sort((a, b) => a.key.localeCompare(b.key));
}

// generate a handful of noteworthy observations from the data
export function computeInsights(days: DayGroup[]): string[] {
	if (days.length === 0) return [];
	const stats = monthlyStats(days);
	const insights: string[] = [];

	// month with most absences
	const mostAbsent = stats.reduce((best, s) => s.absent > best.absent ? s : best, stats[0]);
	if (mostAbsent.absent > 0) {
		insights.push(`Most absences in ${mostAbsent.label.split(' ')[0]} (${mostAbsent.absent} day${mostAbsent.absent > 1 ? 's' : ''})`);
	}

	// month with 100% present
	const perfectMonths = stats.filter(s => s.present === s.total && s.total > 0);
	if (perfectMonths.length > 0 && perfectMonths.length <= 3) {
		const names = perfectMonths.map(m => m.label.split(' ')[0]);
		insights.push(`100% present in ${names.join(', ')}`);
	} else if (perfectMonths.length > 3) {
		insights.push(`${perfectMonths.length} months with perfect attendance`);
	}

	// category that hasn't appeared recently
	const recent = stats.slice(-3);
	for (const cat of ['tardy', 'absent'] as const) {
		if (recent.every(s => s[cat] === 0) && stats.some(s => s[cat] > 0)) {
			const last = [...stats].reverse().find(s => s[cat] > 0);
			if (last) insights.push(`No ${cat === 'tardy' ? 'tardies' : 'absences'} since ${last.label.split(' ')[0]}`);
		}
	}

	// month with most tardies
	const mostTardy = stats.reduce((best, s) => s.tardy > best.tardy ? s : best, stats[0]);
	if (mostTardy.tardy > 2 && insights.length < 4) {
		insights.push(`Most tardies in ${mostTardy.label.split(' ')[0]} (${mostTardy.tardy})`);
	}

	return insights.slice(0, 4);
}
