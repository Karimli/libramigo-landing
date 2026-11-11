// A seated reader with a book on their lap, for conversation scenes: talks with one hand,
// nods while listening. Sits on something 24 units high (seat top at y = 96 in figure space,
// feet on y = 120, facing +x, hips above x = 40). Built on the line-art library in ./lib.

import { el, pen, shape, blot, paint, limb, solid, shoe, place, joint, f, PEN, PAPER, type Vec } from './lib/ink.ts';
import { spring, clamp } from './lib/motion.ts';

export interface SitterOptions {
  hair?: 'bun' | 'short';
  /** Scarf colour; omit for no scarf. */
  scarf?: string;
  /** Solid trouser colour; omit for paper trousers. */
  trousers?: string;
  book?: string;
  scale?: number;
}

export interface SitterState {
  /** 0…1: how much they are the one talking (free hand up and moving, leaning in). */
  talk: number;
  /** Head tilt forward in degrees (a nod). */
  nod: number;
}

export interface Sitter {
  g: SVGGElement;
  /** Seat height in scene units. */
  readonly seat: number;
  /** x = where the hips are, y = the ground. */
  place(x: number, groundY: number, dir: 1 | -1): void;
  update(t: number, dt: number, state: SitterState): void;
}

const lerpP = (a: Vec, b: Vec, t: number): Vec => { t = clamp(t, 0, 1); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; };

export function createSitter(parent: Element, opts: SitterOptions = {}): Sitter {
  const { hair = 'short', scarf: scarfColour, trousers, book: bookColour = '#E9A83A', scale = 1 } = opts;

  // Back to front.
  const fig = el('g', { style: 'cursor:pointer' }, parent);
  const farArm = limb(fig, 3.6);
  const mkLeg = () => (trousers ? solid(limb(fig, 4.6), trousers) : limb(fig, 4.6));
  const farLeg = mkLeg(), farShoe = blot(fig);
  const nearLeg = mkLeg(), nearShoe = blot(fig);
  const jacket = shape(fig);
  const book = paint(fig, bookColour, PEN * 0.75);
  const pages = pen(fig, PEN * 0.5);
  const headG = el('g', {}, fig);
  el('ellipse', { rx: 4.3, ry: 5, fill: PAPER, stroke: 'currentColor', 'stroke-width': PEN }, headG);
  blot(headG).setAttribute('d', hair === 'bun'
    ? 'M-4.4 2.6 Q-5.8 -6 0.3 -6.3 Q4.4 -6.1 4.6 -2.4 Q2 -4.2 -0.8 -3.3 Q-2.7 -2.5 -2.9 2.8Z M-8 -3.6 a2.3 2.3 0 1 0 4.6 0 a2.3 2.3 0 1 0 -4.6 0Z'
    : 'M-4.5 0.6 Q-5.7 -6 0.4 -6.3 Q4.7 -6.1 4.7 -2.2 Q2.2 -4.3 -0.6 -3.5 Q-2.8 -2.7 -3 1Z');
  const scarf = scarfColour ? paint(fig, scarfColour, PEN * 0.8) : null;
  const nearArm = limb(fig, 3.6);
  // three short strokes by the mouth while talking
  const speech = pen(fig, PEN * 0.7);

  // The legs don't move: thighs along the seat, shins down to the ground.
  const hip: Vec = [40, 94];
  farLeg.draw([hip, [63.5, 93.4], [64.5, 118.4]], [0.3, 0.8]); shoe(farShoe, [64.5, 118.4], 0);
  nearLeg.draw([hip, [61.5, 94.4], [60.5, 118.4]], [0.3, 0.8]); shoe(nearShoe, [60.5, 118.4], 0);
  book.setAttribute('d', 'M49.6 88.4 L63 86.6 L63.5 89.8 L50 91.8Z');
  pages.setAttribute('d', 'M51 89.9 L62.4 88.3');

  const lean = spring(26, 7);
  const hand = [spring(48, 8, 53.6), spring(48, 8, 88.6)]; // x, y of the talking hand, starting at rest

  return {
    g: fig,
    seat: 24 * scale,
    place(x, groundY, dir) { place(fig, x, groundY, dir, scale); },
    update(t, dt, { talk, nod }) {
      const breath = Math.sin(t * 1.5) * 0.35;
      const l = lean.step(talk * 2.4, dt); // leans in a little when talking
      const sh: Vec = [41 + l, 62.4 + breath];
      jacket.setAttribute('d', `M${f(sh[0] - 6.5)} ${f(sh[1] + 1)} Q${f(sh[0] - 1)} ${f(sh[1] - 2.6)} ${f(sh[0] + 5.5)} ${f(sh[1] + 1)} L48.4 92.6 Q47 97.6 40 97.6 L33.4 96.4Z`);

      const hc: Vec = [sh[0] + 1.6 + l * 0.4, sh[1] - 10.4];
      headG.setAttribute('transform', `translate(${f(hc[0])} ${f(hc[1])}) rotate(${f(nod + talk * Math.sin(t * 3.1) * 2.5)})`);
      scarf?.setAttribute('d', `M${f(hc[0] - 5)} ${f(hc[1] + 4.6)} Q${f(hc[0] - 0.4)} ${f(hc[1] + 8.6)} ${f(hc[0] + 3.8)} ${f(hc[1] + 5.2)} L${f(hc[0] + 4.2)} ${f(hc[1] + 8)} Q${f(hc[0] - 0.4)} ${f(hc[1] + 11.2)} ${f(hc[0] - 5.2)} ${f(hc[1] + 7.6)}Z`);

      // far hand stays on the book; near hand rests beside it, or comes up and moves while talking
      const shF: Vec = [sh[0] - 0.8, sh[1] + 2.2], shN: Vec = [sh[0] + 1.2, sh[1] + 2.6];
      const onBook: Vec = [58, 87.4];
      farArm.draw([shF, joint(shF, onBook, 15, 14, -1), onBook], [0.2, 0.5]);
      const rest: Vec = [53.6, 88.6];
      const gesture: Vec = [60 + Math.sin(t * 4.3) * 3.2 + Math.sin(t * 1.9) * 1.6, 70.5 + Math.cos(t * 3.7) * 2.8];
      const aim = lerpP(rest, gesture, talk);
      const at: Vec = [hand[0].step(aim[0], dt), hand[1].step(aim[1], dt)];
      nearArm.draw([shN, joint(shN, at, 15, 14, -1), at], [0.2, 0.4]);

      const mx = hc[0] + 7.4, my = hc[1] + 1.6;
      speech.setAttribute('d', `M${f(mx)} ${f(my - 3.4)} l4.6 -2.2 M${f(mx + 0.8)} ${f(my)} l5.4 0 M${f(mx)} ${f(my + 3.4)} l4.6 2.2`);
      speech.setAttribute('opacity', f(clamp(talk * (0.55 + 0.45 * Math.sin(t * 5.2)), 0, 1)));
    },
  };
}
