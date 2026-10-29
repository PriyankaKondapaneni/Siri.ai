// Measure audition takes: length, speaking rate, pauses, pitch range, and transcription accuracy (transcribe-1-pro).
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { asr, credit } from '../../lib-fish.mjs';

const REF = 'she sent him forty seven paper planes before she ever heard his voice mira never did hear his voice she learned it instead'.split(' ');
const norm = (s) => s.toLowerCase().replace(/forty-seven|47/g, 'forty seven').replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
function wer(ref, hyp) {
  const d = Array.from({ length: ref.length + 1 }, (_, i) => [i, ...Array(hyp.length).fill(0)]);
  for (let j = 1; j <= hyp.length; j++) d[0][j] = j;
  for (let i = 1; i <= ref.length; i++) for (let j = 1; j <= hyp.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (ref[i - 1] === hyp[j - 1] ? 0 : 1));
  return d[ref.length][hyp.length] / ref.length;
}
const before = await credit();
for (const f of fs.readdirSync('paper-planes/build/audition').filter((f) => f.endsWith('.wav'))) {
  const p = `paper-planes/build/audition/${f}`;
  const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]).toString());
  const r = await asr(p);
  const hyp = norm(r.text);
  const segs = r.segments || [];
  const gaps = segs.slice(1).map((s, i) => s.start - segs[i].end);
  const speech = segs.length ? segs[segs.length - 1].end - segs[0].start : 0;
  console.log(f.padEnd(11), `len ${dur.toFixed(2)}s`, `| lead ${segs[0]?.start?.toFixed(2)}s tail ${(dur - (segs.at(-1)?.end || 0)).toFixed(2)}s`, `| ${(segs.length / speech * 60).toFixed(0)} wpm`, `| longest pause ${Math.max(...gaps).toFixed(2)}s`, `| WER ${(wer(REF, hyp) * 100).toFixed(0)}%`, `| "${r.text.trim()}"`);
}
console.log(`ASR spent $${(before - (await credit())).toFixed(4)}`);
