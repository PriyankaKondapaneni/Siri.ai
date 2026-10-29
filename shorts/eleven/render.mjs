// Render frames of the page in headless Chromium.
//   node tools/render.mjs stills <out_dir> t1 t2 ...        one PNG per time (seconds), for review
//   node tools/render.mjs video <out.mp4> [from] [to]       the film, frame by frame, encoded with ffmpeg
// The page exposes PP.ready (fonts and textures) and PP.renderFrame(frameIndex). A small static server serves the
// project folder so fonts load the same way a browser would.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/${process.env.PAGE || "index.html"}`;

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error('[page]', m.text()); });
  page.on('pageerror', (e) => console.error('[page error]', e.message));
  await page.goto(url);
  await page.evaluate(() => window.PP.ready);
  return page;
}
const grab = (page, f, type = 'png') => page.evaluate(({ f, type }) => { window.PP.renderFrame(f); return document.getElementById('c').toDataURL(type === 'png' ? 'image/png' : 'image/jpeg', 0.96); }, { f, type });

const [mode, out, ...rest] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--disable-web-security', '--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
try {
  if (mode === 'stills') {
    fs.mkdirSync(out, { recursive: true });
    const page = await openPage(browser);
    for (const t of rest.map(Number)) {
      const f = Math.round(t * 30);
      const t0 = Date.now();
      const data = await grab(page, f);
      fs.writeFileSync(path.join(out, `t${t.toFixed(2).padStart(6, '0')}.png`), Buffer.from(data.split(',')[1], 'base64'));
      console.log(`t=${t}s frame ${f} (${Date.now() - t0} ms)`);
    }
  } else if (mode === 'video') {
    const page0 = await openPage(browser);
    const total = await page0.evaluate(() => window.PP.totalFrames);
    const from = Number(rest[0] ?? 0), to = Math.min(total, Number(rest[1] ?? total));
    const workers = Number(process.env.WORKERS || 3);
    const per = Math.ceil((to - from) / workers);
    const tmp = out.replace(/\.mp4$/, '');
    const pages = [page0, ...(await Promise.all(Array.from({ length: workers - 1 }, () => openPage(browser))))];
    const t0 = Date.now();
    let done = 0;
    await Promise.all(pages.map(async (page, w) => {
      const a = from + w * per, b = Math.min(to, a + per);
      if (a >= b) return;
      const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-tune', 'film', `${tmp}.part${w}.mp4`], { stdio: ['pipe', 'inherit', 'inherit'] });
      for (let f = a; f < b; f++) {
        const data = await grab(page, f);
        if (!ff.stdin.write(Buffer.from(data.split(',')[1], 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
        if (++done % 60 === 0) console.log(`${done}/${to - from} frames, ${((Date.now() - t0) / done).toFixed(0)} ms/frame`);
      }
      ff.stdin.end();
      await new Promise((r) => ff.on('close', r));
    }));
    const list = pages.map((_, w) => `${tmp}.part${w}.mp4`).filter((p) => fs.existsSync(p));
    fs.writeFileSync(`${tmp}.list.txt`, list.map((p) => `file '${path.resolve(p)}'`).join('\n'));
    await new Promise((r) => spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', `${tmp}.list.txt`, '-c', 'copy', out], { stdio: 'inherit' }).on('close', r));
    for (const p of list) fs.unlinkSync(p);
    fs.unlinkSync(`${tmp}.list.txt`);
    console.log(`video: ${out} (${to - from} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
} finally {
  await browser.close();
  server.close();
}
