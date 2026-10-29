// A small DSP kit in plain JavaScript: everything the score and the sound design are built from. Buffers are
// Float32Array at RATE; stereo is a pair of them. All synthesis is deterministic (seeded noise).
export const RATE = 48000;

export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const buf = (sec) => new Float32Array(Math.max(1, Math.ceil(sec * RATE)));
export const stereo = (sec) => [buf(sec), buf(sec)];
export const db = (d) => Math.pow(10, d / 20);
export const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
/** 'A4', 'C#5', 'Eb3' to a MIDI number */
export const midi = (n) => { const m = n.match(/^([A-G])([#b]?)(-?\d)$/); return 12 * (Number(m[3]) + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };

// ---------------------------------------------------------------- envelopes
export function adsr(n, a, d, s, r, hold) {
  // a, d, r in seconds; s level; hold = seconds before release (defaults to the rest)
  const e = new Float32Array(n);
  const A = a * RATE, D = d * RATE, R = r * RATE, H = (hold ?? n / RATE - r) * RATE;
  for (let i = 0; i < n; i++) {
    let v;
    if (i < A) v = i / A;
    else if (i < A + D) v = 1 - (1 - s) * ((i - A) / D);
    else v = s;
    if (i > H) v *= Math.max(0, 1 - (i - H) / R);
    e[i] = v;
  }
  return e;
}
export const expDecay = (n, tau) => { const e = new Float32Array(n); for (let i = 0; i < n; i++) e[i] = Math.exp(-i / (tau * RATE)); return e; };

// ---------------------------------------------------------------- filters (RBJ biquads), in place
export function biquad(x, type, f, q = 0.707, gainDb = 0) {
  const w = (2 * Math.PI * f) / RATE, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * q), A = Math.pow(10, gainDb / 40);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'lp') { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
  else if (type === 'hp') { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
  else if (type === 'bp') { b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
  else if (type === 'peak') { b0 = 1 + al * A; b1 = -2 * cw; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * cw; a2 = 1 - al / A; }
  else if (type === 'lowshelf') { const s2 = 2 * Math.sqrt(A) * al; b0 = A * ((A + 1) - (A - 1) * cw + s2); b1 = 2 * A * ((A - 1) - (A + 1) * cw); b2 = A * ((A + 1) - (A - 1) * cw - s2); a0 = (A + 1) + (A - 1) * cw + s2; a1 = -2 * ((A - 1) + (A + 1) * cw); a2 = (A + 1) + (A - 1) * cw - s2; }
  else if (type === 'highshelf') { const s2 = 2 * Math.sqrt(A) * al; b0 = A * ((A + 1) + (A - 1) * cw + s2); b1 = -2 * A * ((A - 1) + (A + 1) * cw); b2 = A * ((A + 1) + (A - 1) * cw - s2); a0 = (A + 1) - (A - 1) * cw + s2; a1 = 2 * ((A - 1) - (A + 1) * cw); a2 = (A + 1) - (A - 1) * cw - s2; }
  b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) { const x0 = x[i], y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x0; y2 = y1; y1 = y0; x[i] = y0; }
  return x;
}
// a time-varying low/band-pass (state variable filter) for sweeps: f(i) gives the cutoff per sample
export function svf(x, mode, fAt, q = 0.8) {
  let lp = 0, bp = 0;
  for (let i = 0; i < x.length; i++) {
    const f = 2 * Math.sin((Math.PI * Math.min(fAt(i), RATE / 6)) / RATE);
    const hp = x[i] - lp - q * bp;
    bp += f * hp; lp += f * bp;
    x[i] = mode === 'lp' ? lp : mode === 'bp' ? bp : hp;
  }
  return x;
}

// ---------------------------------------------------------------- sources
export function noise(n, seed, color = 'white') {
  const r = rng(seed), x = new Float32Array(n);
  let b = 0, p = [0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < n; i++) {
    const w = r() * 2 - 1;
    if (color === 'brown') { b = (b + 0.02 * w) / 1.02; x[i] = b * 3.5; }
    else if (color === 'pink') { p[0] = 0.99886 * p[0] + w * 0.0555179; p[1] = 0.99332 * p[1] + w * 0.0750759; p[2] = 0.969 * p[2] + w * 0.153852; p[3] = 0.8665 * p[3] + w * 0.3104856; p[4] = 0.55 * p[4] + w * 0.5329522; p[5] = -0.7616 * p[5] - w * 0.016898; x[i] = (p[0] + p[1] + p[2] + p[3] + p[4] + p[5] + p[6] + w * 0.5362) * 0.11; p[6] = w * 0.115926; }
    else x[i] = w;
  }
  return x;
}
export function osc(n, freq, type = 'sine', phase = 0) {
  // freq: number or function of sample index; band-limited-ish saw/square via polyBLEP
  const x = new Float32Array(n);
  let ph = phase;
  const blep = (t, dt) => (t < dt ? ((t /= dt), t + t - t * t - 1) : t > 1 - dt ? ((t = (t - 1) / dt), t * t + t + t + 1) : 0);
  for (let i = 0; i < n; i++) {
    const f = typeof freq === 'function' ? freq(i) : freq, dt = f / RATE;
    if (type === 'sine') x[i] = Math.sin(2 * Math.PI * ph);
    else if (type === 'tri') x[i] = 1 - 4 * Math.abs(Math.round(ph - 0.25) - (ph - 0.25));
    else if (type === 'saw') x[i] = 2 * ph - 1 - blep(ph, dt);
    else if (type === 'square') x[i] = (ph < 0.5 ? 1 : -1) + blep(ph, dt) - blep((ph + 0.5) % 1, dt);
    ph += dt; ph -= Math.floor(ph);
  }
  return x;
}
export const mul = (a, b) => { for (let i = 0; i < a.length; i++) a[i] *= typeof b === 'number' ? b : b[i] ?? 0; return a; };
export const sat = (x, drive = 1.5) => { for (let i = 0; i < x.length; i++) x[i] = Math.tanh(x[i] * drive) / Math.tanh(drive); return x; };

/** Add a mono source into a stereo bus at time t (seconds) with gain and equal-power pan. */
export function put(bus, x, t, gain = 1, pan = 0) {
  const o = Math.round(t * RATE), gl = Math.cos(((pan + 1) * Math.PI) / 4) * gain, gr = Math.sin(((pan + 1) * Math.PI) / 4) * gain;
  for (let i = 0; i < x.length; i++) { const j = o + i; if (j < 0 || j >= bus[0].length) continue; bus[0][j] += x[i] * gl; bus[1][j] += x[i] * gr; }
}
export function putStereo(bus, [l, r], t, gain = 1) {
  const o = Math.round(t * RATE);
  for (let i = 0; i < l.length; i++) { const j = o + i; if (j < 0 || j >= bus[0].length) continue; bus[0][j] += l[i] * gain; bus[1][j] += r[i] * gain; }
}

// ---------------------------------------------------------------- instruments
/** A felt piano note: inharmonic partials with their own decays, a soft hammer, a gentle low-pass. */
export function piano(m, dur, vel = 0.7, seed = 1) {
  const f0 = mtof(m), n = Math.ceil((dur + 1.6) * RATE), x = new Float32Array(n);
  const B = 0.0004 * Math.pow(2, (m - 60) / 24);
  for (let k = 1; k <= 14; k++) {
    const fk = f0 * k * Math.sqrt(1 + B * k * k);
    if (fk > 9000) break;
    const amp = (vel * 0.9) / Math.pow(k, 1.25) * (k === 1 ? 1 : 0.8);
    const tau = (2.6 / (1 + k * 0.35)) * Math.pow(220 / f0, 0.35);
    const ph = (seed * 0.37 * k) % 1;
    for (let i = 0; i < n; i++) {
      const t = i / RATE;
      const rel = t > dur ? Math.exp(-(t - dur) / 0.18) : 1;
      x[i] += amp * Math.sin(2 * Math.PI * (fk * t + ph)) * Math.exp(-t / tau) * rel * Math.min(1, t / 0.004);
    }
  }
  const h = noise(Math.round(0.02 * RATE), seed + 7);
  for (let i = 0; i < h.length; i++) x[i] += h[i] * 0.05 * vel * (1 - i / h.length);
  biquad(x, 'lp', 1800 + vel * 2600, 0.6);
  return x;
}
/** Celesta / music box: an FM bell with a bright attack. */
export function bell(m, dur, vel = 0.5, ratio = 3.5, index = 2.2) {
  const f = mtof(m), n = Math.ceil((dur + 2.2) * RATE), x = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / RATE, env = Math.exp(-t / 1.1) * Math.min(1, t / 0.002);
    const ie = index * Math.exp(-t / 0.25);
    x[i] = vel * env * Math.sin(2 * Math.PI * f * t + ie * Math.sin(2 * Math.PI * f * ratio * t));
  }
  return x;
}
/** A warm pad voice: detuned saws through a slowly opening low-pass, with a soft attack. */
export function pad(m, dur, vel = 0.3, o = {}) {
  const n = Math.ceil((dur + (o.release ?? 1.5)) * RATE), out = new Float32Array(n);
  const det = o.detune ?? [-0.11, -0.04, 0, 0.05, 0.12];
  det.forEach((d, j) => {
    const v = osc(n, mtof(m + d), o.wave || 'saw', (j * 0.21) % 1);
    for (let i = 0; i < n; i++) out[i] += v[i] / det.length;
  });
  svf(out, 'lp', (i) => (o.cutoff ?? 900) * (0.55 + 0.45 * Math.min(1, i / (RATE * 1.5))), 0.9);
  mul(out, adsr(n, o.attack ?? 0.8, 0.5, 0.85, o.release ?? 1.5, dur));
  return mul(out, vel);
}
/** Short bowed-string stab or pizzicato (Karplus-Strong with a damping low-pass). */
export function pluck(m, dur, vel = 0.5, bright = 0.5, seed = 3) {
  const f = mtof(m), P = Math.round(RATE / f), n = Math.ceil((dur + 0.4) * RATE), x = new Float32Array(n);
  const r = rng(seed);
  const line = new Float32Array(P);
  for (let i = 0; i < P; i++) line[i] = r() * 2 - 1;
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const j = i % P, v = line[j];
    const nv = (v * (0.5 + bright * 0.49) + prev * (0.5 - bright * 0.49)) * 0.996;
    prev = v; line[j] = nv;
    x[i] = v * vel * (i / RATE > dur ? Math.exp(-(i / RATE - dur) / 0.05) : 1);
  }
  return x;
}

// ---------------------------------------------------------------- space: a stereo Freeverb
export function reverb([L, R], o = {}) {
  const room = o.room ?? 0.84, damp = o.damp ?? 0.3, wet = o.wet ?? 0.3, width = o.width ?? 1;
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((d) => Math.round((d * RATE) / 44100));
  const aps = [556, 441, 341, 225].map((d) => Math.round((d * RATE) / 44100));
  const run = (x, spread) => {
    const out = new Float32Array(x.length);
    for (const d0 of combs) {
      const d = d0 + spread, bufc = new Float32Array(d); let idx = 0, store = 0;
      for (let i = 0; i < x.length; i++) { const y = bufc[idx]; store = y * (1 - damp) + store * damp; bufc[idx] = x[i] * 0.015 + store * room; out[i] += y; idx = (idx + 1) % d; }
    }
    for (const d0 of aps) {
      const d = d0 + spread, b2 = new Float32Array(d); let idx = 0;
      for (let i = 0; i < x.length; i++) { const bo = b2[idx]; const y = -out[i] + bo; b2[idx] = out[i] + bo * 0.5; out[i] = y; idx = (idx + 1) % d; }
    }
    return out;
  };
  const mono = L.map((v, i) => (v + R[i]) * 0.5);
  const wl = run(mono, 0), wr = run(mono, 23);
  const w1 = wet * (width / 2 + 0.5), w2 = (wet * (1 - width)) / 2;
  for (let i = 0; i < L.length; i++) { const l = L[i], r = R[i]; L[i] = l * (1 - wet * 0.5) + wl[i] * w1 + wr[i] * w2; R[i] = r * (1 - wet * 0.5) + wr[i] * w1 + wl[i] * w2; }
  return [L, R];
}

// ---------------------------------------------------------------- output
export function writeWav(path, chans, fs) {
  const n = chans[0].length, nc = chans.length;
  const b = Buffer.alloc(44 + n * nc * 4);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * nc * 4, 4); b.write('WAVE', 8); b.write('fmt ', 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(3, 20); b.writeUInt16LE(nc, 22); b.writeUInt32LE(RATE, 24); b.writeUInt32LE(RATE * nc * 4, 28); b.writeUInt16LE(nc * 4, 32); b.writeUInt16LE(32, 34);
  b.write('data', 36); b.writeUInt32LE(n * nc * 4, 40);
  for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) b.writeFloatLE(chans[c][i], 44 + (i * nc + c) * 4);
  fs.writeFileSync(path, b);
}
