import { describe, expect, it } from 'vitest';
import * as coursePage from '../../src/db/coursePage';
import * as enrollments from '../../src/db/enrollments';
import { courseOverview } from '../../src/db/stats';
import * as studySessions from '../../src/db/studySessions';
import { db, makeCourse, makeUser, session } from '../helpers';

async function setup() {
	const anna = await makeUser('anna');
	const bo = await makeUser('bo');
	const a = await makeCourse('AAA111', { name: 'Algebra', term: 'VT26' });
	const b = await makeCourse('BBB222', { name: 'Biologi', term: 'HT26' });
	for (const u of [anna, bo]) await enrollments.enroll(db, u.id, a.id);
	await enrollments.enroll(db, anna.id, b.id);

	await studySessions.add(db, anna.id, a.id, session({ studiedOn: '2026-10-01', minutes: 60, rating: 2 }));
	await studySessions.add(db, anna.id, a.id, session({ studiedOn: '2026-10-10', minutes: 30, rating: 4 }));
	await studySessions.add(db, anna.id, a.id, session({ studiedOn: '2026-10-12', minutes: 15, rating: 3 }));
	await studySessions.add(db, bo.id, a.id, session({ studiedOn: '2026-10-12', minutes: 999 }));
	return { anna, bo, a, b };
}

describe('courseOverview', () => {
	it('summerar per kurs, tar med kurser utan sessioner och visar senaste terminen först', async () => {
		const { anna, a, b } = await setup();

		expect(await courseOverview(db, anna.id, '2026-10-07')).toEqual([
			{ courseId: b.id, code: 'BBB222', term: 'HT26', name: 'Biologi', recentMinutes: 0, sessionCount: 0, lastStudiedOn: null },
			{ courseId: a.id, code: 'AAA111', term: 'VT26', name: 'Algebra', recentMinutes: 45, sessionCount: 3, lastStudiedOn: '2026-10-12' },
		]);
	});
});

describe('coursePage.load', () => {
	it('ger kurs, statistik och sessioner för bara användaren', async () => {
		const { anna, a } = await setup();
		const data = await coursePage.load(db, anna.id, a.id, '2026-10-07', false);

		expect(data?.course).toEqual(a);
		expect(data?.stats).toEqual({ totalMinutes: 105, recentMinutes: 45, sessionCount: 3, averageRating: 3 });
		expect(data?.sessions.map((s) => s.studiedOn)).toEqual(['2026-10-01', '2026-10-10', '2026-10-12']);
		expect(data?.allSessions).toBeNull();
	});

	it('admin får alla elevers sessioner', async () => {
		const { anna, a } = await setup();
		expect((await coursePage.load(db, anna.id, a.id, '2026-10-07', true))?.allSessions).toHaveLength(4);
	});

	it('kurs utan sessioner ger nollor', async () => {
		const { anna, b } = await setup();
		const data = await coursePage.load(db, anna.id, b.id, '2026-10-07', false);
		expect(data?.stats).toEqual({ totalMinutes: 0, recentMinutes: 0, sessionCount: 0, averageRating: null });
	});

	it('null för okänd kurs eller kurs användaren inte går', async () => {
		const { bo, b } = await setup();
		expect(await coursePage.load(db, bo.id, b.id, '2026-10-07', false)).toBeNull();
		expect(await coursePage.load(db, bo.id, 999_999, '2026-10-07', false)).toBeNull();
	});
});
