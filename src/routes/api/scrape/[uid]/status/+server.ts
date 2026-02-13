import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { scrapeOrders } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { getStatus } from '$lib/server/scraper/client';
import type { RequestHandler } from './$types';

// GET /api/scrape/[uid]/status — poll status for an order
export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) error(401, 'Not authenticated');

	const [order] = await db
		.select()
		.from(scrapeOrders)
		.where(and(eq(scrapeOrders.id, params.uid), eq(scrapeOrders.userId, locals.user.id)))
		.limit(1);

	if (!order) error(404, 'Order not found');

	// if already completed/failed locally, return cached status
	if (order.status === 'done' || order.status === 'error') {
		return json({ status: order.status, progress: order.status === 'done' ? 1 : order.progress });
	}

	// poll the scraper
	try {
		const result = await getStatus(order.scraperUid);

		if (result.status === 'done') {
			await db.update(scrapeOrders).set({ status: 'done', progress: 1 }).where(eq(scrapeOrders.id, order.id));
		}

		return json({ status: result.status, progress: result.status === 'done' ? 1 : 0.5 });
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Unknown error';
		await db
			.update(scrapeOrders)
			.set({ status: 'error', error: msg })
			.where(eq(scrapeOrders.id, order.id));
		return json({ status: 'error', error: msg });
	}
};
