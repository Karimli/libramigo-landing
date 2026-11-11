// Community scene: two readers sit on stacks of books and talk about what they're reading.
// One talks with a hand while the other nods, then they swap. Clicking one gives them the word.
// Runs only while on screen; with reduced motion it draws one still frame.

import { el, pen, paint, inkDefs, run, PEN } from './lib/ink.ts';
import { rnd } from './lib/motion.ts';
import { createSitter, type SitterState } from './sitter.ts';

const SCALE = 1.35;
const APART = 52; // hips to the middle of the scene, px
const STACKS = [
  [['#B8323F', 40, 0], ['#F4EDE1', 34, 3], ['#E9A83A', 38, -2]],
  [['#8FB5AC', 38, 2], ['#E9A83A', 42, -1], ['#B8323F', 35, 2]],
] as const;

export function initTalk(root: HTMLElement | null) {
  if (!root) return;
  const svg = el('svg', { width: '100%', height: '100%' });
  svg.style.color = 'inherit';
  svg.style.overflow = 'visible';
  root.appendChild(svg);
  const { filter } = inkDefs(svg, 'talk');
  const ground = pen(svg, 0.9);
  const scene = el('g', { filter }, svg);

  const stacks = STACKS.map(() => el('g', {}, scene));
  const people = [
    createSitter(scene, { hair: 'bun', scarf: '#B8323F', scale: SCALE }),
    createSitter(scene, { hair: 'short', trousers: '#8FB5AC', book: '#F4EDE1', scale: SCALE }),
  ];
  // each stack: three books lying flat, as high as the seat
  STACKS.forEach((books, i) => {
    const h = people[i].seat / books.length;
    books.forEach(([colour, w, dx], k) => {
      const y = -h * (k + 1);
      paint(stacks[i], colour, PEN * 0.9).setAttribute('d', `M${-w / 2 + dx} ${y} L${w / 2 + dx} ${y} L${w / 2 + dx} ${y + h} L${-w / 2 + dx} ${y + h}Z`);
      pen(stacks[i], PEN * 0.5).setAttribute('d', `M${-w / 2 + dx + 4} ${y + h / 2} L${w / 2 + dx - 9} ${y + h / 2}`);
    });
  });

  // Scene units are CSS pixels; the ground sits just above the overlay's bottom edge. With
  // --on-card: 1 (set in CSS for narrow screens) they sit directly on whatever is underneath,
  // so the ground is the bottom edge itself and no line is drawn.
  const measure = () => {
    const onCard = getComputedStyle(root).getPropertyValue('--on-card').trim() === '1';
    const w = root.clientWidth, h = root.clientHeight, g = onCard ? h : h - 3, mid = w / 2;
    ground.style.display = onCard ? 'none' : '';
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    let d = `M0 ${g}`;
    for (let x = 16, i = 1; x < w + 16; x += 16, i++) d += ` L${Math.min(x, w)} ${(g + 0.3 * Math.sin(i * 1.7)).toFixed(2)}`;
    ground.setAttribute('d', d);
    people.forEach((p, i) => {
      const dir = i === 0 ? 1 : -1, x = mid - dir * APART;
      p.place(x, g, dir);
      stacks[i].setAttribute('transform', `translate(${x - dir * 2} ${g})`);
    });
  };
  measure();
  new ResizeObserver(measure).observe(root);

  let speaker = 0, turnLeft = 3.2;
  const states: SitterState[] = [{ talk: 0, nod: 0 }, { talk: 0, nod: 0 }];
  const nodAt = [1.4, 1.4], nodT = [-1, -1]; // seconds until the next nod; time into the current one
  people.forEach((p, i) => p.g.addEventListener('pointerdown', () => { speaker = i; turnLeft = rnd(3.5, 5.5); }));

  const draw = (t: number, dt: number) => {
    turnLeft -= dt;
    if (turnLeft <= 0) { speaker = 1 - speaker; turnLeft = rnd(3.2, 6); }
    people.forEach((p, i) => {
      const s = states[i], talking = i === speaker;
      s.talk += ((talking ? 1 : 0) - s.talk) * Math.min(1, dt * 5);
      // the listener nods now and then: down and back up in half a second
      if (talking) { nodT[i] = -1; nodAt[i] = rnd(0.8, 1.8); }
      else if (nodT[i] < 0 && (nodAt[i] -= dt) <= 0) nodT[i] = 0;
      if (nodT[i] >= 0) {
        nodT[i] += dt;
        s.nod = 10 * Math.sin(Math.PI * Math.min(1, nodT[i] / 0.5)) ** 2;
        if (nodT[i] >= 0.5) { nodT[i] = -1; nodAt[i] = rnd(1.1, 2.8); }
      } else s.nod *= 1 - Math.min(1, dt * 8);
      p.update(t, dt, s);
    });
  };

  // ?debug (frame stepping for checks) and reduced motion draw without a loop: start once.
  const manual = new URLSearchParams(location.search).has('debug') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (manual) { states[0].talk = 1; run(draw); return; }
  let stop: (() => void) | null = null;
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !stop) stop = run(draw);
    else if (!entry.isIntersecting && stop) { stop(); stop = null; }
  }).observe(root);
}
