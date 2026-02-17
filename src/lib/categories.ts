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
		badge: 'bg-green-100 text-green-800',
		calendar: 'bg-green-100 text-green-800 border-green-200',
		chart: 'bg-green-400'
	},
	absent: {
		label: 'Absent',
		badge: 'bg-red-100 text-red-800',
		calendar: 'bg-red-100 text-red-800 border-red-200',
		chart: 'bg-red-400'
	},
	tardy: {
		label: 'Tardy',
		badge: 'bg-yellow-100 text-yellow-800',
		calendar: 'bg-yellow-100 text-yellow-800 border-yellow-200',
		chart: 'bg-yellow-400'
	},
	excused: {
		label: 'Excused',
		badge: 'bg-blue-100 text-blue-800',
		calendar: 'bg-blue-100 text-blue-800 border-blue-200',
		chart: 'bg-blue-400'
	},
	other: {
		label: 'Other',
		badge: 'bg-gray-100 text-gray-600',
		calendar: 'bg-gray-100 text-gray-600 border-gray-200',
		chart: 'bg-gray-400'
	}
};

// default hex colors per category — user can override in settings
export const DEFAULT_COLORS: Record<CategoryId, string> = {
	present: '#22c55e',
	absent: '#ef4444',
	tardy: '#eab308',
	excused: '#3b82f6',
	other: '#6b7280'
};

// derive inline CSS styles from a hex color
export function categoryStyles(hex: string): {
	bg: string; text: string; border: string; solid: string;
} {
	return {
		bg: `${hex}1a`,        // hex + ~10% opacity
		text: hex,
		border: `${hex}33`,    // hex + ~20% opacity
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
