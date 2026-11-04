// Switches the page language without a reload (progressive enhancement).
// Without JS the language links are plain <a href="/ru"> links to pre-rendered pages.
import { languages, codes, defaultLang, storageKey } from '../i18n/languages.mjs';

type Dict = Record<string, string>;

const FADE_MS = 180;
const root = document.documentElement;
const cache = new Map<string, Promise<Dict>>();
let current = root.lang;
let token = 0;

function load(lang: string): Promise<Dict> {
  let p = cache.get(lang);
  if (!p) {
    p = fetch(`/i18n/${lang}.json`).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<Dict>;
    });
    p.catch(() => cache.delete(lang));
    cache.set(lang, p);
  }
  return p;
}

function langFromPath(pathname: string): string {
  const seg = pathname.split('/')[1] ?? '';
  return codes.includes(seg) ? seg : defaultLang;
}

function remember(lang: string) {
  try {
    localStorage.setItem(storageKey, lang);
  } catch {
    /* storage unavailable: ignore */
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function render(lang: string, dict: Dict) {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const value = dict[el.dataset.i18n!];
    if (value !== undefined) el.textContent = value;
  });
  // data-i18n-attr="placeholder:waitlist.placeholder;aria-label:nav.langLabel"
  document.querySelectorAll<HTMLElement>('[data-i18n-attr]').forEach((el) => {
    for (const pair of el.dataset.i18nAttr!.split(';')) {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      const value = attr && key ? dict[key] : undefined;
      if (value !== undefined) el.setAttribute(attr!, value);
    }
  });
  document.querySelectorAll<HTMLInputElement>('input[data-i18n-lang]').forEach((el) => (el.value = lang));
  document.querySelectorAll<HTMLAnchorElement>('a[data-lang-link]').forEach((a) => {
    if (a.dataset.langLink === lang) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  });
  const label = languages.find((l) => l.code === lang)?.label ?? lang.toUpperCase();
  document.querySelectorAll<HTMLElement>('[data-lang-current]').forEach((el) => (el.textContent = label));
  // canonical / og:url: swap the trailing language segment
  document.querySelectorAll<HTMLElement>('[data-lang-url]').forEach((el) => {
    const attr = el.hasAttribute('href') ? 'href' : 'content';
    el.setAttribute(attr, el.getAttribute(attr)!.replace(/\/[^/]+$/, `/${lang}`));
  });
  root.lang = lang;
  if (dict['meta.title']) document.title = dict['meta.title'];
}

function announce(dict: Dict, lang: string) {
  const el = document.querySelector<HTMLElement>('[data-i18n-announcer]');
  const name = languages.find((l) => l.code === lang)?.name ?? lang;
  if (el && dict['i18n.changed']) el.textContent = dict['i18n.changed'].replace('{language}', name);
}

async function switchTo(lang: string, push: boolean) {
  if (lang === current) return;
  const my = ++token;
  let dict: Dict;
  try {
    dict = await load(lang);
  } catch {
    location.assign(`/${lang}${location.hash}`); // network failed: fall back to a full page load
    return;
  }
  if (my !== token) return; // a newer switch started meanwhile

  const animate = !reducedMotion();
  if (animate) {
    root.classList.add('i18n-out');
    await wait(FADE_MS);
    if (my !== token) return;
  }
  render(lang, dict);
  current = lang;
  if (push) history.pushState({ lang }, '', `/${lang}${location.hash}`);
  announce(dict, lang);
  window.dispatchEvent(new CustomEvent('libramigo:langchange', { detail: { lang, dict } }));
  if (animate) requestAnimationFrame(() => root.classList.remove('i18n-out'));
}

document.addEventListener('click', (e) => {
  const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[data-lang-link]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  const lang = a.dataset.langLink!;
  remember(lang);
  void switchTo(lang, true);
});

window.addEventListener('popstate', () => void switchTo(langFromPath(location.pathname), false));

history.replaceState({ lang: current }, '');

// Reserve space: elements marked data-i18n-reserve get the height of their longest
// translation at the current width, so switching language never shifts the layout.
// Phones skip it (owner request): the extra space looked like a gap there.
const noReserve = matchMedia('(max-width: 760px)');
async function reserve() {
  const els = [...document.querySelectorAll<HTMLElement>('[data-i18n-reserve]')];
  if (!els.length) return;
  if (noReserve.matches) {
    els.forEach((el) => (el.style.minHeight = ''));
    return;
  }
  let dicts: Dict[];
  try {
    dicts = await Promise.all(codes.map(load));
  } catch {
    return;
  }
  for (const el of els) {
    el.style.minHeight = '';
    const probe = el.cloneNode(false) as HTMLElement;
    probe.removeAttribute('data-i18n');
    probe.removeAttribute('data-i18n-reserve');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;left:0;top:0;width:${el.clientWidth}px;min-height:0;height:auto;animation:none;transform:none;`;
    el.after(probe);
    let max = 0;
    for (const d of dicts) {
      probe.textContent = d[el.dataset.i18n!] ?? el.textContent;
      max = Math.max(max, probe.offsetHeight);
    }
    probe.remove();
    el.style.minHeight = `${max}px`;
  }
}
let raf = 0;
const scheduleReserve = () => {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => void reserve());
};
window.addEventListener('resize', scheduleReserve);
document.fonts?.ready.then(scheduleReserve);

// Warm the cache so switching is instant.
const prefetch = () => {
  codes.forEach((c) => void load(c).catch(() => {}));
  scheduleReserve();
};
if ('requestIdleCallback' in window) requestIdleCallback(prefetch, { timeout: 2000 });
else setTimeout(prefetch, 1000);
