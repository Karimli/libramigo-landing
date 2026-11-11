// Waitlist scene: a post box stands at the foot of the section. While it is on screen the boy
// from the hero walks up with an envelope now and then (first when it scrolls into view, then
// every 15–20 s), posts it, the box's flag goes up, he waves and walks on. When someone joins
// the list (document event "libramigo:waitlist-joined", sent by src/scripts/waitlist.ts) he
// comes straight back with another letter. Nothing runs between visits.
// Reduced motion: just the box, then a still of the boy beside it after joining.

import { el, shape, paint, inkDefs, run, f, PEN, type Vec } from './lib/ink.ts';
import { spring, ease, clamp } from './lib/motion.ts';
import { createBoy, type BoyState } from './boy.ts';

export const JOINED_EVENT = 'libramigo:waitlist-joined';

type Phase = 'idle' | 'enter' | 'reach' | 'post' | 'lower' | 'wave' | 'leave' | 'done';
const REACH = 0.4, POST = 0.5, LOWER = 0.35, WAVE = 1.9;
const FLAG_DOWN = 118; // degrees from upright

export function initPostbox(root: HTMLElement | null, boyHeight = 96) {
  if (!root) return;
  const svg = el('svg', { width: '100%', height: '100%' });
  svg.style.color = 'inherit';
  svg.style.overflow = 'visible';
  root.appendChild(svg);
  const { filter } = inkDefs(svg, 'post');

  // The box, drawn around its own origin: the foot of the post, on the ground.
  const box = el('g', { filter }, svg);
  shape(box).setAttribute('d', 'M-3 0 L-3.4 -48 L3.4 -48 L3 0Z');
  const flag = el('g', {}, box);
  paint(flag, '#E9A83A', PEN * 0.8).setAttribute('d', 'M-1 0 L-1 -17 L10 -14 L1 -10.6 L1 0Z');
  paint(box, '#B8323F').setAttribute('d', 'M-17 -48 L-17 -74 Q-17 -86 -5 -86 L5 -86 Q17 -86 17 -74 L17 -48Z');
  el('path', { d: 'M-13 -73.6 L3 -73.6 L3 -70.6 L-13 -70.6Z', fill: '#0A2523' }, box);
  const SLOT: Vec = [-5, -72];
  const setFlag = (deg: number) => flag.setAttribute('transform', `translate(17 -60) rotate(${f(deg)})`);
  setFlag(FLAG_DOWN);

  const boy = createBoy(svg, { scale: boyHeight / 95 });
  boy.g.setAttribute('filter', filter);
  boy.g.style.cursor = 'default';
  boy.g.setAttribute('opacity', '0');
  // The envelope: cream paper with a dark flap line, so it shows on the green section.
  const letter = el('g', { opacity: 0 }, svg);
  el('path', { d: 'M-7 -4.5 L7 -4.5 L7 4.5 L-7 4.5Z', fill: '#F4EDE1' }, letter);
  el('path', { d: 'M-7 -4.5 L0 1.2 L7 -4.5', fill: 'none', stroke: '#12403C', 'stroke-width': 0.9, 'stroke-linejoin': 'round' }, letter);

  // Scene units are CSS pixels; the ground is the overlay's bottom edge.
  let width = 0, ground = 0, boxX = 0;
  const measure = () => {
    const w = root.clientWidth;
    ground = root.clientHeight;
    const x = w >= 700 ? Math.round(w * 0.78) : w - 52;
    if (boxX) boy.x += x - boxX; // keep him where he is relative to the box
    width = w; boxX = x;
    svg.setAttribute('viewBox', `0 0 ${w} ${ground}`);
    box.setAttribute('transform', `translate(${boxX} ${ground})`);
  };
  measure();
  new ResizeObserver(measure).observe(root);

  let phase: Phase = 'idle', clock = 0, alpha = 0, flagUp = false, stop: (() => void) | null = null;
  const flagAngle = spring(90, 7, FLAG_DOWN);
  const state: BoyState = { go: 0, reach: 0, look: 0, wave: 0 };
  const standX = () => boxX + SLOT[0] - boy.reachAhead - 2;
  const exitX = () => Math.min(width + 30, boxX + 150);
  const next = (p: Phase) => { phase = p; clock = 0; };

  const draw = (t: number, dt: number) => {
    clock += dt;
    let goAim = 0, carry = phase !== 'idle' && phase !== 'done';
    let at: Vec | null = null, squeeze = 1;
    if (phase === 'enter') {
      const left = standX() - boy.x;
      alpha = Math.min(1, alpha + dt * 2.5);
      if (left <= 0.5) next('reach'); else goAim = clamp(left / 14, 0.35, 1);
    } else if (phase === 'reach') {
      state.reach = ease(clock / REACH);
      if (clock >= REACH) next('post');
    } else if (phase === 'post') {
      // the envelope leaves the hand and slides into the slot
      const u = ease(clock / POST), slot: Vec = [boxX + SLOT[0], ground + SLOT[1]];
      at = [boy.hand[0] + 5 + (slot[0] - boy.hand[0] - 5) * u, boy.hand[1] - 2 + (slot[1] - boy.hand[1] + 2) * u];
      squeeze = 1 - u;
      if (clock >= POST) { flagUp = true; flagAngle.kick(-200); next('lower'); }
    } else if (phase === 'lower') {
      carry = false;
      state.reach = 1 - ease(clock / LOWER);
      if (clock >= LOWER) { state.reach = 0; next('wave'); }
    } else if (phase === 'wave') {
      carry = false;
      state.wave = clock < 0.3 ? ease(clock / 0.3) : clock < WAVE - 0.4 ? 1 : 1 - ease((clock - (WAVE - 0.4)) / 0.4);
      state.look = state.wave * 0.3;
      if (clock >= WAVE) { state.wave = state.look = 0; next('leave'); }
    } else if (phase === 'leave') {
      carry = false;
      goAim = 1;
      alpha = clamp((exitX() - boy.x) / 40, 0, 1);
      if (boy.x >= exitX()) {
        next('done'); alpha = 0;
        clearTimeout(timer);
        timer = window.setTimeout(() => { due = true; visit(); }, 15000 + Math.random() * 5000);
      }
    } else {
      carry = false;
    }
    state.go += (goAim - state.go) * Math.min(1, dt * 9);
    if (goAim === 0 && state.go < 0.02) state.go = 0;
    boy.update(t, dt, ground, state);
    boy.g.setAttribute('opacity', f(alpha));
    if (carry) {
      const p = at ?? [boy.hand[0] + 5, boy.hand[1] - 2];
      letter.setAttribute('transform', `translate(${f(p[0])} ${f(p[1])}) rotate(-12) scale(${f(Math.max(0.02, squeeze))} 1)`);
    }
    letter.setAttribute('opacity', carry ? f(alpha) : '0');
    setFlag(flagAngle.step(flagUp ? 0 : FLAG_DOWN, dt));
    if (phase === 'done') {
      if (pending) { if (clock > 0.6) { pending = false; begin(); } } // someone joined while he was busy: back with a second letter after a beat
      else if (clock > 1.5 && stop) { stop(); stop = null; } // flag settled, nothing left to animate
    }
  };

  /** He walks in with a letter. Starts the loop if it isn't running. */
  let pending = false;
  function begin() {
    boy.x = Math.max(-30, standX() - 150);
    boy.dir = 1;
    alpha = 0;
    flagUp = false; // the last letter has been collected
    clearTimeout(timer);
    next('enter');
    if (!stop) stop = run(draw);
  }
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // While the scene is on screen he posts a letter now and then: first when it scrolls into
  // view, then every 15–20 s after he has left. Off screen, the next visit waits for the return.
  let visible = false, due = true, timer = 0;
  const visit = () => {
    if (reduced() || !visible || (phase !== 'idle' && phase !== 'done')) return;
    due = false;
    begin();
  };
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && due) visit();
  }, { threshold: 0.6 }).observe(root);

  // Joining the list sends him back with another one.
  document.addEventListener(JOINED_EVENT, () => {
    if (reduced()) {
      // a still: the letter is posted, the flag is up, he stands by the box waving
      phase = 'done'; flagUp = true;
      boy.x = standX(); boy.dir = 1;
      boy.update(0, 1 / 60, ground, { go: 0, reach: 0, look: 0.3, wave: 1 });
      boy.g.setAttribute('opacity', '1');
      setFlag(0);
      return;
    }
    if (phase === 'idle' || phase === 'done') begin(); else pending = true;
  });
}
