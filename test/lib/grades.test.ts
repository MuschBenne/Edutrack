import { describe, expect, it } from 'vitest';
import { isGradeOnScale, isGradingScale } from '../../src/lib/grades';

describe('grades', () => {
	it('känner igen skalor och betyg på skalan', () => {
		expect(isGradingScale('U345')).toBe(true);
		expect(isGradingScale('toString')).toBe(false); // ärvda egenskaper räknas inte
		expect(isGradeOnScale('U345', '4')).toBe(true);
		expect(isGradeOnScale('U345', 'VG')).toBe(false);
		expect(isGradeOnScale('AF', 'Fx')).toBe(true);
	});
});
