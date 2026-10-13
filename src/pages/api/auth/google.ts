import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { generateCodeVerifier, generateState } from 'arctic';
import { cookieOptions } from '../../../lib/cookies';
import { STATE_COOKIE, VERIFIER_COOKIE, googleClient } from '../../../lib/google';

/** Skickar användaren till Googles inloggning. */
export const GET: APIRoute = ({ cookies, redirect, url }) => {
	// state skyddar mot att någon annan startar inloggningen; PKCE-verifieraren binder koden till den här webbläsaren
	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const authUrl = googleClient(env, url.origin).createAuthorizationURL(state, codeVerifier, ['openid', 'email', 'profile']);

	const tenMinutes = Math.floor(Date.now() / 1000) + 10 * 60;
	cookies.set(STATE_COOKIE, state, cookieOptions(tenMinutes));
	cookies.set(VERIFIER_COOKIE, codeVerifier, cookieOptions(tenMinutes));

	return redirect(authUrl.toString());
};
