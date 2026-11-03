// Single source of truth for supported languages.
// To add a language: create `<code>.json` next to this file and add one line below.
/** @type {{ code: string, label: string, name: string }[]} */
export const languages = [
  { code: 'az', label: 'AZ', name: 'Azərbaycanca' },
  { code: 'ru', label: 'RU', name: 'Русский' },
  { code: 'en', label: 'EN', name: 'English' },
];

export const defaultLang = 'az';
export const storageKey = 'libramigo.lang';
export const codes = languages.map((l) => l.code);
