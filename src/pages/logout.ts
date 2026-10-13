import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { SESSION_COOKIE, endSession } from '../lib/auth';

export const GET: APIRoute = async ({ cookies, redirect }) => {
	const token = cookies.get(SESSION_COOKIE)?.value;
	if (token) await endSession(env.DB, token);
	cookies.delete(SESSION_COOKIE, { path: '/' });
	return redirect('/');
};
