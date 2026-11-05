// Hero shelf animation (GSAP). Entrance: the board slides in, spines rise one by one, the last
// book tips over against its neighbour, the quote card drops in. Idle: the card floats, a random
// book is "pulled" now and then, and the card cycles through reader quotes.
// Everything idles only while the hero is on screen. Reduced motion: static hero (CSS).

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const PULL_EVERY = 3.2; // s between "someone picks a book"
const SWAP_EVERY = 7; // s between quotes

export function initHeroAnimation() {
  const hero = document.querySelector<HTMLElement>('.hero');
  const card = hero?.querySelector<HTMLElement>('[data-hero-card]');
  if (!hero || !card) return;
  gsap.registerPlugin(ScrollTrigger);

  const slots = [...hero.querySelectorAll<HTMLElement>('.slot')];
  const lean = hero.querySelector<HTMLElement>('.slot-lean');
  const board = hero.querySelector<HTMLElement>('.shelf-board')!;
  const body = card.querySelector<HTMLElement>('.quote-body')!;
  const avatar = card.querySelector<HTMLImageElement>('[data-hero-avatar]')!;
  const name = card.querySelector<HTMLElement>('[data-hero-name]')!;
  const user = card.querySelector<HTMLElement>('[data-hero-user]')!;
  const quote = card.querySelector<HTMLElement>('[data-hero-quote]')!;
  const source = card.querySelector<HTMLElement>('[data-hero-source]')!;
  const pool = [...hero.querySelectorAll<HTMLElement>('[data-hero-pool] > div')];
  pool.forEach((p) => (new Image().src = p.dataset.avatar!)); // warm the avatar cache

  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    let onScreen = true;
    let current = 0;

    // ---------- entrance ----------
    gsap.set(card, { rotation: -3 });
    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
    intro
      .fromTo(board, { scaleX: 0, transformOrigin: 'left center', autoAlpha: 1 }, { scaleX: 1, duration: 0.7, ease: 'power2.inOut' })
      .fromTo(slots, { yPercent: 105, autoAlpha: 1 }, { yPercent: 0, duration: 0.8, stagger: 0.07, ease: 'back.out(1.3)' }, '-=0.3');
    if (lean) {
      // the leaning book stands upright first, then tips over and bounces against its neighbour
      intro.fromTo(lean, { rotation: 7, transformOrigin: 'left bottom' }, { rotation: 0, duration: 0.9, ease: 'bounce.out' }, '-=0.15');
    }
    intro.fromTo(
      card,
      { y: -40, autoAlpha: 0, rotation: 4 },
      { y: 0, autoAlpha: 1, rotation: -3, duration: 0.9, ease: 'back.out(1.6)' },
      '-=0.5',
    );

    // ---------- idle ----------
    const float = gsap.to(card, { y: -7, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true });

    const pullable = slots.filter((s) => s !== lean);
    let lastPulled: HTMLElement | null = null;
    const pull = () => {
      if (onScreen) {
        const choices = pullable.filter((s) => s !== lastPulled);
        const slot = choices[Math.floor(Math.random() * choices.length)];
        lastPulled = slot;
        gsap.timeline()
          .to(slot, { y: -22, duration: 0.45, ease: 'power2.out' })
          .to(slot, { y: 0, duration: 0.6, ease: 'bounce.out' }, '+=0.35');
      }
      pullCall = gsap.delayedCall(PULL_EVERY, pull);
    };

    const fill = (i: number) => {
      const item = pool[i];
      const text = item.querySelector<HTMLElement>('[data-role="text"]')!;
      const src = item.querySelector<HTMLElement>('[data-role="source"]');
      avatar.src = item.dataset.avatar!;
      name.textContent = item.dataset.name!;
      user.textContent = '@' + item.dataset.user!;
      // keep the dictionary key on the visible elements so a language switch translates them
      quote.dataset.i18n = text.dataset.i18n!;
      quote.textContent = text.textContent;
      if (src) {
        source.dataset.i18n = src.dataset.i18n!;
        source.textContent = src.textContent;
        source.hidden = false;
      } else {
        delete source.dataset.i18n;
        source.hidden = true;
      }
    };

    const swap = () => {
      if (onScreen && pool.length > 1) {
        current = (current + 1) % pool.length;
        const h0 = card.offsetHeight;
        gsap.timeline()
          .to(body, { autoAlpha: 0, y: -8, duration: 0.3, ease: 'power2.in' })
          .add(() => {
            fill(current);
            const h1 = card.offsetHeight;
            gsap.fromTo(card, { height: h0 }, { height: h1, duration: 0.35, ease: 'power2.out', clearProps: 'height' });
          })
          .fromTo(body, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }, '+=0.05')
          .to(card, { rotation: -1.5, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut' }, '<');
      }
      swapCall = gsap.delayedCall(SWAP_EVERY, swap);
    };

    let pullCall = gsap.delayedCall(PULL_EVERY + 1.5, pull);
    let swapCall = gsap.delayedCall(SWAP_EVERY, swap);
    intro.eventCallback('onComplete', () => float.play());

    // pause the idle loop while the hero is off screen
    const st = ScrollTrigger.create({
      trigger: hero,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        onScreen = self.isActive;
        if (onScreen && intro.progress() === 1) float.play();
        else float.pause();
      },
    });

    return () => {
      st.kill();
      intro.kill();
      float.kill();
      pullCall.kill();
      swapCall.kill();
      fill(0);
      gsap.set([card, board, ...slots], { clearProps: 'all' });
    };
  });
}
