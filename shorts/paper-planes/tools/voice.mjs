// Tighten the chosen take's pauses to short-form pace and map every word onto its script line.
//   node paper-planes/tools/voice.mjs 01 5
// Writes paper-planes/build/ep01/voice.wav and paper-planes/episodes/01/timing.json:
//   { duration, words: [{ w, s, e, line }], lines: [{ id, s, e, text }] }  (seconds, after tightening)
import fs from 'node:fs';
import { readWav, writeWav } from './wav.mjs';

const [ep, take] = process.argv.slice(2);
const dir = `paper-planes/episodes/${ep}`;
const S = JSON.parse(fs.readFileSync(`${dir}/script.json`, 'utf8'));
const asr = JSON.parse(fs.readFileSync(`${dir}/takes/take${take}.asr.json`, 'utf8'));
const { rate, channels } = readWav(`${dir}/takes/take${take}.wav`);
const x = channels[0];

// ---- the script's words, each tagged with its line, aligned to the transcript's words
const tok = (s) => s.toLowerCase().replace(/forty-seven/g, 'fortyseven').replace(/twenty-two/g, 'twentytwo').replace(/a\.m\./g, 'am').replace(/[^a-z0-9'\s]/g, ' ').split(/\s+/).filter(Boolean);
const hearTok = (s) => s.toLowerCase().replace(/^47$/, 'fortyseven').replace(/^22$/, 'twentytwo').replace(/^2$/, 'two').replace(/a\.m\.?/, 'am').replace(/[^a-z0-9']/g, '');
const ref = [];
for (const l of S.lines) {
  const shown = l.text.replace(/\[[^\]]*\]/g, ' ').replace(/<[^>]+>/g, '');
  const raw = shown.split(/\s+/).filter((w) => tok(w).length);
  for (const w of raw) ref.push({ t: tok(w).join(''), shown: w.replace(/^[^\w'"]+|[^\w'"!?.,…]+$/g, ''), line: l.id });
}
const hyp = asr.segments.map((s) => ({ t: hearTok(s.text), s: s.start, e: s.end }));
// edit-distance alignment
const n = ref.length, m = hyp.length;
const D = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
for (let i = 0; i <= n; i++) D[i][0] = i;
for (let j = 0; j <= m; j++) D[0][j] = j;
for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (ref[i - 1].t === hyp[j - 1].t ? 0 : 1));
const map = new Array(n).fill(null);
for (let i = n, j = m; i > 0 && j > 0; ) {
  if (D[i][j] === D[i - 1][j - 1] + (ref[i - 1].t === hyp[j - 1].t ? 0 : 1)) { map[i - 1] = j - 1; i--; j--; }
  else if (D[i][j] === D[i - 1][j] + 1) i--;
  else j--;
}
const words = ref.map((r, i) => ({ w: r.shown, line: r.line, s: map[i] != null ? hyp[map[i]].s : null, e: map[i] != null ? hyp[map[i]].e : null }));
for (let i = 0; i < words.length; i++) if (words[i].s == null) { // unmatched: sit between neighbours
  const p = words[i - 1], q = words.slice(i + 1).find((w) => w.s != null);
  words[i].s = p ? p.e : 0; words[i].e = q ? q.s : words[i].s + 0.3;
}
const unmatched = map.filter((v) => v == null).length;

// ---- tighten: every pause longer than its cap is cut from its middle, with 6 ms fades either side of the join
const CAP = 0.40, DRAMA = 0.75; // a few pauses are part of the performance and keep more air
const dramatic = new Set(['her', 'badly', 'up']); // "...drawn her. [beat] Badly." and "...picked it up. [pause] And it wasn't him."
const cuts = [];
for (let i = 0; i < words.length - 1; i++) {
  const a = words[i], b = words[i + 1];
  const g = b.s - a.e, cap = dramatic.has(a.w.toLowerCase().replace(/[^a-z]/g, '')) ? DRAMA : CAP;
  if (g > cap) { const mid = (a.e + b.s) / 2, rm = g - cap; cuts.push([mid - rm / 2, mid + rm / 2]); }
}
const pieces = []; let last = 0;
for (const [s, e] of cuts) { pieces.push([last, s]); last = e; }
pieces.push([last, x.length / rate]);
const fade = Math.round(0.006 * rate);
const outLen = pieces.reduce((a, [s, e]) => a + Math.round(e * rate) - Math.round(s * rate), 0);
const y = new Float32Array(outLen); let o = 0;
pieces.forEach(([s, e], k) => {
  const a = Math.round(s * rate), b = Math.round(e * rate);
  for (let i = a; i < b; i++) {
    let g = 1;
    if (k > 0 && i - a < fade) g = (i - a) / fade;
    if (k < pieces.length - 1 && b - i < fade) g = Math.min(g, (b - i) / fade);
    y[o++] = x[i] * g;
  }
});
const shift = (t) => t - cuts.reduce((acc, [s, e]) => acc + (t > s ? Math.min(e, t) - s : 0), 0);
const out = words.map((w) => ({ ...w, s: +shift(w.s).toFixed(3), e: +shift(w.e).toFixed(3) }));
const lines = S.lines.map((l) => { const ws = out.filter((w) => w.line === l.id); return { id: l.id, s: ws[0].s, e: ws.at(-1).e, text: ws.map((w) => w.w).join(' ') }; });
fs.mkdirSync(`paper-planes/build/ep${ep}`, { recursive: true });
writeWav(`paper-planes/build/ep${ep}/voice.wav`, rate, [y]);
fs.writeFileSync(`${dir}/timing.json`, JSON.stringify({ take: Number(take), rate, duration: +(y.length / rate).toFixed(3), words: out, lines }, null, 1));
console.log(`take ${take}: ${(x.length / rate).toFixed(2)} s -> ${(y.length / rate).toFixed(2)} s, ${cuts.length} pauses cut, ${unmatched} script words unmatched`);
for (const l of lines) console.log(`  ${l.s.toFixed(2).padStart(6)} - ${l.e.toFixed(2).padStart(6)}  ${l.id.padEnd(9)} ${l.text}`);
// the browser reads the timing as a script (pages loaded from disk can't fetch JSON)
fs.writeFileSync(`${dir}/timing.js`, `window.TIMING = ${fs.readFileSync(`${dir}/timing.json`, 'utf8')};\n`);
