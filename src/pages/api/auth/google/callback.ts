import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { PENDING_COOKIE, resolveGoogleLogin } from '../../../../lib/auth';
import { cookieOptions, setSessionCookie } from '../../../../lib/cookies';
import { STATE_COOKIE, VERIFIER_COOKIE, claimsFromCode, googleClient } from '../../../../lib/google';

/** Google skickar tillbaka hit efter inloggningen. */
export const GET: APIRoute = async ({ cookies, redirect, url }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get(STATE_COOKIE)?.value;
	const codeVerifier = cookies.get(VERIFIER_COOKIE)?.value;
	cookies.delete(STATE_COOKIE, { path: '/' });
	cookies.delete(VERIFIER_COOKIE, { path: '/' });

	// Användaren avbröt hos Google (t.ex. error=access_denied)
	if (url.searchParams.has('error')) return redirect('/login?error=cancelled');
	if (!code || !state || !codeVerifier || state !== storedState) {
		return redirect('/login?error=state');
	}

	let claims;
	try {
		claims = await claimsFromCode(googleClient(env, url.origin), code, codeVerifier);
	} catch (err) {
		console.error('Google sign-in failed', err);
		return redirect('/login?error=google');
	}

	const result = await resolveGoogleLogin(env.DB, claims, env.ADMIN_EMAILS);
	switch (result.kind) {
		case 'session':
			setSessionCookie(cookies, result);
			return redirect('/app');
		case 'onboarding':
			cookies.set(PENDING_COOKIE, result.token, cookieOptions(result.expiresAt));
			return redirect('/onboarding');
		case 'error':
			return redirect('/login?error=unverified');
	}
};
