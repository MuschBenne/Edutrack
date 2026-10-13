export type User = {
	id: number;
	googleId: string;
	username: string;
	email: string;
	universityId: number;
	programme: string;
	isAdmin: boolean;
};

export type NewUser = Omit<User, 'id'>;

export type UserRow = {
	id: number;
	google_id: string;
	username: string;
	email: string;
	university_id: number;
	programme: string;
	is_admin: number;
};

export const USER_COLUMNS = 'id, google_id, username, email, university_id, programme, is_admin';

export function toUser(row: UserRow): User {
	return {
		id: row.id,
		googleId: row.google_id,
		username: row.username,
		email: row.email,
		universityId: row.university_id,
		programme: row.programme,
		isAdmin: row.is_admin === 1,
	};
}

export async function getById(db: D1Database, id: number): Promise<User | null> {
	const row = await db.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`).bind(id).first<UserRow>();
	return row ? toUser(row) : null;
}

export async function getByUsername(db: D1Database, username: string): Promise<User | null> {
	const row = await db.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE username = ?`).bind(username).first<UserRow>();
	return row ? toUser(row) : null;
}

export async function getByGoogleId(db: D1Database, googleId: string): Promise<User | null> {
	const row = await db.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE google_id = ?`).bind(googleId).first<UserRow>();
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
			`INSERT INTO users (google_id, username, email, university_id, programme, is_admin)
			 VALUES (?, ?, ?, ?, ?, ?)
			 ON CONFLICT DO NOTHING
			 RETURNING ${USER_COLUMNS}`,
		)
		.bind(user.googleId, user.username, user.email, user.universityId, user.programme, user.isAdmin ? 1 : 0)
		.first<UserRow>();
	return row ? toUser(row) : null;
}

/**
 * Tar bort en användare. Registreringar, studiesessioner och inloggningar försvinner via ON DELETE CASCADE.
 * @returns true om användaren fanns.
 */
export async function remove(db: D1Database, id: number): Promise<boolean> {
	const { meta } = await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
	return meta.changes > 0;
}

/** Program per lärosäte, vanligaste först. Förslag i onboarding så att alla skriver samma namn. */
export async function programmesByUniversity(db: D1Database): Promise<Record<number, string[]>> {
	const { results } = await db
		.prepare(
			`SELECT university_id, programme FROM users
			 GROUP BY university_id, programme
			 ORDER BY university_id, COUNT(*) DESC, programme`,
		)
		.all<{ university_id: number; programme: string }>();
	const map: Record<number, string[]> = {};
	for (const r of results) (map[r.university_id] ??= []).push(r.programme);
	return map;
}
