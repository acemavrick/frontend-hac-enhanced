import { getAttendance, getMonthlyStats } from '$lib/server/attendance/queries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { user } = await parent();

	const startDate = url.searchParams.get('start') ?? undefined;
	const endDate = url.searchParams.get('end') ?? undefined;
	const category = url.searchParams.get('category') ?? undefined;

	const [records, stats] = await Promise.all([
		getAttendance({ userId: user.id, startDate, endDate, category }),
		getMonthlyStats(user.id, startDate, endDate)
	]);

	return {
		records,
		stats,
		filters: { startDate, endDate, category }
	};
};
