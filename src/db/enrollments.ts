import { qualify } from './sql';
import { COURSE_COLUMNS, type Course, type CourseRow, toCourse } from './courses';

/**
 * Registrerar en användare på en kurs vid användarens eget lärosäte.
 * @returns false om kursen inte finns, hör till ett annat lärosäte eller användaren redan är registrerad.
 */
export async function enroll(db: D1Database, userId: number, courseId: number): Promise<boolean> {
	// SELECT med villkor på lärosätet gör att fel kurs ger 0 rader i stället för ett fel
	const { meta } = await db
		.prepare(
			`INSERT INTO enrollments (user_id, course_id)
			 SELECT u.id, c.id FROM users u JOIN courses c ON c.university_id = u.university_id
			 WHERE u.id = ? AND c.id = ?
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
export async function unenroll(db: D1Database, userId: number, courseId: number): Promise<boolean> {
	const { meta } = await db
		.prepare('DELETE FROM enrollments WHERE user_id = ? AND course_id = ?')
		.bind(userId, courseId)
		.run();
	return meta.changes > 0;
}

export async function isEnrolled(db: D1Database, userId: number, courseId: number): Promise<boolean> {
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
			`SELECT ${qualify(COURSE_COLUMNS, 'c')} FROM enrollments e
			 JOIN courses c ON c.id = e.course_id
			 WHERE e.user_id = ?
			 ORDER BY c.name`,
		)
		.bind(userId)
		.all<CourseRow>();
	return results.map(toCourse);
}

/** Användarnamn för alla elever på en kurs. */
export async function studentsIn(db: D1Database, courseId: number): Promise<string[]> {
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
