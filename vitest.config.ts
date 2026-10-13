import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig(async () => {
	// Läses i Node och skickas in som bindning, eftersom testerna körs i workerd utan filsystem
	const migrations = await readD1Migrations('./migrations');

	return {
		plugins: [
			cloudflareTest({
				// Ingen wrangler-konfig: Astros server-entrypoint behövs inte för att testa databaslagret
				miniflare: {
					compatibilityDate: '2026-10-06',
					d1Databases: ['DB'],
					bindings: { TEST_MIGRATIONS: migrations },
				},
			}),
		],
		test: {
			include: ['test/**/*.test.ts'],
			setupFiles: ['./test/setup.ts'],
		},
	};
});
