import { db } from '$lib/server/db';
import { scrapeOrders } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	const orders = await db
		.select()
		.from(scrapeOrders)
		.where(eq(scrapeOrders.userId, user.id))
		.orderBy(desc(scrapeOrders.createdAt));

	return {
		orders: orders.map((o) => ({
			id: o.id,
			source: o.source,
			tasks: JSON.parse(o.tasks) as string[],
			status: o.status,
			progress: o.progress,
			error: o.error,
			createdAt: o.createdAt?.getTime() ?? 0,
			completedAt: o.completedAt?.getTime() ?? null
		}))
	};
};
