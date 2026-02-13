import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { scrapeOrders, users } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { downloadResult } from '$lib/server/scraper/client';
import { normalizeAttendance } from '$lib/server/scraper/normalizer';
import type { RequestHandler } from './$types';

// GET /api/scrape/[uid]/download — fetch result from scraper, normalize, store
export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) error(401, 'Not authenticated');

	const [order] = await db
		.select()
		.from(scrapeOrders)
		.where(and(eq(scrapeOrders.id, params.uid), eq(scrapeOrders.userId, locals.user.id)))
		.limit(1);

	if (!order) error(404, 'Order not found');

	// get HAC username for the download endpoint
	const [user] = await db.select().from(users).where(eq(users.id, locals.user.id)).limit(1);
	if (!user?.hacUsername) error(400, 'HAC username not set');

	try {
		const raw = await downloadResult(user.hacUsername, order.scraperUid);

		// store raw response
		await db
			.update(scrapeOrders)
			.set({
				rawResponse: JSON.stringify(raw),
				status: 'done',
				progress: 1,
				completedAt: new Date()
			})
			.where(eq(scrapeOrders.id, order.id));

		// normalize attendance data if present
		let attendanceCount = 0;
		const data = raw as Record<string, unknown>;
		if (data.attendance && typeof data.attendance === 'object') {
			attendanceCount = await normalizeAttendance(
				locals.user.id,
				order.id,
				data.attendance as Record<string, unknown>
			);
		}

		return json({
			status: 'done',
			attendanceRecords: attendanceCount,
			raw
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Download failed';
		await db
			.update(scrapeOrders)
			.set({ status: 'error', error: msg })
			.where(eq(scrapeOrders.id, order.id));
		error(500, msg);
	}
};
