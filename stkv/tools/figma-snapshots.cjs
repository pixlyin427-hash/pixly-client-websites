// Produce self-contained HTML snapshots (final animation state, inlined CSS + fonts) for Figma import.
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const DIST = path.join(__dirname, '..', 'dist');
const OUT = path.join(__dirname, '..', '.figma-snapshots'); // run: npm run build && npm run preview, then node tools/figma-snapshots.cjs fs.mkdirSync(OUT, { recursive: true });
const jobs = [
  ['/', 1440], ['/', 390], ['/our-school/', 1440], ['/academics/', 1440], ['/academics/', 390], ['/campus-life/', 1440],
  ['/admissions/', 1440], ['/admissions/', 390], ['/resources/', 1440], ['/disclosure/', 1440], ['/contact/', 1440],
];
const fontData = (file) => `data:font/woff2;base64,${fs.readFileSync(path.join(DIST, file)).toString('base64')}`;
(async () => {
  const b = await chromium.launch();
  for (const [route, w] of jobs) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto('http://localhost:4321' + route, { waitUntil: 'networkidle' });
    const h = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 400) { await p.evaluate((yy) => scrollTo(0, yy), y); await p.waitForTimeout(60); }
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(2500);
    const cssHrefs = await p.$$eval('link[rel=stylesheet]', (l) => l.map((x) => x.getAttribute('href')));
    let css = cssHrefs.map((h) => fs.readFileSync(path.join(DIST, h), 'utf8')).join('\n');
    // keep only latin @font-face rules, inline their files
    css = css.replace(/@font-face\{[^}]*\}/g, (rule) => {
      const m = rule.match(/url\(([^)]+?latin-(?:opsz|wght)-(?:normal|italic)[^)]*?\.woff2)\)/);
      if (!m || /latin-ext/.test(rule)) return '';
      return rule.replace(/src:[^;}]+/, `src:url(${fontData(m[1].replace(/^\//, ''))}) format("woff2")`);
    });
    const inlineStyles = await p.$$eval('style', (s) => s.map((x) => x.textContent).join('\n'));
    const body = await p.evaluate(() => {
      const c = document.documentElement.cloneNode(true);
      c.querySelectorAll('script, link, .search, .mnav, .to-top, .demo-pill, .toasts, dialog, .skip-link, .lang__list').forEach((n) => n.remove());
      c.querySelector('[data-header]')?.classList.remove('is-hidden', 'is-scrolled');
      return c.querySelector('body').innerHTML;
    });
    const htmlAttrs = await p.evaluate(() => Array.from(document.documentElement.attributes).map((a) => `${a.name}="${a.value}"`).join(' '));
    const doc = `<!doctype html><html ${htmlAttrs}><head><meta charset="utf-8"><meta name="viewport" content="width=${w}">
<style>${css}\n${inlineStyles}
*,*::before,*::after{transition:none!important;animation:none!important}
.js [data-reveal]{opacity:1!important;transform:none!important}
.js [data-reveal='mask'],.js [data-reveal='wipe']{clip-path:none!important}
.js [data-reveal='mask']>*,.js [data-reveal='words'] .w__i{transform:none!important}
.js [data-reveal='draw'] *{stroke-dashoffset:0!important}
.hdr{position:absolute!important}
html,body{width:${w}px}
</style></head><body>${body}</body></html>`;
    const name = `${route === '/' ? 'home' : route.replace(/\//g, '')}-${w}.html`;
    fs.writeFileSync(path.join(OUT, name), doc);
    console.log(name, (doc.length / 1024).toFixed(0) + 'KB');
    await p.close();
  }
  await b.close();
})();
