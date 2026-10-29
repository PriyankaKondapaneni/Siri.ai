// The score for 11:11, Episode 1: an original thriller-romance cue in A minor, composed against the cue sheet.
// The "11:11" motif is four repeated celesta notes; it opens the episode, returns at the last message and ends it.
//   node audio/score.mjs 01   ->  build/ep01/music.wav
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { RATE, stereo, put, putStereo, piano, bell, pad, pluck, noise, osc, svf, biquad, mul, adsr, expDecay, reverb, midi, db, writeWav, sat } from './dsp.mjs';

const ep = process.argv[2] || '01';
const T = JSON.parse(fs.readFileSync(`episodes/${ep}/timing.json`, 'utf8'));
const C = createRequire(import.meta.url)(fs.existsSync(`episodes/${ep}/cues.js`) ? `../episodes/${ep}/cues.js` : '../src/cues.js')(T);
const sec = Object.fromEntries(C.music.map((m, i) => [m.kind, { at: m.at, to: C.music[i + 1]?.at ?? C.total }]));
const bus = stereo(C.total + 3);
const dry = stereo(C.total + 3); // things that should stay close (sub, hits)

const N = (n) => midi(n);
const chordPad = (notes, t, dur, vel, o = {}) => notes.forEach((n, i) => put(bus, pad(N(n), dur, vel, o), t, 1, (i - (notes.length - 1) / 2) * 0.35));
const chordPiano = (notes, t, dur, vel, spread = 0.03) => notes.forEach((n, i) => put(bus, piano(N(n), dur, vel * (i === notes.length - 1 ? 1 : 0.8), i + 1), t + i * spread, 0.9, (i - 1) * 0.2));
const motif = (t, n = 'E5', vel = 0.32, gap = 0.24) => { for (let k = 0; k < 4; k++) put(bus, bell(N(n), 0.3, vel * (k === 3 ? 1.15 : 1)), t + k * gap, 0.9, 0.25); };
const sub = (n, t, dur, vel) => { const y = osc(Math.ceil((dur + 1) * RATE), 440 * Math.pow(2, (N(n) - 69) / 12), 'sine'); mul(y, adsr(y.length, 0.6, 0.2, 1, 1, dur)); put(dry, mul(y, vel * 0.5), t); };

// ---- mystery: a dark Am(add9) pad, a low A, the 11:11 motif on her word
if (sec.mystery) {
  const { at, to } = sec.mystery;
  chordPad(['A2', 'E3', 'B3', 'C4'], at, to - at + 0.3, 0.16, { cutoff: 700, attack: 1.6 });
  sub('A1', at, to - at, 0.22);
  if (C.clock1111 != null) motif(C.clock1111 - 0.02);
  [['E5', 1.3], ['D5', 1.65], ['C5', 2.0], ['B4', 2.35]].forEach(([n, dt]) => put(bus, bell(N(n), 0.4, 0.16, 2.0, 1.4), at + dt, 1, -0.3));
  put(bus, piano(N('A3'), 2.5, 0.35, 9), at + 3.5, 0.8, -0.2);
}
// ---- pulse: under the voice notes; a soft eighth-note pulse and slow chord changes
if (sec.pulse) {
  const { at, to } = sec.pulse;
  const prog = [['A2', 'E3', 'C4'], ['F2', 'C3', 'A3'], ['C3', 'G3', 'E4'], ['G2', 'D3', 'B3'], ['A2', 'E3', 'C4']];
  const step = (to - at) / prog.length;
  prog.forEach((ch, i) => {
    chordPad(ch, at + i * step, step + 0.2, 0.12, { cutoff: 1000, attack: 0.6, release: 0.9 });
    put(bus, bell(N(ch[2]) + 12, 0.4, 0.12, 2, 1.2), at + i * step + 0.05, 1, 0.4);
  });
  for (let t = at; t < to - 0.1; t += 0.36) put(bus, biquad(pluck(N(prog[Math.min(prog.length - 1, Math.floor((t - at) / step))][0]), 0.2, 0.22, 0.2, Math.round(t * 10)), 'lp', 2200, 0.7), t, 0.8, -0.15);
  sub('A1', at, to - at, 0.14);
}
// ---- train: a string ostinato in D minor, tightening
if (sec.train) {
  const { at, to } = sec.train;
  chordPad(['D3', 'A3', 'F4'], at, to - at + 0.2, 0.12, { cutoff: 1300, attack: 0.4, wave: 'saw' });
  const pat = ['D3', 'A3', 'D3', 'F3', 'D3', 'A3', 'E3', 'A3'];
  let k = 0;
  for (let t = at; t < to - 0.05; t += 0.3, k++) {
    const x = pad(N(pat[k % pat.length]), 0.16, 0.2, { attack: 0.01, release: 0.12, cutoff: 2400, detune: [-0.06, 0, 0.07] });
    put(bus, x, t, 0.9, k % 2 ? 0.3 : -0.3);
  }
  sub('D2', at, to - at, 0.12);
}
// ---- build: the ostinato doubles and climbs; a riser into the street
if (sec.build) {
  const { at, to } = sec.build;
  chordPad(['E3', 'B3', 'G#4'], at, to - at + 0.2, 0.12, { cutoff: 1500, attack: 0.3 });
  const pat = ['E3', 'B3', 'E3', 'G#3'];
  let k = 0;
  for (let t = at; t < to - 0.05; t += 0.15, k++) {
    const lift = Math.floor((t - at) / ((to - at) / 3));
    const x = pad(N(pat[k % 4]) + lift * 2, 0.09, 0.2 + lift * 0.04, { attack: 0.005, release: 0.06, cutoff: 2800, detune: [-0.05, 0.05] });
    put(bus, x, t, 0.9, k % 2 ? 0.35 : -0.35);
  }
  const n = Math.ceil((to - at) * RATE), r = noise(n, 41, 'pink');
  svf(r, 'bp', (i) => 300 + 5000 * Math.pow(i / n, 2), 0.6);
  mul(r, adsr(n, (to - at) * 0.9, 0.01, 1, 0.1));
  put(bus, mul(r, 0.5), at, 1, 0);
  sub('E1', at, to - at, 0.16);
}
// ---- action: a hit on the street, tremolo strings rising to the near-miss
if (sec.action) {
  const { at, to } = sec.action;
  const n = Math.ceil((to - at) * RATE);
  for (const [nt, pan] of [['A3', -0.4], ['E4', 0], ['A4', 0.4], ['C5', 0.2]]) {
    const x = pad(N(nt), to - at, 0.34, { attack: 0.05, release: 0.05, cutoff: 3400, detune: [-0.08, 0, 0.08] });
    for (let i = 0; i < x.length; i++) x[i] *= 0.6 + 0.4 * Math.sin((2 * Math.PI * 12 * i) / RATE) * (i / n);
    put(bus, x, at, 1, pan);
  }
  sub('A1', at, to - at, 0.2);
}
// ---- romance: warm piano, a soft pad, a celesta melody; time slows
if (sec.romance) {
  const { at, to } = sec.romance;
  const prog = [['C3', 'G3', 'E4'], ['B2', 'G3', 'D4'], ['A2', 'E3', 'C4'], ['F2', 'C3', 'A3'], ['C3', 'G3', 'E4']];
  const step = (to - at) / prog.length;
  prog.forEach((ch, i) => {
    chordPiano(ch, at + i * step, step, 0.34);
    chordPad(ch.map((x) => x.replace(/\d/, (d) => String(Number(d) + 1))), at + i * step, step + 0.3, 0.07, { cutoff: 1600, attack: 1.0 });
  });
  [['E5', 0.3], ['G5', 1.2], ['D5', 2.3], ['C5', 3.4], ['E5', 4.6], ['A4', 5.7], ['C5', 6.8], ['G4', 8.0], ['E5', 9.3]].forEach(([n, dt]) => { if (at + dt < to - 0.3) put(bus, bell(N(n), 0.6, 0.15, 2.0, 1.0), at + dt, 1, 0.3); });
}
// ---- ache: single descending piano notes
if (sec.ache) {
  const { at, to } = sec.ache;
  [['A4', 0], ['G4', 0.8], ['E4', 1.6]].forEach(([n, dt], i) => put(bus, piano(N(n), 1.4, 0.4, 20 + i), at + dt, 0.9, 0.1));
  chordPad(['A2', 'E3'], at, to - at + 0.4, 0.09, { cutoff: 600, attack: 0.8 });
}
// ---- drone: night again; the motif, distant
if (sec.drone) {
  const { at, to } = sec.drone;
  chordPad(['A1', 'E2', 'A2'], at, to - at + 0.4, 0.12, { cutoff: 500, attack: 0.8 });
  motif(at + 0.6, 'E5', 0.16, 0.3);
}
// ---- heartbreak: strings swell, Am - F - Dm - E, a falling piano line on top
if (sec.heartbreak) {
  const { at, to } = sec.heartbreak;
  const prog = [['A2', 'E3', 'C4', 'A4'], ['F2', 'C3', 'A3', 'F4'], ['D3', 'A3', 'F4', 'D5'], ['E3', 'B3', 'G#4', 'E5']];
  const step = (to - at) / prog.length;
  prog.forEach((ch, i) => {
    const swell = 0.08 + i * 0.025;
    ch.forEach((nt, j) => {
      const x = pad(N(nt), step + 0.15, swell, { attack: 0.5, release: 0.2, cutoff: 1400 + i * 500, detune: [-0.09, -0.02, 0.04, 0.1] });
      for (let s = 0; s < x.length; s++) x[s] *= 1 + 0.03 * Math.sin((2 * Math.PI * 5.2 * s) / RATE);
      put(bus, x, at + i * step, 1, (j - 1.5) * 0.3);
    });
    put(bus, piano(N(['C5', 'A4', 'F4', 'G#4'][i]), step, 0.46, 30 + i), at + i * step + 0.1, 0.9, 0.15);
  });
  sub('A1', at, (to - at) / 2, 0.14);
  sub('E1', at + (to - at) / 2, (to - at) / 2, 0.16);
}
// ---- the cut, then the sting: four ticks of the motif and a low ending
const cutAt = sec.cut ? sec.cut.at : C.total + 10;
if (sec.cut) for (const b of [bus, dry]) for (const ch of b) { const i0 = Math.round(cutAt * RATE), f = Math.round(0.05 * RATE); for (let i = i0; i < ch.length; i++) ch[i] *= i < i0 + f ? 1 - (i - i0) / f : 0; }
if (sec.sting) {
  const at = sec.sting.at;
  motif(at, 'E5', 0.3, 0.2);
  put(bus, bell(N('A5'), 1.5, 0.22, 2.0, 1.2), at + 0.95, 1, 0);
  put(bus, piano(N('A2'), 1.4, 0.5, 40), at + 0.95, 1, 0);
  sub('A1', at + 0.95, 0.8, 0.24);
}

for (const ch of bus) biquad(biquad(ch, 'hp', 80, 0.7), 'hp', 80, 0.7);
reverb(bus, { room: 0.86, damp: 0.35, wet: 0.32, width: 1 });
for (const ch of bus) biquad(ch, 'hp', 70, 0.7);
for (let c = 0; c < 2; c++) for (let i = 0; i < bus[c].length; i++) bus[c][i] += dry[c][i];
// section levels: the romance sits a little lower so the voice floats over it; the action pushes forward
const LEVEL = { romance: -3.5, action: 2, build: 1 };
for (const [kind, gdb] of Object.entries(LEVEL)) {
  if (!sec[kind]) continue;
  const { at, to } = sec[kind], g = db(gdb), f = Math.round(0.25 * RATE);
  for (const ch of bus) for (let i = Math.round(at * RATE) - f; i < Math.round(to * RATE) + f; i++) {
    if (i < 0 || i >= ch.length) continue;
    const k = Math.min(1, (i - (Math.round(at * RATE) - f)) / f, (Math.round(to * RATE) + f - i) / f);
    ch[i] *= 1 + (g - 1) * Math.max(0, k);
  }
}
// a gentle glue: high-pass the rumble, a touch of saturation
for (const ch of bus) { biquad(ch, 'hp', 32, 0.7); sat(ch, 1.2); }
fs.mkdirSync(`build/ep${ep}`, { recursive: true });
writeWav(`build/ep${ep}/music.wav`, bus, fs);
console.log(`music: ${(bus[0].length / RATE).toFixed(1)} s`);
