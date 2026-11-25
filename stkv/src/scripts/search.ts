import { esc } from './ui';

type Item = { t: string; s: string; u: string; k?: string };
let index: Item[] | null = null;
const POPULAR = ['Online Enquiry', 'Notice Centre', 'Book Lists', 'Academic Calendar', 'Mandatory Public Disclosure', 'Contact & office details'];

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s]/gu, ' ');

function score(item: Item, terms: string[]) {
  const t = norm(item.t), s = norm(item.s), k = norm(item.k ?? '');
  let total = 0;
  for (const term of terms) {
    let best = 0;
    if (t.split(/\s+/).some((w) => w.startsWith(term))) best = 6;
    else if (t.includes(term)) best = 4;
    else if (s.includes(term)) best = 2.5;
    else if (k.split(/\s+/).some((w) => w.startsWith(term))) best = 1.5;
    if (!best) return 0; // every term must match somewhere
    total += best;
  }
  return total + (item.s === 'Page' ? 1 : 0);
}

function highlight(text: string, terms: string[]) {
  let out = esc(text);
  for (const term of terms.filter((x) => x.length > 1)) out = out.replace(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'), '<mark>$1</mark>');
  return out;
}

export function initSearch() {
  const root = document.querySelector<HTMLElement>('[data-search]');
  if (!root) return;
  const input = root.querySelector<HTMLInputElement>('[data-search-input]')!;
  const results = root.querySelector<HTMLElement>('[data-search-results]')!;
  const status = root.querySelector<HTMLElement>('[data-search-status]')!;
  let active = -1, lastFocus: HTMLElement | null = null;

  const load = async () => { if (!index) { try { index = await (await fetch('/search-index.json')).json(); } catch { index = []; } } return index!; };

  const render = async () => {
    const items = await load();
    const q = norm(input.value).trim();
    const terms = q.split(/\s+/).filter(Boolean);
    let list: Item[];
    if (!terms.length) { list = POPULAR.map((p) => items.find((i) => i.t === p)).filter(Boolean) as Item[]; status.textContent = 'Popular with parents'; }
    else {
      list = items.map((i) => ({ i, sc: score(i, terms) })).filter((x) => x.sc > 0).sort((a, b) => b.sc - a.sc).slice(0, 9).map((x) => x.i);
      status.textContent = list.length ? `${list.length} result${list.length > 1 ? 's' : ''}` : 'No results';
    }
    active = list.length ? 0 : -1;
    if (!list.length) {
      results.innerHTML = `<li class="sr-empty"><p><strong>Nothing matches “${esc(input.value)}”.</strong></p><p>Try “admission”, “book list”, “fees” or “calendar”.</p></li>`;
      return;
    }
    results.innerHTML = list.map((i, n) => `<li role="option" id="sr-${n}" aria-selected="${n === 0}" style="--i:${n}"><a class="sr-item" href="${esc(i.u)}"${i.u.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}><span class="sr-item__t">${highlight(i.t, terms)}</span><span class="sr-item__s">${esc(i.s)}</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg></a></li>`).join('');
    input.setAttribute('aria-activedescendant', 'sr-0');
  };

  const setActive = (n: number) => {
    const opts = Array.from(results.querySelectorAll<HTMLElement>('[role="option"]'));
    if (!opts.length) return;
    active = (n + opts.length) % opts.length;
    opts.forEach((o, i) => o.setAttribute('aria-selected', String(i === active)));
    opts[active].scrollIntoView({ block: 'nearest' });
    input.setAttribute('aria-activedescendant', `sr-${active}`);
  };

  const open = () => {
    lastFocus = document.activeElement as HTMLElement;
    root.removeAttribute('inert'); root.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';
    render(); setTimeout(() => input.focus(), 30);
  };
  const close = () => {
    root.classList.remove('is-open'); root.setAttribute('inert', '');
    document.documentElement.style.overflow = '';
    lastFocus?.focus();
  };

  document.querySelectorAll('[data-search-open]').forEach((b) => b.addEventListener('click', open));
  root.querySelectorAll('[data-search-close]').forEach((b) => b.addEventListener('click', close));
  let debounce = 0;
  input.addEventListener('input', () => { clearTimeout(debounce); debounce = window.setTimeout(render, 90); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') { const a = results.querySelector<HTMLAnchorElement>(`#sr-${active} a`); if (a) { e.preventDefault(); a.click(); } }
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') { // focus trap
      const f = Array.from(root.querySelectorAll<HTMLElement>('input, a, button')).filter((x) => x.offsetParent);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  results.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) close(); });
  document.addEventListener('keydown', (e) => {
    const typing = /input|textarea|select/i.test((e.target as HTMLElement).tagName) || (e.target as HTMLElement).isContentEditable;
    if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); root.classList.contains('is-open') ? close() : open(); }
  });
}
