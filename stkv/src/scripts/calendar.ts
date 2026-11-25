/** Interactive academic calendar — month grid with directional slide, day detail, filters, list view. */
import { esc } from './ui';
import type { CalEvent } from '../data/calendar';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function initCalendars() {
  document.querySelectorAll<HTMLElement>('[data-calendar]').forEach((root) => {
    const events: CalEvent[] = JSON.parse(document.getElementById('calendar-data')!.textContent!);
    const grid = root.querySelector<HTMLElement>('[data-cal-grid]')!;
    const title = root.querySelector<HTMLElement>('[data-cal-title]')!;
    const detail = root.querySelector<HTMLElement>('[data-cal-detail]')!;
    const listEl = root.querySelector<HTMLElement>('[data-cal-list]')!;
    const kinds = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-cal-kind]'));
    const viewBtns = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-cal-view]'));
    const today = new Date();
    let view = new Date(today.getFullYear(), today.getMonth(), 1);
    let selected = iso(today);
    const active = new Set(kinds.map((k) => k.dataset.calKind!));

    const visible = () => events.filter((e) => active.has(e.kind));
    const byDay = () => visible().reduce<Record<string, CalEvent[]>>((m, e) => ((m[e.date] ??= []).push(e), m), {});

    const renderDetail = () => {
      const evs = byDay()[selected] ?? [];
      const d = parse(selected);
      detail.innerHTML = `<p class="label cal-detail__date">${d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>` +
        (evs.length ? `<ul role="list" class="cal-detail__list">${evs.map((e, i) => `<li style="--i:${i}"><span class="cal-kind" data-kind="${e.kind}">${e.kind}</span><strong>${esc(e.title)}</strong>${e.sample ? '<span class="sample-tag">Sample</span>' : ''}</li>`).join('')}</ul>`
          : '<p class="cal-detail__none">No events on this day.</p>');
      detail.classList.remove('is-entering'); void detail.offsetWidth; detail.classList.add('is-entering');
    };

    const render = (dir = 0) => {
      const map = byDay();
      title.textContent = `${MONTHS[view.getMonth()]} ${view.getFullYear()}`;
      const first = new Date(view);
      const offset = (first.getDay() + 6) % 7; // Monday first
      const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      let html = '';
      for (let i = 0; i < offset; i++) html += '<span class="cal-cell is-pad" aria-hidden="true"></span>';
      for (let d = 1; d <= days; d++) {
        const key = iso(new Date(view.getFullYear(), view.getMonth(), d));
        const evs = map[key] ?? [];
        const label = `${d} ${MONTHS[view.getMonth()]}${evs.length ? `, ${evs.length} event${evs.length > 1 ? 's' : ''}: ${evs.map((e) => e.title).join('; ')}` : ''}`;
        html += `<button type="button" class="cal-cell${key === iso(today) ? ' is-today' : ''}${key === selected ? ' is-selected' : ''}${evs.length ? ' has-ev' : ''}" data-day="${key}" aria-label="${esc(label)}" aria-pressed="${key === selected}" tabindex="${key === selected ? 0 : -1}">
          <span class="cal-num">${d}</span>${evs.length ? `<span class="cal-dots">${evs.slice(0, 3).map((e) => `<i data-kind="${e.kind}"></i>`).join('')}</span>` : ''}</button>`;
      }
      grid.innerHTML = html;
      grid.classList.remove('slide-l', 'slide-r'); void grid.offsetWidth;
      if (dir) grid.classList.add(dir > 0 ? 'slide-l' : 'slide-r');

      const monthEvents = visible().filter((e) => e.date.startsWith(iso(view).slice(0, 7))).sort((a, b) => a.date.localeCompare(b.date));
      listEl.innerHTML = monthEvents.length ? monthEvents.map((e, i) => {
        const d = parse(e.date);
        return `<li style="--i:${i}"><time datetime="${e.date}"><b>${d.getDate()}</b>${d.toLocaleDateString('en-IN', { weekday: 'short' })}</time><span class="cal-kind" data-kind="${e.kind}">${e.kind}</span><span class="cal-list__t">${esc(e.title)}</span>${e.sample ? '<span class="sample-tag">Sample</span>' : ''}</li>`;
      }).join('') : '<li class="cal-list__none">No events this month for the selected categories.</li>';
      renderDetail();
    };

    root.querySelector('[data-cal-prev]')!.addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); render(-1); });
    root.querySelector('[data-cal-next]')!.addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); render(1); });
    root.querySelector('[data-cal-today]')!.addEventListener('click', () => { const dir = today < view ? -1 : 1; view = new Date(today.getFullYear(), today.getMonth(), 1); selected = iso(today); render(dir); });
    grid.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-day]'); if (!b) return;
      selected = b.dataset.day!;
      grid.querySelectorAll('.cal-cell').forEach((c) => { const on = c === b; c.classList.toggle('is-selected', on); c.setAttribute('aria-pressed', String(on)); (c as HTMLElement).tabIndex = on ? 0 : -1; });
      renderDetail();
    });
    grid.addEventListener('keydown', (e) => {
      const steps: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 };
      if (!(e.key in steps)) return;
      e.preventDefault();
      const d = parse(selected); d.setDate(d.getDate() + steps[e.key]);
      selected = iso(d);
      if (d.getMonth() !== view.getMonth()) { const dir = d > view ? 1 : -1; view = new Date(d.getFullYear(), d.getMonth(), 1); render(dir); }
      else render();
      grid.querySelector<HTMLElement>(`[data-day="${selected}"]`)?.focus();
    });
    kinds.forEach((k) => k.addEventListener('click', () => {
      const on = k.getAttribute('aria-pressed') !== 'true';
      if (!on && active.size === 1) return; // keep at least one category
      k.setAttribute('aria-pressed', String(on)); on ? active.add(k.dataset.calKind!) : active.delete(k.dataset.calKind!);
      render();
    }));
    viewBtns.forEach((b) => b.addEventListener('click', () => {
      viewBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      root.dataset.view = b.dataset.calView;
    }));
    render();
  });
}
