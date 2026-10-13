import type { GradingScale } from '../lib/grades';
import { termOrderSql } from '../lib/terms';

export type Course = {
	id: number;
	universityId: number;
	code: string;
	term: string;
	name: string;
	gradingScale: GradingScale;
};

export type CourseRow = { id: number; university_id: number; code: string; term: string; name: string; grading_scale: GradingScale };

export const COURSE_COLUMNS = 'id, university_id, code, term, name, grading_scale';

export function toCourse(row: CourseRow): Course {
	return {
		id: row.id,
		universityId: row.university_id,
		code: row.code,
		term: row.term,
		name: row.name,
		gradingScale: row.grading_scale,
	};
}

/** '1DL201 · HT26' */
export function courseLabel(course: Pick<Course, 'code' | 'term'>): string {
	return `${course.code} · ${course.term}`;
}

export async function get(db: D1Database, id: number): Promise<Course | null> {
	const row = await db.prepare(`SELECT ${COURSE_COLUMNS} FROM courses WHERE id = ?`).bind(id).first<CourseRow>();
	return row ? toCourse(row) : null;
}

/**
 * Hämtar kursen med samma lärosäte, kod och termin, eller skapar den.
 * Finns kursen redan behålls dess namn och betygsskala, så att ingen kan ändra en kurs genom att "skapa" den igen.
 * @param input.code Redan normaliserad med normalizeCode().
 */
export async function findOrCreate(
	db: D1Database,
	input: {
		universityId: number;
		code: string;
		term: string;
		name: string;
		gradingScale: GradingScale;
		createdBy: number | null;
		createdAt: number;
	},
): Promise<{ course: Course; created: boolean }> {
	const inserted = await db
		.prepare(
			`INSERT INTO courses (university_id, code, term, name, grading_scale, created_by, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT (university_id, code, term) DO NOTHING
			 RETURNING ${COURSE_COLUMNS}`,
		)
		.bind(input.universityId, input.code, input.term, input.name, input.gradingScale, input.createdBy, input.createdAt)
		.first<CourseRow>();
	if (inserted) return { course: toCourse(inserted), created: true };

	const existing = await db
		.prepare(`SELECT ${COURSE_COLUMNS} FROM courses WHERE university_id = ? AND code = ? AND term = ?`)
		.bind(input.universityId, input.code, input.term)
		.first<CourseRow>();
	return { course: toCourse(existing!), created: false }; // finns, annars hade INSERT lyckats
}

/** @returns true om kursen fanns. */
export async function rename(db: D1Database, id: number, name: string): Promise<boolean> {
	const { meta } = await db.prepare('UPDATE courses SET name = ? WHERE id = ?').bind(name, id).run();
	return meta.changes > 0;
}

/**
 * Tar bort en kurs. Registreringar och studiesessioner försvinner via ON DELETE CASCADE.
 * @returns true om kursen fanns.
 */
export async function remove(db: D1Database, id: number): Promise<boolean> {
	const { meta } = await db.prepare('DELETE FROM courses WHERE id = ?').bind(id).run();
	return meta.changes > 0;
}

/**
 * Kurser på användarens lärosäte som användaren inte redan går, senaste terminen först.
 * @param search Matchar kod eller namn, skiftlägesokänsligt för a–z.
 */
export async function availableFor(db: D1Database, userId: number, universityId: number, search = ''): Promise<Course[]> {
	// % och _ är jokertecken i LIKE och escapas så att de söks bokstavligt
	const pattern = `%${search.trim().replace(/[\\%_]/g, (c) => '\\' + c)}%`;
	const { results } = await db
		.prepare(
			`SELECT ${COURSE_COLUMNS} FROM courses c
			 WHERE c.university_id = ?
			   AND (c.code LIKE ?2 ESCAPE '\\' OR c.name LIKE ?2 ESCAPE '\\')
			   AND NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.course_id = c.id AND e.user_id = ?3)
			 ORDER BY ${termOrderSql()} DESC, code
			 LIMIT 100`,
		)
		.bind(universityId, pattern, userId)
		.all<CourseRow>();
	return results.map(toCourse);
}
