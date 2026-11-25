/**
 * Motion system — reusable, attribute-driven, transform/opacity only.
 *  data-reveal="up|fade|scale|left|line|mask|wipe|stagger|words|draw"  one-shot entrance
 *  data-count="2018" [data-from]                                       counter
 *  data-parallax="0.12"                                                scroll parallax (translateY)
 *  data-depth="12" inside [data-tilt-scope]                            pointer parallax
 *  data-scrub-words                                                    scroll-linked word highlight
 *  data-bg-shift                                                       section colour transition
 */
export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Wrap each word in .w > .w__i, preserving inline elements such as <em>. */
export function splitWords(root: HTMLElement): HTMLElement[] {
  if (root.dataset.split) return Array.from(root.querySelectorAll<HTMLElement>('.w'));
  root.dataset.split = '1';
  const label = root.textContent?.trim();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  while (walker.nextNode()) texts.push(walker.currentNode as Text);
  const words: HTMLElement[] = [];
  for (const t of texts) {
    const parts = (t.nodeValue ?? '').split(/(\s+)/);
    const frag = document.createDocumentFragment();
    for (const p of parts) {
      if (!p) continue;
      if (/^\s+$/.test(p)) { frag.append(document.createTextNode(' ')); continue; }
      const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
      const i = document.createElement('span'); i.className = 'w__i'; i.textContent = p;
      w.append(i); frag.append(w); words.push(w);
    }
    t.replaceWith(frag);
  }
  words.forEach((w, n) => (w.firstElementChild as HTMLElement).style.setProperty('--i', String(n)));
  if (label && !root.hasAttribute('aria-label')) {
    const sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = label; root.prepend(sr);
  }
  return words;
}

function prepare(el: HTMLElement) {
  const type = el.dataset.reveal;
  if (type === 'words') splitWords(el);
  if (type === 'stagger') Array.from(el.children).forEach((c, i) => (c as HTMLElement).style.setProperty('--i', String(i)));
  if (type === 'draw') {
    el.querySelectorAll<SVGGeometryElement>('path, polyline').forEach((p) => {
      if (!p.style.getPropertyValue('--len')) p.style.setProperty('--len', String(Math.ceil(p.getTotalLength())));
    });
  }
}

// Elements hidden by their own clip-path/scale never "intersect", so those watch their parent instead.
const proxyTargets = new WeakMap<Element, HTMLElement[]>();
const revealIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const el = e.target as HTMLElement;
    if (el.dataset.reveal) el.classList.add('is-in');
    proxyTargets.get(el)?.forEach((t) => t.classList.add('is-in'));
    revealIO.unobserve(e.target);
  }
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

export function initReveals(scope: ParentNode = document) {
  scope.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    prepare(el);
    if (reduced) { el.classList.add('is-in'); return; }
    const type = el.dataset.reveal!;
    const watch = ['mask', 'wipe', 'line'].includes(type) && el.parentElement ? el.parentElement : el;
    if (watch !== el) proxyTargets.set(watch, [...(proxyTargets.get(watch) ?? []), el]);
    revealIO.observe(watch);
  });
}

/* ---------- Counters ---------- */
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
function runCounter(el: HTMLElement) {
  const to = Number(el.dataset.count); const from = Number(el.dataset.from ?? 0);
  if (reduced) { el.textContent = String(to); return; }
  const dur = 1800; const t0 = performance.now();
  const tick = (now: number) => {
    const p = Math.min(1, (now - t0) / dur);
    el.textContent = String(Math.round(from + (to - from) * easeOutExpo(p)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
export function initCounters() {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { runCounter(e.target as HTMLElement); io.unobserve(e.target); } }), { threshold: 0.6 });
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => io.observe(el));
}

/* ---------- Scroll-driven effects (single rAF loop, only while visible) ---------- */
export function initScrollFx() {
  const parallax = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
  const scrubs = Array.from(document.querySelectorAll<HTMLElement>('[data-scrub-words]')).map((el) => ({ el, words: splitWords(el) }));
  const visible = new Set<Element>();
  const vio = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target))), { rootMargin: '20% 0px' });
  [...parallax, ...scrubs.map((s) => s.el)].forEach((el) => vio.observe(el));

  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    if (!reduced) for (const el of parallax) {
      if (!visible.has(el)) continue;
      const r = el.getBoundingClientRect();
      const offset = (r.top + r.height / 2 - vh / 2) * Number(el.dataset.parallax);
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    }
    for (const { el, words } of scrubs) {
      if (!visible.has(el)) continue;
      const r = el.getBoundingClientRect();
      const p = reduced ? 1 : Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      const lit = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

/* ---------- Pointer parallax (hero) ---------- */
export function initTilt() {
  if (reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll<HTMLElement>('[data-tilt-scope]').forEach((scope) => {
    const layers = Array.from(scope.querySelectorAll<HTMLElement>('[data-depth]'));
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      layers.forEach((l) => { const d = Number(l.dataset.depth); l.style.translate = `${(cx * d).toFixed(2)}px ${(cy * d).toFixed(2)}px`; });
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.001 ? requestAnimationFrame(loop) : 0;
    };
    scope.addEventListener('pointermove', (e) => {
      const r = scope.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    scope.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
  });
}

/* ---------- Section background shift ---------- */
export function initBgShift() {
  const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('is-active', e.isIntersecting)), { threshold: 0.25 });
  document.querySelectorAll('[data-bg-shift]').forEach((el) => io.observe(el));
}
