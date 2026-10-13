import { termOptions } from './terms';

/** '1dl 201' → '1DL201', så att samma kod alltid blir samma kurs. */
export function normalizeCode(code: string): string {
	return code.replace(/\s+/g, '').toUpperCase();
}

export const COURSE_ERRORS = {
	code: 'Course code has to be 3–12 letters, digits or dashes, e.g. 1DL201.',
	term: 'Pick a term.',
	name: 'Course name has to be 3–100 characters.',
} as const;

export type CourseError = keyof typeof COURSE_ERRORS;
export type CourseInput = { code: string; term: string; name: string };

export function parseCourseForm(form: FormData, today: string): { ok: true; value: CourseInput } | { ok: false; error: CourseError } {
	const code = normalizeCode(String(form.get('code') ?? ''));
	if (!/^[A-Z0-9-]{3,12}$/.test(code)) return { ok: false, error: 'code' };

	const term = String(form.get('term') ?? '');
	if (!termOptions(today).includes(term)) return { ok: false, error: 'term' };

	// Flera mellanslag i rad slås ihop så att namnen ser likadana ut i listorna
	const name = String(form.get('name') ?? '').trim().replace(/\s+/g, ' ');
	if (name.length < 3 || name.length > 100) return { ok: false, error: 'name' };

	return { ok: true, value: { code, term, name } };
}
