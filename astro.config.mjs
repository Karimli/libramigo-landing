// @ts-check
import { defineConfig } from 'astro/config';
import { languages, defaultLang } from './src/i18n/languages.mjs';

export default defineConfig({
  // Production domain. Used for absolute canonical/hreflang/Open Graph URLs.
  site: process.env.SITE_URL || 'https://libramigo.az',
  trailingSlash: 'never',
  // 'file' emits az.html etc. GitHub Pages serves /az from az.html without a
  // redirect to /az/, so URLs stay identical to the ones the language switch pushes.
  build: { format: 'file' },
  i18n: {
    locales: languages.map((l) => l.code),
    defaultLocale: defaultLang,
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
});
