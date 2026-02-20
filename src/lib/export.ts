// attendance data export — CSV + JSON, with optional notes

import type { NormalizedRecord } from './types';
import { CATEGORY_META, type CategoryId } from './categories';

function escapeCsv(val: string): string {
	if (val.includes(',') || val.includes('"') || val.includes('\n')) {
		return `"${val.replace(/"/g, '""')}"`;
	}
	return val;
}

export function toCSV(records: NormalizedRecord[], notes: Record<string, string> = {}): string {
	const headers = ['Date', 'Period', 'Category', 'Time', 'Raw Status', 'Note'];
	const rows = records.map(r => [
		r.date,
		r.period ?? '',
		CATEGORY_META[r.category as CategoryId]?.label ?? r.category,
		r.time ?? '',
		r.rawStatus,
		notes[r.date] ?? ''
	].map(escapeCsv).join(','));

	return [headers.join(','), ...rows].join('\n');
}

export function toJSON(records: NormalizedRecord[], notes: Record<string, string> = {}): string {
	const data = records.map(r => ({
		date: r.date,
		category: r.category,
		period: r.period,
		time: r.time,
		rawStatus: r.rawStatus,
		...(notes[r.date] ? { note: notes[r.date] } : {})
	}));
	return JSON.stringify(data, null, 2);
}

export function downloadBlob(content: string, filename: string, mime: string) {
	const blob = new Blob([content], { type: mime });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

// build a date-range filename prefix from records
export function dateRangeSlug(records: NormalizedRecord[]): string {
	if (records.length === 0) return 'attendance';
	const dates = records.map(r => r.date).sort();
	return `attendance-${dates[0]}-to-${dates[dates.length - 1]}`;
}
