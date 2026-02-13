import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { scrapeOrders, attendanceRecords } from '$lib/server/db/schema';
import { eq, and, count } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, params }) => {
	const { user } = await parent();

	const [order] = await db
		.select()
		.from(scrapeOrders)
		.where(and(eq(scrapeOrders.id, params.id), eq(scrapeOrders.userId, user.id)))
		.limit(1);

	if (!order) error(404, 'Order not found');

	// count attendance records from this order
	const [{ total }] = await db
		.select({ total: count() })
		.from(attendanceRecords)
		.where(eq(attendanceRecords.orderId, order.id));

	return {
		order: {
			id: order.id,
			scraperUid: order.scraperUid,
			tasks: JSON.parse(order.tasks) as string[],
			status: order.status,
			progress: order.progress,
			error: order.error,
			createdAt: order.createdAt?.getTime() ?? 0,
			completedAt: order.completedAt?.getTime() ?? null,
			attendanceCount: total
		}
	};
};
