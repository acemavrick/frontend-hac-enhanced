import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { scrapeOrders } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { getStatus, isTerminal, isSuccess } from '$lib/server/scraper/client';
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

	// if already terminal locally, return cached status
	if (order.status === 'complete' || order.status === 'partial' || order.status === 'failed' || order.status === 'failed_auth' || order.status === 'timed_out') {
		return json({
			status: order.status,
			progress: isSuccess(order.status) ? 1 : order.progress,
			error: order.error
		});
	}

	// poll the scraper for live status
	try {
		const result = await getStatus(order.scraperUid);

		// sync scraper status to our DB
		if (isTerminal(result.status)) {
			await db.update(scrapeOrders).set({
				status: result.status,
				progress: result.progress,
				error: result.error
			}).where(eq(scrapeOrders.id, order.id));
		} else {
			// just update progress for in-flight statuses
			await db.update(scrapeOrders).set({
				status: result.status,
				progress: result.progress
			}).where(eq(scrapeOrders.id, order.id));
		}

		return json({
			status: result.status,
			progress: result.progress,
			error: result.error
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Unknown error';
		await db.update(scrapeOrders).set({
			status: 'failed',
			error: msg
		}).where(eq(scrapeOrders.id, order.id));
		return json({ status: 'failed', error: msg, progress: 0 });
	}
};
