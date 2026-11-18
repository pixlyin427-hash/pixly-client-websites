import { build } from '/opt/npm-tools/node_modules/esbuild/lib/main.js';
import fs from 'fs';
const prod = process.argv.includes('--prod');
await build({
  entryPoints: ['src/main.tsx'], bundle: true, outdir: 'dist/assets', format: 'esm', target: ['es2020', 'safari15'],
  jsx: 'automatic', minify: prod, sourcemap: !prod, legalComments: 'none', logLevel: 'warning',
  external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'],
  nodePaths: ['/opt/npm-tools/node_modules'], entryNames: 'app', define: { 'process.env.NODE_ENV': '"production"' },
});
const v = Date.now().toString(36);
const R = '19.2.0';
const html = `<!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Crème &amp; Crust — Made for your cravings</title>
<meta name="description" content="Freshly made Belgian waffles, irresistible toppings and little moments of happiness. Order online for takeaway or dine-in." />
<meta name="theme-color" content="#241711" />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect x='2' y='2' width='36' height='36' rx='11' fill='%23241711'/%3E%3Crect x='8' y='8' width='24' height='24' rx='6' fill='%23C98243'/%3E%3Cpath d='M16 8v24M24 8v24M8 16h24M8 24h24' stroke='%23241711' stroke-width='2.2' opacity='.55'/%3E%3C/svg%3E" />
<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preconnect" href="https://esm.sh" crossorigin /><link rel="preconnect" href="https://images.pexels.com" />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Playfair+Display:ital,wght@0,600;0,700;1,500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/assets/app.css?v=${v}" />
<script type="importmap">{"imports":{"react":"https://esm.sh/react@${R}","react/jsx-runtime":"https://esm.sh/react@${R}/jsx-runtime","react-dom":"https://esm.sh/react-dom@${R}?external=react","react-dom/client":"https://esm.sh/react-dom@${R}/client?external=react"}}</script>
<script src="/config.js?v=${v}"></script>
</head>
<body>
<div id="root"></div>
<noscript>Please enable JavaScript to order from Crème &amp; Crust.</noscript>
<script type="module" src="/assets/app.js?v=${v}"></script>
</body>
</html>
`;
fs.writeFileSync('dist/index.html', html);
fs.writeFileSync('dist/vercel.json', JSON.stringify({ rewrites: [{ source: '/((?!assets/|config.js).*)', destination: '/index.html' }], headers: [{ source: '/assets/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }, { source: '/(.*)', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }, { key: 'X-Frame-Options', value: 'SAMEORIGIN' }] }] }, null, 2));
if (!fs.existsSync('dist/config.js')) fs.writeFileSync('dist/config.js', 'window.CC_CONFIG = { url: "", key: "" };\n');
console.log('built', fs.statSync('dist/assets/app.js').size, 'bytes js,', fs.statSync('dist/assets/app.css').size, 'bytes css');
