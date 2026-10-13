import { describe, expect, it } from 'vitest';
import * as enrollments from '../../src/db/enrollments';
import * as studySessions from '../../src/db/studySessions';
import { db, makeCourse, makeUser, session, sessionsOf } from '../helpers';

describe('studySessions', () => {
	it('sparar sessioner bara för registrerade elever', async () => {
		const anna = await makeUser('anna');
		const pkd = await makeCourse('PKD');
		const annan = await makeCourse('ANNAN');
		await enrollments.enroll(db, anna.id, pkd.id);

		expect(await studySessions.add(db, anna.id, pkd.id, session())).toBe(true);
		expect(await studySessions.add(db, anna.id, annan.id, session())).toBe(false);
		expect(await studySessions.add(db, anna.id, 999_999, session())).toBe(false);
		expect(await sessionsOf(anna.id, pkd.id)).toEqual([session()]);
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
		expect(await sessionsOf(anna.id, pkd.id)).toEqual([utan]);
	});

	it('admin-grafen får alla elevers sessioner men bara datum, minuter och typ', async () => {
		const anna = await makeUser('anna');
		const bo = await makeUser('bo');
		const pkd = await makeCourse('PKD');
		await enrollments.enroll(db, anna.id, pkd.id);
		await enrollments.enroll(db, bo.id, pkd.id);
		await studySessions.add(db, anna.id, pkd.id, session());
		await studySessions.add(db, bo.id, pkd.id, session({ studiedOn: '2026-10-09' }));

		const { results } = await studySessions.forCourseChartStatement(db, pkd.id).all();
		expect(results).toEqual([
			{ date: '2026-10-08', minutes: 30, type: 'Lecture' },
			{ date: '2026-10-09', minutes: 30, type: 'Lecture' },
		]);
		expect(await sessionsOf(bo.id, pkd.id)).toHaveLength(1);
	});
});
