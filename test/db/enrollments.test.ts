import { describe, expect, it } from 'vitest';
import * as enrollments from '../../src/db/enrollments';
import { courseIdsOf, db, makeCourse, makeUser, studentsIn } from '../helpers';

describe('enrollments', () => {
	it('registrerar och nekar dubblett, okänd kurs och annat lärosätes kurs', async () => {
		const anna = await makeUser('anna');
		const course = await makeCourse('1DL201');
		const lund = await makeCourse('1DL201', { university: 'Lunds universitet' });

		expect(await enrollments.enroll(db, anna.id, course.id)).toBe(true);
		expect(await enrollments.enroll(db, anna.id, course.id)).toBe(false);
		expect(await enrollments.enroll(db, anna.id, 999_999)).toBe(false);
		expect(await enrollments.enroll(db, anna.id, lund.id)).toBe(false);
		expect(await enrollments.isEnrolled(db, anna.id, course.id)).toBe(true);
		expect(await courseIdsOf(anna.id)).toEqual([course.id]);
	});

	it('sätter och tar bort slutbetyg bara för registrerade', async () => {
		const anna = await makeUser('anna');
		const course = await makeCourse('1DL201');
		const other = await makeCourse('1MA025');
		await enrollments.enroll(db, anna.id, course.id);

		expect(await enrollments.setFinalGrade(db, anna.id, course.id, '4')).toBe(true);
		expect(await db.prepare('SELECT final_grade FROM enrollments').first('final_grade')).toBe('4');
		expect(await enrollments.setFinalGrade(db, anna.id, course.id, null)).toBe(true);
		expect(await db.prepare('SELECT final_grade FROM enrollments').first('final_grade')).toBeNull();
		expect(await enrollments.setFinalGrade(db, anna.id, other.id, '4')).toBe(false);
	});

	// Gamla removeStudentFromCourse tömde hela elevlistan (filter som inte returnerade något)
	it('avregistrering tar bara bort rätt elev', async () => {
		const anna = await makeUser('anna');
		const bo = await makeUser('bo');
		const course = await makeCourse('1DL201');
		await enrollments.enroll(db, anna.id, course.id);
		await enrollments.enroll(db, bo.id, course.id);

		expect(await enrollments.unenroll(db, anna.id, course.id)).toBe(true);
		expect(await enrollments.unenroll(db, anna.id, course.id)).toBe(false);
		expect(await studentsIn(course.id)).toEqual(['bo']);
	});
});
