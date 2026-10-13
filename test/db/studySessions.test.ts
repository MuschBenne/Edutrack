import { describe, expect, it } from 'vitest';
import * as enrollments from '../../src/db/enrollments';
import * as studySessions from '../../src/db/studySessions';
import { db, makeCourse, makeUser, session } from '../helpers';

describe('studySessions', () => {
	it('sparar sessioner bara för registrerade elever', async () => {
		const anna = await makeUser('anna');
		const pkd = await makeCourse('PKD');
		const annan = await makeCourse('ANNAN');
		await enrollments.enroll(db, anna.id, pkd.id);

		expect(await studySessions.add(db, anna.id, pkd.id, session())).toBe(true);
		expect(await studySessions.add(db, anna.id, annan.id, session())).toBe(false);
		expect(await studySessions.add(db, anna.id, 999_999, session())).toBe(false);
		expect(await studySessions.forUserCourse(db, anna.id, pkd.id)).toEqual([session()]);
	});

	it('nekar värden utanför schemats gränser', async () => {
		const anna = await makeUser('anna');
		const pkd = await makeCourse('PKD');
		await enrollments.enroll(db, anna.id, pkd.id);

		await expect(studySessions.add(db, anna.id, pkd.id, session({ rating: 6 }))).rejects.toThrow();
		await expect(studySessions.add(db, anna.id, pkd.id, session({ minutes: 0 }))).rejects.toThrow();
		await expect(studySessions.add(db, anna.id, pkd.id, session({ health: 0 }))).rejects.toThrow();
	});

	it('sparar sessioner utan hälsobetyg', async () => {
		const anna = await makeUser('anna');
		const pkd = await makeCourse('PKD');
		await enrollments.enroll(db, anna.id, pkd.id);
		const utan = session({ health: null, mentalHealth: null });

		expect(await studySessions.add(db, anna.id, pkd.id, utan)).toBe(true);
		expect(await studySessions.forUserCourse(db, anna.id, pkd.id)).toEqual([utan]);
	});

	it('forCourse samlar alla elevers sessioner', async () => {
		const anna = await makeUser('anna');
		const bo = await makeUser('bo');
		const pkd = await makeCourse('PKD');
		await enrollments.enroll(db, anna.id, pkd.id);
		await enrollments.enroll(db, bo.id, pkd.id);
		await studySessions.add(db, anna.id, pkd.id, session());
		await studySessions.add(db, bo.id, pkd.id, session({ studiedOn: '2026-10-09' }));

		expect(await studySessions.forCourse(db, pkd.id)).toHaveLength(2);
		expect(await studySessions.forUserCourse(db, bo.id, pkd.id)).toHaveLength(1);
	});
});

describe('toSessionMap', () => {
	it('ger samma datumnyckel som gamla toDateString-formatet', () => {
		expect(studySessions.toLegacyDateKey('2026-10-08')).toBe('Thu_Oct_08_2026');
		expect(studySessions.toLegacyDateKey('2025-01-05')).toBe('Sun_Jan_05_2025');
	});

	it('grupperar per dag i graf-skriptens format', () => {
		const map = studySessions.toSessionMap([
			session({ minutes: 10, type: 'Lecture' }),
			session({ minutes: 20, type: 'Homework' }),
			session({ studiedOn: '2026-10-09', rating: 5 }),
		]);

		expect(Object.keys(map)).toEqual(['Thu_Oct_08_2026', 'Fri_Oct_09_2026']);
		expect(map['Thu_Oct_08_2026']).toHaveLength(2);
		expect(map['Fri_Oct_09_2026'][0]).toEqual({ time: 30, typeOfStudy: 'Lecture', gradeSess: 5, health: 3, mentalHealth: 3 });
	});
});
