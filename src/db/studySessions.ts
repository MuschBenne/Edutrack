export type StudySession = {
	studiedOn: string; // 'YYYY-MM-DD'
	minutes: number;
	type: string;
	rating: number;
	health: number | null; // valfria: hälsodata sparas bara om eleven anger dem
	mentalHealth: number | null;
};

/** Formatet som graf-skripten i public/ förväntar sig (samma som i MongoDB-versionen). */
export type LegacySessionEntry = {
	time: number;
	typeOfStudy: string;
	gradeSess: number;
	health: number | null;
	mentalHealth: number | null;
};
export type LegacySessionMap = { [date: string]: LegacySessionEntry[] };

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

export function forCourseStatement(db: D1Database, courseId: number): D1PreparedStatement {
	return db.prepare(`SELECT ${COLUMNS} FROM study_sessions WHERE course_id = ? ORDER BY studied_on, id`).bind(courseId);
}

/** Sessioner i stigande datumordning. */
export async function forUserCourse(db: D1Database, userId: number, courseId: number): Promise<StudySession[]> {
	const { results } = await forUserCourseStatement(db, userId, courseId).all<SessionRow>();
	return results.map(toSession);
}

/** Alla elevers sessioner i en kurs, för admin-vyn. */
export async function forCourse(db: D1Database, courseId: number): Promise<StudySession[]> {
	const { results } = await forCourseStatement(db, courseId).all<SessionRow>();
	return results.map(toSession);
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2026-10-08' → 'Thu_Oct_08_2026', samma som gamla `new Date().toDateString().replaceAll(' ', '_')`. */
export function toLegacyDateKey(isoDate: string): string {
	const [y, m, d] = isoDate.split('-').map(Number);
	// UTC så att tidszonen där koden körs inte kan flytta datumet en dag
	const date = new Date(Date.UTC(y, m - 1, d));
	return `${DAYS[date.getUTCDay()]}_${MONTHS[m - 1]}_${String(d).padStart(2, '0')}_${y}`;
}

/** Bygger om sessioner till { 'Thu_Oct_08_2026': [ … ] } så att graph_logic.js och static_functions.js fungerar oförändrade. */
export function toSessionMap(sessions: StudySession[]): LegacySessionMap {
	const map: LegacySessionMap = {};
	for (const s of sessions) {
		const key = toLegacyDateKey(s.studiedOn);
		(map[key] ??= []).push({
			time: s.minutes,
			typeOfStudy: s.type,
			gradeSess: s.rating,
			health: s.health,
			mentalHealth: s.mentalHealth,
		});
	}
	return map;
}
