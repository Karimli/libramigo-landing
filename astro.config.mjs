// @ts-check
import { defineConfig } from 'astro/config';
import { languages, defaultLang } from './src/i18n/languages.mjs';

export default defineConfig({
  // TODO: set the production domain once it is decided (needed for hreflang/OG absolute URLs).
  // site: 'https://example.az',
  trailingSlash: 'never',
  build: { format: 'directory' },
  i18n: {
    locales: languages.map((l) => l.code),
    defaultLocale: defaultLang,
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
});
