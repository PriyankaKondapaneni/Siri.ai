// The mix: voice stems processed (Mira close and warm, Kabir's voice notes through a phone, Kabir live), the score
// ducked under the voice, effects and beds, mastered to -14 LUFS with peaks under -1.5 dBTP (two-pass loudnorm).
//   node audio/mix.mjs 01   ->  build/ep01/mix.wav
import { execFileSync, spawnSync } from 'node:child_process';
const stderrOf = (args) => { const r = spawnSync('ffmpeg', args, { encoding: 'utf8', maxBuffer: 1 << 26 }); if (r.status !== 0) throw new Error(r.stderr.slice(-2000)); return r.stderr; };
const ep = process.argv[2] || '01', d = `build/ep${ep}`;
const graph = (ln) => [
  // Mira out loud: present, in the room with Kabir (its reflections)
  `[0:a]aresample=48000,highpass=f=85,equalizer=f=220:t=q:w=1:g=-1.5,equalizer=f=3600:t=q:w=1.2:g=2.5,deesser=i=0.4,acompressor=threshold=-22dB:ratio=3:attack=6:release=90:makeup=3dB,aecho=0.8:0.6:28|55|90:0.2|0.13|0.08[mira]`,
  // Mira's inner voice: her normal narration, but dry, close and warm, with no room around it: a thought, not a sound in the scene
  `[1:a]aresample=48000,highpass=f=80,equalizer=f=180:t=q:w=1:g=2,equalizer=f=3000:t=q:w=1:g=1,deesser=i=0.4,acompressor=threshold=-24dB:ratio=2.5:attack=8:release=120:makeup=3dB,pan=stereo|c0=c0|c1=c0,aecho=1:1:7:0.25[thoughtw]`,
  `[thoughtw]extrastereo=m=1.3[thought]`,
  `[2:a]aresample=48000,highpass=f=90,equalizer=f=3000:t=q:w=1:g=1.5,acompressor=threshold=-22dB:ratio=3:attack=6:release=90:makeup=3dB,aecho=0.8:0.6:28|55|90:0.2|0.13|0.08[live]`,
  `[3:a]aresample=48000,highpass=f=320,lowpass=f=3700,equalizer=f=1700:t=q:w=1:g=5,asoftclip=type=tanh:threshold=0.7,acompressor=threshold=-24dB:ratio=5:attack=3:release=60:makeup=5dB,aecho=0.7:0.4:9:0.18[note]`,
  `[mira][live][note]amix=inputs=3:normalize=0,pan=stereo|c0=c0|c1=c0[centre]`,
  `[centre][thought]amix=inputs=2:normalize=0,asplit=2[voice][key]`,
  `[4:a]volume=-9dB[mus]`,
  `[mus][key]sidechaincompress=threshold=0.025:ratio=6:attack=25:release=350:makeup=1[musd]`,
  `[5:a]volume=-3dB[fx]`,
  `[voice][musd][fx]amix=inputs=3:normalize=0,alimiter=limit=0.89:attack=1:release=60${ln ? ',' + ln + ',alimiter=limit=0.79:attack=1:release=50:level=false' : ''}[out]`,
].join(';');
const inputs = ['mira', 'thought', 'live', 'note', 'music', 'sfx'].flatMap((s) => ['-i', `${d}/${s}.wav`]);
// pass 1: measure
const m = stderrOf(['-hide_banner', '-nostats', ...inputs, '-filter_complex', graph('loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json'), '-map', '[out]', '-f', 'null', '-']);
const j = JSON.parse(m.slice(m.lastIndexOf('{'), m.lastIndexOf('}') + 1));
const ln = `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
execFileSync('ffmpeg', ['-hide_banner', '-v', 'error', '-y', ...inputs, '-filter_complex', graph(ln), '-map', '[out]', '-ar', '48000', '-c:a', 'pcm_s24le', `${d}/mix.wav`]);
const r = stderrOf(['-hide_banner', '-nostats', '-i', `${d}/mix.wav`, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
const s = r.slice(r.lastIndexOf('Summary:'));
console.log(`mix: ${s.match(/I:\s+(-?[\d.]+) LUFS/)[1]} LUFS integrated, true peak ${s.match(/Peak:\s+(-?[\d.]+) dBFS/)[1]} dBTP`);
