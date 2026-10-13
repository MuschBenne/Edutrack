import { describe, expect, it } from 'vitest';
import { addDays, formatMinutes, relativeDay, todayIso } from '../../src/lib/dates';

describe('dates', () => {
	it('todayIso använder svensk tid', () => {
		// 23:30 UTC den 12 oktober är 01:30 den 13 oktober i Stockholm (sommartid)
		expect(todayIso(new Date('2026-10-12T23:30:00Z'))).toBe('2026-10-13');
	});

	it('addDays hanterar månads- och årsskiften', () => {
		expect(addDays('2026-10-13', -6)).toBe('2026-10-07');
		expect(addDays('2026-03-02', -2)).toBe('2026-02-28');
		expect(addDays('2026-01-03', -6)).toBe('2025-12-28');
	});

	it('relativeDay och formatMinutes', () => {
		expect(relativeDay(null, '2026-10-13')).toBe('–');
		expect(relativeDay('2026-10-13', '2026-10-13')).toBe('Today');
		expect(relativeDay('2026-10-12', '2026-10-13')).toBe('Yesterday');
		expect(relativeDay('2026-10-01', '2026-10-13')).toBe('12 days ago');
		expect(formatMinutes(95)).toBe('1 h 35 min');
	});
});
