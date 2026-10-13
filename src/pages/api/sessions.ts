import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import * as studySessions from '../../db/studySessions';
import { todayIso } from '../../lib/dates';
import { readForm } from '../../lib/form';
import { parseId } from '../../lib/ids';
import { parseSessionForm } from '../../lib/sessionForm';

/** Sparar en studiesession från formuläret på kurssidan och skickar tillbaka dit. */
export const POST: APIRoute = async ({ locals, request, redirect }) => {
	if (!locals.user) return redirect('/login', 303);

	const form = await readForm(request);
	if (!form) return new Response('Expected a form', { status: 400 });
	const courseId = parseId(form.get('courseId'));
	if (!courseId) return redirect('/app', 303);
	const back = `/app/course/${courseId}`;

	const parsed = parseSessionForm(form);
	if (!parsed.ok) return redirect(`${back}?error=${parsed.error}#add-session`, 303);

	const saved = await studySessions.add(env.DB, locals.user.id, courseId, { ...parsed.value, studiedOn: todayIso() });
	// Kurssidan kräver registrering, så meddelandet visas på /app
	if (!saved) return redirect('/app?msg=notenrolled', 303);

	// 303 så att webbläsaren gör GET och en omladdning inte skickar formuläret igen
	return redirect(`${back}?saved#add-session`, 303);
};
