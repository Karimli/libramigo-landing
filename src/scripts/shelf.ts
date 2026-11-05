// Watch-only "build your shelf" demo, driven by a GSAP timeline: a fake cursor taps books
// and they drop onto the shelf. The markup is server-rendered in its final state; the
// timeline resets it and loops while the section is on screen (ScrollTrigger).
// Reduced motion or no JS: the final state stays as rendered.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type Status = 'read' | 'reading' | 'want';
type Step = { status: Status } | { book: string };

const SCRIPT: Step[] = [
  { book: 'b1' },
  { book: 'b3' },
  { book: 'b5' },
  { status: 'reading' },
  { book: 'b4' },
  { status: 'want' },
  { book: 'b6' },
];

export function initShelfDemo() {
  const demo = document.querySelector<HTMLElement>('[data-shelf-demo]');
  if (!demo) return;
  gsap.registerPlugin(ScrollTrigger);

  const q = <T extends Element = HTMLElement>(sel: string) => demo.querySelector<T>(sel)!;
  const qa = (sel: string) => [...demo.querySelectorAll<HTMLElement>(sel)];
  const cursor = q<SVGElement>('.cursor');
  const ripple = q<SVGElement>('.ripple');
  const spineList = q('.spines');
  const opts = qa('[data-status-opt]');
  const finalStatus = new Map(qa('[data-spine]').map((el) => [el.dataset.spine!, el.dataset.status as Status]));

  // Cursor target: a point inside the element, relative to the demo box (re-measured on refresh).
  const at = (el: HTMLElement, axis: 'x' | 'y') => () => {
    const d = demo.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return axis === 'x' ? r.left - d.left + r.width * 0.62 : r.top - d.top + r.height * 0.45;
  };

  const counts: Record<Status, number> = { read: 0, reading: 0, want: 0 };
  const countEl = (s: Status) => q(`[data-count="${s}"]`);
  const setStatus = (s: Status) => opts.forEach((o) => o.classList.toggle('on', o.dataset.statusOpt === s));

  function reset() {
    qa('[data-book]').forEach((b) => delete b.dataset.status);
    qa('[data-spine]').forEach((s) => (s.hidden = true));
    (Object.keys(counts) as Status[]).forEach((s) => {
      counts[s] = 0;
      countEl(s).textContent = '0';
    });
    setStatus('read');
  }

  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4, paused: true, defaults: { ease: 'power2.inOut' } });
    tl.call(reset)
      .set(cursor, { x: at(q('.books'), 'x'), y: at(q('.books'), 'y'), autoAlpha: 0 })
      .to(cursor, { autoAlpha: 1, duration: 0.3 });

    const tap = (el: HTMLElement) =>
      tl.fromTo(ripple, { scale: 0, autoAlpha: 0.8, transformOrigin: '7px 5px' }, { scale: 1.6, autoAlpha: 0, duration: 0.42, ease: 'power1.out', immediateRender: false })
        .fromTo(el, { scale: 1 }, { scale: 0.96, duration: 0.09, yoyo: true, repeat: 1, ease: 'power1.inOut', immediateRender: false }, '<');

    let status: Status = 'read'; // status at this point of the script, known while building
    for (const step of SCRIPT) {
      const target = 'status' in step ? opts.find((o) => o.dataset.statusOpt === step.status)! : q(`[data-book="${step.book}"]`);
      tl.to(cursor, { x: at(target, 'x'), y: at(target, 'y'), duration: 0.7 }, '+=0.25');
      tap(target);

      if ('status' in step) {
        const s = (status = step.status);
        tl.call(() => setStatus(s), undefined, '<');
        continue;
      }
      const s = status;
      const spine = q(`[data-spine="${step.book}"]`);
      tl.call(() => {
        target.dataset.status = s;
        spine.dataset.status = finalStatus.get(step.book) ?? s;
        spineList.appendChild(spine); // shelved in tap order
        spine.hidden = false;
        counts[s] += 1;
        countEl(s).textContent = String(counts[s]);
      }, undefined, '<')
        .fromTo(spine, { y: -70, autoAlpha: 0, rotation: -8 }, { y: 0, autoAlpha: 1, rotation: 0, duration: 0.7, ease: 'bounce.out', immediateRender: false }, '<')
        .fromTo(countEl(s), { scale: 1.35 }, { scale: 1, duration: 0.4, ease: 'back.out(3)', immediateRender: false }, '<');
    }

    tl.to(cursor, { autoAlpha: 0, duration: 0.3 }, '+=0.4')
      .to({}, { duration: 3 }); // let the full shelf sit, then loop

    const st = ScrollTrigger.create({
      trigger: demo,
      start: 'top 75%',
      end: 'bottom 25%',
      invalidateOnRefresh: true,
      onToggle: (self) => (self.isActive ? tl.play() : tl.pause()),
      onRefresh: () => tl.invalidate(),
    });

    return () => {
      st.kill();
      tl.kill();
      // back to the rendered final state
      qa('[data-spine]').forEach((s) => { s.hidden = false; gsap.set(s, { clearProps: 'all' }); });
    };
  });
}
