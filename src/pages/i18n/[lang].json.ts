import type { APIRoute } from 'astro';
import { codes, dictionaries } from '../../i18n';

// Pre-rendered flat dictionaries used by the client-side language switch.
export function getStaticPaths() {
  return codes.map((lang) => ({ params: { lang } }));
}

export const GET: APIRoute = ({ params }) =>
  new Response(JSON.stringify(dictionaries[params.lang!]), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
