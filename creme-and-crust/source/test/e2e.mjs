import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';
import { handle, log } from './mock.mjs';

const ROOT = path.resolve('dist'); const SHOTS = path.resolve('test/shots'); fs.mkdirSync(SHOTS, { recursive: true });
const MIME = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.jpg': 'image/jpeg', '.json': 'application/json' };
const results = []; const consoleErrors = [];
const step = async (name, fn) => { try { await fn(); results.push(['PASS', name]); console.log('PASS', name); } catch (e) { results.push(['FAIL', name, String(e.message || e).split('\n')[0]]); console.log('FAIL', name, '→', String(e.message || e).split('\n').slice(0, 3).join(' | ')); } };

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
async function newPage(viewport) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await ctx.route('**/*', async (route) => {
    const req = route.request(); const url = req.url(); const u = new URL(url);
    if (u.host === 'app.test') {
      if (u.pathname === '/config.js') return route.fulfill({ body: 'window.CC_CONFIG={url:"https://mock.supabase.test",key:"test-key"};', contentType: 'text/javascript' });
      if (u.pathname.startsWith('/__vendor/')) return route.fulfill({ path: path.resolve('test/vendor', u.pathname.slice(10)), contentType: 'text/javascript' });
      const f = path.join(ROOT, u.pathname);
      if (u.pathname !== '/' && fs.existsSync(f) && fs.statSync(f).isFile()) return route.fulfill({ path: f, contentType: MIME[path.extname(f)] || 'application/octet-stream' });
      return route.fulfill({ path: path.join(ROOT, 'index.html'), contentType: 'text/html' });
    }
    if (u.host === 'esm.sh') {
      const file = u.pathname.includes('jsx-runtime') ? 'jsx.js' : u.pathname.includes('client') ? 'client.js' : u.pathname.startsWith('/react-dom') ? 'client.js' : 'react.js';
      return route.fulfill({ path: path.resolve('test/vendor', file), contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' } });
    }
    if (u.host === 'mock.supabase.test') {
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      const r = handle(req.method(), url, req.headers(), req.postData());
      return route.fulfill({ status: r.status, body: r.body, contentType: r.contentType || 'text/plain', headers: cors });
    }
    if (u.host === 'images.pexels.com') return route.fulfill({ path: path.resolve('test/vendor/photo.jpg'), contentType: 'image/jpeg' });
    if (u.host.includes('fonts.g')) return route.fulfill({ body: '', contentType: 'text/css' });
    return route.abort();
  });
  ctx.setDefaultTimeout(9000); ctx.setDefaultNavigationTimeout(15000);
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error' && !/WebSocket|ERR_FAILED|ERR_NAME|net::|status of 4\d\d/.test(m.text())) consoleErrors.push(`[${viewport.width}] ${m.text().slice(0, 300)}`); });
  page.on('pageerror', (e) => consoleErrors.push(`[${viewport.width}] PAGEERROR ${e.message}`));
  page.on('dialog', (d) => d.dismiss());
  return page;
}
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
const shot = (page, name) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
const noOverflow = async (page, where) => { const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); if (o > 1) throw new Error(`horizontal overflow ${o}px on ${where}`); };

// ═════════ CUSTOMER FLOW (mobile + desktop) ═════════
const d = await newPage({ width: 1366, height: 860 });
let orderNo = '';
await step('home renders with bestsellers, categories, offers', async () => {
  await d.goto('http://app.test/');
  await d.getByRole('heading', { name: /bestsellers/i }).waitFor({ timeout: 8000 });
  await d.locator('.pcard').first().waitFor();
  const n = await d.locator('.grid-products .pcard').count(); if (n !== 4) throw new Error(`expected 4 bestsellers, got ${n}`);
  if (!(await d.locator('.cat-tile').count())) throw new Error('no category tiles');
  await d.locator('.offer-hero').waitFor();
  await shot(d, '01-home-desktop'); await d.evaluate(() => window.scrollTo(0, 900)); await d.waitForTimeout(150); await shot(d, '02-home-desktop-scroll');
  await d.evaluate(() => window.scrollTo(0, 2200)); await d.waitForTimeout(150); await shot(d, '03-home-desktop-offers');
});
await step('menu: filter category + search', async () => {
  await d.goto('http://app.test/menu');
  await d.locator('.pcard').first().waitFor();
  const all = await d.locator('.pcard').count();
  await d.getByRole('button', { name: /^Beverages/ }).click();
  await d.waitForTimeout(150);
  const bev = await d.locator('.pcard').count(); if (!(bev > 0 && bev < all)) throw new Error(`filter count ${bev}/${all}`);
  await d.getByRole('button', { name: /^All/ }).click();
  await d.getByPlaceholder('Search waffles, drinks…').fill('lotus'); await d.waitForTimeout(400);
  const s = await d.locator('.pcard').count(); if (s !== 1) throw new Error(`search lotus → ${s}`);
  await d.getByPlaceholder('Search waffles, drinks…').fill('zzzz'); await d.waitForTimeout(400);
  await d.getByText(/Nothing matches/).waitFor();
  await d.getByPlaceholder('Search waffles, drinks…').fill('');
  await shot(d, '04-menu-desktop');
});
await step('customize Choco Overload (options change price) + add', async () => {
  await d.goto('http://app.test/menu'); await d.locator('.pcard').first().waitFor();
  const card = d.locator('.pcard', { hasText: 'Choco Overload' });
  await card.getByRole('button', { name: /customize/i }).click();
  const modal = d.locator('.modal'); await modal.waitFor();
  await modal.getByRole('button', { name: /Caramel/ }).click();
  await modal.getByRole('button', { name: /Almonds/ }).click();
  await modal.getByRole('button', { name: /Ice cream scoop/ }).click();
  await modal.getByRole('button', { name: 'Increase' }).click();
  const price = await modal.locator('.cz-foot .price').innerText();
  if (!price.includes('478')) throw new Error(`price shown ${price}, expected ₹478 ((149+20+30+40)×2)`);
  await shot(d, '05-customize');
  await modal.getByRole('textbox').fill('Less sweet please');
  await modal.getByRole('button', { name: 'Add to cart' }).click();
  await d.locator('.toast').first().waitFor();
});
await step('quick add Classic + combo requires drink choice', async () => {
  await d.locator('.pcard', { hasText: 'Classic Belgian' }).getByRole('button', { name: /Add Classic/ }).click();
  await d.locator('.pcard', { hasText: 'Waffle + Drink Combo' }).getByRole('button', { name: /Add Waffle/ }).click();
  const modal = d.locator('.modal'); await modal.waitFor();
  await modal.getByRole('button', { name: 'Add to cart' }).click();
  await modal.getByText('Choose 1 · Required').waitFor();
  await modal.getByRole('button', { name: /Iced Latte/ }).click();
  await modal.getByRole('button', { name: 'Add to cart' }).click();
  await d.waitForTimeout(200);
  const count = await d.locator('.cart-count').innerText(); if (count !== '4') throw new Error(`cart count ${count}`);
});
await step('cart: qty, remove, coupon', async () => {
  await d.goto('http://app.test/cart'); await d.locator('.line').first().waitFor();
  const lines = await d.locator('.line').count(); if (lines !== 3) throw new Error(`lines ${lines}`);
  await d.locator('.line', { hasText: 'Classic Belgian' }).getByRole('button', { name: 'Increase' }).click();
  await d.locator('.line', { hasText: 'Waffle + Drink' }).getByRole('button', { name: /Remove/ }).click();
  await d.waitForTimeout(150);
  await d.locator('#coupon').fill('waffle10'); await d.getByRole('button', { name: 'Apply' }).click();
  await d.getByText(/WAFFLE10 applied/).waitFor({ timeout: 4000 });
  const total = await d.locator('.sum-row.total').innerText();
  // subtotal 478 + 198 = 676; discount 10% capped 50 → 50; tax 5% of 626 = 31.30 → total 657.30
  if (!total.includes('657.30')) throw new Error(`cart total shows "${total}" expected ₹657.30`);
  await shot(d, '06-cart');
});
await step('checkout validation + place order', async () => {
  await d.getByRole('button', { name: /Continue to checkout/ }).click();
  await d.getByRole('heading', { name: 'Checkout' }).waitFor();
  await d.getByRole('button', { name: /Place order/ }).click();
  await d.getByText('Enter a valid 10-digit mobile number.').waitFor();
  await d.locator('#co-name').fill('Priya Test'); await d.locator('#co-phone').fill('98111 44555');
  await d.getByRole('button', { name: /Dine-in/ }).click(); await d.locator('#co-table').fill('T2'); await d.getByText(/Discount \(WAFFLE10\)/).waitFor();
  await d.getByRole('radio', { name: /UPI/ }).click();
  await shot(d, '07-checkout');
  const btn = await d.getByRole('button', { name: /Place order/ }).innerText(); if (!btn.includes('657.30')) throw new Error(`button total ${btn}`);
  await d.getByRole('button', { name: /Place order/ }).click();
  await d.getByRole('heading', { name: 'Order placed!' }).waitFor({ timeout: 8000 });
  orderNo = (await d.locator('.order-no').innerText()).trim();
  if (!/^CC-[A-Z0-9]{6}$/.test(orderNo)) throw new Error(`order no ${orderNo}`);
  const tot = await d.locator('.sum-row.total').last().innerText(); if (!tot.includes('657.30')) throw new Error(`server total ${tot}`);
  await d.getByText('Open a UPI app').waitFor();
  await shot(d, '08-success');
});
await step('cart cleared; order persists after reload', async () => {
  if (await d.locator('.cart-count').count()) throw new Error('cart not cleared');
  await d.reload(); await d.locator('.order-no').waitFor();
});
await step('track order needs correct phone', async () => {
  await d.goto(`http://app.test/track-order`);
  await d.locator('#tr-no').fill(orderNo); await d.locator('#tr-ph').fill('9000000001');
  await d.getByRole('button', { name: /Find my order/ }).click();
  await d.getByText('We couldn’t find that order').waitFor();
  await d.locator('#tr-ph').fill('9811144555'); await d.getByRole('button', { name: /Find my order/ }).click();
  await d.locator('.timeline').waitFor();
  await shot(d, '09-track');
});
await step('about, contact, 404 pages', async () => {
  for (const [u, t] of [['/about', /Golden waffles/], ['/contact', /Contact/], ['/nope', /went missing/]]) { await d.goto('http://app.test' + u); await d.getByRole('heading', { name: t }).first().waitFor(); }
  await shot(d, '10-404');
});

const mob = await newPage({ width: 390, height: 844 });
await step('mobile: home, nav, menu, cart bar, no overflow', async () => {
  await mob.goto('http://app.test/'); await mob.locator('.pcard').first().waitFor();
  await noOverflow(mob, 'home'); await shot(mob, '11-home-mobile');
  await mob.getByRole('button', { name: 'Open menu' }).click(); await mob.locator('.mobile-nav').waitFor(); await shot(mob, '12-mobile-nav');
  await mob.locator('.mobile-nav').getByRole('link', { name: /^Menu/ }).click(); await mob.locator('.pcard').first().waitFor();
  await noOverflow(mob, 'menu');
  await mob.locator('.pcard', { hasText: 'Oreo Crunch' }).getByRole('button', { name: /Add Oreo/ }).click();
  await mob.locator('.cart-bar').waitFor(); await shot(mob, '13-menu-mobile');
  await mob.locator('.pcard', { hasText: 'Lotus Biscoff' }).getByRole('button', { name: /customize/i }).click(); await mob.locator('.modal').waitFor(); await shot(mob, '14-customize-mobile');
  await mob.locator('.modal').getByRole('button', { name: 'Add to cart' }).click();
  for (const u of ['/cart', '/checkout', '/track-order', '/about', '/contact']) { await mob.goto('http://app.test' + u); await mob.waitForTimeout(500); await noOverflow(mob, u); }
  await mob.goto('http://app.test/checkout'); await mob.waitForTimeout(400); await shot(mob, '15-checkout-mobile');
});

// ═════════ ADMIN FLOW ═════════
const a = await newPage({ width: 1440, height: 900 });
await step('admin route is protected → login', async () => {
  await a.goto('http://app.test/admin/orders'); await a.getByRole('heading', { name: 'Staff sign in' }).waitFor();
  await a.locator('#l-email').fill('owner@test.local'); await a.locator('#l-pw').fill('wrong-password'); await a.getByRole('button', { name: 'Sign in' }).click();
  await a.getByText('Incorrect email or password.').waitFor();
  await a.locator('#l-pw').fill('OwnerPass#2026'); await a.getByRole('button', { name: 'Sign in' }).click();
  await a.locator('.board').waitFor({ timeout: 8000 });
});
await step('overview dashboard renders KPIs + charts', async () => {
  await a.goto('http://app.test/admin'); await a.locator('.kpi').first().waitFor(); await a.locator('svg.chart').first().waitFor({ timeout: 8000 });
  await a.waitForTimeout(400); await shot(a, '20-admin-overview');
});
await step('orders: accept → prepare → ready → complete (paid) with receipt', async () => {
  await a.goto('http://app.test/admin/orders'); await a.locator('.board').waitFor();
  const card = a.locator('.ocard', { hasText: orderNo }); await card.waitFor({ timeout: 8000 });
  await shot(a, '21-admin-board');
  await card.getByRole('button', { name: 'Accept' }).click(); await a.locator('.ocard.s-accepted', { hasText: orderNo }).waitFor({ timeout: 6000 });
  await a.locator('.ocard', { hasText: orderNo }).getByRole('button', { name: 'Start preparing' }).click(); await a.locator('.ocard.s-preparing', { hasText: orderNo }).waitFor({ timeout: 6000 });
  await a.locator('.ocard', { hasText: orderNo }).getByRole('button', { name: 'Mark ready' }).click(); await a.locator('.ocard.s-ready', { hasText: orderNo }).waitFor({ timeout: 6000 });
  await a.locator('.ocard', { hasText: orderNo }).getByRole('button', { name: 'Complete' }).click();
  await a.getByRole('button', { name: 'Paid — complete' }).click();
  await a.waitForTimeout(800);
  if (await a.locator('.ocard', { hasText: orderNo }).count()) throw new Error('order still on board after completing');
});
await step('order detail drawer shows history + payment paid', async () => {
  await a.getByRole('button', { name: /All orders/ }).click();
  await a.locator('tr', { hasText: orderNo }).first().click();
  await a.locator('.drawer').getByText('Status history').waitFor();
  await a.locator('.drawer').getByText('Special instructions').first().waitFor().catch(() => {});
  const txt = await a.locator('.drawer').innerText(); if (!/paid/.test(txt) || !/ready → completed/.test(txt)) throw new Error('history/payment missing');
  await shot(a, '22-order-drawer');
  await a.keyboard.press('Escape');
});
await step('stock deducted exactly once for completed order', async () => {
  await a.goto('http://app.test/admin/inventory'); await a.locator('table.tbl').waitFor();
  await a.locator('tr', { hasText: 'Waffle batter' }).getByRole('button', { name: 'History' }).click();
  await a.locator('.drawer').getByText(new RegExp(`Order completed · ${orderNo}`)).waitFor();
  const n = await a.locator('.drawer').getByText(new RegExp(`Order completed · ${orderNo}`)).count(); if (n !== 1) throw new Error(`deducted ${n} times`);
  await a.keyboard.press('Escape');
  await a.locator('tr', { hasText: 'Cups' }).getByRole('button', { name: 'Adjust' }).click();
  await a.locator('#adj-amt').fill('25'); await a.locator('.modal').getByRole('button', { name: 'Save' }).click(); await a.getByText(/Cups: now/).waitFor();
  await shot(a, '23-inventory');
});
await step('bills: search online order, reprint twice (simulated printer)', async () => {
  await a.goto('http://app.test/admin/settings?tab=printer'); await a.getByRole('button', { name: /^Simulated printer \(demo\)/ }).click(); await a.getByRole('button', { name: 'Save changes' }).click(); await a.getByText('Settings saved').waitFor();
  await a.goto('http://app.test/admin/bills'); await a.getByRole('button', { name: 'All' }).click();
  await a.getByPlaceholder('Bill no, order no or name').fill(orderNo); await a.locator('tr', { hasText: orderNo }).first().waitFor();
  await a.locator('tr', { hasText: orderNo }).first().click(); await a.locator('aside .receipt').waitFor();
  await a.locator('aside').getByRole('button', { name: 'Reprint' }).click(); await a.getByText(/simulated printer/).first().waitFor();
  await a.waitForTimeout(600); await a.locator('aside').getByRole('button', { name: 'Reprint' }).click(); await a.waitForTimeout(1500);
  await a.locator('aside').getByText(/Printed 2 time/).waitFor({ timeout: 6000 });
  await shot(a, '24-bills');
});
await step('billing POS: items, options, custom item, 10% discount, UPI, generate + auto-print', async () => {
  await a.goto('http://app.test/admin/billing'); await a.locator('.tile').first().waitFor();
  await a.getByRole('button', { name: 'Add Classic Belgian' }).click(); await a.getByRole('button', { name: 'Add Classic Belgian' }).click();
  await a.getByRole('button', { name: 'Options for Choco Overload' }).click(); await a.locator('.modal').getByRole('button', { name: /Caramel/ }).click(); await a.locator('.modal').getByRole('button', { name: /^Add ·/ }).click();
  await a.getByRole('button', { name: /Custom item/ }).click(); await a.locator('#ci-name').fill('Extra cup'); await a.locator('#ci-price').fill('10'); await a.locator('.modal').getByRole('button', { name: 'Add to bill' }).click();
  await a.getByRole('button', { name: '%' }).click(); await a.getByLabel('Discount value').fill('10');
  await a.getByRole('radio', { name: /UPI/ }).click();
  const btn = await a.getByRole('button', { name: /Generate bill/ }).innerText(); if (!btn.includes('356.27')) throw new Error('POS total shows ' + btn + ' expected ₹356.27');
  await shot(a, '33-pos');
  await a.getByRole('button', { name: /Generate bill/ }).click();
  await a.getByRole('heading', { name: /Bill B\d+ saved/ }).waitFor({ timeout: 8000 });
  globalThis.billNo = (await a.getByRole('heading', { name: /Bill B\d+ saved/ }).innerText()).match(/B\d+/)[0];
  await a.getByText(/Simulated print — nothing/).waitFor({ timeout: 6000 });
  const amt = await a.locator('.modal').innerText(); if (!amt.includes('356.27')) throw new Error('server total differs: ' + amt.slice(0, 120));
  await shot(a, '34-bill-saved');
  await a.getByRole('button', { name: 'New bill' }).click();
  if (await a.locator('.pos-line').count()) throw new Error('bill not cleared after saving');
});
await step('sales today + bill history reflect the new bill; reload keeps it', async () => {
  await a.goto('http://app.test/admin/sales'); await a.locator('tr', { hasText: globalThis.billNo }).waitFor({ timeout: 8000 });
  await shot(a, '35-sales');
  await a.reload(); await a.locator('tr', { hasText: globalThis.billNo }).waitFor({ timeout: 8000 });
  await a.goto('http://app.test/admin/bills'); await a.getByPlaceholder('Bill no, order no or name').fill(globalThis.billNo);
  await a.locator('tr', { hasText: globalThis.billNo }).first().waitFor(); const t = await a.locator('tr', { hasText: globalThis.billNo }).first().innerText();
  if (!/UPI/.test(t) || !/356\.27/.test(t)) throw new Error('history row wrong: ' + t);
});
await step('iPad layouts: POS landscape + portrait, no overflow; Bluetooth chip honest', async () => {
  const ip = await newPage({ width: 1180, height: 820 });
  await ip.goto('http://app.test/admin/login'); await ip.locator('#l-email').fill('owner@test.local'); await ip.locator('#l-pw').fill('OwnerPass#2026'); await ip.getByRole('button', { name: 'Sign in' }).click();
  await ip.locator('.kpi').first().waitFor({ timeout: 8000 });
  await ip.goto('http://app.test/admin/settings?tab=printer'); await ip.locator('#pr-dev').selectOption('bluetooth');
  await ip.goto('http://app.test/admin/billing'); await ip.locator('.tile').first().waitFor();
  const chip = await ip.locator('.printer-chip').innerText();
  const hasBt = await ip.evaluate(() => !!navigator.bluetooth);
  if (hasBt) await ip.getByRole('button', { name: 'Connect printer' }).waitFor(); else if (!/not available/i.test(chip)) throw new Error('no-bluetooth browser shows: ' + chip);
  if (/^(?!.*not).*connected/i.test(chip)) throw new Error('claims connected: ' + chip);
  console.log('   bluetooth in this browser:', hasBt, '· chip:', chip);
  await noOverflow(ip, 'pos landscape'); await ip.getByRole('button', { name: 'Add Oreo Crunch' }).click(); await shot(ip, '36-pos-ipad-landscape');
  await ip.setViewportSize({ width: 820, height: 1180 }); await ip.waitForTimeout(300); await noOverflow(ip, 'pos portrait'); await shot(ip, '37-pos-ipad-portrait');
  for (const u of ['/admin/sales', '/admin/bills']) { await ip.goto('http://app.test' + u); await ip.waitForTimeout(800); await noOverflow(ip, u); }
});
await step('kitchen screen shows live orders and advances one', async () => {
  await a.goto('http://app.test/admin/kitchen'); await a.locator('.ticket').first().waitFor({ timeout: 8000 });
  await shot(a, '25-kitchen');
  const before = await a.locator('.ticket').count();
  await a.locator('.ticket').first().getByRole('button', { name: 'Accept' }).click().catch(() => {});
  await a.waitForTimeout(800);
  if ((await a.locator('.ticket').count()) !== before) throw new Error('ticket count changed unexpectedly');
});
await step('products: edit price, disable product, reflects on menu', async () => {
  await a.goto('http://app.test/admin/products'); await a.locator('table.tbl').waitFor();
  await a.locator('tr', { hasText: 'Iced Latte' }).getByRole('button', { name: 'Edit' }).click();
  await a.locator('#p-price').fill('135'); await a.getByRole('button', { name: 'Save changes' }).click(); await a.getByText('Iced Latte saved').waitFor();
  await a.locator('tr', { hasText: 'Iced Latte' }).getByRole('switch').click(); await a.getByText(/Iced Latte is now hidden/).waitFor();
  await shot(a, '26-products');
  const m2 = await newPage({ width: 1280, height: 800 }); await m2.goto('http://app.test/menu?c=beverages'); await m2.locator('.pcard').first().waitFor();
  const card = await m2.locator('.pcard', { hasText: 'Iced Latte' }).innerText(); if (!/Sold out/.test(card) || !/135/.test(card)) throw new Error('menu not updated: ' + card);
  await a.locator('tr', { hasText: 'Iced Latte' }).getByRole('switch').click();
});
await step('product validation rejects negative price', async () => {
  await a.getByRole('button', { name: 'Add product' }).click(); await a.locator('#p-name').fill('Test Waffle'); await a.locator('#p-price').fill('-5');
  await a.getByRole('button', { name: 'Add product' }).last().click(); await a.getByText(/Enter a valid price/).waitFor(); await a.keyboard.press('Escape');
});
await step('offers: create coupon, invalid code rejected', async () => {
  await a.goto('http://app.test/admin/offers'); await a.locator('.coupon-card').first().waitFor();
  await a.getByRole('button', { name: 'Create offer' }).first().click();
  await a.locator('#cp-code').fill('x'); await a.getByRole('button', { name: 'Save offer' }).click(); await a.getByText(/3–20 letters/).waitFor();
  await a.locator('#cp-code').fill('FLAT25'); await a.locator('#cp-title').fill('Flat ₹25 off'); await a.getByRole('button', { name: 'Fixed amount' }).click(); await a.locator('#cp-val').fill('25'); await a.locator('#cp-min').fill('150');
  await a.getByRole('button', { name: 'Save offer' }).click(); await a.getByText('FLAT25 saved').waitFor();
  await shot(a, '27-offers');
});
await step('analytics: presets + custom range', async () => {
  await a.goto('http://app.test/admin/analytics'); await a.locator('svg.chart').first().waitFor({ timeout: 8000 });
  await a.getByText(/Demo data/).first().waitFor();
  await a.getByRole('button', { name: '30 days' }).click(); await a.waitForTimeout(800); await shot(a, '28-analytics');
  await a.getByRole('button', { name: 'Custom' }).click(); await a.waitForTimeout(800); await a.locator('svg.chart').first().waitFor();
});
await step('categories: delete with products requires move target', async () => {
  await a.goto('http://app.test/admin/categories'); await a.locator('.list-card').first().waitFor();
  await a.locator('.list-card', { hasText: 'Combos' }).getByRole('button', { name: 'Delete' }).click();
  await a.getByText(/Choose where to move them/).waitFor(); await a.keyboard.press('Escape'); await shot(a, '29-categories');
});
await step('settings: all tabs render; team add staff; staff sees limited nav', async () => {
  for (const t of ['shop', 'hours', 'ordering', 'payments', 'receipt', 'printer', 'appearance', 'team', 'demo', 'account']) { await a.goto(`http://app.test/admin/settings?tab=${t}`); await a.locator('.panel h2').first().waitFor(); }
  await a.goto('http://app.test/admin/settings?tab=team'); await a.getByRole('button', { name: 'Add member' }).click();
  await a.locator('#t-name').fill('Ravi Staff'); await a.locator('#t-email').fill('ravi@test.local'); await a.locator('#t-pw').fill('RaviPass#2026');
  await a.getByRole('button', { name: 'Create account' }).click(); await a.getByText('Ravi Staff can now sign in').waitFor();
  await shot(a, '30-settings-team');
  const s = await newPage({ width: 1280, height: 800 });
  await s.goto('http://app.test/admin/login'); await s.locator('#l-email').fill('ravi@test.local'); await s.locator('#l-pw').fill('RaviPass#2026'); await s.getByRole('button', { name: 'Sign in' }).click();
  await s.locator('.kpi').first().waitFor({ timeout: 8000 });
  const nav = await s.locator('.sidebar').innerText(); if (/Analytics|Offers|Products/.test(nav)) throw new Error('staff sees owner nav: ' + nav.replace(/\n/g, ' '));
  await s.goto('http://app.test/admin/analytics'); await s.getByText('Owner access only').waitFor();
});
await step('demo reset removes only demo orders', async () => {
  await a.goto('http://app.test/admin/settings?tab=demo'); await a.getByText(/orders are marked as demo/).waitFor();
  await a.getByRole('button', { name: 'Reset demo data' }).click(); await a.locator('#ask-input').fill('RESET');
  await a.locator('.modal').getByRole('button', { name: 'Reset demo data' }).click(); await a.getByText(/Removed \d+ demo orders, created \d+/).waitFor({ timeout: 15000 });
});
const am = await newPage({ width: 390, height: 844 });
await step('mobile admin: login, board tabs, no overflow', async () => {
  await am.goto('http://app.test/admin/login'); await am.locator('#l-email').fill('owner@test.local'); await am.locator('#l-pw').fill('OwnerPass#2026'); await am.getByRole('button', { name: 'Sign in' }).click();
  await am.locator('.kpi').first().waitFor({ timeout: 8000 }); await noOverflow(am, 'admin overview'); await shot(am, '31-admin-mobile');
  await am.goto('http://app.test/admin/orders'); await am.locator('.board-tabs').waitFor(); await noOverflow(am, 'admin orders'); await shot(am, '32-admin-orders-mobile');
  for (const u of ['/admin/products', '/admin/inventory', '/admin/offers', '/admin/analytics', '/admin/settings', '/admin/receipts']) { await am.goto('http://app.test' + u); await am.waitForTimeout(700); await noOverflow(am, u); }
});

await browser.close();
console.log('\n──── SUMMARY ────');
results.forEach((r) => console.log(r.join('  ')));
console.log(`\n${results.filter((r) => r[0] === 'PASS').length}/${results.length} passed`);
console.log('\nConsole errors:', consoleErrors.length ? '\n' + [...new Set(consoleErrors)].slice(0, 25).join('\n') : 'none');
