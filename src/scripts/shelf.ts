// "Build your shelf" demo. Runs only in the browser; picks are kept in localStorage
// (per-viewer convenience, may be unavailable) and are never sent anywhere.

type Status = 'read' | 'reading' | 'want';
const KEY = 'libramigo.shelf';
const STATUSES: Status[] = ['read', 'reading', 'want'];

function loadState(): Record<string, Status> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    const out: Record<string, Status> = {};
    for (const [k, v] of Object.entries(raw)) if (STATUSES.includes(v as Status)) out[k] = v as Status;
    return out;
  } catch {
    return {};
  }
}

function saveState(state: Record<string, Status>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage blocked: the demo still works for this visit */
  }
}

export function initShelf() {
  const root = document.querySelector<HTMLElement>('[data-shelf]');
  if (!root) return;
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-book]')];
  const spines = new Map([...root.querySelectorAll<HTMLElement>('[data-spine]')].map((el) => [el.dataset.spine!, el]));
  const spineList = root.querySelector<HTMLElement>('.spines')!;
  const clear = root.querySelector<HTMLButtonElement>('[data-shelf-clear]')!;
  const live = root.querySelector<HTMLElement>('[data-shelf-live]')!;
  const removedText = root.querySelector<HTMLElement>('[data-shelf-removed]')!;
  const clearedText = root.querySelector<HTMLElement>('[data-shelf-cleared]')!;
  const state = loadState();
  // Order in which books were shelved, so new books are added at the right end.
  const order: string[] = Object.keys(state);

  const current = (): Status =>
    (root.querySelector<HTMLInputElement>('input[name="shelf-status"]:checked')?.value as Status) || 'read';
  const statusLabel = (s: Status) =>
    root.querySelector<HTMLElement>(`.opt-${s} span`)?.textContent?.trim() || s;

  function render() {
    for (const btn of buttons) {
      const id = btn.dataset.book!;
      const s = state[id];
      btn.setAttribute('aria-pressed', String(Boolean(s)));
      if (s) btn.dataset.status = s;
      else delete btn.dataset.status;
      const spine = spines.get(id)!;
      spine.hidden = !s;
      if (s) spine.dataset.status = s;
      else delete spine.dataset.status;
    }
    for (const id of order) spineList.appendChild(spines.get(id)!);
    for (const s of STATUSES) {
      const el = root.querySelector<HTMLElement>(`[data-count="${s}"]`);
      if (el) el.textContent = String(order.filter((id) => state[id] === s).length);
    }
    root.dataset.total = String(order.length);
    clear.disabled = order.length === 0;
  }

  for (const btn of buttons) {
    btn.addEventListener('click', () => {
      const id = btn.dataset.book!;
      const title = btn.querySelector('.book-title')?.textContent?.trim() || '';
      const s = current();
      if (state[id] === s) {
        delete state[id];
        order.splice(order.indexOf(id), 1);
        live.textContent = `${title}: ${removedText.textContent?.trim()}`;
      } else {
        if (!state[id]) order.push(id);
        state[id] = s;
        // replay the pop animation when the status changes
        const spine = spines.get(id)!;
        spine.style.animation = 'none';
        void spine.offsetWidth;
        spine.style.animation = '';
        live.textContent = `${title}: ${statusLabel(s)}`;
      }
      saveState(state);
      render();
    });
  }

  clear.addEventListener('click', () => {
    for (const id of order) delete state[id];
    order.length = 0;
    saveState(state);
    render();
    live.textContent = clearedText.textContent?.trim() || '';
    buttons[0]?.focus();
  });

  render();
}
