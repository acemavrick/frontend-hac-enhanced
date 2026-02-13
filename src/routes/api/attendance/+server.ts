import { json, error } from '@sveltejs/kit';
import { getAttendance, getMonthlyStats } from '$lib/server/attendance/queries';
import type { RequestHandler } from './$types';

// GET /api/attendance?start=...&end=...&category=...
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) error(401, 'Not authenticated');

	const startDate = url.searchParams.get('start') ?? undefined;
	const endDate = url.searchParams.get('end') ?? undefined;
	const category = url.searchParams.get('category') ?? undefined;
	const statsOnly = url.searchParams.get('stats') === '1';

	if (statsOnly) {
		const stats = await getMonthlyStats(locals.user.id, startDate, endDate);
		return json({ stats });
	}

	const records = await getAttendance({
		userId: locals.user.id,
		startDate,
		endDate,
		category
	});

	return json({ records });
};
