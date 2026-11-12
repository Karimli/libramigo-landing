// Problem section: a reader walks along the tops of the quote cards, nose in a book. The cards
// glide left (CSS marquee) while she walks right a little faster, so she crosses the screen
// slowly, fades out at the right edge and comes round again from the left. At each gap between
// cards she leaps across and reads on. Clicking her makes her wave; pointer movement over the
// section is wind in her scarf.
// The overlay ([data-beltwalk]) sits directly above the belt; the ground is the cards' top edge,
// measured from the page. Runs only while on screen; with reduced motion she stands on a card, and moves with it
// when the row is scrolled by hand.

import { el, inkDefs, run } from './lib/ink.ts';
import { pointerWind, ease, clamp } from './lib/motion.ts';
import { createReader } from './reader.ts';

const TAKEOFF = 22; // px before a card's right edge where she leaves the ground (front foot still on it)
const LAND = 22; // px past the next card's left edge where she comes down
const AIR = 0.55; // seconds in the air
const ARC = 16; // px height of the leap
const EDGE = 36; // px outside the overlay where she leaves and comes back in
const FADE = 70; // px over which she fades in and out at the edges

export function initBeltWalk(root: HTMLElement | null, belt: HTMLElement | null) {
  const track = belt?.querySelector<HTMLElement>('.belt-track');
  if (!root || !belt || !track) return;
  const svg = el('svg', { width: '100%', height: '100%' });
  svg.style.color = 'inherit';
  svg.style.overflow = 'visible';
  root.appendChild(svg);
  const { filter } = inkDefs(svg, 'beltwalk');
  // A little smaller on phones. An easy reading pace: about 35 px/s on the cards, against a belt
  // moving 22–27 px/s the other way, so with the leaps she gains some 15–20 px/s on screen.
  const phone = root.clientWidth < 700;
  const reader = createReader(svg, { scale: (phone ? 94 : 108) / 95, period: 1.02, stride: 20 });
  reader.g.setAttribute('filter', filter);
  reader.g.style.pointerEvents = 'auto';

  // Scene units are CSS pixels. Card edges are kept in the track's own coordinates, which don't
  // change as it glides; `loop` is the distance after which the track repeats itself.
  let width = 0, ground = 0, loop = 0;
  let cards: { l: number; r: number }[] = [];
  const measure = () => {
    width = root.clientWidth;
    svg.setAttribute('viewBox', `0 0 ${width} ${root.clientHeight}`);
    const origin = track.getBoundingClientRect().left;
    cards = [...track.querySelectorAll<HTMLElement>('.quote-card')]
      .filter((c) => c.offsetParent !== null)
      .map((c) => { const r = c.getBoundingClientRect(); return { l: r.left - origin, r: r.right - origin }; });
    // the ground is wherever the cards' top edge really is, measured rather than assumed from CSS
    const first = track.querySelector<HTMLElement>('.quote-card');
    ground = first ? first.getBoundingClientRect().top - root.getBoundingClientRect().top : root.clientHeight;
    const lists = [...track.querySelectorAll<HTMLElement>('.quote-list')].filter((l) => l.offsetParent !== null);
    loop = lists.length > 1 ? lists[1].getBoundingClientRect().left - lists[0].getBoundingClientRect().left : 0;
  };
  /** Where the track's origin is in overlay coordinates right now. */
  const offset = () => track.getBoundingClientRect().left - root.getBoundingClientRect().left;
  const cardAt = (x: number) => cards.findIndex((c) => x >= c.l - 1 && x <= c.r + 1);

  let x = 0; // her feet, in track coordinates
  let jumpT = -1, jumpFrom = 0, jumpDist = 0;
  let prevOff: number | null = null;
  /** Put her at screen position sx (overlay px), on the nearest card and clear of its edges. */
  const placeAt = (off: number, sx: number) => {
    const want = sx - off;
    let best = cards[0], gap = Infinity;
    for (const c of cards) { const d = Math.abs((c.l + c.r) / 2 - want); if (d < gap) { gap = d; best = c; } }
    if (best) x = clamp(want, best.l + LAND + 10, best.r - TAKEOFF - 10);
    jumpT = -1;
  };
  /** Draw her at track position x, faded near the overlay's edges. */
  const show = (off: number) => {
    const sx = x + off;
    reader.x = sx;
    reader.g.setAttribute('opacity', (clamp((sx + EDGE) / FADE, 0, 1) * clamp((width + EDGE - sx) / FADE, 0, 1)).toFixed(2));
  };

  const wind = pointerWind(root.closest('section') ?? root, 0.2);
  const draw = (t: number, dt: number) => {
    if (!cards.length) return;
    const off = offset();
    // the marquee restarted: the same cards are now one loop further right in track coordinates
    if (loop && prevOff !== null && off - prevOff > loop / 2) x -= loop;
    prevOff = off;
    // walked off the right edge (or lost while the page was away): come round from the left
    if (x + off > width + EDGE || x + off < -EDGE * 3) placeAt(off, -EDGE);

    if (jumpT >= 0) {
      // in the air: straight across, up and down in an arc, legs in a leap
      jumpT += dt;
      const u = Math.min(1, jumpT / AIR);
      x = jumpFrom + jumpDist * u;
      const leap = u < 0.18 ? ease(u / 0.18) : u > 0.8 ? 1 - ease((u - 0.8) / 0.2) : 1;
      show(off);
      reader.update(t, dt, ground - ARC * 4 * u * (1 - u), wind.step(t), { rate: 0, leap });
      if (u >= 1) jumpT = -1;
      return;
    }

    let i = cardAt(x);
    if (i < 0) { placeAt(off, x + off); i = cardAt(x); }
    show(off);
    reader.update(t, dt, ground, wind.step(t));
    x = reader.x - off;

    const next = cards[i + 1];
    if (!reader.waving && next && cards[i].r - x <= TAKEOFF) {
      jumpT = 0; jumpFrom = x; jumpDist = next.l + LAND - x;
    }
  };

  measure();
  placeAt(offset(), width * 0.2);
  // on resize keep her where she was on screen
  new ResizeObserver(() => { const sx = x + offset(); measure(); placeAt(offset(), clamp(sx, 0, width)); }).observe(root);

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // A still: she stands on a card, and stays on it when the row is scrolled by hand.
    const still = () => { show(offset()); reader.update(0, 1 / 60, ground, 0, { rate: 0 }); };
    placeAt(offset(), width * (width > 700 ? 0.6 : 0.5));
    still();
    belt.addEventListener('scroll', still, { passive: true });
    new ResizeObserver(still).observe(root);
    return;
  }
  // ?debug (frame stepping for checks) draws without a loop: start once.
  if (new URLSearchParams(location.search).has('debug')) { run(draw); return; }
  let stop: (() => void) | null = null;
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !stop) { prevOff = null; stop = run(draw); }
    else if (!entry.isIntersecting && stop) { stop(); stop = null; }
  }).observe(root);
}
