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

/**
 * Sätter eller tar bort (null) elevens slutbetyg. Att betyget finns på kursens skala kontrolleras av anroparen.
 * @returns false om användaren inte är registrerad på kursen.
 */
export async function setFinalGrade(db: D1Database, userId: number, courseId: number, grade: string | null): Promise<boolean> {
	const { meta } = await db
		.prepare('UPDATE enrollments SET final_grade = ? WHERE user_id = ? AND course_id = ?')
		.bind(grade, userId, courseId)
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
