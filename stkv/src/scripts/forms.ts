/**
 * Form validation + multi-step flow + SIMULATED submission.
 * Nothing is sent anywhere: `submitDemo` is the single seam where a real API call
 * (e.g. POST /api/enquiries) can be connected later.
 */
import { esc } from './ui';

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const MESSAGES: Record<string, (f: Field) => string> = {
  valueMissing: (f) => f.dataset.msgRequired ?? 'This field is required.',
  typeMismatch: (f) => (f.type === 'email' ? 'Enter a valid email address, e.g. name@example.com.' : 'Please check this value.'),
  patternMismatch: (f) => f.dataset.msgPattern ?? 'Please check the format.',
  tooShort: (f) => `Please enter at least ${(f as HTMLInputElement).minLength} characters.`,
  rangeUnderflow: (f) => f.dataset.msgMin ?? 'Please choose a later date.',
};

function wrap(f: Field) { return f.closest<HTMLElement>('.field'); }

export function validateField(f: Field, show = true): boolean {
  const field = wrap(f);
  if (!field) return f.checkValidity();
  const v = f.validity;
  let msg = '';
  if (!v.valid) for (const key of Object.keys(MESSAGES)) if (v[key as keyof ValidityState]) { msg = MESSAGES[key](f); break; }
  if (!msg && !v.valid) msg = 'Please check this field.';
  if (show) {
    field.classList.toggle('is-invalid', !!msg);
    field.classList.toggle('is-valid', !msg && !!f.value);
    const out = field.querySelector('.field__error span');
    if (out) out.textContent = msg;
    f.setAttribute('aria-invalid', String(!!msg));
  }
  return !msg;
}

function validateGroup(scope: HTMLElement) {
  const fields = Array.from(scope.querySelectorAll<Field>('input, select, textarea')).filter((f) => !f.disabled && f.type !== 'hidden');
  let firstBad: Field | null = null;
  // radio groups: validate via first radio of the group
  const seen = new Set<string>();
  for (const f of fields) {
    if (f.type === 'radio') {
      if (seen.has(f.name)) continue; seen.add(f.name);
      const group = scope.querySelector<HTMLElement>(`[data-radio-group="${f.name}"]`);
      const ok = !!scope.querySelector(`input[name="${f.name}"]:checked`) || !f.required;
      group?.classList.toggle('is-invalid', !ok);
      if (!ok && !firstBad) firstBad = f;
      continue;
    }
    if (!validateField(f) && !firstBad) firstBad = f;
  }
  if (firstBad) { firstBad.focus({ preventScroll: true }); firstBad.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  return !firstBad;
}

/** The single integration point for a future backend. */
async function submitDemo(_data: FormData): Promise<{ ref: string }> {
  await new Promise((r) => setTimeout(r, 1400));
  return { ref: `DEMO-${Math.random().toString(36).slice(2, 7).toUpperCase()}` };
}

export function initForms() {
  // Indian mobile numbers: allow spaces, keep digits only
  document.querySelectorAll<HTMLInputElement>('input[data-phone]').forEach((i) => i.addEventListener('input', () => { i.value = i.value.replace(/[^\d]/g, '').slice(0, 10); }));
  // Dates: not in the past
  document.querySelectorAll<HTMLInputElement>('input[data-future]').forEach((i) => { i.min = new Date(Date.now() + 864e5).toISOString().slice(0, 10); });

  document.querySelectorAll<HTMLFormElement>('form[data-validate]').forEach((form) => {
    form.noValidate = true;
    form.querySelectorAll<Field>('input, select, textarea').forEach((f) => {
      f.addEventListener('blur', () => { if (f.value || wrap(f)?.classList.contains('is-invalid')) validateField(f); });
      f.addEventListener('input', () => { if (wrap(f)?.classList.contains('is-invalid') || wrap(f)?.classList.contains('is-valid')) validateField(f); });
      f.addEventListener('change', () => { if (f.type === 'radio') form.querySelector(`[data-radio-group="${f.name}"]`)?.classList.remove('is-invalid'); });
    });

    const steps = Array.from(form.querySelectorAll<HTMLElement>('[data-step]'));
    const bar = form.querySelector<HTMLElement>('[data-progress]');
    const stepLabels = Array.from(form.querySelectorAll<HTMLElement>('[data-step-label]'));
    let current = 0;
    const show = (n: number, dir = 1) => {
      steps.forEach((s, i) => { s.hidden = i !== n; s.classList.remove('step-in-fwd', 'step-in-back'); if (i === n) { void s.offsetWidth; s.classList.add(dir > 0 ? 'step-in-fwd' : 'step-in-back'); } });
      stepLabels.forEach((l, i) => { l.classList.toggle('is-done', i < n); l.classList.toggle('is-current', i === n); l.setAttribute('aria-current', i === n ? 'step' : 'false'); });
      bar?.style.setProperty('--p', String((n + 1) / steps.length));
      current = n;
      if (steps[n]?.hasAttribute('data-review')) fillReview(form, steps[n]);
      const head = steps[n]?.querySelector<HTMLElement>('legend, h3');
      head?.setAttribute('tabindex', '-1'); head?.focus({ preventScroll: true });
      form.scrollIntoView({ block: 'start', behavior: 'smooth' });
    };
    if (steps.length) {
      form.querySelectorAll('[data-next]').forEach((b) => b.addEventListener('click', () => { if (validateGroup(steps[current])) show(current + 1, 1); }));
      form.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => show(current - 1, -1)));
      form.addEventListener('click', (e) => { const g = (e.target as HTMLElement).closest<HTMLElement>('[data-goto]'); if (g) show(Number(g.dataset.goto), -1); });
      steps.forEach((s, i) => (s.hidden = i !== 0));
      bar?.style.setProperty('--p', String(1 / steps.length));
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateGroup(steps.length ? steps[current] : form)) return;
      const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      btn?.classList.add('is-loading'); btn?.setAttribute('aria-busy', 'true');
      const label = btn?.querySelector('.btn__label'); const orig = label?.textContent;
      if (label) label.textContent = 'Submitting…';
      const { ref } = await submitDemo(new FormData(form));
      btn?.classList.remove('is-loading'); btn?.classList.add('is-success'); btn?.removeAttribute('aria-busy');
      if (label) label.textContent = 'Done';
      setTimeout(() => {
        const success = form.parentElement?.querySelector<HTMLElement>('[data-success]');
        if (success) {
          success.querySelectorAll('[data-ref]').forEach((r) => (r.textContent = ref));
          const name = (form.elements.namedItem('parentName') as HTMLInputElement | null)?.value;
          success.querySelectorAll('[data-name]').forEach((r) => (r.textContent = name ? `, ${name.split(' ')[0]}` : ''));
          form.hidden = true; success.hidden = false; success.classList.add('is-entering');
          success.querySelector<HTMLElement>('h3, [tabindex]')?.focus();
        }
        btn?.classList.remove('is-success'); if (label) label.textContent = orig ?? 'Submit';
      }, 700);
    });

    form.parentElement?.querySelector('[data-reset]')?.addEventListener('click', () => {
      form.reset(); form.querySelectorAll('.is-valid, .is-invalid').forEach((x) => x.classList.remove('is-valid', 'is-invalid'));
      const success = form.parentElement!.querySelector<HTMLElement>('[data-success]')!; success.hidden = true; form.hidden = false;
      if (steps.length) show(0, -1);
    });
  });
}

function fillReview(form: HTMLFormElement, step: HTMLElement) {
  const out = step.querySelector<HTMLElement>('[data-review-out]');
  if (!out) return;
  const fd = new FormData(form);
  const rows: [string, string, number][] = [];
  form.querySelectorAll<HTMLElement>('[data-step]').forEach((s, si) => {
    s.querySelectorAll<Field>('[data-review-label]').forEach((f) => {
      const val = f.type === 'radio' ? (fd.get(f.name) as string) : f.value;
      if (f.type === 'radio' && rows.some((r) => r[0] === f.dataset.reviewLabel)) return;
      rows.push([f.dataset.reviewLabel!, val || '—', si]);
    });
  });
  out.innerHTML = rows.map(([k, v, si]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd><button type="button" class="review-edit" data-goto="${si}">Edit</button></div>`).join('');
}
