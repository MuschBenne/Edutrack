import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { SESSION_COOKIE, endSession } from '../lib/auth';

// POST (inte GET) så att en länk från en annan sajt inte kan logga ut någon; Astros Origin-kontroll stoppar cross-site-POST
export const POST: APIRoute = async ({ cookies, redirect }) => {
	const token = cookies.get(SESSION_COOKIE)?.value;
	if (token) await endSession(env.DB, token);
	cookies.delete(SESSION_COOKIE, { path: '/' });
	return redirect('/', 303);
};
