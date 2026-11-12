// Problem section: a reader walks along the tops of the quote cards, nose in a book. The cards
// glide left (CSS marquee) while she walks right, so she stays roughly in place like on a
// treadmill; at each gap between cards she leaps across and reads on. Clicking her makes her
// wave; pointer movement over the section is wind in her scarf.
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

export function initBeltWalk(root: HTMLElement | null, belt: HTMLElement | null) {
  const track = belt?.querySelector<HTMLElement>('.belt-track');
  if (!root || !belt || !track) return;
  const svg = el('svg', { width: '100%', height: '100%' });
  svg.style.color = 'inherit';
  svg.style.overflow = 'visible';
  root.appendChild(svg);
  const { filter } = inkDefs(svg, 'beltwalk');
  // A little smaller on phones. Short, unhurried steps suit someone reading as she walks, and
  // keep her speed close to the belt's (about 27 px/s on desktop) without a slow-motion cadence.
  const phone = root.clientWidth < 700;
  const reader = createReader(svg, { scale: (phone ? 94 : 108) / 95, period: 1.05, stride: 15 });
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
  const home = () => width * (width > 700 ? 0.6 : 0.5); // where she tries to stay on screen
  const cardAt = (x: number) => cards.findIndex((c) => x >= c.l - 1 && x <= c.r + 1);

  let x = 0; // her feet, in track coordinates
  let rate = 1, jumpT = -1, jumpFrom = 0, jumpDist = 0;
  /** Put her on the card nearest her home spot, clear of its edges. */
  const settle = (off: number) => {
    const want = home() - off;
    let best = cards[0], gap = Infinity;
    for (const c of cards) { const d = Math.abs((c.l + c.r) / 2 - want); if (d < gap) { gap = d; best = c; } }
    if (best) x = clamp(want, best.l + LAND + 20, best.r - TAKEOFF - 20);
    jumpT = -1; rate = 1;
  };

  const wind = pointerWind(root.closest('section') ?? root, 0.2);
  const draw = (t: number, dt: number) => {
    if (!cards.length) return;
    const off = offset();
    // The marquee jumped back by one loop, or the page was away for a while: find her again.
    if (x + off > width + 60 && loop) x -= loop;
    else if (x + off < -60 && loop) x += loop;
    if (x + off > width + 60 || x + off < -60) settle(off);

    if (jumpT >= 0) {
      // in the air: straight across, up and down in an arc, legs in a leap
      jumpT += dt;
      const u = Math.min(1, jumpT / AIR);
      x = jumpFrom + jumpDist * u;
      const leap = u < 0.18 ? ease(u / 0.18) : u > 0.8 ? 1 - ease((u - 0.8) / 0.2) : 1;
      reader.x = x + off;
      reader.update(t, dt, ground - ARC * 4 * u * (1 - u), wind.step(t), { rate: 0, leap });
      if (u >= 1) jumpT = -1;
      return;
    }

    let i = cardAt(x);
    if (i < 0) { settle(off); i = cardAt(x); }
    // Walk a little faster or slower to drift back to her home spot; if she is far ahead of it
    // (the belt stopped), stand and read until it catches up.
    const ahead = x + off - home();
    const aim = ahead > 260 ? 0 : clamp(1 - ahead / 160, 0.6, 1.3);
    rate += (aim - rate) * Math.min(1, dt * 3);
    reader.x = x + off;
    reader.update(t, dt, ground, wind.step(t), { rate });
    x = reader.x - off;

    const next = cards[i + 1];
    if (!reader.waving && next && cards[i].r - x <= TAKEOFF) {
      jumpT = 0; jumpFrom = x; jumpDist = next.l + LAND - x;
    }
  };

  measure();
  settle(offset());
  new ResizeObserver(() => { measure(); settle(offset()); }).observe(root);

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // A still: she stands on a card, and stays on it when the row is scrolled by hand.
    const still = () => { reader.x = x + offset(); reader.update(0, 1 / 60, ground, 0, { rate: 0 }); };
    still();
    belt.addEventListener('scroll', still, { passive: true });
    new ResizeObserver(still).observe(root);
    return;
  }
  // ?debug (frame stepping for checks) draws without a loop: start once.
  if (new URLSearchParams(location.search).has('debug')) { run(draw); return; }
  let stop: (() => void) | null = null;
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !stop) stop = run(draw);
    else if (!entry.isIntersecting && stop) { stop(); stop = null; }
  }).observe(root);
}
