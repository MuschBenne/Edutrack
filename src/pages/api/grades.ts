import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import * as courses from '../../db/courses';
import * as enrollments from '../../db/enrollments';
import { isGradeOnScale } from '../../lib/grades';
import { parseId } from '../../lib/ids';

/** Sparar eller tar bort elevens slutbetyg från kortet på kurssidan. */
export const POST: APIRoute = async ({ locals, request, redirect }) => {
	const user = locals.user;
	if (!user) return redirect('/login', 303);

	const form = await request.formData();
	const courseId = parseId(form.get('courseId'));
	const course = courseId ? await courses.get(env.DB, courseId) : null;
	if (!course) return redirect('/app', 303);
	const back = `/app/course/${course.id}`;

	// Tomt val betyder "inte betygsatt än"
	const grade = String(form.get('grade') ?? '') || null;
	if (grade !== null && !isGradeOnScale(course.gradingScale, grade)) return redirect(`${back}?grade=invalid#final-grade`, 303);

	const saved = await enrollments.setFinalGrade(env.DB, user.id, course.id, grade);
	return redirect(`${back}?grade=${saved ? (grade ? 'saved' : 'cleared') : 'invalid'}#final-grade`, 303);
};
