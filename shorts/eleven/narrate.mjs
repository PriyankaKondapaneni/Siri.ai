// Per-line narration: every line gets N takes from Fish Audio (drama-3), each transcribed with word timestamps;
// the best take per line is the one heard exactly, closest to the median length. Takes on disk are reused.
//   NODE_USE_ENV_PROXY=1 node eleven/narrate.mjs 01 [last=3] [first=1] [speed=1]
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tts, asr, credit } from '../lib-fish.mjs';

const ep = process.argv[2], N = Number(process.argv[3] || 3);
const FIRST = Number(process.argv[4] || 1), SPEED = Number(process.argv[5] || 1); // takes FIRST..N at this prosody speed
const ONLY = FIRST > 1; // when adding faster takes, pick among those only
const dir = `eleven/episodes/${ep}`;
const S = JSON.parse(fs.readFileSync(`${dir}/script.json`, 'utf8'));
const norm = (s) => s.toLowerCase().replace(/\[[^\]]*\]/g, ' ').replace(/11:11/g, 'eleven eleven').replace(/\b8:02\b/g, 'eight oh two').replace(/\b6:40\b/g, 'six forty').replace(/eight-oh-two/g, 'eight oh two').replace(/six-forty/g, 'six forty').replace(/\b5th\b/g, 'fifth').replace(/[^a-z\s']/g, ' ').split(/\s+/).filter(Boolean);
function wer(r, h) {
  const d = Array.from({ length: r.length + 1 }, (_, i) => [i, ...Array(h.length).fill(0)]);
  for (let j = 1; j <= h.length; j++) d[0][j] = j;
  for (let i = 1; i <= r.length; i++) for (let j = 1; j <= h.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (r[i - 1] === h[j - 1] ? 0 : 1));
  return d[r.length][h.length] / r.length;
}
const dur = (p) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]).toString());
fs.mkdirSync(`${dir}/takes`, { recursive: true });
const before = await credit();
const pick = {};
for (const l of S.lines) {
  if (l.take) continue; // reuses another line's take (the cold-open hook): nothing to record
  const takes = [];
  for (let k = ONLY ? FIRST : 1; k <= N; k++) {
    const wav = `${dir}/takes/${l.id}.${k}.wav`, aj = `${dir}/takes/${l.id}.${k}.asr.json`;
    if (!fs.existsSync(wav)) fs.writeFileSync(wav, await tts(l.text, { model: S.model, voice: S.voices[l.who], temperature: [0.7, 0.78, 0.64, 0.7, 0.78, 0.64][k - 1], speed: SPEED }));
    // a transcript older than its take belongs to an earlier recording (the transcripts are committed, the takes are not)
    if (!fs.existsSync(aj) || fs.statSync(aj).mtimeMs < fs.statSync(wav).mtimeMs) fs.writeFileSync(aj, JSON.stringify(await asr(wav), null, 1));
    const r = JSON.parse(fs.readFileSync(aj, 'utf8'));
    takes.push({ k, w: wer(norm(l.text), norm(r.text)), d: dur(wav), text: r.text.trim() });
  }
  const med = [...takes].sort((a, b) => a.d - b.d)[Math.floor(takes.length / 2)].d;
  const best = [...takes].sort((a, b) => a.w - b.w || Math.abs(a.d - med) - Math.abs(b.d - med))[0];
  pick[l.id] = best.k;
  console.log(`${l.id.padEnd(3)} ${l.who.padEnd(5)} takes ${takes.map((t) => `${t.k}:${t.d.toFixed(2)}s/${(t.w * 100).toFixed(0)}%`).join('  ')}  -> take ${best.k}${best.w > 0 ? `  (heard: ${best.text})` : ''}`);
}
// keep the pick of a take borrowed from another episode (a hook can reuse an earlier episode's line)
const prev = fs.existsSync(`${dir}/picks.json`) ? JSON.parse(fs.readFileSync(`${dir}/picks.json`, 'utf8')) : {};
for (const l of S.lines) if (l.take && pick[l.take] == null && prev[l.take] != null) pick[l.take] = prev[l.take];
fs.writeFileSync(`${dir}/picks.json`, JSON.stringify(pick, null, 1));
console.log(`spent $${(before - (await credit())).toFixed(4)} this run`);
