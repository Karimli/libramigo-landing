// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // TODO: set the production domain once it is decided (needed for hreflang/OG absolute URLs).
  // site: 'https://example.az',
  trailingSlash: 'never',
  build: { format: 'directory' },
  i18n: {
    locales: ['az', 'ru', 'en'],
    defaultLocale: 'az',
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
});
