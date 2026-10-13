import type { AstroCookies } from 'astro';
import { type IssuedToken, SESSION_COOKIE } from './auth';

/** HttpOnly + SameSite=Lax: skripten kan inte läsa cookien, och den skickas inte med från andra sajters formulär. */
export function cookieOptions(expiresAt?: number) {
	return {
		path: '/',
		httpOnly: true,
		secure: import.meta.env.PROD,
		sameSite: 'lax' as const,
		...(expiresAt ? { expires: new Date(expiresAt * 1000) } : {}),
	};
}

export function setSessionCookie(cookies: AstroCookies, session: IssuedToken): void {
	cookies.set(SESSION_COOKIE, session.token, cookieOptions(session.expiresAt));
}
