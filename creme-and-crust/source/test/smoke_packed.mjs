import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import path from 'path'; import { handle } from './mock.mjs';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 } }); ctx.setDefaultTimeout(10000);
await ctx.route('**/*', async (route) => {
  const req = route.request(); const u = new URL(req.url());
  if (u.host === 'app.test') {
    if (u.pathname === '/config.js') return route.fulfill({ body: 'window.CC_CONFIG={url:"https://mock.supabase.test",key:"k"};', contentType: 'text/javascript' });
    if (u.pathname.startsWith('/__vendor/')) return route.fulfill({ path: path.resolve('test/vendor', u.pathname.slice(10)), contentType: 'text/javascript' });
    return route.fulfill({ path: 'deploy/index.html', contentType: 'text/html' });
  }
  if (u.host === 'esm.sh') { const f = u.pathname.includes('jsx-runtime') ? 'jsx.js' : u.pathname.startsWith('/react-dom') ? 'client.js' : 'react.js'; return route.fulfill({ path: path.resolve('test/vendor', f), contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' } }); }
  if (u.host === 'mock.supabase.test') { if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } }); const r = handle(req.method(), req.url(), req.headers(), req.postData()); return route.fulfill({ status: r.status, body: r.body, contentType: r.contentType || 'text/plain', headers: { 'access-control-allow-origin': '*' } }); }
  if (u.host === 'images.pexels.com') return route.fulfill({ path: path.resolve('test/vendor/photo.jpg'), contentType: 'image/jpeg' });
  return route.abort();
});
const p = await ctx.newPage(); const errs = [];
p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/ERR_FAILED|net::|WebSocket/.test(m.text()) && errs.push(m.text()));
await p.goto('http://app.test/'); await p.locator('.pcard').first().waitFor(); console.log('home ok, cards:', await p.locator('.pcard').count());
await p.goto('http://app.test/admin/login'); await p.locator('#l-email').fill('owner@test.local'); await p.locator('#l-pw').fill('OwnerPass#2026'); await p.getByRole('button', { name: 'Sign in' }).click();
await p.locator('.kpi').first().waitFor(); console.log('admin ok');
await p.goto('http://app.test/admin/billing'); await p.locator('.tile').first().waitFor(); console.log('pos ok, tiles:', await p.locator('.tile').count());
const bg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor); console.log('css applied, body bg:', bg);
console.log('errors:', errs.length ? errs : 'none'); await browser.close();
