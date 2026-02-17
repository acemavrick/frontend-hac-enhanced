import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { scrapeOrders, users, attendanceRecords } from '$lib/server/db/schema';
import { eq, and, count } from 'drizzle-orm';
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

	// completedAt proves a previous download succeeded — don't re-insert rows
	if (order.completedAt !== null) {
		const [{ total }] = await db
			.select({ total: count() })
			.from(attendanceRecords)
			.where(eq(attendanceRecords.orderId, order.id));
		return json({ status: 'complete', attendanceRecords: total });
	}

	const [user] = await db.select().from(users).where(eq(users.id, locals.user.id)).limit(1);
	if (!user?.hacUsername || !user?.hacPasswordEncrypted || !user?.hacPasswordIv) {
		error(400, 'HAC credentials not set');
	}

	try {
		const { decrypt } = await import('$lib/server/auth/crypto');
		const hacPassword = decrypt(user.hacPasswordEncrypted, user.hacPasswordIv);
		const raw = await downloadResult(user.hacUsername, hacPassword, order.scraperUid);

		// wrap everything in a transaction — if normalization or update fails,
		// order stays 'processing' and can be retried
		let attendanceCount = 0;
		await db.transaction(async (tx) => {
			const data = raw as Record<string, unknown>;
			const tasks = data.tasks as Record<string, unknown> | undefined;
			const attendance = tasks?.attendance ?? data.attendance;

			if (attendance && typeof attendance === 'object') {
				attendanceCount = await normalizeAttendance(
					locals.user!.id,
					order.id,
					attendance as Record<string, unknown>,
					tx
				);
			}

			await tx
				.update(scrapeOrders)
				.set({
					rawResponse: JSON.stringify(raw),
					status: 'complete',
					progress: 1,
					completedAt: new Date()
				})
				.where(eq(scrapeOrders.id, order.id));
		});

		return json({
			status: 'complete',
			attendanceRecords: attendanceCount
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Download failed';
		await db
			.update(scrapeOrders)
			.set({ status: 'failed', error: msg })
			.where(eq(scrapeOrders.id, order.id));
		error(500, msg);
	}
};
