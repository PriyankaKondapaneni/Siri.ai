// The loudness envelope of each voice stem at 30 fps, for the on-screen voice-note waveform.
//   node audio/envelope.mjs 01  ->  episodes/01/envelope.js
import fs from 'node:fs';
import { readWav } from '../wav.mjs';
const ep = process.argv[2] || '01';
const out = {};
for (const stem of ['note', 'live', 'mira']) {
  const { rate, channels } = readWav(`build/ep${ep}/${stem}.wav`);
  const x = channels[0], hop = rate / 30, env = [];
  for (let f = 0; f * hop < x.length; f++) { let s = 0; const a = Math.floor(f * hop), b = Math.min(x.length, Math.floor((f + 1) * hop)); for (let i = a; i < b; i++) s += x[i] * x[i]; env.push(+Math.sqrt(s / Math.max(1, b - a)).toFixed(4)); }
  const peak = Math.max(...env);
  out[stem] = env.map((v) => +(v / peak).toFixed(3));
}
fs.writeFileSync(`episodes/${ep}/envelope.js`, `window.ENVELOPE = ${JSON.stringify(out)};\n`);
console.log('envelope frames', out.note.length);
