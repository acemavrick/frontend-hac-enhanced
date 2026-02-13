import { json, error } from '@sveltejs/kit';
import { compareOrders } from '$lib/server/attendance/queries';
import type { RequestHandler } from './$types';

// GET /api/attendance/compare?a=orderId&b=orderId
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) error(401, 'Not authenticated');

	const orderA = url.searchParams.get('a');
	const orderB = url.searchParams.get('b');

	if (!orderA || !orderB) error(400, 'Both order IDs (a, b) are required');

	const diff = await compareOrders(locals.user.id, orderA, orderB);
	return json(diff);
};
