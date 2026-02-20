import { json, error, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { attendanceNotes } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/attendance/notes — upsert a day note
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) error(401, 'Not authenticated');

	const body = await request.json();
	const date = body.date as string;
	const content = (body.content as string ?? '').trim();

	if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		error(400, 'Invalid date format');
	}

	const userId = locals.user.id;

	if (content === '') {
		// empty content = delete the note
		await db.delete(attendanceNotes)
			.where(and(eq(attendanceNotes.userId, userId), eq(attendanceNotes.date, date)));
		return json({ ok: true, deleted: true });
	}

	// upsert — try update first, insert if not found
	const existing = await db.select({ id: attendanceNotes.id })
		.from(attendanceNotes)
		.where(and(eq(attendanceNotes.userId, userId), eq(attendanceNotes.date, date)))
		.limit(1);

	if (existing.length > 0) {
		await db.update(attendanceNotes)
			.set({ content, updatedAt: new Date() })
			.where(eq(attendanceNotes.id, existing[0].id));
	} else {
		await db.insert(attendanceNotes).values({ userId, date, content });
	}

	return json({ ok: true });
};
