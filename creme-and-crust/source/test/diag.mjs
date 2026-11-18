import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs'; import path from 'path'; import { handle, log } from './mock.mjs';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await ctx.route('**/*', async (route) => {
  const req = route.request(); const u = new URL(req.url());
  if (u.host === 'app.test') {
    if (u.pathname === '/config.js') return route.fulfill({ body: 'window.CC_CONFIG={url:"https://mock.supabase.test",key:"test-key"};', contentType: 'text/javascript' });
    if (u.pathname.startsWith('/__vendor/')) return route.fulfill({ path: path.resolve('test/vendor', u.pathname.slice(10)), contentType: 'text/javascript' });
    const f = path.join('dist', u.pathname); if (u.pathname !== '/' && fs.existsSync(f)) return route.fulfill({ path: f, contentType: f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'text/html' });
    return route.fulfill({ path: 'dist/index.html', contentType: 'text/html' });
  }
  if (u.host === 'esm.sh') { const file = u.pathname.includes('jsx-runtime') ? 'jsx.js' : u.pathname.startsWith('/react-dom') ? 'client.js' : 'react.js'; return route.fulfill({ path: path.resolve('test/vendor', file), contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' } }); }
  if (u.host === 'mock.supabase.test') { if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } }); const r = handle(req.method(), req.url(), req.headers(), req.postData()); return route.fulfill({ status: r.status, body: r.body, contentType: r.contentType || 'text/plain', headers: { 'access-control-allow-origin': '*' } }); }
  return route.abort();
});
const page = await ctx.newPage();
page.on('console', (m) => console.log('CONSOLE', m.type(), m.text().slice(0, 400)));
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
page.on('requestfailed', (r) => console.log('REQFAIL', r.url().slice(0, 120), r.failure()?.errorText));
await page.goto('http://app.test/' + (process.argv[2] || ''));
await page.waitForTimeout(3000);
console.log('HTML:', (await page.locator('#root').innerHTML()).slice(0, 300));
console.log('API calls:', log.join('\n  '));
await browser.close();
