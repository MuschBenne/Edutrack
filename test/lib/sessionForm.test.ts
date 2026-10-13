import { describe, expect, it } from 'vitest';
import { parseSessionForm } from '../../src/lib/sessionForm';

function form(values: Record<string, string>) {
	const f = new FormData();
	const base = { minutes: '45', type: 'Lecture', rating: '4', health: '3', mentalHealth: '5' };
	for (const [k, v] of Object.entries({ ...base, ...values })) f.set(k, v);
	return f;
}

describe('parseSessionForm', () => {
	it('godkänner ett giltigt formulär', () => {
		expect(parseSessionForm(form({}))).toEqual({
			ok: true,
			value: { minutes: 45, type: 'Lecture', rating: 4, health: 3, mentalHealth: 5 },
		});
	});

	it('ger rätt felkod', () => {
		expect(parseSessionForm(form({ minutes: '' }))).toEqual({ ok: false, error: 'minutes' });
		expect(parseSessionForm(form({ minutes: '1.5' }))).toEqual({ ok: false, error: 'minutes' });
		expect(parseSessionForm(form({ minutes: '1441' }))).toEqual({ ok: false, error: 'minutes' });
		expect(parseSessionForm(form({ type: 'Sleeping' }))).toEqual({ ok: false, error: 'type' });
		expect(parseSessionForm(form({ rating: '6' }))).toEqual({ ok: false, error: 'scale' });
		expect(parseSessionForm(form({ health: '0' }))).toEqual({ ok: false, error: 'scale' });
	});
});
