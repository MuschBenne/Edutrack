import type { User } from './users';

type SessionUserRow = {
	id: number;
	google_id: string;
	username: string;
	email: string;
	class: string;
	is_admin: number;
};

/** @param idHash SHA-256 av token i cookien, så att en läckt databas inte ger inloggade sessioner. */
export async function create(db: D1Database, idHash: string, userId: number, expiresAt: number): Promise<void> {
	await db
		.prepare('INSERT INTO auth_sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
		.bind(idHash, userId, expiresAt)
		.run();
}

/** Användaren för en giltig session, eller null om sessionen saknas eller har gått ut. */
export async function getUser(db: D1Database, idHash: string, now: number): Promise<User | null> {
	const row = await db
		.prepare(
			`SELECT u.id, u.google_id, u.username, u.email, u.class, u.is_admin
			 FROM auth_sessions s JOIN users u ON u.id = s.user_id
			 WHERE s.id = ? AND s.expires_at > ?`,
		)
		.bind(idHash, now)
		.first<SessionUserRow>();
	if (!row) return null;
	return {
		id: row.id,
		googleId: row.google_id,
		username: row.username,
		email: row.email,
		class: row.class,
		isAdmin: row.is_admin === 1,
	};
}

export async function remove(db: D1Database, idHash: string): Promise<void> {
	await db.prepare('DELETE FROM auth_sessions WHERE id = ?').bind(idHash).run();
}

/** Tar bort utgångna sessioner och påbörjade registreringar. Körs vid varje inloggning i stället för ett cron-jobb. */
export async function removeExpired(db: D1Database, now: number): Promise<void> {
	await db.batch([
		db.prepare('DELETE FROM auth_sessions WHERE expires_at <= ?').bind(now),
		db.prepare('DELETE FROM pending_signups WHERE expires_at <= ?').bind(now),
	]);
}
