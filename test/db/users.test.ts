import { describe, expect, it } from 'vitest';
import * as users from '../../src/db/users';
import * as enrollments from '../../src/db/enrollments';
import * as studySessions from '../../src/db/studySessions';
import { db, makeCourse, makeUser, session } from '../helpers';

describe('users', () => {
	it('skapar och hittar en användare via id och Google-id', async () => {
		const created = await makeUser('anna', true);

		expect(created.isAdmin).toBe(true);
		expect(await users.getById(db, created.id)).toEqual(created);
		expect(await users.getByGoogleId(db, 'google-anna')).toEqual(created);
		expect(await users.getByGoogleId(db, 'okänd')).toBeNull();
	});

	it('nekar dubbletter av Google-id, användarnamn och e-post', async () => {
		await makeUser('anna');
		const base = { googleId: 'g-ny', username: 'ny', email: 'ny@example.com', class: 'DV', isAdmin: false };

		expect(await users.create(db, { ...base, googleId: 'google-anna' })).toBeNull();
		expect(await users.create(db, { ...base, username: 'anna' })).toBeNull();
		expect(await users.create(db, { ...base, email: 'anna@example.com' })).toBeNull();
		expect(await users.create(db, base)).not.toBeNull();
	});

	it('borttagning tar med registreringar och sessioner', async () => {
		const anna = await makeUser('anna');
		await makeCourse('pkd');
		await enrollments.enroll(db, anna.id, 'pkd');
		expect(await studySessions.add(db, anna.id, 'pkd', session())).toBe(true);

		expect(await users.remove(db, anna.id)).toBe(true);
		expect(await users.remove(db, anna.id)).toBe(false);
		expect(await enrollments.studentsIn(db, 'pkd')).toEqual([]);
		expect(await studySessions.forCourse(db, 'pkd')).toEqual([]);
	});
});
