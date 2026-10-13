declare namespace App {
	interface Locals {
		user: import('./db/users').User | null;
	}
}

// Secrets från .dev.vars lokalt och `wrangler secret put` i produktion
declare namespace Cloudflare {
	interface Env {
		GOOGLE_CLIENT_ID: string;
		GOOGLE_CLIENT_SECRET: string;
		ADMIN_EMAILS?: string;
	}
}
