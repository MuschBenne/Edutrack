import { describe, expect, it } from 'vitest';
import * as admin from '../../src/db/admin';
import * as enrollments from '../../src/db/enrollments';
import { db, makeCourse, makeUser, universityId } from '../helpers';

describe('admin', () => {
	it('listar användare med kurser och kurser med antal elever, filtrerat per lärosäte', async () => {
		const anna = await makeUser('anna');
		await makeUser('lars', { university: 'Lunds universitet' });
		const course = await makeCourse('1DL201', { name: 'Programdesign' });
		await makeCourse('EDA016', { university: 'Lunds universitet' });
		await enrollments.enroll(db, anna.id, course.id);

		const uppsala = await universityId();
		const usersInUppsala = await admin.users(db, uppsala);
		expect(usersInUppsala.map((u) => u.username)).toEqual(['anna']);
		expect(usersInUppsala[0].courses).toEqual([{ id: course.id, code: '1DL201', term: 'HT26', name: 'Programdesign' }]);

		const coursesInUppsala = await admin.courses(db, uppsala);
		expect(coursesInUppsala).toMatchObject([{ code: '1DL201', students: 1, university: 'Uppsala universitet', createdBy: null }]);

		expect(await admin.users(db, null)).toHaveLength(2);
		expect(await admin.courses(db, null)).toHaveLength(2);
	});
});
