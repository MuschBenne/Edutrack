import { describe, expect, it } from 'vitest';
import * as auth from '../../src/lib/auth';
import { nowSeconds, sha256Hex } from '../../src/lib/tokens';
import { db, makeUser } from '../helpers';

// Googles svar mockas genom att claims skickas in direkt; själva kod-utbytet i lib/google.ts testas inte här
const claims = (overrides: Partial<auth.GoogleClaims> = {}): auth.GoogleClaims => ({
	sub: 'google-ny',
	email: 'ny@example.com',
	email_verified: true,
	...overrides,
});

async function startOnboarding(c = claims()) {
	const result = await auth.resolveGoogleLogin(db, c);
	if (result.kind !== 'onboarding') throw new Error(`Väntade onboarding, fick ${result.kind}`);
	return result.token;
}

describe('resolveGoogleLogin', () => {
	it('känt Google-id ger en session för rätt användare', async () => {
		const anna = await makeUser('anna');
		const result = await auth.resolveGoogleLogin(db, claims({ sub: 'google-anna', email: 'anna@example.com' }));

		expect(result.kind).toBe('session');
		if (result.kind !== 'session') return;
		expect(await auth.userFromSessionToken(db, result.token)).toEqual(anna);
	});

	it('nytt Google-id leder till onboarding utan att skapa användare', async () => {
		const token = await startOnboarding();

		expect(await auth.getPendingSignup(db, token)).toEqual({ googleId: 'google-ny', email: 'ny@example.com' });
		expect(await db.prepare('SELECT COUNT(*) AS n FROM users').first('n')).toBe(0);
	});

	it('nekar overifierad e-post', async () => {
		expect((await auth.resolveGoogleLogin(db, claims({ email_verified: false }))).kind).toBe('error');
	});
});

describe('completeOnboarding', () => {
	it('skapar kontot, loggar in och förbrukar registreringen', async () => {
		const token = await startOnboarding();
		const result = await auth.completeOnboarding(db, token, { username: 'nyanvändare', class: 'IT' }, undefined);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		const user = await auth.userFromSessionToken(db, result.token);
		expect(user).toMatchObject({ username: 'nyanvändare', class: 'IT', email: 'ny@example.com', isAdmin: false });
		expect(await auth.getPendingSignup(db, token)).toBeNull();
	});

	it('ger admin till adresser i ADMIN_EMAILS, oavsett versaler och mellanslag', async () => {
		const token = await startOnboarding(claims({ email: 'Admin@Example.com' }));
		const result = await auth.completeOnboarding(db, token, { username: 'adminen', class: 'DV' }, 'annan@x.se, admin@example.com');

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect((await auth.userFromSessionToken(db, result.token))?.isAdmin).toBe(true);
	});

	it('validerar användarnamn och programme', async () => {
		const token = await startOnboarding();

		expect(await auth.completeOnboarding(db, token, { username: 'kort', class: 'DV' }, undefined)).toMatchObject({ ok: false });
		expect(await auth.completeOnboarding(db, token, { username: 'har mellanslag', class: 'DV' }, undefined)).toMatchObject({ ok: false });
		expect(await auth.completeOnboarding(db, token, { username: 'giltigt', class: 'XX' }, undefined)).toMatchObject({ ok: false });
		// Misslyckade försök förbrukar inte registreringen
		expect(await auth.getPendingSignup(db, token)).not.toBeNull();
	});

	it('nekar upptaget användarnamn', async () => {
		await makeUser('upptaget');
		const token = await startOnboarding();

		expect(await auth.completeOnboarding(db, token, { username: 'upptaget', class: 'DV' }, undefined)).toEqual({
			ok: false,
			message: 'That username is already taken.',
		});
	});

	it('nekar okänd eller utgången registrering', async () => {
		expect(await auth.completeOnboarding(db, 'påhittad', { username: 'giltigt', class: 'DV' }, undefined)).toMatchObject({ ok: false });

		const token = await startOnboarding();
		await db.prepare('UPDATE pending_signups SET expires_at = ?').bind(nowSeconds() - 1).run();
		expect(await auth.completeOnboarding(db, token, { username: 'giltigt', class: 'DV' }, undefined)).toMatchObject({ ok: false });
	});
});

describe('sessioner', () => {
	it('sparar bara hashen av token i databasen', async () => {
		const anna = await makeUser('anna');
		const { token } = await auth.startSession(db, anna.id);

		const stored = await db.prepare('SELECT id FROM auth_sessions').first<string>('id');
		expect(stored).toBe(await sha256Hex(token));
		expect(stored).not.toBe(token);
	});

	it('utloggning och utgång gör token ogiltig', async () => {
		const anna = await makeUser('anna');
		const first = await auth.startSession(db, anna.id);
		await auth.endSession(db, first.token);
		expect(await auth.userFromSessionToken(db, first.token)).toBeNull();

		const second = await auth.startSession(db, anna.id);
		await db.prepare('UPDATE auth_sessions SET expires_at = ?').bind(nowSeconds() - 1).run();
		expect(await auth.userFromSessionToken(db, second.token)).toBeNull();
	});

	it('ny inloggning städar bort utgångna sessioner', async () => {
		const anna = await makeUser('anna');
		await auth.startSession(db, anna.id);
		await db.prepare('UPDATE auth_sessions SET expires_at = ?').bind(nowSeconds() - 1).run();
		await auth.startSession(db, anna.id);

		expect(await db.prepare('SELECT COUNT(*) AS n FROM auth_sessions').first('n')).toBe(1);
	});
});
