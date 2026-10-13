import { describe, expect, it } from 'vitest';
import { normalizeCode, parseCourseForm } from '../../src/lib/courseForm';
import { termFor, termOptions } from '../../src/lib/terms';

function form(values: Record<string, string>) {
	const f = new FormData();
	for (const [k, v] of Object.entries({ code: '1dl 201', term: 'HT26', name: '  Program  design ', gradingScale: 'UGVG', ...values })) f.set(k, v);
	return f;
}

describe('terms', () => {
	it('termFor och termOptions över årsskiften', () => {
		expect(termFor('2026-06-30')).toBe('VT26');
		expect(termFor('2026-07-01')).toBe('HT26');
		expect(termOptions('2026-10-13')).toEqual(['VT26', 'HT26', 'VT27']);
		expect(termOptions('2027-02-01')).toEqual(['HT26', 'VT27', 'HT27']);
		expect(termOptions('2000-01-10')).toEqual(['HT99', 'VT00', 'HT00']);
	});
});

describe('parseCourseForm', () => {
	it('normaliserar kod och namn', () => {
		expect(normalizeCode(' 1dl 201 ')).toBe('1DL201');
		expect(parseCourseForm(form({}), '2026-10-13')).toEqual({ ok: true, value: { code: '1DL201', term: 'HT26', name: 'Program design', gradingScale: 'UGVG' } });
	});

	it('ger rätt felkod', () => {
		const today = '2026-10-13';
		expect(parseCourseForm(form({ code: 'ab' }), today)).toEqual({ ok: false, error: 'code' });
		expect(parseCourseForm(form({ code: '1DL/201' }), today)).toEqual({ ok: false, error: 'code' });
		expect(parseCourseForm(form({ term: 'HT20' }), today)).toEqual({ ok: false, error: 'term' });
		expect(parseCourseForm(form({ name: 'ab' }), today)).toEqual({ ok: false, error: 'name' });
		expect(parseCourseForm(form({ gradingScale: 'X' }), today)).toEqual({ ok: false, error: 'scale' });
	});
});
