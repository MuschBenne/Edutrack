import { describe, expect, it } from 'vitest';
import * as courses from '../../src/db/courses';
import * as enrollments from '../../src/db/enrollments';
import * as studySessions from '../../src/db/studySessions';
import { db, makeCourse, makeUser, session } from '../helpers';

describe('courses', () => {
	it('skapar en kurs och nekar dubblett-id', async () => {
		expect(await courses.create(db, { courseId: 'pkd', name: 'PKD' })).toBe(true);
		expect(await courses.create(db, { courseId: 'pkd', name: 'Annat namn' })).toBe(false);
		expect(await courses.get(db, 'pkd')).toEqual({ courseId: 'pkd', name: 'PKD' });
	});

	it('availableFor visar bara kurser användaren inte går', async () => {
		const anna = await makeUser('anna');
		await makeCourse('a');
		await makeCourse('b');
		await makeCourse('c');
		await enrollments.enroll(db, anna.id, 'b');

		const ids = (await courses.availableFor(db, anna.id)).map((c) => c.courseId);
		expect(ids).toEqual(['a', 'c']);
	});

	// Gamla removeCourse väntade inte in uppdateringen av eleverna (forEach med async)
	it('borttagning tar med registreringar och sessioner', async () => {
		const anna = await makeUser('anna');
		await makeCourse('pkd');
		await enrollments.enroll(db, anna.id, 'pkd');
		expect(await studySessions.add(db, anna.id, 'pkd', session())).toBe(true);

		expect(await courses.remove(db, 'pkd')).toBe(true);
		expect(await courses.remove(db, 'pkd')).toBe(false);
		expect(await enrollments.coursesFor(db, anna.id)).toEqual([]);
		expect(await studySessions.forUserCourse(db, anna.id, 'pkd')).toEqual([]);
	});
});
