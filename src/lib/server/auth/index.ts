import { db } from '$lib/server/db';
import { sessions, users } from '$lib/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import type { Cookies } from '@sveltejs/kit';

const SESSION_COOKIE = 'session_id';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type SessionUser = {
	id: string;
	username: string;
	hacUsername: string | null;
};

export async function createSession(userId: string, cookies: Cookies): Promise<string> {
	const sessionId = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

	await db.insert(sessions).values({
		id: sessionId,
		userId,
		expiresAt
	});

	cookies.set(SESSION_COOKIE, sessionId, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: false, // localhost dev — flip in prod
		maxAge: SESSION_DURATION_MS / 1000
	});

	return sessionId;
}

export async function validateSession(cookies: Cookies): Promise<SessionUser | null> {
	const sessionId = cookies.get(SESSION_COOKIE);
	if (!sessionId) return null;

	const result = await db
		.select({
			sessionId: sessions.id,
			expiresAt: sessions.expiresAt,
			userId: users.id,
			username: users.username,
			hacUsername: users.hacUsername
		})
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
		.limit(1);

	if (result.length === 0) {
		// stale cookie — clean up
		cookies.delete(SESSION_COOKIE, { path: '/' });
		return null;
	}

	return {
		id: result[0].userId,
		username: result[0].username,
		hacUsername: result[0].hacUsername
	};
}

export async function deleteSession(cookies: Cookies): Promise<void> {
	const sessionId = cookies.get(SESSION_COOKIE);
	if (sessionId) {
		await db.delete(sessions).where(eq(sessions.id, sessionId));
	}
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

// whether any users exist (for first-time setup detection)
export async function needsSetup(): Promise<boolean> {
	const result = await db.select({ id: users.id }).from(users).limit(1);
	return result.length === 0;
}
