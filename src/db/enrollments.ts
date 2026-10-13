import { type Course, toCourse } from './courses';

/**
 * Registrerar en användare på en kurs.
 * @returns false om kursen inte finns eller användaren redan är registrerad.
 */
export async function enroll(db: D1Database, userId: number, courseId: string): Promise<boolean> {
	// SELECT från courses gör att en okänd kurs ger 0 rader i stället för ett FOREIGN KEY-fel
	const { meta } = await db
		.prepare(
			`INSERT INTO enrollments (user_id, course_id)
			 SELECT ?, course_id FROM courses WHERE course_id = ?
			 ON CONFLICT DO NOTHING`,
		)
		.bind(userId, courseId)
		.run();
	return meta.changes > 0;
}

/**
 * Avregistrerar en användare. Användarens sessioner i kursen försvinner via ON DELETE CASCADE.
 * @returns true om registreringen fanns.
 */
export async function unenroll(db: D1Database, userId: number, courseId: string): Promise<boolean> {
	const { meta } = await db
		.prepare('DELETE FROM enrollments WHERE user_id = ? AND course_id = ?')
		.bind(userId, courseId)
		.run();
	return meta.changes > 0;
}

export async function isEnrolled(db: D1Database, userId: number, courseId: string): Promise<boolean> {
	const row = await db
		.prepare('SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?')
		.bind(userId, courseId)
		.first();
	return row !== null;
}

/** Kurser som användaren är registrerad på. */
export async function coursesFor(db: D1Database, userId: number): Promise<Course[]> {
	const { results } = await db
		.prepare(
			`SELECT c.course_id, c.name FROM enrollments e
			 JOIN courses c ON c.course_id = e.course_id
			 WHERE e.user_id = ?
			 ORDER BY c.name`,
		)
		.bind(userId)
		.all<{ course_id: string; name: string }>();
	return results.map(toCourse);
}

/** Användarnamn för alla elever på en kurs, för admin-vyn. */
export async function studentsIn(db: D1Database, courseId: string): Promise<string[]> {
	const { results } = await db
		.prepare(
			`SELECT u.username FROM enrollments e
			 JOIN users u ON u.id = e.user_id
			 WHERE e.course_id = ?
			 ORDER BY u.username`,
		)
		.bind(courseId)
		.all<{ username: string }>();
	return results.map((r) => r.username);
}
