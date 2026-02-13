import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, scrapeOrders } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from '$lib/server/auth/crypto';
import { submitOrder } from '$lib/server/scraper/client';
import type { RequestHandler } from './$types';

// POST /api/scrape — submit a new scrape order
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) error(401, 'Not authenticated');

	const body = await request.json();
	const tasks: string[] = body.tasks ?? ['attendance'];

	// get HAC credentials from DB
	const [user] = await db.select().from(users).where(eq(users.id, locals.user.id)).limit(1);
	if (!user?.hacUsername || !user?.hacPasswordEncrypted || !user?.hacPasswordIv) {
		error(400, 'HAC credentials not configured — go to Settings');
	}

	const hacPassword = decrypt(user.hacPasswordEncrypted, user.hacPasswordIv);

	// submit to scraper API
	const result = await submitOrder(user.hacUsername, hacPassword, tasks);

	// track in our DB
	const order = {
		userId: locals.user.id,
		scraperUid: result.uid,
		tasks: JSON.stringify(tasks),
		status: 'processing'
	};

	const [inserted] = await db.insert(scrapeOrders).values(order).returning();

	return json({ id: inserted.id, scraperUid: result.uid, status: 'processing' });
};
