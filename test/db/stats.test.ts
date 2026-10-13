import { describe, expect, it } from 'vitest';
import * as coursePage from '../../src/db/coursePage';
import * as enrollments from '../../src/db/enrollments';
import { courseOverview } from '../../src/db/stats';
import * as studySessions from '../../src/db/studySessions';
import { db, makeCourse, makeUser, session } from '../helpers';

async function setup() {
	const anna = await makeUser('anna');
	const bo = await makeUser('bo');
	await makeCourse('a', 'Algebra');
	await makeCourse('b', 'Biologi');
	for (const u of [anna, bo]) await enrollments.enroll(db, u.id, 'a');
	await enrollments.enroll(db, anna.id, 'b');

	await studySessions.add(db, anna.id, 'a', session({ studiedOn: '2026-10-01', minutes: 60, rating: 2 }));
	await studySessions.add(db, anna.id, 'a', session({ studiedOn: '2026-10-10', minutes: 30, rating: 4 }));
	await studySessions.add(db, anna.id, 'a', session({ studiedOn: '2026-10-12', minutes: 15, rating: 3 }));
	await studySessions.add(db, bo.id, 'a', session({ studiedOn: '2026-10-12', minutes: 999 }));
	return { anna, bo };
}

describe('courseOverview', () => {
	it('summerar per kurs och tar med kurser utan sessioner', async () => {
		const { anna } = await setup();

		expect(await courseOverview(db, anna.id, '2026-10-07')).toEqual([
			{ courseId: 'a', name: 'Algebra', recentMinutes: 45, sessionCount: 3, lastStudiedOn: '2026-10-12' },
			{ courseId: 'b', name: 'Biologi', recentMinutes: 0, sessionCount: 0, lastStudiedOn: null },
		]);
	});
});

describe('coursePage.load', () => {
	it('ger statistik och sessioner för bara användaren', async () => {
		const { anna } = await setup();
		const data = await coursePage.load(db, anna.id, 'a', '2026-10-07', false);

		expect(data?.stats).toEqual({ totalMinutes: 105, recentMinutes: 45, sessionCount: 3, averageRating: 3 });
		expect(data?.sessions.map((s) => s.studiedOn)).toEqual(['2026-10-01', '2026-10-10', '2026-10-12']);
		expect(data?.allSessions).toBeNull();
	});

	it('admin får alla elevers sessioner', async () => {
		const { anna } = await setup();
		const data = await coursePage.load(db, anna.id, 'a', '2026-10-07', true);
		expect(data?.allSessions).toHaveLength(4);
	});

	it('kurs utan sessioner ger nollor', async () => {
		const { anna } = await setup();
		const data = await coursePage.load(db, anna.id, 'b', '2026-10-07', false);
		expect(data?.stats).toEqual({ totalMinutes: 0, recentMinutes: 0, sessionCount: 0, averageRating: null });
	});

	it('null för okänd kurs eller kurs användaren inte går', async () => {
		const { bo } = await setup();
		expect(await coursePage.load(db, bo.id, 'b', '2026-10-07', false)).toBeNull();
		expect(await coursePage.load(db, bo.id, 'finns-inte', '2026-10-07', false)).toBeNull();
	});
});
