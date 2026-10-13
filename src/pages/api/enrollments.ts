import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import * as enrollments from '../../db/enrollments';
import { parseId } from '../../lib/ids';

/** Registrerar användaren på en befintlig kurs från listan på /app/register-course. */
export const POST: APIRoute = async ({ locals, request, redirect }) => {
	const user = locals.user;
	if (!user) return redirect('/login', 303);

	const courseId = parseId((await request.formData()).get('courseId'));
	if (courseId && ((await enrollments.enroll(env.DB, user.id, courseId)) || (await enrollments.isEnrolled(env.DB, user.id, courseId)))) {
		return redirect(`/app/course/${courseId}?joined=registered`, 303);
	}
	return redirect('/app/register-course?error=notfound', 303);
};
