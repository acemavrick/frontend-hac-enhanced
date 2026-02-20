// built-in attendance categories and default HAC code mappings

export const CATEGORY_IDS = ['present', 'absent', 'tardy', 'excused', 'other'] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

// sensible defaults — user can override via settings
export const DEFAULT_CATEGORY_MAP: Record<string, CategoryId> = {
	'present': 'present',
	'no contact': 'absent',
	'unexcused': 'absent',
	'funding only absence': 'absent',
	'tardy': 'tardy',
	'after tardy': 'tardy',
	'college day': 'excused',
	'excused parental consent': 'excused',
	'doctors return': 'excused',
	'excused': 'excused'
};

// label + tailwind classes for each category
export const CATEGORY_META: Record<CategoryId, { label: string; badge: string; calendar: string; chart: string }> = {
	present: {
		label: 'Present',
		badge: 'bg-green-900/30 text-green-400',
		calendar: 'bg-green-900/30 text-green-400 border-green-800',
		chart: 'bg-green-400'
	},
	absent: {
		label: 'Absent',
		badge: 'bg-red-900/30 text-red-400',
		calendar: 'bg-red-900/30 text-red-400 border-red-800',
		chart: 'bg-red-400'
	},
	tardy: {
		label: 'Tardy',
		badge: 'bg-yellow-900/30 text-yellow-400',
		calendar: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
		chart: 'bg-yellow-400'
	},
	excused: {
		label: 'Excused',
		badge: 'bg-blue-900/30 text-blue-400',
		calendar: 'bg-blue-900/30 text-blue-400 border-blue-800',
		chart: 'bg-blue-400'
	},
	other: {
		label: 'Other',
		badge: 'bg-surface-overlay text-text-muted',
		calendar: 'bg-surface-overlay text-text-muted border-border',
		chart: 'bg-surface-overlay'
	}
};

// default hex colors per category — tuned for dark backgrounds
export const DEFAULT_COLORS: Record<CategoryId, string> = {
	present: '#34d399',
	absent: '#f87171',
	tardy: '#facc15',
	excused: '#60a5fa',
	other: '#9ca3af'
};

// derive inline CSS styles from a hex color
export function categoryStyles(hex: string): {
	bg: string; text: string; border: string; solid: string;
} {
	return {
		bg: `${hex}20`,        // ~12% opacity — visible on dark
		text: hex,
		border: `${hex}40`,    // ~25% opacity
		solid: hex
	};
}

// extract the status code from a rawStatus like "2,Tardy,8:45:00 AM"
export function extractCode(rawStatus: string): string {
	const parts = rawStatus.split(',').map((s) => s.trim());
	return parts[1]?.toLowerCase() ?? '';
}

// resolve a rawStatus to a category using user map (falls back to defaults, then "other")
export function resolveCategory(
	rawStatus: string,
	userMap: Record<string, string> | null | undefined
): CategoryId {
	const code = extractCode(rawStatus);
	if (!code) return 'other';

	// user overrides first
	if (userMap?.[code]) {
		const cat = userMap[code] as CategoryId;
		if (CATEGORY_IDS.includes(cat)) return cat;
	}

	// then defaults
	if (DEFAULT_CATEGORY_MAP[code]) return DEFAULT_CATEGORY_MAP[code];

	return 'other';
}
