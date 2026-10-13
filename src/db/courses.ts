export type Course = {
	courseId: string;
	name: string;
};

type CourseRow = { course_id: string; name: string };

export function toCourse(row: CourseRow): Course {
	return { courseId: row.course_id, name: row.name };
}

export async function get(db: D1Database, courseId: string): Promise<Course | null> {
	const row = await db.prepare('SELECT course_id, name FROM courses WHERE course_id = ?').bind(courseId).first<CourseRow>();
	return row ? toCourse(row) : null;
}

export async function list(db: D1Database): Promise<Course[]> {
	const { results } = await db.prepare('SELECT course_id, name FROM courses ORDER BY name').all<CourseRow>();
	return results.map(toCourse);
}

/** @returns false om kurs-id:t redan finns. */
export async function create(db: D1Database, course: Course): Promise<boolean> {
	const { meta } = await db
		.prepare('INSERT INTO courses (course_id, name) VALUES (?, ?) ON CONFLICT DO NOTHING')
		.bind(course.courseId, course.name)
		.run();
	return meta.changes > 0;
}

/**
 * Tar bort en kurs. Registreringar och studiesessioner försvinner via ON DELETE CASCADE.
 * @returns true om kursen fanns.
 */
export async function remove(db: D1Database, courseId: string): Promise<boolean> {
	const { meta } = await db.prepare('DELETE FROM courses WHERE course_id = ?').bind(courseId).run();
	return meta.changes > 0;
}

/** Kurser som användaren inte redan är registrerad på. */
export async function availableFor(db: D1Database, userId: number): Promise<Course[]> {
	const { results } = await db
		.prepare(
			`SELECT course_id, name FROM courses c
			 WHERE NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.course_id = c.course_id AND e.user_id = ?)
			 ORDER BY name`,
		)
		.bind(userId)
		.all<CourseRow>();
	return results.map(toCourse);
}
