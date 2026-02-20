import { json, error, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { scrapeOrders, attendanceRecords } from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { parseScraperJson } from '$lib/server/import/parser';

// POST /api/import — preview or confirm an attendance import
export const POST: RequestHandler = async ({ locals, request, url }) => {
	if (!locals.user) error(401, 'Not authenticated');

	const confirm = url.searchParams.get('confirm') === 'true';
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}

	const result = parseScraperJson(body);

	if (!confirm) {
		// preview — also detect duplicates against existing records
		const dates = [...new Set(result.records.map(r => r.date))];
		let duplicateCount = 0;

		if (dates.length > 0) {
			// find the user's latest completed order to check for overlap
			const [latestOrder] = await db
				.select({ id: scrapeOrders.id })
				.from(scrapeOrders)
				.where(and(
					eq(scrapeOrders.userId, locals.user.id),
					inArray(scrapeOrders.status, ['complete', 'partial'])
				))
				.orderBy(scrapeOrders.completedAt)
				.limit(1);

			if (latestOrder) {
				// count how many import records match existing date+period combos
				const existing = await db
					.select({ date: attendanceRecords.date, period: attendanceRecords.period })
					.from(attendanceRecords)
					.where(and(
						eq(attendanceRecords.userId, locals.user.id),
						eq(attendanceRecords.orderId, latestOrder.id)
					));

				const existingKeys = new Set(existing.map(r => `${r.date}|${r.period ?? ''}`));
				for (const r of result.records) {
					if (existingKeys.has(`${r.date}|${r.period ?? ''}`)) {
						duplicateCount++;
					}
				}
			}
		}

		return json({
			preview: true,
			totalRecords: result.records.length,
			duplicates: duplicateCount,
			dropped: result.dropped,
			warnings: result.warnings,
			// send a small sample for the preview table
			sample: result.records.slice(0, 20).map(r => ({
				date: r.date, category: r.category, period: r.period, time: r.time
			}))
		});
	}

	// confirm — create order + insert records
	if (result.records.length === 0) {
		error(400, 'No records to import');
	}

	const userId = locals.user.id;
	let recordCount = 0;

	await db.transaction(async (tx) => {
		const [order] = await tx.insert(scrapeOrders).values({
			userId,
			source: 'import',
			tasks: JSON.stringify(['attendance']),
			status: 'complete',
			progress: 1,
			completedAt: new Date()
		}).returning({ id: scrapeOrders.id });

		const rows = result.records.map(r => ({
			userId,
			orderId: order.id,
			date: r.date,
			year: r.year,
			month: r.month,
			day: r.day,
			rawStatus: r.rawStatus,
			category: r.category,
			period: r.period,
			time: r.time
		}));

		await tx.insert(attendanceRecords).values(rows);
		recordCount = rows.length;
	});

	return json({
		preview: false,
		imported: recordCount,
		warnings: result.warnings
	});
};
