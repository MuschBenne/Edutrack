import { env } from 'cloudflare:test';
import * as courses from '../src/db/courses';
import * as users from '../src/db/users';
import type { StudySession } from '../src/db/studySessions';

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

export async function makeCourse(code: string, options: { term?: string; name?: string; university?: string } = {}) {
	const { course } = await courses.findOrCreate(db, {
		universityId: await universityId(options.university),
		code,
		term: options.term ?? 'HT26',
		name: options.name ?? `Course ${code}`,
		createdBy: null,
		createdAt: 0,
	});
	return course;
}

export function session(overrides: Partial<StudySession> = {}): StudySession {
	return { studiedOn: '2026-10-08', minutes: 30, type: 'Lecture', rating: 3, health: 3, mentalHealth: 3, ...overrides };
}
