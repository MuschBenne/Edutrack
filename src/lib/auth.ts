import * as authSessions from '../db/authSessions';
import * as pendingSignups from '../db/pendingSignups';
import * as users from '../db/users';
import { nowSeconds, randomToken, sha256Hex } from './tokens';

export const SESSION_COOKIE = 'session';
export const PENDING_COOKIE = 'pending_signup';
export const SESSION_DAYS = 30;
const PENDING_MINUTES = 15;

export const CLASSES = ['DV', 'IT', 'ES'] as const;

/** Det vi behöver ur Googles id-token. */
export type GoogleClaims = { sub: string; email: string; email_verified: boolean };

export type IssuedToken = { token: string; expiresAt: number };

export type GoogleLoginResult =
	| ({ kind: 'session' } & IssuedToken)
	| ({ kind: 'onboarding' } & IssuedToken)
	| { kind: 'error'; message: string };

export type OnboardingResult = ({ ok: true } & IssuedToken) | { ok: false; message: string };

/** Skapar en inloggningssession och städar bort utgångna samtidigt. */
export async function startSession(db: D1Database, userId: number): Promise<IssuedToken> {
	const now = nowSeconds();
	const token = randomToken();
	const expiresAt = now + SESSION_DAYS * 24 * 60 * 60;
	await authSessions.removeExpired(db, now);
	await authSessions.create(db, await sha256Hex(token), userId, expiresAt);
	return { token, expiresAt };
}

export async function userFromSessionToken(db: D1Database, token: string): Promise<users.User | null> {
	return authSessions.getUser(db, await sha256Hex(token), nowSeconds());
}

export async function endSession(db: D1Database, token: string): Promise<void> {
	await authSessions.remove(db, await sha256Hex(token));
}

/**
 * Steget efter att Google bekräftat vem användaren är.
 * Känt Google-id ger en session. Annars mellanlagras id och e-post tills användaren valt namn och klass.
 */
export async function resolveGoogleLogin(db: D1Database, claims: GoogleClaims): Promise<GoogleLoginResult> {
	if (!claims.email_verified) {
		return { kind: 'error', message: 'Your Google account email is not verified.' };
	}

	const existing = await users.getByGoogleId(db, claims.sub);
	if (existing) {
		return { kind: 'session', ...(await startSession(db, existing.id)) };
	}

	const token = randomToken();
	const expiresAt = nowSeconds() + PENDING_MINUTES * 60;
	await pendingSignups.create(db, await sha256Hex(token), { googleId: claims.sub, email: claims.email }, expiresAt);
	return { kind: 'onboarding', token, expiresAt };
}

export async function getPendingSignup(db: D1Database, token: string): Promise<pendingSignups.PendingSignup | null> {
	return pendingSignups.get(db, await sha256Hex(token), nowSeconds());
}

/** Samma regel som gamla registreringen: 5–20 tecken. Begränsat teckenurval eftersom namnet visas för admin. */
export function validateUsername(username: string): string | null {
	if (username.length < 5 || username.length > 20) return 'Username has to be 5–20 characters.';
	if (!/^[\p{L}\p{N}_.-]+$/u.test(username)) return 'Username can only contain letters, digits, _ . and -.';
	return null;
}

/** @param adminEmails Kommaseparerad lista från secreten ADMIN_EMAILS. */
export function isAdminEmail(adminEmails: string | undefined, email: string): boolean {
	return (adminEmails ?? '')
		.split(',')
		.map((e) => e.trim().toLowerCase())
		.includes(email.toLowerCase());
}

/** Skapar kontot från en påbörjad registrering och loggar in användaren. */
export async function completeOnboarding(
	db: D1Database,
	pendingToken: string,
	input: { username: string; class: string },
	adminEmails: string | undefined,
): Promise<OnboardingResult> {
	const pendingHash = await sha256Hex(pendingToken);
	const pending = await pendingSignups.get(db, pendingHash, nowSeconds());
	if (!pending) return { ok: false, message: 'Your sign-in has expired. Please sign in with Google again.' };

	const username = input.username.trim();
	const usernameError = validateUsername(username);
	if (usernameError) return { ok: false, message: usernameError };
	if (!(CLASSES as readonly string[]).includes(input.class)) return { ok: false, message: 'Please pick a programme.' };

	const user = await users.create(db, {
		googleId: pending.googleId,
		username,
		email: pending.email,
		class: input.class,
		isAdmin: isAdminEmail(adminEmails, pending.email),
	});
	if (!user) {
		// create() säger inte vilken UNIQUE-kolumn som krockade, så kolla den användaren kan påverka
		return (await users.getByUsername(db, username))
			? { ok: false, message: 'That username is already taken.' }
			: { ok: false, message: 'This Google account or email already has an account. Try logging in.' };
	}

	await pendingSignups.remove(db, pendingHash);
	return { ok: true, ...(await startSession(db, user.id)) };
}
