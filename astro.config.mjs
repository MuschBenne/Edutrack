// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // Alla sidor renderas per anrop; navigeringen beror på om man är inloggad
  output: 'server',
  // Appen använder varken Astro sessions eller astro:assets, så adaptern ska inte skapa KV- och Images-bindningar
  session: false,
  adapter: cloudflare({ imageService: 'passthrough' }),
  // Gamla adresser från Express-versionen
  redirects: {
    '/register': '/login',
  },
});