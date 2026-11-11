// Hero shelf animation (GSAP). Entrance: the board slides in, spines rise one by one, the last
// book tips over against its neighbour, the quote card drops in. Idle: the card floats and a
// line-art boy browses the shelf (src/lineart/browser.ts): each book he touches lifts out and
// the card turns to the next reader quote. Clicking a book sends him to it.
// Everything idles only while the hero is on screen. Reduced motion: static hero, boy standing.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createShelfBrowser } from '../lineart/browser';

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
  const browserRoot = hero.querySelector<HTMLElement>('[data-hero-browser]');
  const books = slots.filter((s) => s !== lean); // the leaning book stays put

  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: reduce)', () => {
    if (!browserRoot) return;
    const browser = createShelfBrowser({ root: browserRoot, books, onTouch: () => {} });
    browser.drawStill();
    return () => browser.destroy();
  });
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

    // a touched book lifts out of the row, hangs a moment, and drops back
    const lift = (slot: HTMLElement) => {
      gsap.killTweensOf(slot);
      gsap.timeline()
        .to(slot, { y: -26, duration: 0.4, ease: 'back.out(2.2)' })
        .to(slot, { y: 0, duration: 0.6, ease: 'bounce.out' }, '+=0.6');
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

    let swapping: gsap.core.Timeline | null = null;
    const swap = () => {
      if (pool.length < 2 || swapping?.isActive()) return;
      current = (current + 1) % pool.length;
      const h0 = card.offsetHeight;
      swapping = gsap.timeline()
        .to(body, { autoAlpha: 0, y: -8, duration: 0.3, ease: 'power2.in' })
        .add(() => {
          fill(current);
          const h1 = card.offsetHeight;
          gsap.fromTo(card, { height: h0 }, { height: h1, duration: 0.35, ease: 'power2.out', clearProps: 'height' });
        })
        .fromTo(body, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }, '+=0.05')
        .to(card, { rotation: -1.5, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut' }, '<');
    };

    // the boy arrives once the shelf is up
    const browser = browserRoot ? createShelfBrowser({ root: browserRoot, books, onTouch: (book) => { lift(book); swap(); } }) : null;
    let browsing = false;
    if (browserRoot) gsap.set(browserRoot, { autoAlpha: 0 });
    const tick = (time: number, deltaMs: number) => {
      if (browsing && onScreen) browser?.step(time, Math.min(0.05, deltaMs / 1000));
    };
    gsap.ticker.add(tick);
    intro.eventCallback('onComplete', () => {
      float.play();
      browsing = true;
      if (browserRoot) gsap.to(browserRoot, { autoAlpha: 1, duration: 0.6 });
    });

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
      swapping?.kill();
      gsap.ticker.remove(tick);
      browser?.destroy();
      fill(0);
      gsap.set([card, board, body, ...slots, ...(browserRoot ? [browserRoot] : [])], { clearProps: 'all' });
    };
  });
}
