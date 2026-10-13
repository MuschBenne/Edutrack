import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import * as courses from '../../db/courses';
import * as enrollments from '../../db/enrollments';
import * as studySessions from '../../db/studySessions';
import { todayIso } from '../../lib/dates';
import { parseSessionForm } from '../../lib/sessionForm';

/** Sparar en studiesession från formuläret på kurssidan och skickar tillbaka dit. */
export const POST: APIRoute = async ({ locals, request, redirect }) => {
	if (!locals.user) return redirect('/login', 303);

	const form = await request.formData();
	const courseId = String(form.get('courseId') ?? '');
	const back = `/app/course/${encodeURIComponent(courseId)}`;

	const parsed = parseSessionForm(form);
	if (!parsed.ok) return redirect(`${back}?error=${parsed.error}#add-session`, 303);

	const saved = await studySessions.add(env.DB, locals.user.id, courseId, { ...parsed.value, studiedOn: todayIso() });
	if (!saved) return redirect(`${back}?error=enrollment#add-session`, 303);

	// 303 så att webbläsaren gör GET och en omladdning inte skickar formuläret igen
	return redirect(`${back}?saved#add-session`, 303);
};

/** Användarens sessioner i en kurs, i graf-skriptens format. Används av fetchGraphData i graph_logic.js. */
export const GET: APIRoute = async ({ locals, url }) => {
	if (!locals.user) return Response.json({ message: 'Not logged in' }, { status: 401 });

	const courseId = url.searchParams.get('courseId') ?? '';
	const course = await courses.get(env.DB, courseId);
	if (!course || !(await enrollments.isEnrolled(env.DB, locals.user.id, courseId))) {
		return Response.json({ message: 'Course not found' }, { status: 404 });
	}

	const sessions = await studySessions.forUserCourse(env.DB, locals.user.id, courseId);
	return Response.json({ courseId, name: course.name, sessions: studySessions.toSessionMap(sessions) });
};
