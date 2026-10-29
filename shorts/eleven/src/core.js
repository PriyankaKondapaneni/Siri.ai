// 47 Paper Planes: the shared core. Plain JavaScript, no libraries: seeded randomness, noise, easing, canvases
// and the clock. Everything that draws is a pure function of time, so any frame can be rendered on its own.
(function (g) {
  const PP = (g.PP = g.PP || {});
  PP.W = 1080;
  PP.H = 1920;
  PP.FPS = 30;

  // ---------------------------------------------------------------- randomness
  // mulberry32: small, fast, good enough; seeds come from hashing strings and numbers together
  PP.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  PP.hash = function (...parts) {
    let h = 2166136261 >>> 0;
    for (const p of parts) {
      const s = String(p);
      for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
      }
      h ^= 0x9e3779b9;
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  };
  PP.rand = (...parts) => PP.rng(PP.hash(...parts))();
  PP.randRange = (lo, hi, ...parts) => lo + (hi - lo) * PP.rand(...parts);

  // ---------------------------------------------------------------- noise (value noise, smooth, seeded)
  const lattice = (i, seed) => PP.rand('n', seed, i) * 2 - 1;
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  PP.noise1 = function (x, seed = 0) {
    const i = Math.floor(x), f = x - i;
    return lattice(i, seed) * (1 - fade(f)) + lattice(i + 1, seed) * fade(f);
  };
  PP.fbm1 = function (x, seed = 0, oct = 4) {
    let v = 0, a = 0.5, fr = 1;
    for (let o = 0; o < oct; o++) { v += a * PP.noise1(x * fr, seed + o * 131); a *= 0.5; fr *= 2.03; }
    return v;
  };
  // 2D value noise on a hashed lattice, used to build paper textures (precomputed, so speed matters less)
  PP.noise2 = function (x, y, seed = 0) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = fade(x - xi), yf = fade(y - yi);
    const L = (a, b) => PP.rand('n2', seed, a, b) * 2 - 1;
    const v00 = L(xi, yi), v10 = L(xi + 1, yi), v01 = L(xi, yi + 1), v11 = L(xi + 1, yi + 1);
    return (v00 * (1 - xf) + v10 * xf) * (1 - yf) + (v01 * (1 - xf) + v11 * xf) * yf;
  };

  // ---------------------------------------------------------------- easing and interpolation
  PP.clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  PP.lerp = (a, b, t) => a + (b - a) * t;
  PP.inv = (a, b, v) => PP.clamp((v - a) / (b - a));
  PP.smooth = (t) => t * t * (3 - 2 * t);
  PP.ease = {
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    out: (t) => 1 - Math.pow(1 - t, 3),
    in: (t) => t * t * t,
    outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
    outElastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
    outQuart: (t) => 1 - Math.pow(1 - t, 4),
    inQuad: (t) => t * t,
  };
  // keyframes: [[t, value], ...] with an optional ease per segment ([t, v, easeFn])
  PP.kf = function (t, keys) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        const [t0, v0] = keys[i - 1], [t1, v1, e] = keys[i];
        const u = (e || PP.ease.inOut)((t - t0) / (t1 - t0));
        if (Array.isArray(v0)) return v0.map((x, k) => PP.lerp(x, v1[k], u));
        return PP.lerp(v0, v1, u);
      }
    }
    return keys[keys.length - 1][1];
  };
  // a quick appear: 0 before t0, overshooting pop to 1 over dur
  PP.pop = (t, t0, dur = 0.35) => (t < t0 ? 0 : t > t0 + dur ? 1 : PP.ease.outBack((t - t0) / dur, 2.2));

  // ---------------------------------------------------------------- the stop-motion clock
  // Cut-outs move "on twos" (12 steps a second) and ink lines boil at 8 a second, as hand-made animation does.
  PP.step = (t, rate = 12) => Math.floor(t * rate + 1e-6) / rate;
  PP.boil = (t, rate = 8) => Math.floor(t * rate + 1e-6);
  // a tiny per-step positional jitter, the hand-placed wobble of stop motion
  PP.jit = (t, id, amp = 1.2) => {
    const s = PP.boil(t, 12);
    return [(PP.rand('jx', id, s) - 0.5) * 2 * amp, (PP.rand('jy', id, s) - 0.5) * 2 * amp];
  };

  // ---------------------------------------------------------------- canvases
  PP.canvas = function (w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  };
  PP.cache = new Map();
  PP.cached = function (key, make) {
    let v = PP.cache.get(key);
    if (!v) { v = make(); PP.cache.set(key, v); }
    return v;
  };
  // an LRU-ish cache for per-frame sprites that recur (poses on twos, boil variants)
  PP.spriteCache = new Map();
  PP.sprite = function (key, make) {
    let v = PP.spriteCache.get(key);
    if (v) { PP.spriteCache.delete(key); PP.spriteCache.set(key, v); return v; }
    v = make();
    PP.spriteCache.set(key, v);
    if (PP.spriteCache.size > 400) PP.spriteCache.delete(PP.spriteCache.keys().next().value);
    return v;
  };

  PP.hex = function (h, a = 1) {
    const n = parseInt(h.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };
  PP.rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

  PP.with = function (ctx, fn) { ctx.save(); try { fn(); } finally { ctx.restore(); } };
  PP.place = function (ctx, x, y, rot = 0, sx = 1, sy = sx) { ctx.translate(x, y); if (rot) ctx.rotate(rot); if (sx !== 1 || sy !== 1) ctx.scale(sx, sy); };
  PP.deg = (d) => (d * Math.PI) / 180;
})(typeof window !== 'undefined' ? window : globalThis);
