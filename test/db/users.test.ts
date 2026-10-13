import { describe, expect, it } from 'vitest';
import * as enrollments from '../../src/db/enrollments';
import * as studySessions from '../../src/db/studySessions';
import * as users from '../../src/db/users';
import { db, makeCourse, makeUser, session, universityId } from '../helpers';

describe('users', () => {
	it('skapar och hittar en användare via id och Google-id', async () => {
		const created = await makeUser('anna', { isAdmin: true });

		expect(created).toMatchObject({ isAdmin: true, programme: 'Computer Science', universityId: await universityId() });
		expect(await users.getById(db, created.id)).toEqual(created);
		expect(await users.getByGoogleId(db, 'google-anna')).toEqual(created);
		expect(await users.getByGoogleId(db, 'okänd')).toBeNull();
	});

	it('nekar dubbletter av Google-id, användarnamn och e-post', async () => {
		await makeUser('anna');
		const base = { googleId: 'g-ny', username: 'ny', email: 'ny@example.com', universityId: await universityId(), programme: 'X', isAdmin: false };

		expect(await users.create(db, { ...base, googleId: 'google-anna' })).toBeNull();
		expect(await users.create(db, { ...base, username: 'anna' })).toBeNull();
		expect(await users.create(db, { ...base, email: 'anna@example.com' })).toBeNull();
		expect(await users.create(db, base)).not.toBeNull();
	});

	it('borttagning tar med registreringar, sessioner och inloggningar men lämnar skapade kurser', async () => {
		const anna = await makeUser('anna');
		const course = await makeCourse('1DL201');
		await db.prepare('UPDATE courses SET created_by = ? WHERE id = ?').bind(anna.id, course.id).run();
		await enrollments.enroll(db, anna.id, course.id);
		expect(await studySessions.add(db, anna.id, course.id, session())).toBe(true);
		await db.prepare("INSERT INTO auth_sessions (id, user_id, expires_at) VALUES ('hash', ?, 9999999999)").bind(anna.id).run();

		expect(await users.remove(db, anna.id)).toBe(true);
		expect(await users.remove(db, anna.id)).toBe(false);
		expect(await enrollments.studentsIn(db, course.id)).toEqual([]);
		expect(await studySessions.forCourse(db, course.id)).toEqual([]);
		expect(await db.prepare('SELECT COUNT(*) AS n FROM auth_sessions WHERE user_id = ?').bind(anna.id).first('n')).toBe(0);
		expect(await db.prepare('SELECT created_by FROM courses WHERE id = ?').bind(course.id).first('created_by')).toBeNull();
	});

	it('programförslag per lärosäte, vanligaste först', async () => {
		await makeUser('anna', { programme: 'Data' });
		await makeUser('bo', { programme: 'IT' });
		await makeUser('cia', { programme: 'IT' });
		await makeUser('dan', { programme: 'Juridik', university: 'Lunds universitet' });

		const map = await users.programmesByUniversity(db);
		expect(map[await universityId()]).toEqual(['IT', 'Data']);
		expect(map[await universityId('Lunds universitet')]).toEqual(['Juridik']);
	});
});
