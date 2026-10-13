import { describe, expect, it } from 'vitest';
import * as enrollments from '../../src/db/enrollments';
import { db, makeCourse, makeUser } from '../helpers';

describe('enrollments', () => {
	it('registrerar, nekar dubblett och okänd kurs', async () => {
		const anna = await makeUser('anna');
		await makeCourse('pkd', 'PKD');

		expect(await enrollments.enroll(db, anna.id, 'pkd')).toBe(true);
		expect(await enrollments.enroll(db, anna.id, 'pkd')).toBe(false);
		expect(await enrollments.enroll(db, anna.id, 'finns-inte')).toBe(false);
		expect(await enrollments.isEnrolled(db, anna.id, 'pkd')).toBe(true);
		expect(await enrollments.coursesFor(db, anna.id)).toEqual([{ courseId: 'pkd', name: 'PKD' }]);
	});

	// Gamla removeStudentFromCourse tömde hela elevlistan (filter som inte returnerade något)
	it('avregistrering tar bara bort rätt elev', async () => {
		const anna = await makeUser('anna');
		const bo = await makeUser('bo');
		await makeCourse('pkd');
		await enrollments.enroll(db, anna.id, 'pkd');
		await enrollments.enroll(db, bo.id, 'pkd');

		expect(await enrollments.unenroll(db, anna.id, 'pkd')).toBe(true);
		expect(await enrollments.unenroll(db, anna.id, 'pkd')).toBe(false);
		expect(await enrollments.studentsIn(db, 'pkd')).toEqual(['bo']);
	});
});
