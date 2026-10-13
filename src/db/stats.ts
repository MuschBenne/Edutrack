import { termOrderSql } from '../lib/terms';

export type CourseOverview = {
	courseId: number;
	code: string;
	term: string;
	name: string;
	finalGrade: string | null;
	recentMinutes: number;
	sessionCount: number;
	lastStudiedOn: string | null;
};

export type CourseStats = {
	totalMinutes: number;
	recentMinutes: number;
	sessionCount: number;
	averageRating: number | null;
};

/**
 * En rad per kurs användaren går, med nyckeltal för "Mina kurser".
 * @param since Första dagen som räknas till recentMinutes, 'YYYY-MM-DD'.
 */
export async function courseOverview(db: D1Database, userId: number, since: string): Promise<CourseOverview[]> {
	// LEFT JOIN så att kurser utan sessioner också kommer med
	const { results } = await db
		.prepare(
			`SELECT c.id, c.code, c.term, c.name, e.final_grade,
			        COALESCE(SUM(CASE WHEN s.studied_on >= ? THEN s.minutes END), 0) AS recent_minutes,
			        COUNT(s.id) AS session_count,
			        MAX(s.studied_on) AS last_studied_on
			 FROM enrollments e
			 JOIN courses c ON c.id = e.course_id
			 LEFT JOIN study_sessions s ON s.user_id = e.user_id AND s.course_id = e.course_id
			 WHERE e.user_id = ?
			 GROUP BY c.id
			 ORDER BY ${termOrderSql('c.term')} DESC, c.name`,
		)
		.bind(since, userId)
		.all<{ id: number; code: string; term: string; name: string; final_grade: string | null; recent_minutes: number; session_count: number; last_studied_on: string | null }>();
	return results.map((r) => ({
		courseId: r.id,
		code: r.code,
		term: r.term,
		name: r.name,
		finalGrade: r.final_grade,
		recentMinutes: r.recent_minutes,
		sessionCount: r.session_count,
		lastStudiedOn: r.last_studied_on,
	}));
}

/** Prepared statement så att kurssidan kan köra den i samma db.batch() som övriga frågor. */
export function courseStatsStatement(db: D1Database, userId: number, courseId: number, since: string): D1PreparedStatement {
	return db
		.prepare(
			`SELECT COALESCE(SUM(minutes), 0) AS total_minutes,
			        COALESCE(SUM(CASE WHEN studied_on >= ? THEN minutes END), 0) AS recent_minutes,
			        COUNT(*) AS session_count,
			        AVG(rating) AS average_rating
			 FROM study_sessions WHERE user_id = ? AND course_id = ?`,
		)
		.bind(since, userId, courseId);
}

export function toCourseStats(row: {
	total_minutes: number;
	recent_minutes: number;
	session_count: number;
	average_rating: number | null;
}): CourseStats {
	return {
		totalMinutes: row.total_minutes,
		recentMinutes: row.recent_minutes,
		sessionCount: row.session_count,
		averageRating: row.average_rating,
	};
}
