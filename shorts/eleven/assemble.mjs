// Assemble the voice track from the picked takes: trim each clip to its words, tighten its pauses, and lay the
// lines on the episode's rhythm (a phone buzz before every voice note). Writes three stems (Mira, Kabir live,
// Kabir's voice notes, which the mix sends through a phone) and timing.json / timing.js for picture and captions.
//   node eleven/assemble.mjs 01
import fs from 'node:fs';
import { readWav, writeWav } from './wav.mjs';

const ep = process.argv[2];
const dir = `eleven/episodes/${ep}`;
const S = JSON.parse(fs.readFileSync(`${dir}/script.json`, 'utf8'));
const picks = JSON.parse(fs.readFileSync(`${dir}/picks.json`, 'utf8'));
const RATE = 44100;
// the delivery tempo: every take is time-stretched (pitch kept) by this factor before assembly
const TEMPO = Number(process.env.TEMPO || 1.08);
import { execFileSync } from 'node:child_process';
function stretched(src) {
  if (TEMPO === 1) return src;
  const out = src.replace(/\.wav$/, `.t${Math.round(TEMPO * 100)}.wav`);
  if (!fs.existsSync(out)) execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-af', `atempo=${TEMPO}`, '-ar', String(RATE), '-ac', '1', '-c:a', 'pcm_s16le', out]);
  return out;
}

// pauses inside a line longer than this are cut from the middle; a few lines keep more air on purpose
const CAP = { default: 0.26, n1: 0.42, n3: 0.36, n6: 0.36, k6: 0.5, k7: 0.55, k5: 0.4, n9: 0.36 };
// the gap before each line (seconds); voice notes get room for the buzz
const GAP = { default: 0.12, note: 0.42, after_note: 0.16, h0: 0.25, n1: 0.55, k4: 0.12, n6: 0.3, n7: 0.22, n9: 0.36, k7: 0.36, n8: 0.18 };

const out = { mira: [], live: [], note: [] };
const words = [], lines = [];
let t = GAP[S.lines[0].id] ?? GAP.default;
const total = [];
let prevKind = null;
S.lines.forEach((l, li) => {
  // a line can reuse part of another line's take (the cold-open hook): take = source line, from = first word index
  const src = l.take || l.id, k = picks[src];
  const { channels } = readWav(stretched(`${dir}/takes/${src}.${k}.wav`));
  const x = channels[0];
  const segs = JSON.parse(fs.readFileSync(`${dir}/takes/${src}.${k}.asr.json`, 'utf8')).segments.slice(l.from || 0).map((g) => ({ ...g, start: g.start / TEMPO, end: g.end / TEMPO }));
  // gap before this line
  if (li > 0) t += l.kind === 'note' ? GAP.note : GAP[l.id] ?? (prevKind === 'note' ? GAP.after_note : GAP.default);
  // the clip: from just before the first word to just after the last, pauses tightened
  const a = Math.max(0, segs[0].start - 0.07), z = Math.min(x.length / RATE, segs.at(-1).end + 0.16);
  const cap = CAP[l.id] ?? CAP.default;
  const cuts = [];
  for (let i = 1; i < segs.length; i++) {
    const g = segs[i].start - segs[i - 1].end;
    if (g > cap) { const m = (segs[i].start + segs[i - 1].end) / 2, rm = g - cap; cuts.push([m - rm / 2, m + rm / 2]); }
  }
  const shift = (s) => s - a - cuts.reduce((acc, [c0, c1]) => acc + (s > c0 ? Math.min(c1, s) - c0 : 0), 0);
  const pieces = []; let last = a;
  for (const [c0, c1] of cuts) { pieces.push([last, c0]); last = c1; }
  pieces.push([last, z]);
  const fade = Math.round(0.006 * RATE);
  const clip = [];
  pieces.forEach(([p0, p1], pi) => {
    const i0 = Math.round(p0 * RATE), i1 = Math.round(p1 * RATE);
    for (let i = i0; i < i1; i++) {
      let gn = 1;
      if (i - i0 < fade) gn = (i - i0) / fade;
      if (i1 - i < fade) gn = Math.min(gn, (i1 - i) / fade);
      if (pi === 0 && i - i0 < Math.round(0.02 * RATE)) gn = Math.min(gn, (i - i0) / Math.round(0.02 * RATE));
      clip.push(x[i] * gn);
    }
  });
  const stem = l.kind === 'note' ? 'note' : l.who === 'mira' ? 'mira' : 'live';
  total.push({ stem, at: t, clip });
  // display words: the script's own words (with punctuation and digits), timed by the transcript's words
  const shown = (l.show || l.text.replace(/\[[^\]]*\]/g, ' ')).replace(/\s+/g, ' ').trim().split(' ');
  const timed = segs.map((s) => ({ s: t + shift(s.start), e: t + shift(s.end) }));
  // spread display words over the timed words proportionally (they differ only where numbers are written as digits)
  shown.forEach((w, i) => {
    const j = Math.min(timed.length - 1, Math.floor((i / shown.length) * timed.length + 1e-6));
    const j2 = Math.min(timed.length - 1, Math.floor(((i + 1) / shown.length) * timed.length - 1e-6));
    words.push({ w, line: l.id, who: l.who, kind: l.kind, s: +timed[j].s.toFixed(3), e: +timed[Math.max(j, j2)].e.toFixed(3) });
  });
  const dur = clip.length / RATE;
  lines.push({ id: l.id, who: l.who, kind: l.kind, s: +t.toFixed(3), e: +(t + dur).toFixed(3), text: shown.join(' ') });
  t += dur;
  prevKind = l.kind;
});
const duration = t;
fs.mkdirSync(`eleven/build/ep${ep}`, { recursive: true });
for (const stem of ['mira', 'live', 'note']) {
  const y = new Float32Array(Math.ceil((duration + 0.5) * RATE));
  for (const c of total.filter((c) => c.stem === stem)) { const o = Math.round(c.at * RATE); c.clip.forEach((v, i) => (y[o + i] += v)); }
  writeWav(`eleven/build/ep${ep}/${stem}.wav`, RATE, [y]);
}
const T = { duration: +duration.toFixed(3), words, lines };
fs.writeFileSync(`${dir}/timing.json`, JSON.stringify(T, null, 1));
fs.writeFileSync(`${dir}/timing.js`, `window.TIMING = ${JSON.stringify(T)};\n`);
console.log(`voice track ${duration.toFixed(2)} s`);
for (const l of lines) console.log(`  ${l.s.toFixed(2).padStart(6)}-${l.e.toFixed(2).padStart(6)} ${l.id.padEnd(3)} ${l.kind.padEnd(4)} ${l.text}`);
