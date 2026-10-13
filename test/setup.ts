import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeEach } from 'vitest';

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);

// Tom databas inför varje test, utom lärosätena från migreringen. Resten följer med via ON DELETE CASCADE.
beforeEach(async () => {
	await env.DB.batch([
		env.DB.prepare('DELETE FROM users'),
		env.DB.prepare('DELETE FROM courses'),
		env.DB.prepare("DELETE FROM universities WHERE name LIKE 'Test %'"),
	]);
});
