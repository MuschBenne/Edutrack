import type { StudySession } from '../db/studySessions';
import { STUDY_TYPES, type StudyType, isStudyType } from './studyTypes';

/** Det graferna behöver; inga betyg eller hälsodata skickas till webbläsaren. */
export type ChartSession = { date: string; minutes: number; type: string };

export type TypeMinutes = Record<StudyType, number>;

export function toChartSessions(sessions: Pick<StudySession, 'studiedOn' | 'minutes' | 'type'>[]): ChartSession[] {
	return sessions.map((s) => ({ date: s.studiedOn, minutes: s.minutes, type: s.type }));
}

function emptyTotals(): TypeMinutes {
	return Object.fromEntries(Object.keys(STUDY_TYPES).map((t) => [t, 0])) as TypeMinutes;
}

/** Minuter per studietyp. Okända typer räknas inte. */
export function minutesByType(sessions: ChartSession[]): TypeMinutes {
	const totals = emptyTotals();
	for (const s of sessions) if (isStudyType(s.type)) totals[s.type] += s.minutes;
	return totals;
}

/** ISO 8601-vecka för 'YYYY-MM-DD'. UTC hela vägen, så att webbläsarens tidszon och sommartid inte påverkar. */
export function isoWeek(isoDate: string): { year: number; week: number } {
	const [y, m, d] = isoDate.split('-').map(Number);
	const date = new Date(Date.UTC(y, m - 1, d));
	// Veckan hör till det år dess torsdag ligger i
	date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
	const year = date.getUTCFullYear();
	const week = Math.ceil(((date.getTime() - Date.UTC(year, 0, 1)) / 86_400_000 + 1) / 7);
	return { year, week };
}

/** Minuter per studietyp och vecka, äldsta veckan först. Veckor utan sessioner tas inte med. */
export function minutesByWeek(sessions: ChartSession[]): { year: number; week: number; minutes: TypeMinutes }[] {
	const weeks = new Map<string, { year: number; week: number; minutes: TypeMinutes }>();
	for (const s of sessions) {
		if (!isStudyType(s.type)) continue;
		const { year, week } = isoWeek(s.date);
		// Nyckeln innehåller året så att v41 2026 och v41 2027 inte slås ihop
		const key = `${year}-${String(week).padStart(2, '0')}`;
		let entry = weeks.get(key);
		if (!entry) weeks.set(key, (entry = { year, week, minutes: emptyTotals() }));
		entry.minutes[s.type] += s.minutes;
	}
	return [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
}
