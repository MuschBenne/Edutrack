import { decodeIdToken, Google } from 'arctic';
import type { GoogleClaims } from './auth';

export const STATE_COOKIE = 'google_oauth_state';
export const VERIFIER_COOKIE = 'google_code_verifier';

export function googleClient(env: Cloudflare.Env, origin: string): Google {
	if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
		throw new Error('GOOGLE_CLIENT_ID och GOOGLE_CLIENT_SECRET saknas. Lägg dem i .dev.vars lokalt.');
	}
	// Samma kod fungerar lokalt och i produktion; båda adresserna måste finnas i Google Cloud Console
	return new Google(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, `${origin}/api/auth/google/callback`);
}

/**
 * Byter koden från Google mot användarens uppgifter.
 * Id-tokenets signatur kontrolleras inte: det kommer direkt från Googles token-endpoint över HTTPS, inte via webbläsaren.
 */
export async function claimsFromCode(google: Google, code: string, codeVerifier: string): Promise<GoogleClaims> {
	const tokens = await google.validateAuthorizationCode(code, codeVerifier);
	const claims = decodeIdToken(tokens.idToken()) as Partial<GoogleClaims>;
	if (typeof claims.sub !== 'string' || typeof claims.email !== 'string') {
		throw new Error('Google id token is missing sub or email');
	}
	return { sub: claims.sub, email: claims.email, email_verified: claims.email_verified === true };
}
