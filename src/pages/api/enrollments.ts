import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import * as enrollments from '../../db/enrollments';
import { readForm } from '../../lib/form';
import { parseId } from '../../lib/ids';

/** Registrerar användaren på en befintlig kurs från /app/register-course, eller avregistrerar från kurssidan. */
export const POST: APIRoute = async ({ locals, request, redirect }) => {
	const user = locals.user;
	if (!user) return redirect('/login', 303);

	const form = await readForm(request);
	if (!form) return new Response('Expected a form', { status: 400 });
	const courseId = parseId(form.get('courseId'));

	if (form.get('action') === 'unregister') {
		// Sessioner och slutbetyg försvinner med registreringen (ON DELETE CASCADE)
		const removed = courseId !== null && (await enrollments.unenroll(env.DB, user.id, courseId));
		return redirect(`/app?msg=${removed ? 'unregistered' : 'notenrolled'}`, 303);
	}

	if (courseId && ((await enrollments.enroll(env.DB, user.id, courseId)) || (await enrollments.isEnrolled(env.DB, user.id, courseId)))) {
		return redirect(`/app/course/${courseId}?joined=registered`, 303);
	}
	return redirect('/app/register-course?error=notfound', 303);
};
