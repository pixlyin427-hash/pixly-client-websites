/** Page-level interactions: gallery + lightbox, class selector, checklist, horizontal rails,
 *  hover-reveal lists, sticky swaps and the information-assistant demo. */
import { esc, toast } from './ui';
import { reduced } from './motion';

/* ---------- Gallery: FLIP filtering + lightbox ---------- */
export function initGallery() {
  const root = document.querySelector<HTMLElement>('[data-gallery]');
  if (!root) return;
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-g-item]'));
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-g-filter]'));
  chips.forEach((c) => c.addEventListener('click', () => {
    const tag = c.dataset.gFilter!;
    chips.forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
    const first = new Map(items.map((i) => [i, i.getBoundingClientRect()]));
    items.forEach((i) => (i.hidden = tag !== 'All' && i.dataset.tag !== tag));
    if (reduced) return;
    items.forEach((i) => {
      if (i.hidden) return;
      const a = first.get(i)!, b = i.getBoundingClientRect();
      const wasHidden = a.width === 0;
      i.animate(wasHidden
        ? [{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'none' }]
        : [{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})` }, { transform: 'none' }],
      { duration: 560, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    });
  }));

  const box = document.getElementById('lightbox') as HTMLDialogElement | null;
  if (!box) return;
  const stage = box.querySelector<HTMLElement>('[data-lb-stage]')!;
  const cap = box.querySelector<HTMLElement>('[data-lb-cap]')!;
  const counter = box.querySelector<HTMLElement>('[data-lb-count]')!;
  let idx = 0;
  const visibleItems = () => items.filter((i) => !i.hidden);
  const show = (n: number, dir = 0) => {
    const list = visibleItems(); idx = (n + list.length) % list.length;
    const it = list[idx];
    stage.innerHTML = it.querySelector('.arch, .frame')!.innerHTML;
    stage.classList.remove('lb-l', 'lb-r', 'lb-in'); void stage.offsetWidth;
    stage.classList.add(dir > 0 ? 'lb-l' : dir < 0 ? 'lb-r' : 'lb-in');
    cap.innerHTML = `<strong>${esc(it.dataset.title!)}</strong> <span>${esc(it.dataset.tag!)} · Illustration — school photography to be added</span>`;
    counter.textContent = `${idx + 1} / ${list.length}`;
  };
  items.forEach((it) => it.querySelector('button')!.addEventListener('click', () => { show(visibleItems().indexOf(it)); box.showModal(); document.documentElement.classList.add('modal-open'); }));
  box.querySelector('[data-lb-prev]')!.addEventListener('click', () => show(idx - 1, -1));
  box.querySelector('[data-lb-next]')!.addEventListener('click', () => show(idx + 1, 1));
  box.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') show(idx + 1, 1); if (e.key === 'ArrowLeft') show(idx - 1, -1); });
  let x0 = 0;
  stage.addEventListener('pointerdown', (e) => (x0 = e.clientX));
  stage.addEventListener('pointerup', (e) => { const dx = e.clientX - x0; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); });
}

/* ---------- Academic Centre: class selector ---------- */
export function initClassSelector() {
  const root = document.querySelector<HTMLElement>('[data-class-selector]');
  if (!root) return;
  const data = JSON.parse(document.getElementById('class-data')!.textContent!) as { n: number; roman: string; stage: { name: string; classes: string; lead: string }; subjects: string[]; bookList: { file: string } }[];
  const btns = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-class]'));
  const ink = root.querySelector<HTMLElement>('.cls-ink')!;
  const panel = root.querySelector<HTMLElement>('[data-class-panel]')!;
  const moveInk = (b: HTMLElement) => { ink.style.setProperty('--x', `${b.offsetLeft}px`); ink.style.setProperty('--w', `${b.offsetWidth}px`); };
  const select = (n: number, push = true) => {
    const c = data.find((d) => d.n === n)!; const b = btns[n - 1];
    btns.forEach((x) => { x.setAttribute('aria-pressed', String(x === b)); });
    moveInk(b); b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduced ? 'auto' : 'smooth' });
    panel.classList.remove('is-entering'); void panel.offsetWidth; panel.classList.add('is-entering');
    panel.querySelector('[data-c-num]')!.textContent = String(c.n);
    panel.querySelector('[data-c-roman]')!.textContent = `Class ${c.roman}`;
    panel.querySelector('[data-c-stage]')!.textContent = `${c.stage.name} stage · ${c.stage.classes}`;
    panel.querySelector('[data-c-lead]')!.textContent = c.stage.lead;
    panel.querySelector('[data-c-subjects]')!.innerHTML = c.subjects.map((s, i) => `<li style="--i:${i}">${esc(s)}</li>`).join('');
    panel.querySelectorAll<HTMLAnchorElement>('[data-c-book]').forEach((a) => { a.href = c.bookList.file; a.setAttribute('download', `STKV-Class-${c.n}-book-list-SAMPLE.pdf`); });
    panel.querySelectorAll('[data-c-name]').forEach((e) => (e.textContent = `Class ${c.n}`));
    if (push) { const u = new URL(location.href); u.searchParams.set('class', String(n)); history.replaceState(null, '', u); }
  };
  btns.forEach((b, i) => {
    b.addEventListener('click', () => select(i + 1));
    b.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + 10) % 10; btns[n].focus(); select(n + 1); } });
  });
  const start = Number(new URLSearchParams(location.search).get('class')) || 1;
  requestAnimationFrame(() => select(Math.min(10, Math.max(1, start)), false));
  addEventListener('resize', () => moveInk(btns.find((b) => b.getAttribute('aria-pressed') === 'true')!), { passive: true });
}

/* ---------- Document checklist (progress remembered per browser) ---------- */
export function initChecklist() {
  const root = document.querySelector<HTMLElement>('[data-checklist]');
  if (!root) return;
  const boxes = Array.from(root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
  const out = root.querySelector<HTMLElement>('[data-cl-count]')!; const bar = root.querySelector<HTMLElement>('[data-cl-bar]')!;
  const KEY = 'stkv-doc-checklist';
  try { const saved = JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]; boxes.forEach((b) => (b.checked = saved.includes(b.value))); } catch { /* storage unavailable */ }
  const update = (announce = false) => {
    const n = boxes.filter((b) => b.checked).length;
    out.textContent = `${n} of ${boxes.length} ready`; bar.style.setProperty('--p', String(n / boxes.length));
    root.classList.toggle('is-complete', n === boxes.length);
    try { localStorage.setItem(KEY, JSON.stringify(boxes.filter((b) => b.checked).map((b) => b.value))); } catch { /* ignore */ }
    if (announce && n === boxes.length) toast('Checklist complete', 'Remember to confirm the final document list with the school office.', 'check');
  };
  boxes.forEach((b) => b.addEventListener('change', () => update(true)));
  root.querySelector('[data-cl-reset]')?.addEventListener('click', () => { boxes.forEach((b) => (b.checked = false)); update(); });
  update();
}

/* ---------- Horizontal rails: buttons, drag, progress (native scroll, no hijacking) ---------- */
export function initRails() {
  document.querySelectorAll<HTMLElement>('[data-rail]').forEach((root) => {
    const track = root.querySelector<HTMLElement>('[data-rail-track]')!;
    const prog = root.querySelector<HTMLElement>('[data-rail-progress]');
    const prev = root.querySelector<HTMLButtonElement>('[data-rail-prev]'); const next = root.querySelector<HTMLButtonElement>('[data-rail-next]');
    const step = () => (track.firstElementChild as HTMLElement)?.offsetWidth + 24;
    prev?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      prog?.style.setProperty('--p', String(max > 0 ? track.scrollLeft / max : 1));
      if (prev) prev.disabled = track.scrollLeft < 4; if (next) next.disabled = track.scrollLeft > max - 4;
    };
    track.addEventListener('scroll', update, { passive: true }); addEventListener('resize', update, { passive: true }); update();
    let down = false, sx = 0, sl = 0, moved = false;
    track.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = track.scrollLeft; track.classList.add('is-dragging'); });
    addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; track.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { down = false; track.classList.remove('is-dragging'); });
    track.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  });
}

/* ---------- Hover-reveal list: floating preview follows cursor (desktop) ---------- */
export function initHoverReveal() {
  document.querySelectorAll<HTMLElement>('[data-hover-reveal]').forEach((root) => {
    const float = root.querySelector<HTMLElement>('[data-hr-float]');
    if (!float || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const slides = Array.from(float.querySelectorAll<HTMLElement>('[data-hr-slide]'));
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const loop = () => { x += (tx - x) * 0.14; y += (ty - y) * 0.14; float.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${(tx - x) * 0.04}deg)`; raf = requestAnimationFrame(loop); };
    root.addEventListener('pointermove', (e) => { const r = root.getBoundingClientRect(); tx = e.clientX - r.left - 130; ty = e.clientY - r.top - 160; });
    root.querySelectorAll<HTMLElement>('[data-hr-row]').forEach((row, i) => row.addEventListener('pointerenter', () => { slides.forEach((s, j) => s.classList.toggle('is-on', j === i)); }));
    root.addEventListener('pointerenter', (e) => { const r = root.getBoundingClientRect(); x = tx = e.clientX - r.left - 130; y = ty = e.clientY - r.top - 160; float.classList.add('is-visible'); if (!raf && !reduced) raf = requestAnimationFrame(loop); });
    root.addEventListener('pointerleave', () => { float.classList.remove('is-visible'); cancelAnimationFrame(raf); raf = 0; });
  });
}

/* ---------- Sticky swap: list item in view drives the framed artwork ---------- */
export function initStickySwap() {
  document.querySelectorAll<HTMLElement>('[data-sticky-swap]').forEach((root) => {
    const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-ss-row]'));
    const frames = Array.from(root.querySelectorAll<HTMLElement>('[data-ss-frame]'));
    const counter = root.querySelector<HTMLElement>('[data-ss-count]');
    const set = (i: number) => {
      rows.forEach((r, j) => r.classList.toggle('is-active', j === i));
      frames.forEach((f, j) => { f.classList.toggle('is-on', j === i); f.classList.toggle('is-past', j < i); });
      if (counter) counter.textContent = String(i + 1).padStart(2, '0');
    };
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) set(rows.indexOf(e.target as HTMLElement)); }), { rootMargin: '-45% 0px -45% 0px' });
    rows.forEach((r, i) => { io.observe(r); r.addEventListener('pointerenter', () => set(i)); });
    set(0);
  });
}

/* ---------- Achievement showcase filter ---------- */
export function initAchievements() {
  const root = document.querySelector<HTMLElement>('[data-achievements]');
  if (!root) return;
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-a-filter]'));
  const out = root.querySelector<HTMLElement>('[data-a-out]')!;
  chips.forEach((c) => c.addEventListener('click', () => {
    chips.forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
    out.classList.remove('is-entering'); void out.offsetWidth; out.classList.add('is-entering');
    out.querySelectorAll('[data-a-cat]').forEach((e) => (e.textContent = c.dataset.aFilter === 'All' ? 'Any category' : c.dataset.aFilter!));
  }));
}

/* ---------- School information assistant (rule-based demo, answers only from site data) ---------- */
type Intent = { k: string[]; a: string; link?: [string, string] };
export function initAssistant() {
  const root = document.querySelector<HTMLElement>('[data-assistant]');
  if (!root) return;
  const intents: Intent[] = JSON.parse(document.getElementById('assistant-data')!.textContent!);
  const log = root.querySelector<HTMLElement>('[data-as-log]')!;
  const form = root.querySelector<HTMLFormElement>('[data-as-form]')!;
  const input = form.querySelector<HTMLInputElement>('input')!;
  const add = (who: 'me' | 'bot', html: string) => {
    const li = document.createElement('div'); li.className = `as-msg as-msg--${who}`; li.innerHTML = html; log.append(li);
    log.scrollTo({ top: log.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
    return li;
  };
  const answer = (q: string) => {
    const words = q.toLowerCase();
    let best: Intent | null = null, bestScore = 0;
    for (const it of intents) { const s = it.k.filter((k) => words.includes(k)).length; if (s > bestScore) { best = it; bestScore = s; } }
    return best ?? { k: [], a: 'I can only answer from what is published on this website. I could not find that — the school office can help. You could also try asking about admissions, the affiliation number, address, fees, book lists or the parent app.', link: ['/contact/', 'Contact details'] as [string, string] };
  };
  const ask = (q: string) => {
    if (!q.trim()) return;
    add('me', esc(q)); input.value = '';
    const typing = add('bot', '<span class="as-typing" aria-label="Assistant is typing"><i></i><i></i><i></i></span>');
    setTimeout(() => {
      const a = answer(q);
      typing.innerHTML = `${esc(a.a)}${a.link ? ` <a class="link" href="${esc(a.link[0])}">${esc(a.link[1])} →</a>` : ''}`;
      typing.classList.add('is-entering');
    }, reduced ? 0 : 650);
  };
  form.addEventListener('submit', (e) => { e.preventDefault(); ask(input.value); });
  root.querySelectorAll<HTMLButtonElement>('[data-as-suggest]').forEach((b) => b.addEventListener('click', () => ask(b.textContent!)));
}
