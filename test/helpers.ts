import { env } from 'cloudflare:test';
import * as courses from '../src/db/courses';
import * as users from '../src/db/users';
import type { StudySession } from '../src/db/studySessions';

export const db = env.DB;

export async function makeUser(name: string, isAdmin = false) {
	const user = await users.create(db, {
		googleId: `google-${name}`,
		username: name,
		email: `${name}@example.com`,
		class: 'DV',
		isAdmin,
	});
	if (!user) throw new Error(`Kunde inte skapa ${name}`);
	return user;
}

export async function makeCourse(courseId: string, name = courseId) {
	await courses.create(db, { courseId, name });
}

export function session(overrides: Partial<StudySession> = {}): StudySession {
	return { studiedOn: '2026-10-08', minutes: 30, type: 'Lecture', rating: 3, health: 3, mentalHealth: 3, ...overrides };
}
