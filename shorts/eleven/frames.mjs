// Render chosen frames of a page as PNGs (with transparency), named by frame number.
//   PAGE=index-02s.html node frames.mjs <out_dir> <list.json>   (list.json: an array of frame numbers)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const [out, list] = process.argv.slice(2);
const frames = JSON.parse(fs.readFileSync(list, 'utf8'));
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', (e) => console.error('[page error]', e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/${process.env.PAGE}`);
  await page.evaluate(() => window.PP.ready);
  for (const f of frames) {
    const data = await page.evaluate((f) => { window.PP.renderFrame(f); return document.getElementById('c').toDataURL('image/png'); }, f);
    fs.writeFileSync(path.join(out, `f${String(f).padStart(5, '0')}.png`), Buffer.from(data.split(',')[1], 'base64'));
  }
  console.log(`${frames.length} frames`);
} finally { await browser.close(); server.close(); }
