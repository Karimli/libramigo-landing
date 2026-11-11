// A strip of pavement with a reader walking along it, nose in a book.
// Decorative: drawn live in SVG inside [data-street]. Pointer movement over the section is wind
// (the scarf streams), a click makes the reader look up and wave. Runs only while on screen;
// with reduced motion it draws one still frame.

import { el, pen, inkDefs, run } from './lib/ink.ts';
import { pointerWind } from './lib/motion.ts';
import { createReader } from './reader.ts';

const HEIGHT = 100; // scene units; the strip's CSS height sets the scale
const GROUND = 92;
const SCALE = 0.88; // reader ≈ 84 units tall
const MARGIN = 34; // how far off either edge the reader walks before coming round again

export function initStreet(root: HTMLElement | null) {
  if (!root) return;
  const svg = el('svg', { height: '100%', width: '100%', preserveAspectRatio: 'xMinYMax meet' });
  svg.style.color = 'inherit'; // ink = the strip's text colour
  root.appendChild(svg);
  const { filter } = inkDefs(svg, 'street');

  // The pavement line gets its unevenness from the path itself: the ink filter can't be used on
  // a flat line (its filter region would have no height).
  const ground = pen(svg, 0.8);
  const reader = createReader(svg, { scale: SCALE });
  reader.g.setAttribute('filter', filter);

  // The viewBox is as wide as the strip, so the figure keeps its size at every screen width.
  let width = 0;
  const measure = () => {
    const w = (root.clientWidth / Math.max(1, root.clientHeight)) * HEIGHT;
    if (!w || Math.abs(w - width) < 0.5) return;
    if (width) reader.x *= w / width;
    width = w;
    svg.setAttribute('viewBox', `0 0 ${w.toFixed(1)} ${HEIGHT}`);
    let d = `M0 ${GROUND}`;
    for (let x = 14, i = 1; x < w + 14; x += 14, i++) d += ` L${x} ${(GROUND + 0.22 * Math.sin(i * 1.7) + 0.14 * Math.sin(i * 0.61)).toFixed(2)}`;
    ground.setAttribute('d', d);
  };
  measure();
  reader.x = width * 0.3;
  new ResizeObserver(measure).observe(root);

  const wind = pointerWind(root.closest('section') ?? root, 0.2);
  const draw = (t: number, dt: number) => {
    reader.update(t, dt, GROUND, wind.step(t));
    if (reader.x > width + MARGIN) reader.x = -MARGIN;
  };

  // ?debug (frame stepping for checks) and reduced motion draw without a loop: start once.
  const manual = new URLSearchParams(location.search).has('debug') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (manual) { run(draw); return; }
  let stop: (() => void) | null = null;
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !stop) stop = run(draw);
    else if (!entry.isIntersecting && stop) { stop(); stop = null; }
  }).observe(root);
}
