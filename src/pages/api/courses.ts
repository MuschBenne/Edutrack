import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import * as courses from '../../db/courses';
import * as enrollments from '../../db/enrollments';
import { parseCourseForm } from '../../lib/courseForm';
import { todayIso } from '../../lib/dates';
import { nowSeconds } from '../../lib/tokens';

/** Skapar en kurs, eller registrerar användaren på den befintliga om kod och termin redan finns. */
export const POST: APIRoute = async ({ locals, request, redirect }) => {
	const user = locals.user;
	if (!user) return redirect('/login', 303);

	const form = await request.formData();
	const parsed = parseCourseForm(form, todayIso());
	if (!parsed.ok) {
		const back = new URLSearchParams({
			error: parsed.error,
			code: String(form.get('code') ?? ''),
			term: String(form.get('term') ?? ''),
			name: String(form.get('name') ?? ''),
			gradingScale: String(form.get('gradingScale') ?? ''),
		});
		return redirect(`/app/register-course?${back}#add-course`, 303);
	}

	const { course, created } = await courses.findOrCreate(env.DB, {
		...parsed.value,
		universityId: user.universityId,
		createdBy: user.id,
		createdAt: nowSeconds(),
	});
	const enrolled = await enrollments.enroll(env.DB, user.id, course.id);

	// created: ny kurs; existing: fanns redan, nu registrerad; already: var redan registrerad
	const joined = created ? 'created' : enrolled ? 'existing' : 'already';
	return redirect(`/app/course/${course.id}?joined=${joined}`, 303);
};
