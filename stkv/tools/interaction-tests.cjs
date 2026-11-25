// Interaction test suite. Run with the preview server on :4321 (npm run build && npm run preview), then: node tools/interaction-tests.cjs
const { chromium } = require('playwright');
const B = 'http://localhost:4321';
const results = []; const ok = (name, cond, info = '') => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`);
const step = async (name, fn) => { try { await fn(); } catch (e) { results.push(`FAIL  ${name}  — threw: ${String(e).split('\n')[0]}`); } };
(async () => {
  const b = await chromium.launch();
  const errs = [];
  const mk = async (w = 1440) => { const p = await b.newPage({ viewport: { width: w, height: 900 } }); p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => m.type() === 'error' && errs.push(m.text())); return p; };
  const p = await mk();
  await step('header', async () => {
    await p.goto(B + '/', { waitUntil: 'networkidle' });
    await p.hover('.nav__item:nth-child(2) .nav__link'); await p.waitForTimeout(400);
    ok('Mega dropdown opens on hover', await p.$eval('.nav__item:nth-child(2)', (e) => e.classList.contains('is-open')));
    await p.mouse.move(700, 700); await p.waitForTimeout(500);
    ok('Mega dropdown closes on leave', !(await p.$eval('.nav__item:nth-child(2)', (e) => e.classList.contains('is-open'))));
    await p.focus('.nav__item:nth-child(1) .nav__toggle'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    ok('Dropdown toggles via keyboard', await p.$eval('.nav__item:nth-child(1) .nav__toggle', (e) => e.getAttribute('aria-expanded') === 'true'));
    await p.keyboard.press('Escape');
  });
  await step('search', async () => {
    await p.locator('body').press('/'); await p.waitForTimeout(400);
    ok('Search opens with "/"', await p.$eval('[data-search]', (e) => e.classList.contains('is-open')));
    await p.fill('[data-search-input]', 'book list'); await p.waitForTimeout(400);
    const n = await p.$$eval('[data-search-results] [role=option]', (x) => x.length);
    ok('Search returns results for "book list"', n > 0, `${n} results; first: ${await p.$eval('[data-search-results] [role=option]', (e) => e.textContent.trim().slice(0, 60))}`);
    await p.fill('[data-search-input]', 'zzqx'); await p.waitForTimeout(300);
    ok('Search empty state', !!(await p.$('.sr-empty')));
    await p.fill('[data-search-input]', 'fire safety'); await p.waitForTimeout(300);
    await p.keyboard.press('Enter'); await p.waitForURL(/disclosure/); ok('Search Enter navigates', p.url().includes('/disclosure/'), p.url());
  });
  await step('language+disclosure', async () => {
    await p.waitForLoadState('networkidle');
    await p.click('.lang__btn'); await p.waitForTimeout(250); await p.click('[data-lang-code=mr]'); await p.waitForTimeout(300);
    ok('Language: planned language shows toast', (await p.$$('.toast')).length > 0);
    await p.fill('[data-dsearch]', 'fire'); await p.waitForTimeout(200);
    ok('Disclosure search filters', (await p.$$eval('[data-drow]:not([hidden])', (x) => x.length)) === 1);
  });
  await step('notices', async () => {
    await p.goto(B + '/resources/', { waitUntil: 'networkidle' });
    const all = await p.$$eval('.nrow', (x) => x.length);
    await p.click('[data-n-cat=Examination]'); await p.waitForTimeout(200);
    const ex = await p.$$eval('.nrow', (x) => x.length);
    await p.check('[data-n-archive]', { force: true }); await p.waitForTimeout(200);
    const exA = await p.$$eval('.nrow', (x) => x.length);
    await p.fill('[data-n-q]', 'nothingmatches'); await p.waitForTimeout(300);
    ok('Notice filters (all→exam→+archive→empty)', all === 10 && ex === 2 && exA === 4 && !!(await p.$('.nlist .empty')), `${all}/${ex}/${exA}`);
    await p.click('[data-n-clear]'); await p.waitForTimeout(200);
    await p.selectOption('[data-n-sort]', 'oldest'); await p.waitForTimeout(200);
    ok('Notice sort oldest', (await p.$eval('.nrow time', (e) => e.getAttribute('datetime'))) === '2026-06-08');
  });
  await step('calendar', async () => {
    const t1 = await p.$eval('[data-cal-title]', (e) => e.textContent);
    await p.click('[data-cal-next]'); await p.waitForTimeout(200);
    const t2 = await p.$eval('[data-cal-title]', (e) => e.textContent);
    await p.click('[data-day="2026-12-19"]'); await p.waitForTimeout(200);
    ok('Calendar navigates & shows day detail', t1 !== t2 && (await p.$eval('[data-cal-detail]', (e) => e.textContent)).includes('Annual day'), `${t1} → ${t2}`);
    await p.click('[data-cal-view=list]'); ok('Calendar list view', await p.$eval('.cal__list', (e) => getComputedStyle(e).display !== 'none'));
  });
  await step('academics', async () => {
    await p.goto(B + '/academics/?class=9', { waitUntil: 'networkidle' }); await p.waitForTimeout(300);
    ok('Class selector honours ?class=9', (await p.$eval('[data-c-num]', (e) => e.textContent)) === '9');
    await p.click('[data-class="3"]'); await p.waitForTimeout(200);
    ok('Class selector switches subjects', (await p.$eval('[data-c-subjects]', (e) => e.textContent)).includes('World Around Us'));
    await p.click('#exams .acc__btn'); await p.waitForTimeout(500);
    ok('Accordion opens', await p.$eval('#exams .acc__item', (e) => e.classList.contains('is-open')));
    await p.goto(B + '/', { waitUntil: 'networkidle' });
    await p.click('#st-middle'); await p.waitForTimeout(200);
    ok('Home stage tabs switch', (await p.$eval('#sp-middle', (e) => !e.hidden)) && (await p.$eval('#sp-foundational', (e) => e.hidden)));
  });
  await step('admissions', async () => {
    await p.goto(B + '/admissions/', { waitUntil: 'networkidle' });
    await p.click('[data-step]:not([hidden]) [data-next]'); await p.waitForTimeout(300);
    ok('Step 1 blocks when empty', (await p.$$eval('.field.is-invalid, .radio-group.is-invalid', (x) => x.length)) >= 2);
    await p.fill('#sName', 'Aarav Patil'); await p.fill('#dob', '2018-05-04'); await p.click('label.choice:has(input[value="Class 3"])');
    await p.click('[data-step]:not([hidden]) [data-next]'); await p.waitForTimeout(400);
    await p.fill('#pName', 'Sneha Patil'); await p.selectOption('#rel', 'Mother'); await p.fill('#mob', '12345');
    await p.click('[data-step]:not([hidden]) [data-next]'); await p.waitForTimeout(300);
    ok('Invalid mobile is rejected', await p.$eval('#mob', (e) => e.closest('.field').classList.contains('is-invalid')), await p.$eval('#mob', (e) => e.closest('.field').querySelector('.field__error').textContent.trim()));
    await p.fill('#mob', '9876543210'); await p.click('[data-step]:not([hidden]) [data-next]'); await p.waitForTimeout(400);
    await p.click('label.choice:has(input[value="WhatsApp"])'); await p.click('label.check:has(input[name=consent])');
    await p.click('[data-step]:not([hidden]) [data-next]'); await p.waitForTimeout(400);
    const review = await p.$eval('[data-review-out]', (e) => e.textContent);
    ok('Review step lists entries', review.includes('Aarav Patil') && review.includes('Class 3') && review.includes('WhatsApp'));
    await p.click('.enq__form button[type=submit]'); await p.waitForTimeout(300);
    ok('Submit shows loading state', await p.$eval('.enq__form button[type=submit]', (e) => e.classList.contains('is-loading')));
    await p.waitForSelector('.enq__card [data-success]:not([hidden])', { timeout: 5000 });
    ok('Success screen + demo reference', (await p.$eval('.enq__card [data-success] [data-ref]', (e) => e.textContent)).startsWith('DEMO-'));
    await p.click('[data-checklist] li:nth-child(1) label'); await p.waitForTimeout(100);
    ok('Checklist counts', (await p.$eval('[data-cl-count]', (e) => e.textContent)).startsWith('1 of'));
    await p.click('#visit [data-open-modal=visit-modal]'); await p.waitForTimeout(500);
    ok('Visit modal opens', await p.$eval('#visit-modal', (e) => e.open));
    await p.keyboard.press('Escape'); await p.waitForTimeout(500);
    ok('Visit modal closes on Esc', !(await p.$eval('#visit-modal', (e) => e.open)));
  });
  await step('gallery', async () => {
    await p.goto(B + '/campus-life/', { waitUntil: 'networkidle' });
    await p.click('[data-g-filter=Sports]'); await p.waitForTimeout(700);
    ok('Gallery filter', (await p.$$eval('[data-g-item]:not([hidden])', (x) => x.length)) === 3);
    await p.click('[data-g-item]:not([hidden]) button'); await p.waitForTimeout(400);
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300);
    ok('Lightbox opens + keyboard next', (await p.$eval('#lightbox', (e) => e.open)) && (await p.$eval('[data-lb-count]', (e) => e.textContent)) === '2 / 3');
  });
  await step('assistant', async () => {
    await p.goto(B + '/contact/', { waitUntil: 'networkidle' });
    await p.fill('#as-in', 'What is the affiliation number?'); await p.press('#as-in', 'Enter'); await p.waitForTimeout(1000);
    ok('Assistant answers from verified data', (await p.$eval('[data-as-log]', (e) => e.textContent)).includes('1131284'));
  });
  await step('mobile', async () => {
    const m = await mk(390); await m.goto(B + '/', { waitUntil: 'networkidle' });
    await m.click('[data-burger]'); await m.waitForTimeout(700);
    ok('Mobile menu opens', await m.$eval('[data-mnav]', (e) => e.classList.contains('is-open') && !e.hasAttribute('inert')));
    await m.locator('.mnav__exp').nth(2).click(); await m.waitForTimeout(450);
    ok('Mobile submenu expands', await m.$eval('#mn-2', (e) => e.classList.contains('is-open')));
    await m.keyboard.press('Escape'); await m.waitForTimeout(300);
    ok('Mobile menu closes on Esc', !(await m.$eval('[data-mnav]', (e) => e.classList.contains('is-open'))));
  });
  await step('a11y modes', async () => {
    const ctx = await b.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } }); const r = await ctx.newPage();
    await r.goto(B + '/', { waitUntil: 'networkidle' });
    ok('Reduced motion: reveals visible immediately', await r.$eval('.news__feature', (e) => getComputedStyle(e).opacity === '1'));
    const nj = await b.newContext({ javaScriptEnabled: false }); const q = await nj.newPage(); await q.goto(B + '/', { waitUntil: 'load' });
    ok('No-JS: hero heading visible', await q.$eval('#hero-title', (e) => getComputedStyle(e).opacity === '1' && e.textContent.includes('Where curious')));
  });
  console.log(results.join('\n')); console.log('Console/page errors:', errs.length ? errs : 'none');
  await b.close();
})();
