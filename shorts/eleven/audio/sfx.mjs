// Sound design for 11:11, Episode 1: every effect and ambience is synthesized here, then placed from the cue sheet.
//   node audio/sfx.mjs 01   ->  build/ep01/sfx.wav
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { RATE, stereo, buf, put, putStereo, noise, osc, svf, biquad, mul, adsr, expDecay, reverb, db, writeWav, sat, bell, rng } from './dsp.mjs';

const ep = process.argv[2] || '01';
const T = JSON.parse(fs.readFileSync(`episodes/${ep}/timing.json`, 'utf8'));
const C = createRequire(import.meta.url)(fs.existsSync(`episodes/${ep}/cues.js`) ? `../episodes/${ep}/cues.js` : '../src/cues.js')(T);
const n = (s) => Math.ceil(s * RATE);

// ---------------------------------------------------------------- clips (mono unless noted)
const clips = {
  rainStart: () => { const x = noise(n(3.5), 11, 'brown'); biquad(x, 'lp', 160, 0.7); mul(x, adsr(x.length, 1.2, 0.5, 0.7, 1.5)); return mul(x, 1.6); },
  clockFlip: () => { const x = noise(n(0.012), 12); biquad(x, 'hp', 2500); const b = mul(osc(n(0.07), 2093, 'sine'), adsr(n(0.07), 0.002, 0.02, 0.6, 0.04)); const o = buf(0.12); o.set(x); for (let i = 0; i < b.length; i++) o[i + n(0.02)] += b[i] * 0.4; return o; },
  buzz: () => {
    // two vibration pulses: a motor's hum with harmonics, and the phone rattling on the bed
    const o = buf(0.5);
    for (const t0 of [0, 0.24]) {
      const m = n(0.17), hum = osc(m, (i) => 168 + 6 * Math.sin(i / 300), 'square');
      biquad(hum, 'lp', 900, 0.8);
      const rat = noise(m, 13 + t0 * 10); biquad(rat, 'bp', 1400, 1.2);
      for (let i = 0; i < m; i++) rat[i] *= 0.5 + 0.5 * Math.sign(Math.sin((2 * Math.PI * 168 * i) / RATE));
      const env = adsr(m, 0.012, 0.02, 0.9, 0.03);
      for (let i = 0; i < m; i++) o[n(t0) + i] += (hum[i] * 0.6 + rat[i] * 0.35) * env[i];
    }
    return o;
  },
  blip: () => { const o = buf(0.3); const a = mul(osc(n(0.07), 1568), adsr(n(0.07), 0.003, 0.03, 0.5, 0.03)); const b = mul(osc(n(0.16), 2093), adsr(n(0.16), 0.003, 0.05, 0.4, 0.1)); for (let i = 0; i < a.length; i++) o[i] += a[i] * 0.5; for (let i = 0; i < b.length; i++) o[i + n(0.08)] += b[i] * 0.45; return o; },
  swipe: () => { const m = n(0.2), x = noise(m, 14); svf(x, 'bp', (i) => 1800 + 5000 * (i / m), 1.0); return mul(x, adsr(m, 0.04, 0.05, 0.6, 0.1)); },
  trash: () => { const m = n(0.32), x = buf(0.32), r = rng(15); for (let k = 0; k < 40; k++) { const p = Math.floor(r() * (m - 400)); for (let i = 0; i < 300; i++) x[p + i] += (r() * 2 - 1) * Math.exp(-i / 40) * 0.6; } biquad(x, 'hp', 1200); return x; },
  // a cookie snapped in half: one dry crack, then a few crumbs
  crunch: () => { const m = n(0.3), x = buf(0.3), r = rng(31); for (let k = 0; k < 16; k++) { const p = k === 0 ? 0 : Math.floor(n(0.02) + Math.pow(r(), 1.6) * (m - 900)), a = k === 0 ? 1 : 0.25 + r() * 0.3, d = k === 0 ? 90 : 25 + r() * 30; for (let i = 0; i < 700; i++) x[p + i] += (r() * 2 - 1) * a * Math.exp(-i / d); } biquad(x, 'bp', 2600, 0.6); return mul(x, 1.3); },
  cafeDoor: () => { const o = buf(2.2); const a = bell(88, 0.3, 0.3, 2.76, 1.2), b = bell(84, 0.3, 0.3, 2.76, 1.2); for (let i = 0; i < a.length && i < o.length; i++) o[i] += a[i]; for (let i = 0; i < b.length && i + n(0.12) < o.length; i++) o[i + n(0.12)] += b[i]; return o; },
  cupTip: () => { const m = n(0.6), x = buf(0.6); for (const [f, a, d] of [[2310, 0.4, 0.18], [3730, 0.25, 0.12], [5120, 0.15, 0.07]]) for (let i = 0; i < m; i++) x[i] += Math.sin((2 * Math.PI * f * i) / RATE) * a * Math.exp(-i / (d * RATE)); return x; },
  splash: () => {
    const m = n(0.9), x = noise(m, 16); biquad(x, 'lp', 3200); biquad(x, 'hp', 300);
    mul(x, mul(adsr(m, 0.005, 0.12, 0.35, 0.5), 1));
    const r = rng(17);
    for (let k = 0; k < 26; k++) { const p = Math.floor(r() * m * 0.8), f0 = 500 + r() * 900; for (let i = 0; i < n(0.05) && p + i < m; i++) x[p + i] += Math.sin((2 * Math.PI * (f0 + i * 2) * i) / RATE) * 0.25 * Math.exp(-i / 500); }
    return x;
  },
  trainIn: () => { const o = buf(1.8); const a = bell(76, 0.5, 0.35, 2, 0.8), b = bell(72, 0.6, 0.35, 2, 0.8); for (let i = 0; i < a.length && i < o.length; i++) o[i] += a[i]; for (let i = 0; i < b.length && i + n(0.45) < o.length; i++) o[i + n(0.45)] += b[i]; return o; },
  clothShift: () => { const m = n(0.45), x = noise(m, 18); biquad(x, 'bp', 2200, 0.7); const r = rng(19); for (let i = 0; i < m; i++) x[i] *= (0.4 + 0.6 * Math.abs(Math.sin(i / 900 + r() * 0.2))) * Math.sin((Math.PI * i) / m); return mul(x, 0.6); },
  heartbeat: () => {
    const o = buf(2.8);
    for (let k = 0; k < 3; k++) for (const [dt, f, a] of [[0, 62, 1], [0.27, 52, 0.75]]) {
      const t0 = n(k * 0.86 + dt), m = n(0.22);
      for (let i = 0; i < m; i++) o[t0 + i] += Math.sin((2 * Math.PI * f * i) / RATE * (1 - i / (m * 3))) * a * Math.exp(-i / (0.05 * RATE)) * (1 - k * 0.15);
    }
    return sat(o, 1.4);
  },
  tick: () => { const m = n(0.05), x = noise(m, 20); biquad(x, 'bp', 3200, 2.5); const y = osc(m, 1850); for (let i = 0; i < m; i++) x[i] = (x[i] * 0.7 + y[i] * 0.4) * Math.exp(-i / 220); return x; },
  tickFast: () => { const o = buf(5.2), tk = clips.tick(); let t = 0, k = 0; while (t < 4.9) { for (let i = 0; i < tk.length; i++) o[n(t) + i] += tk[i] * (k % 2 ? 0.7 : 1); const rate = 2 + 5 * (t / 4.9); t += 1 / rate; k++; } return o; },
  tickTock: () => { const o = buf(2.2), tk = clips.tick(); for (let k = 0; k < 4; k++) for (let i = 0; i < tk.length; i++) o[n(k * 0.5) + i] += tk[i] * (k % 2 ? 0.65 : 1); return o; },
  endTicks: () => { const o = buf(1.4), tk = clips.tick(); for (let k = 0; k < 4; k++) for (let i = 0; i < tk.length; i++) o[n(k * 0.2) + i] += tk[i]; return o; },
  pinDrop: () => { const o = buf(0.8); const a = bell(91, 0.2, 0.35, 3, 0.6); for (let i = 0; i < a.length && i < o.length; i++) o[i] += a[i]; const th = osc(n(0.12), (i) => 140 - i / 60, 'sine'); for (let i = 0; i < th.length; i++) o[n(0.03) + i] += th[i] * 0.4 * Math.exp(-i / 1500); return o; },
  riser: () => { const m = n(1.4), x = noise(m, 21); biquad(x, 'hp', 2500); for (let i = 0; i < m; i++) x[i] *= Math.pow(i / m, 3); return x; },
  engine: () => {
    // a car tearing past: engine harmonics swelling, doppler drop after it passes
    const m = n(2.0), pass = 0.62;
    const f = (i) => { const t = i / RATE; return t < pass ? 92 + 28 * (t / pass) : 120 - 40 * Math.min(1, (t - pass) / 0.5); };
    const x = osc(m, f, 'saw'); biquad(x, 'lp', 700, 0.9);
    const r = noise(m, 22); biquad(r, 'lp', 1500);
    for (let i = 0; i < m; i++) { const t = i / RATE; const amp = t < pass ? Math.pow(t / pass, 2.2) : Math.exp(-(t - pass) / 0.35); x[i] = (x[i] * 0.7 + r[i] * 0.5) * amp; }
    return sat(x, 1.6);
  },
  horn: () => { const m = n(0.6), a = osc(m, 415, 'square'), b = osc(m, 523, 'square'); for (let i = 0; i < m; i++) a[i] = (a[i] + b[i]) * 0.3; biquad(a, 'lp', 2200, 0.8); biquad(a, 'peak', 1200, 1, 4); return mul(a, adsr(m, 0.01, 0.05, 0.9, 0.08)); },
  screech: () => { const m = n(1.0), s = osc(m, (i) => 1950 + 120 * Math.sin(i / 260) + 60 * Math.sin(i / 37), 'sine'), r = noise(m, 23); biquad(r, 'bp', 3200, 1.4); for (let i = 0; i < m; i++) s[i] = s[i] * 0.4 + r[i] * 0.5; return mul(s, adsr(m, 0.02, 0.2, 0.8, 0.35)); },
  grab: () => { const m = n(0.3), x = noise(m, 24); biquad(x, 'bp', 1600, 0.8); mul(x, expDecay(m, 0.06)); const th = osc(n(0.1), 110); for (let i = 0; i < th.length; i++) x[i] += th[i] * 0.5 * Math.exp(-i / 900); return x; },
  whooshBy: () => { const m = n(0.8), x = noise(m, 25); svf(x, 'bp', (i) => 1400 - 1000 * (i / m), 1.2); for (let i = 0; i < m; i++) x[i] *= Math.sin((Math.PI * i) / m) ** 2; return mul(x, 1.4); },
  boom: () => { const m = n(2.4), x = osc(m, (i) => 35 + 70 * Math.exp(-i / (0.12 * RATE)), 'sine'); mul(x, expDecay(m, 0.5)); const r = noise(m, 26); biquad(r, 'lp', 380); mul(r, expDecay(m, 0.25)); for (let i = 0; i < m; i++) x[i] += r[i] * 0.8; return sat(x, 2); },
  boomSoft: () => { const m = n(2.6), x = osc(m, (i) => 33 + 40 * Math.exp(-i / (0.2 * RATE)), 'sine'); mul(x, expDecay(m, 0.8)); return sat(mul(x, 0.9), 1.3); },
  tinnitus: () => { const m = n(1.6), x = osc(m, 3400); return mul(x, adsr(m, 0.1, 0.3, 0.6, 1.0)); },
  shimmer: () => { const o = buf(2.2), r = rng(27); for (let k = 0; k < 9; k++) { const b = bell(96 + Math.floor(r() * 8), 0.2, 0.12, 2, 0.8); const p = n(k * 0.09); for (let i = 0; i < b.length && p + i < o.length; i++) o[p + i] += b[i]; } return o; },
};

// ---------------------------------------------------------------- ambience beds (stereo, any length)
function bed(kind, dur, seed) {
  const m = n(dur), L = buf(dur), R = buf(dur), r = rng(seed);
  if (kind === 'rain') {
    for (const [ch, s] of [[L, seed], [R, seed + 1]]) {
      const x = noise(m, s); biquad(x, 'hp', 900); biquad(x, 'lp', 7000);
      const lo = noise(m, s + 5, 'pink'); biquad(lo, 'lp', 500);
      for (let i = 0; i < m; i++) ch[i] = x[i] * 0.28 * (0.75 + 0.25 * Math.sin(i / 7000 + s)) + lo[i] * 0.5;
    }
    // drips on the window
    for (let k = 0; k < dur * 5; k++) { const p = Math.floor(r() * (m - 2000)), f = 1800 + r() * 2200, ch = r() < 0.5 ? L : R; for (let i = 0; i < 1600; i++) ch[p + i] += Math.sin((2 * Math.PI * f * i) / RATE) * 0.05 * Math.exp(-i / 180); }
  } else if (kind === 'cafe') {
    for (const [ch, s] of [[L, seed], [R, seed + 1]]) {
      const x = noise(m, s, 'pink'); biquad(x, 'bp', 700, 0.5);
      const env = noise(Math.ceil(m / 800) + 2, s + 9);
      for (let i = 0; i < m; i++) { const e = env[Math.floor(i / 800)] * 0.5 + 0.6; ch[i] = x[i] * e * 0.9; }
    }
    for (let k = 0; k < dur * 0.8; k++) { const b = bell(96 + Math.floor(r() * 6), 0.1, 0.06, 2.76, 1.2); const p = Math.floor(r() * (m - b.length)); const ch = r() < 0.5 ? L : R; for (let i = 0; i < b.length; i++) ch[p + i] += b[i]; }
  } else if (kind === 'train') {
    for (const [ch, s] of [[L, seed], [R, seed + 1]]) {
      const x = noise(m, s, 'brown'); biquad(x, 'lp', 180);
      const air = noise(m, s + 3); biquad(air, 'bp', 600, 0.5);
      const hum = osc(m, 120 + (s % 2) * 0.7);
      for (let i = 0; i < m; i++) ch[i] = x[i] * 1.4 + air[i] * 0.07 + hum[i] * 0.03;
    }
    // the clack of the rails: pairs of knocks every second or so
    for (let t = 0.2; t < dur; t += 1.05) for (const dt of [0, 0.12]) { const p = n(t + dt); const k = noise(n(0.06), Math.round(t * 100)); biquad(k, 'bp', 450, 1.5); for (let i = 0; i < k.length && p + i < m; i++) { const v = k[i] * Math.exp(-i / 500) * 1.2; L[p + i] += v; R[p + i] += v * 0.9; } }
  } else if (kind === 'room') {
    for (const [ch, s] of [[L, seed], [R, seed + 1]]) { const x = noise(m, s, 'pink'); biquad(x, 'lp', 400); for (let i = 0; i < m; i++) ch[i] = x[i] * 0.6; }
  } else if (kind === 'street') {
    for (const [ch, s] of [[L, seed], [R, seed + 1]]) { const x = noise(m, s, 'brown'); biquad(x, 'lp', 420); const w = noise(m, s + 2); biquad(w, 'bp', 1200, 0.4); for (let i = 0; i < m; i++) ch[i] = x[i] * 1.1 + w[i] * 0.05 * (0.5 + 0.5 * Math.sin(i / 30000)); }
    for (let t = 0.5; t < dur; t += 2.2 + r() * 2) { const p = n(t), c = n(1.6), lr = r() < 0.5; const x = noise(c, Math.round(t * 10)); biquad(x, 'lp', 900); for (let i = 0; i < c && p + i < m; i++) { const v = x[i] * Math.sin((Math.PI * i) / c) * 0.35; (lr ? L : R)[p + i] += v; (lr ? R : L)[p + i] += v * 0.5; } }
  }
  return [L, R];
}

// ---------------------------------------------------------------- place everything
const busOut = stereo(C.total + 3);
const cache = {};
for (const [t, name, gdb, pan] of C.sfx) {
  const x = (cache[name] ??= clips[name]());
  if (name === 'engine') {
    // the car sweeps across the stereo field
    const o = Math.round(t * RATE);
    for (let i = 0; i < x.length; i++) { const p = -0.9 + 1.8 * Math.min(1, i / x.length * 1.4), j = o + i; if (j >= busOut[0].length) break; busOut[0][j] += x[i] * db(gdb) * Math.cos(((p + 1) * Math.PI) / 4); busOut[1][j] += x[i] * db(gdb) * Math.sin(((p + 1) * Math.PI) / 4); }
  } else put(busOut, x, t, db(gdb), pan);
}
for (const [a, b, kind, gdb] of C.beds) {
  const [L, R] = bed(kind, b - a + 0.6, Math.round(a * 100) + kind.length);
  const m = L.length, f = Math.round(0.35 * RATE);
  for (let i = 0; i < m; i++) { const k = Math.min(1, i / f, (m - i) / f); L[i] *= k; R[i] *= k; }
  putStereo(busOut, [L, R], a - 0.3, db(gdb));
}
// a short room so the effects sit in a space
reverb(busOut, { room: 0.6, damp: 0.5, wet: 0.14 });
fs.mkdirSync(`build/ep${ep}`, { recursive: true });
writeWav(`build/ep${ep}/sfx.wav`, busOut, fs);
console.log(`sfx: ${C.sfx.length} effects, ${C.beds.length} beds, ${(busOut[0].length / RATE).toFixed(1)} s`);
