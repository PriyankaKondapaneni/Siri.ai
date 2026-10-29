// Narration: generate N full takes of an episode's script with Fish Audio (drama-3), transcribe each with word
// timestamps, and report accuracy and pacing so the best take can be picked.
//   NODE_USE_ENV_PROXY=1 node paper-planes/tools/narrate.mjs 01 [last=3] [first=1] [speed=1]
// Writes paper-planes/episodes/<ep>/takes/take<k>.wav and take<k>.asr.json. Takes already on disk are kept
// (no second charge), so re-running only fills in what's missing.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tts, asr, credit } from '../../lib-fish.mjs';

const ep = process.argv[2];
const n = Number(process.argv[3] || 3);
const first = Number(process.argv[4] || 1); // take numbers first..n
const speed = Number(process.argv[5] || 1); // Fish prosody speed for these takes
const dir = `paper-planes/episodes/${ep}`;
const S = JSON.parse(fs.readFileSync(`${dir}/script.json`, 'utf8'));
const text = S.lines.map((l) => l.text).join(' ');
const spoken = text.replace(/\[[^\]]*\]/g, ' ').replace(/<[^>]+>/g, '');
const norm = (s) => s.toLowerCase().replace(/forty-seven|47/g, 'forty seven').replace(/\b2\b/g, 'two').replace(/a\.m\./g, 'am').replace(/[^a-z\s']/g, ' ').split(/\s+/).filter(Boolean);
const REF = norm(spoken);
function wer(ref, hyp) {
  const d = Array.from({ length: ref.length + 1 }, (_, i) => [i, ...Array(hyp.length).fill(0)]);
  for (let j = 1; j <= hyp.length; j++) d[0][j] = j;
  for (let i = 1; i <= ref.length; i++) for (let j = 1; j <= hyp.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (ref[i - 1] === hyp[j - 1] ? 0 : 1));
  return d[ref.length][hyp.length] / ref.length;
}
fs.mkdirSync(`${dir}/takes`, { recursive: true });
console.log(`${Buffer.byteLength(text)} bytes, ${REF.length} words`);
const before = await credit();
for (let k = first; k <= n; k++) {
  const wav = `${dir}/takes/take${k}.wav`;
  if (!fs.existsSync(wav)) fs.writeFileSync(wav, await tts(text, { model: S.model, voice: S.voice, temperature: [0.7, 0.75, 0.65, 0.7, 0.75, 0.65][k - 1] ?? 0.7, speed }));
  const aj = `${dir}/takes/take${k}.asr.json`;
  if (!fs.existsSync(aj)) fs.writeFileSync(aj, JSON.stringify(await asr(wav), null, 1));
  const r = JSON.parse(fs.readFileSync(aj, 'utf8'));
  const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav]).toString());
  const segs = r.segments;
  const gaps = segs.slice(1).map((s, i) => [s.start - segs[i].end, segs[i].text, s.text]).sort((a, b) => b[0] - a[0]);
  console.log(`take${k}: ${dur.toFixed(2)} s, WER ${(wer(REF, norm(r.text)) * 100).toFixed(1)}%, ${segs.length} words, longest pauses ${gaps.slice(0, 4).map((g) => `${g[0].toFixed(2)}s (${g[1]}|${g[2]})`).join(', ')}`);
  if (wer(REF, norm(r.text)) > 0) console.log(`   heard: ${r.text}`);
}
console.log(`spent $${(before - (await credit())).toFixed(4)} this run`);
