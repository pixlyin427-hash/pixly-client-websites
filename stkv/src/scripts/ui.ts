/** Shared interface primitives: toasts, modals, tabs, accordions, back-to-top, sample downloads. */

const ICONS = {
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.1"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v4h4"/></svg>',
};

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/* ---------- Toasts ---------- */
export function toast(title: string, body = '', icon: keyof typeof ICONS = 'info', life = 5200) {
  const host = document.querySelector<HTMLElement>('[data-toasts]');
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'toast'; el.setAttribute('role', 'status'); el.style.setProperty('--life', `${life}ms`);
  el.innerHTML = `${ICONS[icon]}<div><strong>${esc(title)}</strong>${body ? `<span>${esc(body)}</span>` : ''}</div><button class="toast__close" type="button" aria-label="Dismiss notification"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg></button><span class="toast__bar"></span>`;
  const remove = () => { el.classList.add('is-leaving'); el.addEventListener('animationend', () => el.remove(), { once: true }); };
  el.querySelector('button')!.addEventListener('click', remove);
  let timer = window.setTimeout(remove, life);
  el.addEventListener('pointerenter', () => { clearTimeout(timer); el.querySelector<HTMLElement>('.toast__bar')!.style.animationPlayState = 'paused'; });
  el.addEventListener('pointerleave', () => { timer = window.setTimeout(remove, 1800); });
  host.append(el);
  if (host.children.length > 3) host.firstElementChild?.remove();
}

/* ---------- Modals (native dialog + exit animation) ---------- */
export function openModal(id: string) {
  const d = document.getElementById(id) as HTMLDialogElement | null;
  if (!d || d.open) return;
  d.showModal(); document.documentElement.classList.add('modal-open');
}
export function closeModal(d: HTMLDialogElement) {
  if (!d.open || d.classList.contains('is-closing')) return;
  d.classList.add('is-closing');
  const done = () => {
    d.classList.remove('is-closing'); d.close(); document.documentElement.classList.remove('modal-open');
    // Return a submitted modal form to its initial state for next time
    d.querySelectorAll<HTMLFormElement>('form[data-validate]').forEach((f) => {
      if (!f.hidden) return;
      f.reset(); f.hidden = false; f.querySelectorAll('.is-valid, .is-invalid').forEach((x) => x.classList.remove('is-valid', 'is-invalid'));
      d.querySelector('[data-success]')?.setAttribute('hidden', '');
    });
  };
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? done() : d.addEventListener('animationend', done, { once: true });
}
function initModals() {
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const opener = t.closest<HTMLElement>('[data-open-modal]');
    if (opener) { e.preventDefault(); openModal(opener.dataset.openModal!); return; }
    const closer = t.closest('[data-close-modal]');
    if (closer) { const d = closer.closest('dialog'); if (d) closeModal(d); return; }
    if (t instanceof HTMLDialogElement && t.open) closeModal(t); // backdrop click
  });
  document.querySelectorAll('dialog').forEach((d) => d.addEventListener('cancel', (e) => { e.preventDefault(); closeModal(d); }));
}

/* ---------- Tabs (sliding ink, roving focus) ---------- */
export function initTabs(scope: ParentNode = document) {
  scope.querySelectorAll<HTMLElement>('[data-tabs]').forEach((root) => {
    const list = root.querySelector<HTMLElement>('[role="tablist"]')!;
    const tabs = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const ink = list.querySelector<HTMLElement>('.tabs__ink');
    const moveInk = (t: HTMLElement) => { if (!ink) return; ink.style.setProperty('--x', `${t.offsetLeft - 4}px`); ink.style.setProperty('--w', `${t.offsetWidth}px`); };
    const select = (t: HTMLButtonElement, focus = false) => {
      tabs.forEach((x) => {
        const on = x === t;
        x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(x.getAttribute('aria-controls')!);
        if (panel) { panel.hidden = !on; if (on) { panel.classList.remove('is-entering'); void panel.offsetWidth; panel.classList.add('is-entering'); } }
      });
      moveInk(t); if (focus) t.focus();
      root.dispatchEvent(new CustomEvent('tabchange', { detail: t.dataset.value }));
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        const k = e.key; let n = -1;
        if (k === 'ArrowRight') n = (i + 1) % tabs.length; else if (k === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length; else if (k === 'Home') n = 0; else if (k === 'End') n = tabs.length - 1;
        if (n > -1) { e.preventDefault(); select(tabs[n], true); }
      });
    });
    const current = tabs.find((t) => t.getAttribute('aria-selected') === 'true') ?? tabs[0];
    requestAnimationFrame(() => moveInk(current));
    new ResizeObserver(() => moveInk(tabs.find((t) => t.getAttribute('aria-selected') === 'true')!)).observe(list);
  });
}

/* ---------- Accordions ---------- */
export function initAccordions(scope: ParentNode = document) {
  scope.querySelectorAll<HTMLButtonElement>('[data-acc-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.acc__item')!; const open = !item.classList.contains('is-open');
      const group = btn.closest('[data-acc-single]');
      if (group && open) group.querySelectorAll('.acc__item.is-open').forEach((o) => { if (o !== item) { o.classList.remove('is-open'); o.querySelector('[data-acc-btn]')!.setAttribute('aria-expanded', 'false'); } });
      item.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', String(open));
    });
  });
}

/* ---------- Back to top + scroll progress ---------- */
function initToTop() {
  const btn = document.querySelector<HTMLElement>('[data-to-top]');
  if (!btn) return;
  const pill = document.querySelector<HTMLElement>('.demo-pill');
  let ticking = false;
  const update = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    btn.style.setProperty('--p', String(max > 0 ? scrollY / max : 0));
    btn.classList.toggle('is-visible', scrollY > 700);
    pill?.classList.toggle('is-visible', scrollY > 500 && max - scrollY > 400);
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  btn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); (document.querySelector('#main') as HTMLElement)?.focus({ preventScroll: true }); });
}

/* ---------- Sample / pending downloads ---------- */
function initDownloads() {
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLElement>('[data-sample-download]');
    if (a) toast('Sample file downloading', 'This is a clearly marked placeholder. The school will publish the official document.', 'doc');
    const p = (e.target as HTMLElement).closest<HTMLElement>('[data-pending-doc]');
    if (p) { e.preventDefault(); toast('Document awaiting upload', `“${p.dataset.pendingDoc}” has not been provided by the school yet.`, 'info'); }
  });
}

export function initUI() {
  initModals(); initTabs(); initAccordions(); initToTop(); initDownloads();
}
