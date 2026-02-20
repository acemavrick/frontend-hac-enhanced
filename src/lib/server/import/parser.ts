// import parser — converts scraper-format JSON to rows ready for insertion

import { resolveCategory } from '$lib/categories';

const MONTH_MAP: Record<string, number> = {
	January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
	July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
};

export type ParsedRow = {
	date: string;
	year: number;
	month: number;
	day: number;
	rawStatus: string;
	category: string;
	period: string | null;
	time: string | null;
};

export type DroppedItem = {
	location: string;  // e.g. "January day 5, event 2"
	raw: string;
	reason: string;
};

export type ImportResult = {
	records: ParsedRow[];
	dropped: DroppedItem[];
	warnings: string[];
};

/**
 * parse scraper-format attendance JSON.
 * expects: { "MonthName": { month, year, dates: { dayNum: "pd,code[,time]|..." } } }
 *
 * also handles wrapper formats like { attendance: { ... } } or { tasks: { attendance: { ... } } }
 */
export function parseScraperJson(raw: unknown): ImportResult {
	const records: ParsedRow[] = [];
	const dropped: DroppedItem[] = [];
	const warnings: string[] = [];

	if (!raw || typeof raw !== 'object') {
		warnings.push('Input is not a valid JSON object');
		return { records, dropped, warnings };
	}

	// unwrap common wrappers
	let data = raw as Record<string, unknown>;
	if ('tasks' in data && data.tasks && typeof data.tasks === 'object') {
		const tasks = data.tasks as Record<string, unknown>;
		if ('attendance' in tasks) data = tasks.attendance as Record<string, unknown>;
	} else if ('attendance' in data && data.attendance && typeof data.attendance === 'object') {
		data = data.attendance as Record<string, unknown>;
	}

	let totalMonths = 0;

	for (const [key, monthObj] of Object.entries(data)) {
		if (!monthObj || typeof monthObj !== 'object') continue;
		const m = monthObj as Record<string, unknown>;

		const monthName = String(m.month ?? key);
		const yearStr = String(m.year ?? '');
		const dates = m.dates as Record<string, string> | undefined;

		const monthNum = MONTH_MAP[monthName];
		const year = parseInt(yearStr, 10);

		if (!monthNum) {
			// try to detect if this is a month-like key we don't recognize
			if (dates && typeof dates === 'object') {
				warnings.push(`Skipped unrecognized month "${monthName}"`);
			}
			continue;
		}
		if (!year || year < 2000 || year > 2100) {
			warnings.push(`Skipped ${monthName}: invalid year "${yearStr}"`);
			continue;
		}
		if (!dates || typeof dates !== 'object') {
			warnings.push(`Skipped ${monthName} ${year}: no dates object`);
			continue;
		}

		totalMonths++;

		for (const [dayStr, eventsRaw] of Object.entries(dates)) {
			const day = parseInt(dayStr, 10);
			if (!day || day < 1 || day > 31) {
				dropped.push({ location: `${monthName} day "${dayStr}"`, raw: String(eventsRaw), reason: 'Invalid day number' });
				continue;
			}

			if (!eventsRaw || typeof eventsRaw !== 'string') {
				dropped.push({ location: `${monthName} day ${day}`, raw: String(eventsRaw), reason: 'Empty or non-string events' });
				continue;
			}

			const isoDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
			const events = eventsRaw.split('|');

			for (let ei = 0; ei < events.length; ei++) {
				const event = events[ei].trim();
				if (!event) continue;

				const parts = event.split(',').map(s => s.trim());
				if (parts.length < 2) {
					dropped.push({
						location: `${monthName} day ${day}, event ${ei + 1}`,
						raw: event,
						reason: 'Less than 2 comma-separated parts'
					});
					continue;
				}

				const period = parts[0] || null;
				const time = parts.length >= 3 ? parts.slice(2).join(',') : null;

				records.push({
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

	if (totalMonths === 0) {
		warnings.push('No valid month data found in the input');
	}

	return { records, dropped, warnings };
}
