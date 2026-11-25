/** Smart Notice Centre — search, category & year filters, sort, archive, URL-synced. */
import { esc } from './ui';
import type { Notice } from '../data/notices';

const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const fmt = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export function initNotices() {
  const root = document.querySelector<HTMLElement>('[data-notices]');
  if (!root) return;
  const data: Notice[] = JSON.parse(document.getElementById('notice-data')!.textContent!);
  const q = root.querySelector<HTMLInputElement>('[data-n-q]')!;
  const year = root.querySelector<HTMLSelectElement>('[data-n-year]')!;
  const sort = root.querySelector<HTMLSelectElement>('[data-n-sort]')!;
  const archive = root.querySelector<HTMLInputElement>('[data-n-archive]')!;
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-n-cat]'));
  const list = root.querySelector<HTMLElement>('[data-n-list]')!;
  const count = root.querySelector<HTMLElement>('[data-n-count]')!;
  const clear = root.querySelector<HTMLButtonElement>('[data-n-clear]')!;

  const params = new URLSearchParams(location.search);
  if (params.get('q')) q.value = params.get('q')!;
  let cat = params.get('cat') ?? 'All';

  const render = () => {
    const term = q.value.trim().toLowerCase();
    let rows = data.filter((n) => (archive.checked || !n.archived)
      && (cat === 'All' || n.category === cat)
      && (year.value === 'all' || n.year === year.value)
      && (!term || `${n.title} ${n.summary} ${n.category}`.toLowerCase().includes(term)));
    rows.sort((a, b) => (sort.value === 'oldest' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));

    chips.forEach((c) => {
      c.setAttribute('aria-pressed', String(c.dataset.nCat === cat));
      const n = data.filter((x) => (archive.checked || !x.archived) && (year.value === 'all' || x.year === year.value) && (c.dataset.nCat === 'All' || x.category === c.dataset.nCat)).length;
      const badge = c.querySelector('.chip__count'); if (badge) badge.textContent = String(n);
    });
    const filtered = term || cat !== 'All' || year.value !== 'all' || archive.checked || sort.value !== 'latest';
    clear.hidden = !filtered;
    count.textContent = `${rows.length} notice${rows.length === 1 ? '' : 's'}`;

    if (!rows.length) {
      list.innerHTML = `<li class="empty is-entering"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2M8.5 11h5"/></svg><p><strong>No notices match these filters.</strong></p><p class="small">Try a different keyword, choose “All”, or include archived notices.</p></li>`;
      return;
    }
    list.innerHTML = rows.map((n, i) => {
      const d = parse(n.date);
      return `<li class="nrow${n.archived ? ' is-archived' : ''}" style="--i:${Math.min(i, 10)}">
        <time class="nrow__date" datetime="${n.date}"><span class="nrow__day">${String(d.getDate()).padStart(2, '0')}</span><span>${d.toLocaleString('en-IN', { month: 'short' })} ${d.getFullYear()}</span></time>
        <div class="nrow__main">
          <p class="nrow__meta"><span class="nrow__cat" data-cat="${esc(n.category)}">${esc(n.category)}</span><span>${esc(n.year)}</span>${n.archived ? '<span class="nrow__arch">Archived</span>' : ''}<span class="sample-tag">Sample</span></p>
          <h3 class="nrow__title">${esc(n.title)}</h3>
          <p class="nrow__sum">${esc(n.summary)}</p>
        </div>
        <div class="nrow__act">${n.file
          ? `<a class="btn btn--ghost btn--sm" href="${n.file}" download data-sample-download><span class="btn__label">Download</span><span class="btn__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/></svg><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/></svg></span><span class="sr-only"> ${esc(n.title)} (sample PDF, published ${fmt.format(parse(n.date))})</span></a>`
          : '<span class="small muted">No attachment</span>'}</div>
      </li>`;
    }).join('');
    const url = new URL(location.href);
    term ? url.searchParams.set('q', q.value.trim()) : url.searchParams.delete('q');
    cat !== 'All' ? url.searchParams.set('cat', cat) : url.searchParams.delete('cat');
    history.replaceState(null, '', url);
  };

  let t = 0;
  q.addEventListener('input', () => { clearTimeout(t); t = window.setTimeout(render, 140); });
  [year, sort, archive].forEach((el) => el.addEventListener('change', render));
  chips.forEach((c) => c.addEventListener('click', () => { cat = c.dataset.nCat!; render(); }));
  clear.addEventListener('click', () => { q.value = ''; cat = 'All'; year.value = 'all'; sort.value = 'latest'; archive.checked = false; render(); q.focus(); });
  render();
}
