import fs from 'fs'; import zlib from 'zlib';
const js = fs.readFileSync('dist/assets/app.js'); const css = fs.readFileSync('dist/assets/app.css');
const z = (b) => zlib.gzipSync(b, { level: 9 }).toString('base64').replace(/(.{3000})/g, '$1\n');
const html = fs.readFileSync('dist/index.html', 'utf8')
  .replace(/<link rel="stylesheet" href="\/assets\/app\.css[^>]*>\n?/, '')
  .replace(/<script type="module" src="\/assets\/app\.js[^>]*><\/script>/, `<script type="module">
const u=(b)=>Uint8Array.from(atob(b),c=>c.charCodeAt(0));
const g=async(b)=>new Response(new Blob([u(b)]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
if(!('DecompressionStream' in window)){document.getElementById('root').innerHTML='<p style="font:16px sans-serif;padding:40px;text-align:center">Please update your browser (iOS/iPadOS 16.4 or newer, or a current Chrome) to open this app.</p>';}
else{const[c,j]=await Promise.all([g(document.getElementById('cc-css').textContent),g(document.getElementById('cc-js').textContent)]);
const s=document.createElement('style');s.textContent=c;document.head.appendChild(s);
await import(URL.createObjectURL(new Blob([j],{type:'text/javascript'})));}
</script>
<script type="text/plain" id="cc-css">${z(css)}</script>
<script type="text/plain" id="cc-js">${z(js)}</script>`);
fs.mkdirSync('deploy', { recursive: true });
fs.writeFileSync('deploy/index.html', html);
fs.writeFileSync('deploy/vercel.json', JSON.stringify({ rewrites: [{ source: '/((?!config\\.js).*)', destination: '/index.html' }], headers: [{ source: '/(.*)', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }, { key: 'X-Frame-Options', value: 'SAMEORIGIN' }] }, { source: '/', headers: [{ key: 'Cache-Control', value: 'no-cache' }] }] }));
fs.writeFileSync('deploy/config.js', `window.CC_CONFIG={url:"https://cdgvztmryzmzvvpxikjm.supabase.co",key:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkZ3Z6dG1yeXptenZ2cHhpa2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ5ODE3MTUsImV4cCI6MjExMDU1NzcxNX0.LOStz7sgHaNpJmsTBLYE375Z9qD6C2vKF4M1dd0jbd4"};\n`);
console.log('index.html', fs.statSync('deploy/index.html').size, 'bytes');
