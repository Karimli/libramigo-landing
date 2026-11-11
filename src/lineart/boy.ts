// A boy with a backpack: walks, stops, reaches out to touch something in front of him and
// looks up at it, or waves. The caller decides what he does each frame (see BoyState).
// Built on the line-art library in ./lib (figure space: feet on y = 120, facing +x, at x = 40).

import { el, shape, blot, paint, limb, solid, shoe, place, joint, toScene, f, PEN, PAPER, type Vec } from './lib/ink.ts';
import { gait } from './lib/gait.ts';
import { spring, clamp } from './lib/motion.ts';

export interface BoyOptions {
  /** Flat colours. */
  backpack?: string;
  trousers?: string;
  /** Figure scale in scene units (1 → about 95 units tall). */
  scale?: number;
}

export interface BoyState {
  /** 1 walking … 0 standing. */
  go: number;
  /** 0…1: near arm stretched forward to touch. */
  reach: number;
  /** 0…1: head tipped back, looking up. */
  look: number;
  /** 0…1: near arm up, waving. */
  wave: number;
}

export interface Boy {
  g: SVGGElement;
  /** Scene x of the feet. */
  x: number;
  dir: 1 | -1;
  /** How far in front of his feet the outstretched hand is, in scene units. */
  readonly reachAhead: number;
  /** Walking speed in scene units per second at go = 1. */
  readonly speed: number;
  /** Scene position of the near hand after the last update (for things he carries). */
  hand: Vec;
  update(t: number, dt: number, groundY: number, state: BoyState): void;
}

const lerpP = (a: Vec, b: Vec, t: number): Vec => { t = clamp(t, 0, 1); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; };
const REACH_X = 66; // figure-space x of the outstretched hand

export function createBoy(parent: Element, opts: BoyOptions = {}): Boy {
  const { backpack: packColour = '#B8323F', trousers: trouserColour = '#8FB5AC', scale = 1 } = opts;

  // Back to front.
  const fig = el('g', { style: 'cursor:pointer' }, parent);
  const farArm = limb(fig, 3.6);
  const legs = [solid(limb(fig, 4.6), trouserColour), solid(limb(fig, 4.6), trouserColour)];
  const shoes = [blot(fig), blot(fig)];
  const pack = paint(fig, packColour, PEN * 0.8);
  const jacket = shape(fig);
  const headG = el('g', {}, fig);
  el('ellipse', { rx: 4.3, ry: 5, fill: PAPER, stroke: 'currentColor', 'stroke-width': PEN }, headG);
  blot(headG).setAttribute('d', 'M-4.5 0.6 Q-5.7 -6 0.4 -6.3 Q4.7 -6.1 4.7 -2.2 Q2.2 -4.3 -0.6 -3.5 Q-2.8 -2.7 -3 1Z');
  const nearArm = limb(fig, 3.6);

  const walk = gait({ kind: 'walk', period: 0.92, stride: 22 });
  const armSwing = [spring(60, 9), spring(60, 9)];
  const packLag = spring(55, 7);
  let phase = 0;

  const self: Boy = {
    g: fig,
    x: 0,
    dir: 1,
    reachAhead: (REACH_X - 40) * scale,
    speed: walk.speed * scale,
    hand: [0, 0],
    update(t, dt, groundY, { go, reach, look, wave }) {
      phase += (dt / walk.period) * go;
      self.x += self.dir * walk.speed * scale * dt * go; // exactly the gait's speed, so planted feet don't slide
      place(fig, self.x, groundY, self.dir, scale);

      const p = walk.pose(phase, go);
      const b = p.bob;
      p.feet.forEach((fo, i) => { legs[i].draw([p.hip, fo.knee, fo.ankle], [0.3, 0.8]); shoe(shoes[i], fo.ankle, fo.pitch); });
      fig.insertBefore(legs[p.front].g, pack); fig.insertBefore(shoes[p.front], pack);

      // backpack rides on the shoulders a beat behind the body
      const sh: Vec = [41, 43.4 + b];
      const py = sh[1] + 2 + (packLag.step(b, dt) - b) * 1.6;
      pack.setAttribute('d', `M36 ${f(py)} Q27.4 ${f(py - 0.6)} 27.8 ${f(py + 8)} L28.4 ${f(py + 17)} Q29 ${f(py + 20.4)} 36 ${f(py + 19.6)}Z`);
      jacket.setAttribute('d', `M${f(sh[0] - 6.5)} ${f(sh[1] + 1)} Q${f(sh[0] - 1)} ${f(sh[1] - 2.6)} ${f(sh[0] + 5.5)} ${f(sh[1] + 1)} L47.8 ${f(73 + b)} Q41 ${f(75.6 + b)} 33 ${f(73.8 + b)}Z`);

      // head tips back to look up
      const hc: Vec = [42.4 - look * 1.2, 33 + b];
      headG.setAttribute('transform', `translate(${f(hc[0])} ${f(hc[1])}) rotate(${f(-15 * look)})`);

      // arms swing opposite the legs, through springs so they lag and settle
      const legSwing = (p.feet[0].ankle[0] - 40) / (walk.stride / 2);
      const farA = (armSwing[0].step(-legSwing * 18 * go, dt) * Math.PI) / 180;
      const nearA = (armSwing[1].step(legSwing * 16 * go, dt) * Math.PI) / 180;
      const shF: Vec = [sh[0] - 0.8, sh[1] + 2.2], shN: Vec = [sh[0] + 1.2, sh[1] + 2.6];
      const elbF: Vec = [shF[0] + 15 * Math.sin(farA), shF[1] + 15 * Math.cos(farA)];
      farArm.draw([shF, elbF, [elbF[0] + 14 * Math.sin(farA + 0.25), elbF[1] + 14 * Math.cos(farA + 0.25)]], [0.2, 0.5]);

      let elbow: Vec = [shN[0] + 15 * Math.sin(nearA), shN[1] + 15 * Math.cos(nearA)];
      let hand: Vec = [elbow[0] + 14 * Math.sin(nearA + 0.15), elbow[1] + 14 * Math.cos(nearA + 0.15)];
      if (reach > 0.001) {
        const target: Vec = [REACH_X, 46 + b];
        elbow = lerpP(elbow, joint(shN, target, 15, 14, -1), reach);
        hand = lerpP(hand, target, reach);
      }
      if (wave > 0.001) {
        const target: Vec = [hc[0] + 12 + Math.sin(t * 11) * 2.6 * wave, hc[1] - 8];
        elbow = lerpP(elbow, [shN[0] + 10.5, shN[1] + 5], wave);
        hand = lerpP(hand, target, wave);
      }
      nearArm.draw([shN, elbow, hand], [0.2, 0.4]);
      self.hand = toScene(self.x, groundY, self.dir, hand[0], hand[1], scale);
    },
  };
  return self;
}
