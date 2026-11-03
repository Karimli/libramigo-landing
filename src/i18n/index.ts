import { languages, defaultLang, codes, storageKey } from './languages.mjs';

export { languages, defaultLang, codes, storageKey };
export type Lang = string;
export type Dict = Record<string, string>;

type Nested = { [key: string]: string | Nested };

const modules = import.meta.glob<{ default: Nested }>('./*.json', { eager: true });

function flatten(obj: Nested, prefix = ''): Dict {
  const out: Dict = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[key] = v;
    else Object.assign(out, flatten(v, key));
  }
  return out;
}

export const dictionaries: Record<Lang, Dict> = {};
for (const code of codes) {
  const mod = modules[`./${code}.json`];
  if (!mod) {
    console.warn(`[i18n] Missing dictionary file src/i18n/${code}.json`);
    continue;
  }
  dictionaries[code] = flatten(mod.default);
}

// Build-time check: every dictionary must have exactly the keys of the default one.
(function validate() {
  const base = dictionaries[defaultLang] ?? {};
  const baseKeys = new Set(Object.keys(base));
  for (const code of codes) {
    if (code === defaultLang || !dictionaries[code]) continue;
    const keys = new Set(Object.keys(dictionaries[code]));
    const missing = [...baseKeys].filter((k) => !keys.has(k));
    const extra = [...keys].filter((k) => !baseKeys.has(k));
    if (missing.length) console.warn(`[i18n] ${code}.json is missing keys: ${missing.join(', ')}`);
    if (extra.length) console.warn(`[i18n] ${code}.json has keys not in ${defaultLang}.json: ${extra.join(', ')}`);
  }
})();

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && codes.includes(value);
}

export function t(lang: Lang, key: string): string {
  const value = dictionaries[lang]?.[key] ?? dictionaries[defaultLang]?.[key];
  if (value === undefined) {
    console.warn(`[i18n] Unknown key "${key}" (${lang})`);
    return key;
  }
  return value;
}

export function useTranslations(lang: Lang) {
  return (key: string) => t(lang, key);
}
