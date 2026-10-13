import { env } from 'cloudflare:workers';
import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE, userFromSessionToken } from './lib/auth';

const LOGIN_REQUIRED = ['/app', '/admin', '/api/admin'];
const ADMIN_ONLY = ['/admin', '/api/admin'];

const matches = (path: string, prefixes: string[]) => prefixes.some((p) => path === p || path.startsWith(p + '/'));

export const onRequest = defineMiddleware(async (ctx, next) => {
	ctx.locals.user = null;
	// Förrenderade sidor byggs utan request, så det finns ingen cookie att läsa
	if (ctx.isPrerendered) return next();

	const token = ctx.cookies.get(SESSION_COOKIE)?.value;
	// Utan cookie behövs ingen databasfråga, så anonyma besök kostar inget mot D1
	if (token) {
		ctx.locals.user = await userFromSessionToken(env.DB, token);
		if (!ctx.locals.user) ctx.cookies.delete(SESSION_COOKIE, { path: '/' });
	}

	const path = ctx.url.pathname;
	if (matches(path, LOGIN_REQUIRED) && !ctx.locals.user) return ctx.redirect('/login');
	if (matches(path, ADMIN_ONLY) && !ctx.locals.user?.isAdmin) {
		return new Response('Access denied, admins only!', { status: 403 });
	}

	return next();
});
