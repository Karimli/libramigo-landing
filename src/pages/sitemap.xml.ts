// sitemap.xml: one entry per language page, each listing its language alternates (hreflang).
// The root page (/) is a language redirect with noindex, so it is not listed.
import type { APIRoute } from 'astro';
import { languages, defaultLang } from '../i18n/languages.mjs';

export const GET: APIRoute = ({ site }) => {
  const url = (path: string) => new URL(path, site).href;
  const alternates = [
    ...languages.map((l) => `    <xhtml:link rel="alternate" hreflang="${l.code}" href="${url(`/${l.code}`)}"/>`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${url(`/${defaultLang}`)}"/>`,
  ].join('\n');
  const entries = languages
    .map((l) => `  <url>\n    <loc>${url(`/${l.code}`)}</loc>\n${alternates}\n  </url>`)
    .join('\n');
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    entries +
    '\n</urlset>\n';
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
