// A reader perched on the edge of something, legs dangling and swinging, head in an open book.
// wave() makes them look up and wave, then go back to reading.
// Figure space: facing +x, hips above x = 40, sitting on y = 96 (the edge is under the knees,
// around x = 62). Built on the line-art library in ./lib.

import { el, pen, shape, blot, paint, limb, solid, shoe, joint, hang, f, PEN, PAPER, type Vec } from './lib/ink.ts';
import { ease, clamp } from './lib/motion.ts';

export interface PercherOptions {
  trousers?: string;
  book?: string;
  scale?: number;
}

export interface Percher {
  g: SVGGElement;
  /** How far in front of the hips the knees are, in scene units (where the edge should be). */
  readonly knee: number;
  /** x = where the hips are, seatY = the surface they sit on. */
  place(x: number, seatY: number): void;
  /** Look up from the book and wave. */
  wave(): void;
  update(t: number, dt: number): void;
}

const lerpP = (a: Vec, b: Vec, t: number): Vec => { t = clamp(t, 0, 1); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; };
const WAVE_SECONDS = 2.2;
const SHIN = 23;

export function createPercher(parent: Element, opts: PercherOptions = {}): Percher {
  const { trousers = '#2C6B63', book: bookColour = '#E9A83A', scale = 1 } = opts;

  // Back to front.
  const fig = el('g', { style: 'cursor:pointer' }, parent);
  const farArm = limb(fig, 3.6);
  const farLeg = solid(limb(fig, 4.6), trousers), farShoe = blot(fig);
  const nearLeg = solid(limb(fig, 4.6), trousers), nearShoe = blot(fig);
  const jacket = shape(fig);
  const headG = el('g', {}, fig);
  el('ellipse', { rx: 4.3, ry: 5, fill: PAPER, stroke: 'currentColor', 'stroke-width': PEN }, headG);
  blot(headG).setAttribute('d', 'M-4.5 0.6 Q-5.7 -6 0.4 -6.3 Q4.7 -6.1 4.7 -2.2 Q2.2 -4.3 -0.6 -3.5 Q-2.8 -2.7 -3 1Z');

  // The open book, seen edge-on: two leaves opening up from the spine, which rests in the hands.
  const bookG = el('g', {}, fig);
  const A: Vec = [-5.6, -11.8], B: Vec = [7, -11]; // tops of the leaf nearer the reader and the far leaf
  paint(bookG, bookColour, PEN * 0.75).setAttribute('d', `M0.4 1.2 L${f(A[0] - 2)} ${f(A[1] + 0.8)} L${f(A[0])} ${f(A[1])} L0 -0.7Z`);
  paint(bookG, bookColour, PEN * 0.75).setAttribute('d', `M-0.4 1.2 L${f(B[0] + 2)} ${f(B[1] + 0.9)} L${f(B[0])} ${f(B[1])} L0 -0.7Z`);
  shape(bookG, PEN * 0.75).setAttribute('d', `M0 -0.5 L${f(A[0])} ${f(A[1])} Q-1.5 -10.4 0.3 -7.6 Q2.7 -10.2 ${f(B[0])} ${f(B[1])}Z`);
  pen(bookG, PEN * 0.5).setAttribute('d', 'M0.3 -7.2 L0 -0.9');
  const nearArm = limb(fig, 3.6);

  const hip: Vec = [40, 94], kneeF: Vec = [63.4, 93.4], kneeN: Vec = [61.6, 94.6];
  let waveT = -1;

  return {
    g: fig,
    knee: (kneeN[0] - 40) * scale,
    place(x, seatY) { fig.setAttribute('transform', `translate(${f(x)} ${f(seatY)}) scale(${f(scale)}) translate(-40 -96)`); },
    wave() { if (waveT < 0) waveT = 0; },
    update(t, dt) {
      let up = 0;
      if (waveT >= 0) {
        waveT += dt;
        up = waveT < 0.4 ? ease(waveT / 0.4) : waveT < WAVE_SECONDS - 0.5 ? 1 : 1 - ease((waveT - (WAVE_SECONDS - 0.5)) / 0.5);
        if (waveT > WAVE_SECONDS) waveT = -1;
      }

      // legs swing from the knee like pendulums, out of step with each other; the swing breathes
      const amp = 9 + 3 * Math.sin(t * 0.37);
      const swingN = 5 + amp * Math.sin(t * 2.1), swingF = 5 + amp * Math.sin(t * 2.1 + 2.3);
      const ankleN = hang(kneeN, SHIN, swingN), ankleF = hang(kneeF, SHIN, swingF);
      farLeg.draw([hip, kneeF, ankleF], [0.3, 0.8]); shoe(farShoe, ankleF, 16 - swingF * 0.7);
      nearLeg.draw([hip, kneeN, ankleN], [0.3, 0.8]); shoe(nearShoe, ankleN, 16 - swingN * 0.7);

      const breath = Math.sin(t * 1.5) * 0.35;
      const sh: Vec = [41.4, 62.4 + breath];
      jacket.setAttribute('d', `M${f(sh[0] - 6.5)} ${f(sh[1] + 1)} Q${f(sh[0] - 1)} ${f(sh[1] - 2.6)} ${f(sh[0] + 5.5)} ${f(sh[1] + 1)} L48.4 92.6 Q47 97.6 40 97.6 L33.4 96.4Z`);

      // head: bent over the book, lifts when looking up
      const hc: Vec = [sh[0] + 2.6 - up * 0.9, sh[1] - 10.2];
      headG.setAttribute('transform', `translate(${f(hc[0])} ${f(hc[1])}) rotate(${f(17 * (1 - up))})`);

      // both hands hold the book above the lap; it tips down a little while looking up
      const spine: Vec = [56.4, 80.6 + breath * 0.6 + up * 3];
      bookG.setAttribute('transform', `translate(${f(spine[0])} ${f(spine[1])}) rotate(${f(-5 + up * 15)}) scale(0.86)`);
      const shF: Vec = [sh[0] - 0.8, sh[1] + 2.2], shN: Vec = [sh[0] + 1.2, sh[1] + 2.6];
      const handF: Vec = [spine[0] + 1.6, spine[1] + 0.6], handN: Vec = [spine[0] - 1.2, spine[1] + 1.2];
      farArm.draw([shF, joint(shF, handF, 15, 14, -1), handF], [0.2, 0.5]);
      if (up > 0.01) {
        // near hand leaves the book and waves beside the head
        const target: Vec = [hc[0] + 12 + Math.sin(waveT * 11) * 2.6 * up, hc[1] - 7];
        nearArm.draw([shN, lerpP(joint(shN, handN, 15, 14, -1), [shN[0] + 10.5, shN[1] + 5.5], up), lerpP(handN, target, up)], [0.2, 0.4]);
      } else {
        nearArm.draw([shN, joint(shN, handN, 15, 14, -1), handN], [0.2, 0.4]);
      }
    },
  };
}
