import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import * as courses from '../../db/courses';
import * as enrollments from '../../db/enrollments';
import { type CourseError, MAX_COURSES_PER_DAY, parseCourseForm } from '../../lib/courseForm';
import { todayIso } from '../../lib/dates';
import { readForm } from '../../lib/form';
import { nowSeconds } from '../../lib/tokens';

/** Skapar en kurs, eller registrerar användaren på den befintliga om kod och termin redan finns. */
export const POST: APIRoute = async ({ locals, request, redirect }) => {
	const user = locals.user;
	if (!user) return redirect('/login', 303);

	const form = await readForm(request);
	if (!form) return new Response('Expected a form', { status: 400 });

	// Skickar tillbaka inskrivna värden så att formuläret fylls i igen
	const fail = (error: CourseError | 'notfound') => {
		const back = new URLSearchParams({
			error,
			code: String(form.get('code') ?? ''),
			term: String(form.get('term') ?? ''),
			name: String(form.get('name') ?? ''),
			gradingScale: String(form.get('gradingScale') ?? ''),
		});
		return redirect(`/app/register-course?${back}#add-course`, 303);
	};

	const parsed = parseCourseForm(form, todayIso());
	if (!parsed.ok) return fail(parsed.error);
	const { code, term } = parsed.value;

	// Gränsen gäller bara nya kurser; att gå med i en befintlig går alltid
	const now = nowSeconds();
	const exists = await courses.find(env.DB, user.universityId, code, term);
	if (!exists && !user.isAdmin && (await courses.countCreatedSince(env.DB, user.id, now - 24 * 60 * 60)) >= MAX_COURSES_PER_DAY) {
		return fail('limit');
	}

	const result = await courses.findOrCreate(env.DB, { ...parsed.value, universityId: user.universityId, createdBy: user.id, createdAt: now });
	if (!result) return fail('notfound');
	const enrolled = await enrollments.enroll(env.DB, user.id, result.course.id);

	// created: ny kurs; existing: fanns redan, nu registrerad; already: var redan registrerad
	const joined = result.created ? 'created' : enrolled ? 'existing' : 'already';
	return redirect(`/app/course/${result.course.id}?joined=${joined}`, 303);
};
