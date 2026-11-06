// Waitlist form: validation, submission and success/error states.
// State lives in the DOM, so a language switch (which only swaps text) never resets it.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface WaitlistPayload {
  email: string;
  lang: string;
  source: 'landing';
  createdAt: string;
}

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

async function submit(endpoint: string, payload: WaitlistPayload): Promise<void> {
  if (!endpoint) {
    if (import.meta.env.DEV) {
      console.info('[waitlist] PUBLIC_WAITLIST_ENDPOINT not set – payload:', payload);
      return;
    }
    throw new Error('Waitlist endpoint is not configured');
  }
  // text/plain keeps this a CORS "simple request" (no preflight): Google Apps Script
  // web apps cannot answer OPTIONS. The body is still JSON.
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  // Apps Script always answers 200, so the outcome is in the body: { ok: boolean }.
  const data: unknown = await res.json().catch(() => null);
  if (!data || (data as { ok?: unknown }).ok !== true) throw new Error('Waitlist backend rejected the submission');
}

export function initWaitlist() {
  const form = document.querySelector<HTMLFormElement>('[data-waitlist-form]');
  const done = document.querySelector<HTMLElement>('[data-waitlist-done]');
  if (!form || !done) return;
  const input = form.querySelector<HTMLInputElement>('input[name="email"]')!;
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const errors = form.querySelectorAll<HTMLElement>('[data-error]');
  const endpoint = form.dataset.endpoint ?? '';
  let busy = false;

  const showError = (kind: 'invalid' | 'network' | null) => {
    errors.forEach((el) => (el.hidden = el.dataset.error !== kind));
    if (kind) {
      input.setAttribute('aria-invalid', String(kind === 'invalid'));
      input.setAttribute('aria-describedby', `waitlist-error-${kind} waitlist-privacy`);
    } else {
      input.removeAttribute('aria-invalid');
      input.setAttribute('aria-describedby', 'waitlist-privacy');
    }
  };

  input.addEventListener('input', () => showError(null));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    const email = input.value.trim();
    if (!isValidEmail(email)) {
      showError('invalid');
      input.focus();
      return;
    }
    busy = true;
    button.setAttribute('aria-busy', 'true');
    button.disabled = true;
    input.readOnly = true;
    try {
      await submit(endpoint, {
        email,
        lang: document.documentElement.lang,
        source: 'landing',
        createdAt: new Date().toISOString(),
      });
      showError(null);
      form.hidden = true;
      done.hidden = false;
    } catch (err) {
      console.error('[waitlist] submission failed', err);
      showError('network');
    } finally {
      busy = false;
      button.removeAttribute('aria-busy');
      button.disabled = false;
      input.readOnly = false;
    }
  });
}
