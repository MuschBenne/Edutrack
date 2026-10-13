import { describe, expect, it } from 'vitest';
import { isoWeek, minutesByType, minutesByWeek, toChartSessions } from '../../src/lib/chartData';

describe('chartData', () => {
	it('ISO-veckor, även vid årsskiften', () => {
		expect(isoWeek('2026-10-08')).toEqual({ year: 2026, week: 41 });
		expect(isoWeek('2026-12-31')).toEqual({ year: 2026, week: 53 });
		expect(isoWeek('2027-01-03')).toEqual({ year: 2026, week: 53 }); // söndag hör till föregående års vecka
		expect(isoWeek('2027-01-04')).toEqual({ year: 2027, week: 1 });
		expect(isoWeek('2024-12-30')).toEqual({ year: 2025, week: 1 }); // måndag hör till nästa års vecka 1
	});

	it('samma veckonummer olika år blir olika veckor, i datumordning', () => {
		const weeks = minutesByWeek([
			{ date: '2027-10-12', minutes: 40, type: 'Lecture' },
			{ date: '2026-10-06', minutes: 10, type: 'Lecture' },
			{ date: '2027-10-05', minutes: 20, type: 'Labs' },
		]);

		expect(weeks.map((w) => [w.year, w.week, w.minutes.Lecture, w.minutes.Labs])).toEqual([
			[2026, 41, 10, 0],
			[2027, 40, 0, 20],
			[2027, 41, 40, 0],
		]);
	});

	it('summerar per typ och hoppar över okända typer', () => {
		const totals = minutesByType([
			{ date: '2026-10-08', minutes: 30, type: 'Lecture' },
			{ date: '2026-10-09', minutes: 15, type: 'Lecture' },
			{ date: '2026-10-09', minutes: 99, type: 'Sleeping' },
		]);

		expect(totals.Lecture).toBe(45);
		expect(Object.values(totals).reduce((a, b) => a + b)).toBe(45);
		expect(minutesByWeek([])).toEqual([]);
	});

	it('skickar inte betyg eller hälsodata till grafen', () => {
		const chart = toChartSessions([{ studiedOn: '2026-10-08', minutes: 30, type: 'Lecture', rating: 4, health: 2, mentalHealth: 1 } as never]);
		expect(chart).toEqual([{ date: '2026-10-08', minutes: 30, type: 'Lecture' }]);
	});
});
