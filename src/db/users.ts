export type User = {
	id: number;
	googleId: string;
	username: string;
	email: string;
	class: string;
	isAdmin: boolean;
};

export type NewUser = Omit<User, 'id'>;

type UserRow = {
	id: number;
	google_id: string;
	username: string;
	email: string;
	class: string;
	is_admin: number;
};

const COLUMNS = 'id, google_id, username, email, class, is_admin';

function toUser(row: UserRow): User {
	return {
		id: row.id,
		googleId: row.google_id,
		username: row.username,
		email: row.email,
		class: row.class,
		isAdmin: row.is_admin === 1,
	};
}

export async function getById(db: D1Database, id: number): Promise<User | null> {
	const row = await db.prepare(`SELECT ${COLUMNS} FROM users WHERE id = ?`).bind(id).first<UserRow>();
	return row ? toUser(row) : null;
}

export async function getByGoogleId(db: D1Database, googleId: string): Promise<User | null> {
	const row = await db.prepare(`SELECT ${COLUMNS} FROM users WHERE google_id = ?`).bind(googleId).first<UserRow>();
	return row ? toUser(row) : null;
}

/**
 * Skapar en användare.
 * @returns Den nya användaren, eller null om Google-id, användarnamn eller e-post redan finns.
 */
export async function create(db: D1Database, user: NewUser): Promise<User | null> {
	// ON CONFLICT DO NOTHING utan mål gäller alla UNIQUE-kolumner; RETURNING ger då ingen rad
	const row = await db
		.prepare(
			`INSERT INTO users (google_id, username, email, class, is_admin)
			 VALUES (?, ?, ?, ?, ?)
			 ON CONFLICT DO NOTHING
			 RETURNING ${COLUMNS}`,
		)
		.bind(user.googleId, user.username, user.email, user.class, user.isAdmin ? 1 : 0)
		.first<UserRow>();
	return row ? toUser(row) : null;
}

export async function list(db: D1Database): Promise<User[]> {
	const { results } = await db.prepare(`SELECT ${COLUMNS} FROM users ORDER BY username`).all<UserRow>();
	return results.map(toUser);
}

/**
 * Tar bort en användare. Registreringar, studiesessioner och inloggningar försvinner via ON DELETE CASCADE.
 * @returns true om användaren fanns.
 */
export async function remove(db: D1Database, id: number): Promise<boolean> {
	const { meta } = await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
	return meta.changes > 0;
}
