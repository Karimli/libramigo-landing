// @ts-check
import { defineConfig } from 'astro/config';
import { languages, defaultLang } from './src/i18n/languages.mjs';

export default defineConfig({
  // Production domain (not decided yet). Needed for absolute canonical/hreflang/Open Graph URLs.
  site: process.env.SITE_URL || undefined,
  trailingSlash: 'never',
  build: { format: 'directory' },
  i18n: {
    locales: languages.map((l) => l.code),
    defaultLocale: defaultLang,
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
});
