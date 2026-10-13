import { env } from 'cloudflare:workers';
import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE, userFromSessionToken } from './lib/auth';

const LOGIN_REQUIRED = ['/app', '/admin', '/api/admin'];
const ADMIN_ONLY = ['/admin', '/api/admin'];

// Ingen inramning (clickjacking), formulär bara till egen domän, ingen MIME-gissning och ingen fullständig URL i Referer till andra sajter
const SECURITY_HEADERS = {
	'Content-Security-Policy': "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
	'X-Frame-Options': 'DENY',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
};

const matches = (path: string, prefixes: string[]) => prefixes.some((p) => path === p || path.startsWith(p + '/'));

export const onRequest = defineMiddleware(async (ctx, next) => {
	ctx.locals.user = null;

	const token = ctx.cookies.get(SESSION_COOKIE)?.value;
	// Utan cookie behövs ingen databasfråga, så anonyma besök kostar inget mot D1
	if (token) {
		ctx.locals.user = await userFromSessionToken(env.DB, token);
		if (!ctx.locals.user) ctx.cookies.delete(SESSION_COOKIE, { path: '/' });
	}

	const path = ctx.url.pathname;
	let response: Response;
	if (matches(path, LOGIN_REQUIRED) && !ctx.locals.user) response = ctx.redirect('/login');
	else if (matches(path, ADMIN_ONLY) && !ctx.locals.user?.isAdmin) response = new Response('Access denied, admins only!', { status: 403 });
	else response = await next();

	// Kopia, eftersom headers på vissa svar (t.ex. Response.redirect) inte går att ändra
	const secured = new Response(response.body, response);
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) secured.headers.set(name, value);
	return secured;
});
