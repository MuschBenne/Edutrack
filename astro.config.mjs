// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // Alla sidor renderas per anrop; navigeringen beror på om man är inloggad
  output: 'server',
  adapter: cloudflare(),
  // Gamla adresser från Express-versionen
  redirects: {
    '/register': '/login',
  },
});