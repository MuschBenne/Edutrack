export type StudySession = {
	studiedOn: string; // 'YYYY-MM-DD'
	minutes: number;
	type: string;
	rating: number;
	health: number | null; // valfria: hälsodata sparas bara om eleven anger dem
	mentalHealth: number | null;
};

export type SessionRow = {
	studied_on: string;
	minutes: number;
	type: string;
	rating: number;
	health: number | null;
	mental_health: number | null;
};

const COLUMNS = 'studied_on, minutes, type, rating, health, mental_health';

export function toSession(row: SessionRow): StudySession {
	return {
		studiedOn: row.studied_on,
		minutes: row.minutes,
		type: row.type,
		rating: row.rating,
		health: row.health,
		mentalHealth: row.mental_health,
	};
}

/**
 * Sparar en studiesession.
 * @returns false om användaren inte är registrerad på kursen.
 * @throws Om ett värde bryter mot schemats CHECK-villkor (t.ex. betyg utanför 1–5).
 */
export async function add(db: D1Database, userId: number, courseId: number, s: StudySession): Promise<boolean> {
	// SELECT från enrollments gör att en saknad registrering ger 0 rader i stället för ett FOREIGN KEY-fel
	const { meta } = await db
		.prepare(
			`INSERT INTO study_sessions (user_id, course_id, ${COLUMNS})
			 SELECT user_id, course_id, ?, ?, ?, ?, ?, ? FROM enrollments
			 WHERE user_id = ? AND course_id = ?`,
		)
		.bind(s.studiedOn, s.minutes, s.type, s.rating, s.health, s.mentalHealth, userId, courseId)
		.run();
	return meta.changes > 0;
}

// Statement-varianterna låter kurssidan köra flera frågor i en db.batch()
export function forUserCourseStatement(db: D1Database, userId: number, courseId: number): D1PreparedStatement {
	return db
		.prepare(`SELECT ${COLUMNS} FROM study_sessions WHERE user_id = ? AND course_id = ? ORDER BY studied_on, id`)
		.bind(userId, courseId);
}

/** Alla elevers sessioner i en kurs för admin-grafen; bara det grafen visar, inga betyg eller hälsodata. */
export function forCourseChartStatement(db: D1Database, courseId: number): D1PreparedStatement {
	return db
		.prepare('SELECT studied_on AS date, minutes, type FROM study_sessions WHERE course_id = ? ORDER BY studied_on, id')
		.bind(courseId);
}
