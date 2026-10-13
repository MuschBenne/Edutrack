export type PendingSignup = { googleId: string; email: string };

/** @param idHash SHA-256 av token i cookien. */
export async function create(db: D1Database, idHash: string, signup: PendingSignup, expiresAt: number): Promise<void> {
	await db
		.prepare('INSERT INTO pending_signups (id, google_id, email, expires_at) VALUES (?, ?, ?, ?)')
		.bind(idHash, signup.googleId, signup.email, expiresAt)
		.run();
}

export async function get(db: D1Database, idHash: string, now: number): Promise<PendingSignup | null> {
	const row = await db
		.prepare('SELECT google_id, email FROM pending_signups WHERE id = ? AND expires_at > ?')
		.bind(idHash, now)
		.first<{ google_id: string; email: string }>();
	return row ? { googleId: row.google_id, email: row.email } : null;
}

export async function remove(db: D1Database, idHash: string): Promise<void> {
	await db.prepare('DELETE FROM pending_signups WHERE id = ?').bind(idHash).run();
}
