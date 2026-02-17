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

	// already terminal locally — return cached status
	if (order.status === 'complete' || order.status === 'partial' || order.status === 'failed' || order.status === 'failed_auth' || order.status === 'timed_out' || order.status === 'canceled') {
		return json({
			status: order.status,
			progress: isSuccess(order.status) ? 1 : order.progress,
			error: order.error
		});
	}

	// poll the scraper for live status
	try {
		const result = await getStatus(order.scraperUid);

		// sync scraper state to local DB — but DON'T mark success statuses
		// locally. only the download route can transition to 'complete' (after
		// data is actually stored), preventing the stuck-complete-no-data bug.
		if (isSuccess(result.status)) {
			await db.update(scrapeOrders).set({
				progress: result.progress
			}).where(eq(scrapeOrders.id, order.id));
		} else if (isTerminal(result.status)) {
			// failure statuses are safe to persist immediately
			await db.update(scrapeOrders).set({
				status: result.status,
				progress: result.progress,
				error: result.error
			}).where(eq(scrapeOrders.id, order.id));
		} else {
			// in-flight — just update progress
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
