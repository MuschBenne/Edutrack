import { termOrderSql } from '../lib/terms';

export type AdminUser = {
	id: number;
	username: string;
	email: string;
	university: string;
	programme: string;
	isAdmin: boolean;
	courses: { id: number; code: string; term: string; name: string; finalGrade: string | null }[];
};

export type AdminCourse = {
	id: number;
	code: string;
	term: string;
	name: string;
	gradingScale: string;
	university: string;
	students: number;
	createdBy: string | null;
};

/** @param universityId null = alla lärosäten. */
export async function users(db: D1Database, universityId: number | null): Promise<AdminUser[]> {
	// "? IS NULL OR ..." gör filtret valfritt utan att bygga olika SQL-strängar
	const [userRes, courseRes] = await db.batch<Record<string, unknown>>([
		db
			.prepare(
				`SELECT u.id, u.username, u.email, un.name AS university, u.programme, u.is_admin
				 FROM users u JOIN universities un ON un.id = u.university_id
				 WHERE ?1 IS NULL OR u.university_id = ?1
				 ORDER BY u.username`,
			)
			.bind(universityId),
		db
			.prepare(
				`SELECT e.user_id, e.final_grade, c.id, c.code, c.term, c.name
				 FROM enrollments e JOIN courses c ON c.id = e.course_id
				 WHERE ?1 IS NULL OR c.university_id = ?1
				 ORDER BY ${termOrderSql('c.term')} DESC, c.code`,
			)
			.bind(universityId),
	]);

	const coursesByUser = new Map<number, AdminUser['courses']>();
	for (const r of courseRes.results as { user_id: number; final_grade: string | null; id: number; code: string; term: string; name: string }[]) {
		if (!coursesByUser.has(r.user_id)) coursesByUser.set(r.user_id, []);
		coursesByUser.get(r.user_id)!.push({ id: r.id, code: r.code, term: r.term, name: r.name, finalGrade: r.final_grade });
	}

	return (userRes.results as { id: number; username: string; email: string; university: string; programme: string; is_admin: number }[]).map(
		(r) => ({
			id: r.id,
			username: r.username,
			email: r.email,
			university: r.university,
			programme: r.programme,
			isAdmin: r.is_admin === 1,
			courses: coursesByUser.get(r.id) ?? [],
		}),
	);
}

/** @param universityId null = alla lärosäten. */
export async function courses(db: D1Database, universityId: number | null): Promise<AdminCourse[]> {
	const { results } = await db
		.prepare(
			`SELECT c.id, c.code, c.term, c.name, c.grading_scale, un.name AS university, cr.username AS created_by,
			        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS students
			 FROM courses c
			 JOIN universities un ON un.id = c.university_id
			 LEFT JOIN users cr ON cr.id = c.created_by
			 WHERE ?1 IS NULL OR c.university_id = ?1
			 ORDER BY un.name, ${termOrderSql('c.term')} DESC, c.code`,
		)
		.bind(universityId)
		.all<{ id: number; code: string; term: string; name: string; grading_scale: string; university: string; created_by: string | null; students: number }>();
	return results.map((r) => ({
		id: r.id,
		code: r.code,
		term: r.term,
		name: r.name,
		gradingScale: r.grading_scale,
		university: r.university,
		students: r.students,
		createdBy: r.created_by,
	}));
}
