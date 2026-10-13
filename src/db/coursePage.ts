import { COURSE_COLUMNS, type Course, type CourseRow, toCourse } from './courses';
import { qualify } from './sql';
import { type CourseStats, courseStatsStatement, toCourseStats } from './stats';
import { type SessionRow, type StudySession, forCourseStatement, forUserCourseStatement, toSession } from './studySessions';

export type CoursePageData = {
	course: Course;
	finalGrade: string | null;
	stats: CourseStats;
	sessions: StudySession[];
	/** Alla elevers sessioner; bara för admin. */
	allSessions: StudySession[] | null;
};

/**
 * Allt kurssidan behöver, i en enda resa till D1.
 * @returns null om kursen inte finns eller användaren inte är registrerad på den.
 */
export async function load(
	db: D1Database,
	userId: number,
	courseId: number,
	since: string,
	includeAllStudents: boolean,
): Promise<CoursePageData | null> {
	const statements = [
		db
			.prepare(
				`SELECT ${qualify(COURSE_COLUMNS, 'c')}, e.final_grade FROM courses c
				 JOIN enrollments e ON e.course_id = c.id
				 WHERE e.user_id = ? AND c.id = ?`,
			)
			.bind(userId, courseId),
		courseStatsStatement(db, userId, courseId, since),
		forUserCourseStatement(db, userId, courseId),
		...(includeAllStudents ? [forCourseStatement(db, courseId)] : []),
	];
	const [courseRes, statsRes, sessionsRes, allRes] = await db.batch<Record<string, unknown>>(statements);

	const courseRow = courseRes.results[0] as (CourseRow & { final_grade: string | null }) | undefined;
	if (!courseRow) return null;

	return {
		course: toCourse(courseRow),
		finalGrade: courseRow.final_grade,
		stats: toCourseStats(statsRes.results[0] as Parameters<typeof toCourseStats>[0]),
		sessions: (sessionsRes.results as SessionRow[]).map(toSession),
		allSessions: allRes ? (allRes.results as SessionRow[]).map(toSession) : null,
	};
}
