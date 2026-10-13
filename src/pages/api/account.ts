import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import * as users from '../../db/users';
import { SESSION_COOKIE } from '../../lib/auth';
import { readForm } from '../../lib/form';

/** Raderar det inloggade kontot. Användarnamnet måste skrivas in som bekräftelse. */
export const POST: APIRoute = async ({ locals, request, redirect, cookies }) => {
	const user = locals.user;
	if (!user) return redirect('/login', 303);

	const form = await readForm(request);
	if (String(form?.get('confirm') ?? '').trim() !== user.username) return redirect('/app/account?error=confirm#delete', 303);

	// CASCADE tar kursregistreringar, studiesessioner, slutbetyg och inloggningar; skapade kurser blir kvar utan skapare
	await users.remove(env.DB, user.id);
	cookies.delete(SESSION_COOKIE, { path: '/' });
	return redirect('/login?deleted=1', 303);
};
