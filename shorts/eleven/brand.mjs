// Render the channel art: node brand.mjs -> brand/profile-800.png, brand/banner-2560x1440.png
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const root = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(import.meta.url)('playwright');
const T = { '.html': 'text/html', '.js': 'text/javascript', '.otf': 'font/otf', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(root, decodeURIComponent(new URL(q.url, 'http://x').pathname)); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': T[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); });
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const b = await chromium.launch();
for (const [kind, w, h, out] of [['dp', 800, 800, 'brand/profile-800.png'], ['banner', 2560, 1440, 'brand/banner-2560x1440.png']]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on('pageerror', (e) => console.error(e.message));
  await p.goto(`http://127.0.0.1:${srv.address().port}/brand.html?kind=${kind}&w=${w}&h=${h}`);
  await p.evaluate(() => window.draw());
  const d = await p.evaluate(() => document.getElementById('c').toDataURL('image/png'));
  fs.writeFileSync(path.join(root, out), Buffer.from(d.split(',')[1], 'base64'));
  console.log(out);
}
await b.close(); srv.close();
