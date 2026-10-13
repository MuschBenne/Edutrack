import type { StudySession } from '../db/studySessions';
import { isStudyType } from './studyTypes';

export type SessionInput = Omit<StudySession, 'studiedOn'>;

const MAX_MINUTES = 24 * 60;

/** Felkoderna skickas i URL:en efter en omdirigering, så att ingen fritext kan smugglas in på sidan. */
export const SESSION_ERRORS = {
	minutes: 'Enter the duration as a whole number of minutes, between 1 and 1440.',
	type: 'Pick a type of study.',
	scale: 'Pick a value from 1 to 5 for each scale.',
	enrollment: 'You are not registered to this course.',
} as const;

export type SessionError = keyof typeof SESSION_ERRORS;

/** Heltal inom [min, max], annars null. Number('') blir 0, så tomma fält fångas av min-gränsen. */
function intInRange(value: FormDataEntryValue | null, min: number, max: number): number | null {
	const n = Number(value);
	return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

/** Validerar formuläret för en ny studiesession. */
export function parseSessionForm(form: FormData): { ok: true; value: SessionInput } | { ok: false; error: SessionError } {
	const minutes = intInRange(form.get('minutes'), 1, MAX_MINUTES);
	if (minutes === null) return { ok: false, error: 'minutes' };

	const type = String(form.get('type') ?? '');
	if (!isStudyType(type)) return { ok: false, error: 'type' };

	const rating = intInRange(form.get('rating'), 1, 5);
	const health = intInRange(form.get('health'), 1, 5);
	const mentalHealth = intInRange(form.get('mentalHealth'), 1, 5);
	if (rating === null || health === null || mentalHealth === null) {
		return { ok: false, error: 'scale' };
	}

	return { ok: true, value: { minutes, type, rating, health, mentalHealth } };
}
