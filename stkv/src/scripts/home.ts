/** STKV homepage: navigation, countdown and the GSAP motion system. */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
gsap.registerPlugin(ScrollTrigger, SplitText);

/* ---------- Header: hide on scroll down, sliding hover ink, mobile menu ---------- */
const hd = document.querySelector<HTMLElement>('[data-hd]')!;
let lastY = scrollY;
addEventListener('scroll', () => {
  const y = scrollY;
  if (!document.documentElement.classList.contains('menu-open')) hd.classList.toggle('is-hidden', y > lastY && y > 500);
  lastY = y;
  document.querySelector('[data-totop]')?.classList.toggle('is-on', y > 900);
}, { passive: true });

const hnav = document.querySelector<HTMLElement>('[data-hdnav]');
if (hnav) {
  const ink = hnav.querySelector<HTMLElement>('.hd__ink')!;
  hnav.querySelectorAll<HTMLElement>('a').forEach((a) => {
    const place = () => { ink.style.setProperty('--x', `${a.offsetLeft}px`); ink.style.setProperty('--w', `${a.offsetWidth}px`); hnav.classList.add('has-ink'); };
    a.addEventListener('pointerenter', place); a.addEventListener('focus', place);
  });
  hnav.addEventListener('pointerleave', () => hnav.classList.remove('has-ink'));
}

const burger = document.querySelector<HTMLButtonElement>('[data-burger]')!;
const mnav = document.querySelector<HTMLElement>('[data-mnav]')!;
const setMenu = (open: boolean) => {
  burger.setAttribute('aria-expanded', String(open));
  mnav.classList.toggle('is-open', open);
  open ? mnav.removeAttribute('inert') : mnav.setAttribute('inert', '');
  document.documentElement.classList.toggle('menu-open', open);
  document.documentElement.style.overflow = open ? 'hidden' : '';
  hd.classList.remove('is-hidden');
};
burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
addEventListener('keydown', (e) => { if (e.key === 'Escape' && mnav.classList.contains('is-open')) { setMenu(false); burger.focus(); } });
mnav.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) setMenu(false); });

/* ---------- Admissions countdown to 1 December (IST); switches to "open" afterwards ---------- */
const cdBox = document.querySelector<HTMLElement>('[data-countdown]');
if (cdBox) {
  const now = new Date();
  const year = now.getMonth() === 11 || now.getMonth() < 3 ? (now.getMonth() === 11 ? now.getFullYear() : now.getFullYear() - 1) : now.getFullYear();
  const target = new Date(`${year}-12-01T00:00:00+05:30`).getTime();
  const tick = () => {
    const ms = target - Date.now();
    if (ms <= 0) { cdBox.innerHTML = '<div class="count__open">Admissions are open — enquire today</div>'; return false; }
    const parts = { d: Math.floor(ms / 864e5), h: Math.floor(ms / 36e5) % 24, m: Math.floor(ms / 6e4) % 60, s: Math.floor(ms / 1e3) % 60 };
    for (const [k, val] of Object.entries(parts)) { const el = cdBox.querySelector(`[data-cd="${k}"]`)!; const t = String(val).padStart(2, '0'); if (el.textContent !== t) el.textContent = t; }
    return true;
  };
  if (tick()) { const id = setInterval(() => { if (!tick()) clearInterval(id); }, 1000); }
}

/* ---------- Motion (skipped entirely for reduced-motion users) ---------- */
const mm = gsap.matchMedia();
mm.add({ motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 1000px)', wide: '(min-width: 761px)' }, (ctx) => {
  const { motion, desktop, wide } = ctx.conditions as Record<string, boolean>;
  if (!motion) return;

  // Hero: photo settles, lines rise, highlights swipe in, stickers pop
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('[data-hero-media]', { scale: 1.18, duration: 2.2, ease: 'power3.out' })
    .from('[data-h-kick]', { y: 20, autoAlpha: 0, duration: .8 }, .2)
    .from('[data-h-title] .li', { yPercent: 110, duration: 1.1, stagger: .12 }, .3)
    .fromTo('.hl', { '--hl': 0 }, { '--hl': 1, duration: .7, stagger: .15, ease: 'power3.inOut' }, .9)
    .from('[data-h-sub], [data-h-row] > *', { y: 26, autoAlpha: 0, duration: .9, stagger: .08 }, 1.05)
    .from('[data-sticker]', { scale: 0, rotate: -40, duration: 1, stagger: .12, ease: 'back.out(2)' }, 1.2);
  gsap.to('[data-hero-media]', { yPercent: 12, scale: 1.05, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('[data-sticker]', { y: (i) => -60 - i * 40, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Activities ribbon: speed and direction follow scrolling
  const loop = gsap.to('[data-marquee]', { xPercent: -50, duration: 30, ease: 'none', repeat: -1 });
  ScrollTrigger.create({ onUpdate: (self) => gsap.to(loop, { timeScale: self.direction * Math.min(4, 1 + Math.abs(self.getVelocity()) / 600), duration: .4, overwrite: true }) });

  // Quick access bar slides up with staggered items
  gsap.from('[data-quick] li', { y: 30, autoAlpha: 0, duration: .8, stagger: .05, ease: 'power3.out', scrollTrigger: { trigger: '[data-quick]', start: 'top 92%' } });

  // Section headings: words rise from a mask
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((h) => {
    SplitText.create(h, { type: 'words', mask: 'words', onSplit: (s) => gsap.from(s.words, { yPercent: 110, duration: 1, stagger: .045, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } }) });
  });

  // Stats: bounce in and count up
  gsap.from('[data-stat]', { y: 70, rotate: (i) => (i % 2 ? 4 : -4), autoAlpha: 0, duration: 1, stagger: .1, ease: 'back.out(1.4)', scrollTrigger: { trigger: '.stats__grid', start: 'top 85%' } });
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const o = { v: 0 };
    gsap.to(o, { v: Number(el.dataset.count), duration: 2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' }, onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-IN'); } });
  });

  // Mosaic tiles: rounded clip-path wipe + image zoom-out, batched
  ScrollTrigger.batch('[data-tile]', { start: 'top 90%', once: true, onEnter: (els) => {
    gsap.fromTo(els, { clipPath: 'inset(100% 0% 0% 0% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: 1.1, stagger: .1, ease: 'power4.inOut', clearProps: 'clipPath' });
    gsap.from(els.map((e) => e.querySelector('.ph__img')), { scale: 1.3, duration: 1.6, stagger: .1, ease: 'power3.out' });
  } });

  // A Day at STKV: pinned story — each hour wipes in a new photo and caption
  const imgs = gsap.utils.toArray<HTMLElement>('[data-dimg]');
  const steps = gsap.utils.toArray<HTMLElement>('[data-dstep]');
  const dots = gsap.utils.toArray<HTMLElement>('[data-ddot]');
  const clock = document.querySelector<HTMLElement>('[data-clock]')!;
  const ap = document.querySelector<HTMLElement>('[data-ap]')!;
  const labels = steps.map((s) => s.querySelector('.day__t')!.textContent!.split(' '));
  let cur = -1;
  const setStep = (i: number) => { if (i === cur) return; cur = i; clock.textContent = labels[i][0]; ap.textContent = labels[i][1]; dots.forEach((d, j) => d.classList.toggle('is-on', j === i)); };
  setStep(0);
  const dtl = gsap.timeline({ scrollTrigger: { trigger: '.day__pin', start: 'top top', end: `+=${steps.length * (desktop ? 70 : 60)}%`, pin: true, scrub: .8,
    onUpdate: (st) => setStep(Math.min(steps.length - 1, Math.floor(st.progress * steps.length + .15))) } });
  dtl.to('[data-daybar]', { scaleX: 1, ease: 'none', duration: steps.length }, 0)
     .fromTo(imgs[0].querySelector('.ph__img'), { scale: 1.15 }, { scale: 1, duration: 1, ease: 'none' }, 0);
  imgs.slice(1).forEach((img, k) => {
    const i = k + 1;
    dtl.fromTo(img, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .6, ease: 'power2.inOut' }, i - .3)
       .fromTo(img.querySelector('.ph__img'), { scale: 1.3 }, { scale: 1, duration: 1, ease: 'none' }, i - .3)
       .to(steps[i - 1], { autoAlpha: 0, y: -30, duration: .3 }, i - .3)
       .fromTo(steps[i], { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: .35 }, i - .1);
  });

  // Journey cards: fan in (scrubbed on desktop, simple entrance on small screens)
  if (desktop) gsap.from('[data-jcard]', { xPercent: 50, rotate: 7, autoAlpha: 0, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: '.journey__cards', start: 'top 88%', end: 'top 45%', scrub: 1 } });
  else gsap.from('[data-jcard]', { y: 50, autoAlpha: 0, stagger: .1, duration: .9, ease: 'back.out(1.3)', scrollTrigger: { trigger: '.journey__cards', start: 'top 85%' } });

  // Heritage timeline: pinned horizontal scroll on tablet/desktop, stacked on phones
  if (wide) {
    const list = document.querySelector<HTMLElement>('[data-time-list]')!;
    const dist = () => Math.max(0, list.scrollWidth - innerWidth + 160);
    const ttl = gsap.timeline({ scrollTrigger: { trigger: '[data-time-pin]', start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 1, invalidateOnRefresh: true } });
    ttl.to(list, { x: () => -dist(), ease: 'none' }, 0).to('[data-time-line]', { scaleX: 1, ease: 'none' }, 0);
    gsap.utils.toArray<HTMLElement>('.ev').forEach((ev) => gsap.from(ev.children, { y: 30, autoAlpha: 0, stagger: .05, duration: .6, ease: 'power2.out', scrollTrigger: { trigger: ev, containerAnimation: ttl, start: 'left 88%' } }));
  } else {
    gsap.utils.toArray<HTMLElement>('.ev').forEach((ev) => gsap.from(ev, { x: -30, autoAlpha: 0, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: ev, start: 'top 88%' } }));
  }

  // Motto: Devanagari characters bloom; founder portrait rises
  const motto = SplitText.create('[data-motto]', { type: 'words' });
  gsap.from(motto.words, { y: 50, autoAlpha: 0, rotateX: -50, stagger: .12, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '[data-motto]', start: 'top 82%' } });
  gsap.from('.motto__portrait', { y: 60, rotate: -4, autoAlpha: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.motto', start: 'top 70%' } });
  gsap.to('.motto__crest', { rotate: 12, ease: 'none', scrollTrigger: { trigger: '.motto', start: 'top bottom', end: 'bottom top', scrub: true } });

  // Principal quote lights up word by word
  const q = SplitText.create('[data-scrub]', { type: 'words', wordsClass: 'word' });
  gsap.to(q.words, { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: '[data-scrub]', start: 'top 80%', end: 'bottom 50%', scrub: true } });
  gsap.from('[data-voice-photo]', { rotate: -8, y: 80, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.voice', start: 'top 72%' } });

  // News rows slide in; countdown tiles flip
  gsap.from('[data-news] li', { x: 40, autoAlpha: 0, stagger: .08, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: '[data-news]', start: 'top 85%' } });
  gsap.from('.count div', { rotateX: -90, transformOrigin: 'top', autoAlpha: 0, duration: .9, stagger: .08, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.count', start: 'top 90%' } });
});

// Fonts can change line lengths: recalculate trigger positions once they load
document.fonts?.ready.then(() => ScrollTrigger.refresh());
