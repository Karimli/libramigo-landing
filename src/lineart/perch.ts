// Roadmap scene: a reader sits on the top right corner of the current stage's card, legs
// dangling over its side, reading. Clicking them makes them wave.
// The overlay ([data-perch]) is positioned by CSS so that the card's top edge is SEAT px from
// the overlay's top and the card's right edge is EDGE px from the overlay's right: keep the
// numbers here and in Roadmap.astro in step. Runs only while on screen; reduced motion: a still.

import { el, run } from './lib/ink.ts';
import { inkFilter } from './filter.ts';
import { createPercher } from './percher.ts';

const SEAT = 64;
const EDGE = 38;

export function initPerch(root: HTMLElement | null) {
  if (!root) return;
  const svg = el('svg', { width: '100%', height: '100%' });
  svg.style.color = 'inherit';
  svg.style.overflow = 'visible';
  root.appendChild(svg);
  const filter = inkFilter(svg, 'perch');
  // The figure is drawn at scale 1 inside a group that CSS sizes through --perch-scale, so it can
  // be smaller where there is less room above the card (narrow screens, under the rail).
  const holder = el('g', { filter }, svg);
  const reader = createPercher(holder);
  reader.place(0, 0);
  reader.g.style.pointerEvents = 'auto';
  reader.g.addEventListener('pointerdown', () => reader.wave());

  // Scene units are CSS pixels. Knees sit just over the card's edge, so the shins hang beside it.
  const measure = () => {
    const w = root.clientWidth, h = root.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const k = parseFloat(getComputedStyle(root).getPropertyValue('--perch-scale')) || 1;
    holder.setAttribute('transform', `translate(${(w - EDGE - reader.knee * k + 2).toFixed(1)} ${SEAT}) scale(${k})`);
  };
  measure();
  new ResizeObserver(measure).observe(root);
  addEventListener('resize', measure); // --perch-scale changes at a breakpoint without resizing the overlay

  const draw = (t: number, dt: number) => reader.update(t, dt);
  // ?debug (frame stepping for checks) and reduced motion draw without a loop: start once.
  const manual = new URLSearchParams(location.search).has('debug') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (manual) { run(draw); return; }
  let stop: (() => void) | null = null;
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !stop) stop = run(draw);
    else if (!entry.isIntersecting && stop) { stop(); stop = null; }
  }).observe(root);
}
