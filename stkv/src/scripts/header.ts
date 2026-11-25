import { toast } from './ui';

export function initHeader() {
  const hdr = document.querySelector<HTMLElement>('[data-header]');
  if (!hdr) return;

  /* Scroll state: solid after 24px, hide on scroll down, reveal on scroll up */
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY;
    hdr.classList.toggle('is-scrolled', y > 24);
    const busy = hdr.classList.contains('is-mega') || document.documentElement.classList.contains('menu-open');
    if (!busy && Math.abs(y - lastY) > 6) hdr.classList.toggle('is-hidden', y > lastY && y > 480);
    lastY = y;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* Mega dropdowns with hover intent + click/keyboard toggles */
  const items = Array.from(hdr.querySelectorAll<HTMLElement>('[data-dropdown]'));
  const list = hdr.querySelector<HTMLElement>('[data-nav]');
  const ink = list?.querySelector<HTMLElement>('.nav__ink');
  let openTimer = 0, closeTimer = 0;
  const setOpen = (item: HTMLElement | null) => {
    items.forEach((it) => {
      const on = it === item;
      it.classList.toggle('is-open', on);
      it.querySelector('.nav__toggle')!.setAttribute('aria-expanded', String(on));
    });
    hdr.classList.toggle('is-mega', !!item);
  };
  const placeInk = (link: HTMLElement | null) => {
    if (!ink || !list) return;
    if (!link) { const cur = list.querySelector<HTMLElement>('.nav__link[aria-current="page"]'); if (!cur) { list.classList.remove('has-ink'); return; } link = cur; }
    ink.style.setProperty('--x', `${link.offsetLeft + 12}px`); ink.style.setProperty('--w', `${link.offsetWidth - 18}px`);
    list.classList.add('has-ink');
  };
  items.forEach((it) => {
    const link = it.querySelector<HTMLElement>('.nav__link')!;
    it.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse') return; clearTimeout(closeTimer); openTimer = window.setTimeout(() => setOpen(it), hdr.classList.contains('is-mega') ? 0 : 90); placeInk(link); });
    it.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'mouse') return; clearTimeout(openTimer); closeTimer = window.setTimeout(() => { setOpen(null); placeInk(null); }, 200); });
    it.querySelector('.nav__toggle')!.addEventListener('click', () => setOpen(it.classList.contains('is-open') ? null : it));
    it.addEventListener('focusout', (e) => { if (!it.contains(e.relatedTarget as Node)) it.classList.contains('is-open') && setOpen(null); });
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && hdr.classList.contains('is-mega')) { const open = items.find((i) => i.classList.contains('is-open')); setOpen(null); open?.querySelector<HTMLElement>('.nav__toggle')?.focus(); } });
  requestAnimationFrame(() => placeInk(null));
  addEventListener('resize', () => placeInk(null), { passive: true });

  /* Mobile menu */
  const burger = hdr.querySelector<HTMLButtonElement>('[data-burger]');
  const mnav = document.querySelector<HTMLElement>('[data-mnav]');
  if (burger && mnav) {
    const toggle = (open: boolean) => {
      burger.setAttribute('aria-expanded', String(open));
      burger.querySelector('.sr-only')!.textContent = open ? 'Close menu' : 'Open menu';
      mnav.classList.toggle('is-open', open);
      open ? mnav.removeAttribute('inert') : mnav.setAttribute('inert', '');
      document.documentElement.classList.toggle('menu-open', open);
      document.documentElement.style.overflow = open ? 'hidden' : '';
      hdr.classList.remove('is-hidden');
    };
    burger.addEventListener('click', () => toggle(burger.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && mnav.classList.contains('is-open')) { toggle(false); burger.focus(); } });
    mnav.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) toggle(false); });
    mnav.querySelectorAll<HTMLButtonElement>('.mnav__exp').forEach((b) => b.addEventListener('click', () => {
      const open = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', String(open));
      document.getElementById(b.getAttribute('aria-controls')!)!.classList.toggle('is-open', open);
    }));
  }

  /* Language selector — English live; Marathi & Hindi planned */
  const lang = hdr.querySelector<HTMLElement>('[data-lang]');
  const announcePlanned = (name: string) => toast(`${name} version planned`, 'Translations will be added once the school approves the content. The site stays in English for now.');
  if (lang) {
    const btn = lang.querySelector<HTMLButtonElement>('.lang__btn')!;
    const opts = Array.from(lang.querySelectorAll<HTMLElement>('[role="option"]'));
    const setOpen = (open: boolean) => { lang.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', String(open)); if (open) opts.find((o) => o.getAttribute('aria-selected') === 'true')?.focus(); };
    btn.addEventListener('click', () => setOpen(!lang.classList.contains('is-open')));
    const choose = (o: HTMLElement) => { setOpen(false); btn.focus(); if (o.dataset.ready !== 'true') announcePlanned(o.dataset.langLabel ?? 'This language'); };
    opts.forEach((o, i) => {
      o.addEventListener('click', () => choose(o));
      o.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); opts[(i + 1) % opts.length].focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); opts[(i - 1 + opts.length) % opts.length].focus(); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(o); }
        else if (e.key === 'Escape' || e.key === 'Tab') { setOpen(false); btn.focus(); }
      });
    });
    document.addEventListener('click', (e) => { if (!lang.contains(e.target as Node)) setOpen(false); });
  }
  document.querySelector('[data-lang-cycle]')?.addEventListener('click', () => announcePlanned('Marathi and Hindi'));
}
