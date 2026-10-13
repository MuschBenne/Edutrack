import { env } from 'cloudflare:test';
import * as courses from '../src/db/courses';
import * as users from '../src/db/users';
import { type SessionRow, type StudySession, forUserCourseStatement, toSession } from '../src/db/studySessions';
import type { GradingScale } from '../src/lib/grades';

export const db = env.DB;

/** Id för ett lärosäte från migreringen. */
export async function universityId(name = 'Uppsala universitet'): Promise<number> {
	const id = await db.prepare('SELECT id FROM universities WHERE name = ?').bind(name).first<number>('id');
	if (!id) throw new Error(`Saknar lärosätet ${name}`);
	return id;
}

export async function makeUser(name: string, options: { isAdmin?: boolean; university?: string; programme?: string } = {}) {
	const user = await users.create(db, {
		googleId: `google-${name}`,
		username: name,
		email: `${name}@example.com`,
		universityId: await universityId(options.university),
		programme: options.programme ?? 'Computer Science',
		isAdmin: options.isAdmin ?? false,
	});
	if (!user) throw new Error(`Kunde inte skapa ${name}`);
	return user;
}

export async function makeCourse(
	code: string,
	options: { term?: string; name?: string; university?: string; gradingScale?: GradingScale } = {},
) {
	const result = await courses.findOrCreate(db, {
		universityId: await universityId(options.university),
		code,
		term: options.term ?? 'HT26',
		name: options.name ?? `Course ${code}`,
		gradingScale: options.gradingScale ?? 'U345',
		createdBy: null,
		createdAt: 0,
	});
	if (!result) throw new Error(`Kunde inte skapa ${code}`);
	return result.course;
}

export function session(overrides: Partial<StudySession> = {}): StudySession {
	return { studiedOn: '2026-10-08', minutes: 30, type: 'Lecture', rating: 3, health: 3, mentalHealth: 3, ...overrides };
}

/** Användarens sessioner i en kurs, via samma fråga som kurssidan. */
export async function sessionsOf(userId: number, courseId: number): Promise<StudySession[]> {
	const { results } = await forUserCourseStatement(db, userId, courseId).all<SessionRow>();
	return results.map(toSession);
}

/** Användarnamn på kursens elever, i bokstavsordning. */
export async function studentsIn(courseId: number): Promise<string[]> {
	const { results } = await db
		.prepare('SELECT u.username FROM enrollments e JOIN users u ON u.id = e.user_id WHERE e.course_id = ? ORDER BY u.username')
		.bind(courseId)
		.all<{ username: string }>();
	return results.map((r) => r.username);
}

/** Id på kurserna användaren är registrerad på. */
export async function courseIdsOf(userId: number): Promise<number[]> {
	const { results } = await db.prepare('SELECT course_id FROM enrollments WHERE user_id = ? ORDER BY course_id').bind(userId).all<{ course_id: number }>();
	return results.map((r) => r.course_id);
}
