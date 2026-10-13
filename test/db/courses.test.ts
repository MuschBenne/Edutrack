import { describe, expect, it } from 'vitest';
import * as courses from '../../src/db/courses';
import * as enrollments from '../../src/db/enrollments';
import * as studySessions from '../../src/db/studySessions';
import { courseIdsOf, db, makeCourse, makeUser, session, sessionsOf, universityId } from '../helpers';

describe('courses', () => {
	it('findOrCreate ger samma kurs för samma lärosäte, kod och termin, och behåller första namnet och skalan', async () => {
		const uni = await universityId();
		const input = { universityId: uni, code: '1DL201', term: 'HT26', name: 'Programdesign', gradingScale: 'U345' as const, createdBy: null, createdAt: 0 };

		const first = await courses.findOrCreate(db, input);
		const second = await courses.findOrCreate(db, { ...input, name: 'Annat namn', gradingScale: 'AF' });

		expect(first?.created).toBe(true);
		expect(second).toEqual({ course: first?.course, created: false });
		expect(second?.course).toMatchObject({ name: 'Programdesign', gradingScale: 'U345' });
		expect(await courses.find(db, uni, '1DL201', 'HT26')).toEqual(first?.course);
		expect(await courses.find(db, uni, '1DL201', 'VT27')).toBeNull();
	});

	it('räknar bara kurser som användaren skapat inom tidsfönstret', async () => {
		const anna = await makeUser('anna');
		const uni = await universityId();
		const base = { universityId: uni, term: 'HT26', name: 'Kurs', gradingScale: 'U345' as const, createdBy: anna.id };
		await courses.findOrCreate(db, { ...base, code: 'GAMMAL', createdAt: 100 });
		await courses.findOrCreate(db, { ...base, code: 'NY1', createdAt: 1000 });
		await courses.findOrCreate(db, { ...base, code: 'NY2', createdAt: 2000 });
		await makeCourse('ANNANS');

		expect(await courses.countCreatedSince(db, anna.id, 1000)).toBe(2);
	});

	it('byter betygsskala och nollställer betyg som inte finns på den nya', async () => {
		const anna = await makeUser('anna');
		const bo = await makeUser('bo');
		const course = await makeCourse('1DL201', { gradingScale: 'U345' });
		await enrollments.enroll(db, anna.id, course.id);
		await enrollments.enroll(db, bo.id, course.id);
		await enrollments.setFinalGrade(db, anna.id, course.id, 'U');
		await enrollments.setFinalGrade(db, bo.id, course.id, '4');

		expect(await courses.setGradingScale(db, course.id, 'UG')).toBe(true);
		expect((await courses.get(db, course.id))?.gradingScale).toBe('UG');
		const grades = await db.prepare('SELECT final_grade FROM enrollments WHERE course_id = ? ORDER BY user_id').bind(course.id).all();
		expect(grades.results.map((r) => r.final_grade)).toEqual(['U', null]);
		expect(await courses.setGradingScale(db, 999_999, 'UG')).toBe(false);
	});

	it('samma kod blir olika kurser för olika terminer och lärosäten', async () => {
		const a = await makeCourse('1DL201', { term: 'HT26' });
		const b = await makeCourse('1DL201', { term: 'VT27' });
		const c = await makeCourse('1DL201', { term: 'HT26', university: 'Lunds universitet' });

		expect(new Set([a.id, b.id, c.id]).size).toBe(3);
	});

	it('availableFor visar bara det egna lärosätets kurser som användaren inte går, senaste terminen först', async () => {
		const anna = await makeUser('anna');
		const old = await makeCourse('AAA111', { term: 'VT26', name: 'Algebra' });
		const current = await makeCourse('BBB222', { term: 'HT26', name: 'Biologi' });
		const taken = await makeCourse('CCC333', { term: 'HT26' });
		await makeCourse('DDD444', { university: 'Lunds universitet' });
		await enrollments.enroll(db, anna.id, taken.id);

		const ids = (await courses.availableFor(db, anna.id, anna.universityId)).map((c) => c.id);
		expect(ids).toEqual([current.id, old.id]);
	});

	it('availableFor söker på kod och namn, och behandlar % bokstavligt', async () => {
		const anna = await makeUser('anna');
		await makeCourse('1DL201', { name: 'Programdesign' });
		await makeCourse('1MA025', { name: 'Linjär algebra' });

		const search = async (q: string) => (await courses.availableFor(db, anna.id, anna.universityId, q)).map((c) => c.code);
		expect(await search('1dl')).toEqual(['1DL201']);
		expect(await search('algebra')).toEqual(['1MA025']);
		expect(await search('%')).toEqual([]);
	});

	it('byter namn och tar bort med registreringar och sessioner', async () => {
		const anna = await makeUser('anna');
		const course = await makeCourse('1DL201');
		await enrollments.enroll(db, anna.id, course.id);
		expect(await studySessions.add(db, anna.id, course.id, session())).toBe(true);

		expect(await courses.rename(db, course.id, 'Nytt namn')).toBe(true);
		expect((await courses.get(db, course.id))?.name).toBe('Nytt namn');

		expect(await courses.remove(db, course.id)).toBe(true);
		expect(await courses.remove(db, course.id)).toBe(false);
		expect(await courseIdsOf(anna.id)).toEqual([]);
		expect(await sessionsOf(anna.id, course.id)).toEqual([]);
	});
});
