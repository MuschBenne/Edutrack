export type University = { id: number; name: string };

export async function list(db: D1Database): Promise<University[]> {
	const { results } = await db.prepare('SELECT id, name FROM universities').all<University>();
	// SQLite sorterar Å, Ä, Ö i fel ordning, så sortera med svensk ordning här
	return results.sort((a, b) => a.name.localeCompare(b.name, 'sv'));
}

export async function get(db: D1Database, id: number): Promise<University | null> {
	return db.prepare('SELECT id, name FROM universities WHERE id = ?').bind(id).first<University>();
}

/** @returns false om namnet redan finns. */
export async function create(db: D1Database, name: string): Promise<boolean> {
	const { meta } = await db.prepare('INSERT INTO universities (name) VALUES (?) ON CONFLICT DO NOTHING').bind(name).run();
	return meta.changes > 0;
}
