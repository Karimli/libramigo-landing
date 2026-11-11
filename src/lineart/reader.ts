// A reader walking with an open book: head down in the pages, scarf trailing behind.
// Click (wave()) and the reader stops, looks up and waves, then goes back to the book.
// Built on the line-art library in ./lib (figure space: feet on y = 120, facing +x, at x = 40).

import { el, pen, shape, blot, paint, limb, shoe, place, joint, f, PEN, PAPER, type Vec } from './lib/ink.ts';
import { gait, type GaitKind } from './lib/gait.ts';
import { spring, ease, clamp } from './lib/motion.ts';

export interface ReaderOptions {
  /** Flat accent colours. */
  scarf?: string;
  book?: string;
  /** Hair: a bun at the back, or short. */
  hair?: 'bun' | 'short';
  gait?: GaitKind;
  /** Figure scale in scene units (1 → about 95 units tall). */
  scale?: number;
  dir?: 1 | -1;
}

export interface Reader {
  g: SVGGElement;
  /** Scene x of the feet; the caller wraps or removes the figure when it leaves. */
  x: number;
  readonly dir: 1 | -1;
  /** Stop, look up from the book and wave. */
  wave(): void;
  /** Advance by dt seconds and draw standing on groundY. wind ≈ -2.4…2.4. */
  update(t: number, dt: number, groundY: number, wind?: number): void;
}

const lerpP = (a: Vec, b: Vec, t: number): Vec => { t = clamp(t, 0, 1); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; };
const WAVE_SECONDS = 2.2;

export function createReader(parent: Element, opts: ReaderOptions = {}): Reader {
  const { scarf: scarfColour = '#B8323F', book: bookColour = '#E9A83A', hair: hairStyle = 'bun', scale = 1, dir = 1 } = opts;

  // Back to front.
  const fig = el('g', { style: 'cursor:pointer' }, parent);
  const farArm = limb(fig, 3.6);
  const legs = [limb(fig, 4.2), limb(fig, 4.2)];
  const shoes = [blot(fig), blot(fig)];
  const coat = shape(fig);
  const coatSeam = pen(fig, PEN * 0.6);
  const scarfTail = paint(fig, scarfColour, PEN * 0.8);
  const headG = el('g', {}, fig);
  el('ellipse', { rx: 3.6, ry: 4.6, fill: PAPER, stroke: 'currentColor', 'stroke-width': PEN }, headG);
  blot(headG).setAttribute('d', hairStyle === 'bun'
    ? 'M-4 2.4 Q-5.3 -5.4 0.2 -5.6 Q3.6 -5.4 3.9 -2.2 Q1.4 -3.7 -0.8 -2.9 Q-2.4 -2.1 -2.6 2.6Z M-7.2 -3.4 a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0Z'
    : 'M-4 1.6 Q-5.2 -5.4 0.2 -5.6 Q3.6 -5.4 3.9 -2.2 Q1.4 -3.7 -0.8 -2.9 Q-2.4 -2.1 -2.6 1.8Z');
  const scarf = paint(fig, scarfColour, PEN * 0.8);

  // The open book, seen edge-on: two leaves opening up from the spine, which rests in the hands.
  const bookG = el('g', {}, fig);
  const A: Vec = [-6.6, -14], B: Vec = [8.2, -13]; // tops of the leaf nearer the reader and the far leaf
  paint(bookG, bookColour, PEN * 0.75).setAttribute('d', `M0.4 1.4 L${f(A[0] - 2.4)} ${f(A[1] + 0.9)} L${f(A[0])} ${f(A[1])} L0 -0.8Z`);
  paint(bookG, bookColour, PEN * 0.75).setAttribute('d', `M-0.4 1.4 L${f(B[0] + 2.4)} ${f(B[1] + 1.1)} L${f(B[0])} ${f(B[1])} L0 -0.8Z`);
  shape(bookG, PEN * 0.75).setAttribute('d', `M0 -0.6 L${f(A[0])} ${f(A[1])} Q-1.8 -12.4 0.4 -9 Q3.2 -12.2 ${f(B[0])} ${f(B[1])}Z`);
  pen(bookG, PEN * 0.5).setAttribute('d', 'M0.3 -8.6 L0 -1');
  const nearArm = limb(fig, 3.6);

  const walk = gait({ kind: opts.gait ?? 'walk' });
  const tail = spring(30, 4);
  const hold = spring(70, 9); // the book lags the body's rise and fall a little
  let phase = Math.random(), waveT = -1;

  const self: Reader = {
    g: fig,
    x: 0,
    dir,
    wave() { if (waveT < 0) waveT = 0; },
    update(t, dt, groundY, wind = 0) {
      // waving: slow to a stop, look up, wave, go back to the book
      let up = 0;
      if (waveT >= 0) {
        waveT += dt;
        up = waveT < 0.4 ? ease(waveT / 0.4) : waveT < WAVE_SECONDS - 0.5 ? 1 : 1 - ease((waveT - (WAVE_SECONDS - 0.5)) / 0.5);
        if (waveT > WAVE_SECONDS) waveT = -1;
      }
      const go = 1 - up;
      phase += (dt / walk.period) * go;
      self.x += dir * walk.speed * scale * dt * go; // exactly the gait's speed, so planted feet don't slide
      place(fig, self.x, groundY, dir, scale);

      const p = walk.pose(phase, go);
      const b = p.bob;
      p.feet.forEach((fo, i) => { legs[i].draw([p.hip, fo.knee, fo.ankle], [0.3, 0.8]); shoe(shoes[i], fo.ankle, fo.pitch); });
      fig.insertBefore(legs[p.front].g, coat); fig.insertBefore(shoes[p.front], coat);

      // coat, drawn around the forward knee so the hem opens and closes with the stride
      const kF = p.feet[p.front].knee, aF = p.feet[p.front].ankle;
      const sh: Vec = [41.6, 41 + b], hemY = 93;
      const fx = Math.max(kF[0] + 2.4, 46.4);
      coat.setAttribute('d', `M${f(sh[0] - 6)} ${f(sh[1] + 1)} Q${f(sh[0] - 1)} ${f(sh[1] - 2.4)} ${f(sh[0] + 5)} ${f(sh[1] + 1)} L${f(fx - 0.6)} ${f(70 + b)} Q${f(fx)} ${f(82 + b * 0.5)} ${f(Math.max(fx, aF[0] - 4))} ${hemY} L30.6 ${hemY + 1} L33.2 ${f(70 + b)}Z`);
      coatSeam.setAttribute('d', `M${f(sh[0] + 2.6)} ${f(sh[1] + 4)} L${f(sh[0] + 3.8)} ${f(66 + b)}`);

      // head: bent over the book, lifts when looking up
      const hc: Vec = [44 - up * 0.8, 32 + b];
      headG.setAttribute('transform', `translate(${f(hc[0])} ${f(hc[1])}) rotate(${f(16 * (1 - up))})`);
      scarf.setAttribute('d', `M${f(hc[0] - 5)} ${f(hc[1] + 4.4)} Q${f(hc[0] - 0.4)} ${f(hc[1] + 8.4)} ${f(hc[0] + 3.6)} ${f(hc[1] + 5)} L${f(hc[0] + 4)} ${f(hc[1] + 7.8)} Q${f(hc[0] - 0.4)} ${f(hc[1] + 11)} ${f(hc[0] - 5.2)} ${f(hc[1] + 7.4)}Z`);
      const flow = tail.step(-5 - walk.speed * 0.08 * go - dir * wind * 5 + Math.sin(t * 9 + phase) * 0.8, dt);
      scarfTail.setAttribute('d', `M${f(hc[0] - 4)} ${f(hc[1] + 6)} Q${f(hc[0] - 6.4 + flow * 0.4)} ${f(hc[1] + 9)} ${f(hc[0] - 4.4 + flow)} ${f(hc[1] + 16 + flow * 0.2)} L${f(hc[0] - 1.4 + flow * 0.9)} ${f(hc[1] + 16.6 + flow * 0.2)} Q${f(hc[0] - 3.4 + flow * 0.3)} ${f(hc[1] + 10)} ${f(hc[0] - 1.2)} ${f(hc[1] + 7.4)}Z`);

      // both hands hold the book in front of the chest; it drops a little while looking up
      const by = hold.step(b, dt);
      const spine: Vec = [55, 57 + by + up * 5];
      bookG.setAttribute('transform', `translate(${f(spine[0])} ${f(spine[1])}) rotate(${f(-4 + up * 16 + (by - b) * 3)})`);
      const shF: Vec = [sh[0] - 0.6, sh[1] + 2], shN: Vec = [sh[0] + 1.4, sh[1] + 2.4];
      const handF: Vec = [spine[0] + 1.6, spine[1] + 0.6], handN: Vec = [spine[0] - 1.2, spine[1] + 1.2];
      farArm.draw([shF, joint(shF, handF, 16.5, 15.5, -1), handF], [0.2, 0.5]);

      if (up > 0.01) {
        // near hand leaves the book and waves beside the head
        const wag = Math.sin(waveT * 11) * 2.6 * up;
        const target: Vec = [hc[0] + 12 + wag, hc[1] - 7];
        const hand = lerpP(handN, target, up);
        const elbow = lerpP(joint(shN, handN, 16.5, 15.5, -1), [shN[0] + 11, shN[1] + 6], up);
        nearArm.draw([shN, elbow, hand], [0.2, 0.4]);
      } else {
        nearArm.draw([shN, joint(shN, handN, 16.5, 15.5, -1), handN], [0.2, 0.4]);
      }
    },
  };
  fig.addEventListener('pointerdown', () => self.wave());
  return self;
}
