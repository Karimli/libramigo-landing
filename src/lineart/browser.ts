// The boy browsing the hero shelf: he walks along in front of the books, stops at one, reaches
// out and touches it (onTouch), looks up, then moves on to another. Clicking a book sends him
// there next; clicking him makes him wave. The caller drives step() from its own frame loop.

import { el, inkDefs } from './lib/ink.ts';
import { ease, clamp } from './lib/motion.ts';
import { createBoy, type BoyState } from './boy.ts';

export interface ShelfBrowserOptions {
  /** Overlay the scene is drawn into; sits on the shelf with its bottom edge on the board. */
  root: HTMLElement;
  /** Books he can visit, left to right. */
  books: HTMLElement[];
  /** Called at the moment his hand touches a book. */
  onTouch(book: HTMLElement): void;
  /** Height of the figure in CSS pixels. */
  height?: number;
}

export interface ShelfBrowser {
  /** Advance by dt seconds and redraw. */
  step(t: number, dt: number): void;
  /** One standing frame, for reduced motion. */
  drawStill(): void;
  destroy(): void;
}

type Phase = 'walk' | 'reach' | 'hold' | 'lower' | 'rest';
const REACH = 0.4, HOLD = 1.0, LOWER = 0.4, REST = 0.55, WAVE = 2.0;

export function createShelfBrowser({ root, books, onTouch, height = 128 }: ShelfBrowserOptions): ShelfBrowser {
  const svg = el('svg', { width: '100%', height: '100%' });
  svg.style.color = 'inherit';
  svg.style.overflow = 'visible';
  root.appendChild(svg);
  const { filter } = inkDefs(svg, 'browser');
  const boy = createBoy(svg, { scale: height / 95 });
  boy.g.setAttribute('filter', filter);
  boy.g.style.pointerEvents = 'auto';

  // Scene units are CSS pixels; the ground is the overlay's bottom edge.
  let width = 0, ground = 0;
  const centre = (book: HTMLElement) => { const r = book.getBoundingClientRect(), o = root.getBoundingClientRect(); return r.left + r.width / 2 - o.left; };
  const measure = () => {
    width = root.clientWidth; ground = root.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${width} ${ground}`);
    if (target) aim(target);
  };

  let phase: Phase = 'rest', clock = 0, waveT = -1;
  let target: HTMLElement | null = null, queued: HTMLElement | null = null, last: HTMLElement | null = null;
  let standX = 0, bookX = 0;
  const state: BoyState = { go: 0, reach: 0, look: 0, wave: 0 };

  /** Where to stand so the outstretched hand lands on the book, coming from the side he is on. */
  function aim(book: HTMLElement) {
    target = book;
    bookX = centre(book);
    const side = boy.x <= bookX ? 1 : -1; // he ends up on this side of it, facing it
    standX = clamp(bookX - side * boy.reachAhead, 12, Math.max(12, width - 12));
    boy.dir = standX >= boy.x ? 1 : -1;
    phase = 'walk';
  }
  function pickNext() {
    if (queued) { const q = queued; queued = null; return aim(q); }
    // somewhere else, and not the neighbour he is already touching
    const far = books.filter((bk) => bk !== last && Math.abs(centre(bk) - boy.x) > boy.reachAhead * 2.2);
    const pool = far.length ? far : books.filter((bk) => bk !== last);
    aim(pool[Math.floor(Math.random() * pool.length)]);
  }

  const onBook = (e: Event) => {
    const book = e.currentTarget as HTMLElement;
    if (phase === 'walk' || phase === 'rest') { queued = null; aim(book); } else queued = book;
  };
  const onBoy = () => { if (waveT < 0) waveT = 0; };
  books.forEach((bk) => bk.addEventListener('pointerdown', onBook));
  boy.g.addEventListener('pointerdown', onBoy);
  const resize = new ResizeObserver(measure);
  resize.observe(root);
  measure();
  boy.x = books.length ? clamp(centre(books[books.length - 1]) + boy.reachAhead, 12, width - 12) : width / 2;
  boy.dir = -1;

  return {
    step(t, dt) {
      clock += dt;
      let goAim = 0;
      if (waveT >= 0) {
        // waving interrupts whatever he was doing; he picks it up again afterwards
        waveT += dt;
        state.wave = waveT < 0.35 ? ease(waveT / 0.35) : waveT < WAVE - 0.4 ? 1 : 1 - ease((waveT - (WAVE - 0.4)) / 0.4);
        if (waveT > WAVE) { waveT = -1; state.wave = 0; }
        clock -= dt;
      } else if (phase === 'walk') {
        const left = (standX - boy.x) * boy.dir;
        if (left <= 0.5) { boy.dir = bookX >= boy.x ? 1 : -1; phase = 'reach'; clock = 0; }
        else goAim = clamp(left / 14, 0.35, 1); // ease into the stop
      } else if (phase === 'reach') {
        state.reach = ease(clock / REACH);
        state.look = ease(clock / REACH) * 0.5;
        if (clock >= REACH) { phase = 'hold'; clock = 0; last = target; if (target) onTouch(target); }
      } else if (phase === 'hold') {
        state.reach = 1;
        state.look = 0.5 + 0.5 * ease(clock / 0.3);
        if (clock >= HOLD) { phase = 'lower'; clock = 0; }
      } else if (phase === 'lower') {
        state.reach = state.look = 1 - ease(clock / LOWER);
        if (clock >= LOWER) { phase = 'rest'; clock = 0; state.reach = state.look = 0; }
      } else if (clock >= REST && books.length) {
        pickNext();
      }
      state.go += (goAim - state.go) * Math.min(1, dt * 9);
      if (goAim === 0 && state.go < 0.02) state.go = 0;
      boy.update(t, dt, ground, state);
    },
    drawStill() {
      boy.update(0, 1 / 60, ground, { go: 0, reach: 0, look: 0, wave: 0 });
    },
    destroy() {
      resize.disconnect();
      books.forEach((bk) => bk.removeEventListener('pointerdown', onBook));
      svg.remove();
    },
  };
}
