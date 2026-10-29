// Ink: hand-drawn lines. Every stroke is resampled and nudged by seeded noise that changes on the boil clock, so
// lines shimmer like hand-traced animation; widths swell and taper like a brush pen. Strokes can draw themselves
// on (progress 0..1), which is how drawings appear on the page.
(function (g) {
  const PP = g.PP;

  // resample a polyline to points roughly `step` apart, keeping the ends
  function resample(pts, step) {
    const out = [pts[0]];
    let carry = 0;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const len = Math.hypot(x1 - x0, y1 - y0);
      let d = step - carry;
      while (d < len) { out.push([x0 + ((x1 - x0) * d) / len, y0 + ((y1 - y0) * d) / len]); d += step; }
      carry = len - (d - step);
    }
    const last = pts[pts.length - 1];
    if (Math.hypot(last[0] - out[out.length - 1][0], last[1] - out[out.length - 1][1]) > 0.5) out.push(last);
    return out;
  }
  PP.resample = resample;

  // Curves: Catmull-Rom through control points, for lines that should feel drawn in one gesture.
  PP.curve = function (ctrl, n = 12, closed = false) {
    const P = closed ? [ctrl[ctrl.length - 1], ...ctrl, ctrl[0], ctrl[1]] : [ctrl[0], ...ctrl, ctrl[ctrl.length - 1]];
    const out = [];
    for (let i = 1; i < P.length - 2; i++) {
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push([f(P[i - 1][0], P[i][0], P[i + 1][0], P[i + 2][0]), f(P[i - 1][1], P[i][1], P[i + 1][1], P[i + 2][1])]);
      }
    }
    out.push(closed ? out[0] : ctrl[ctrl.length - 1]);
    return out;
  };
  PP.circlePts = (cx, cy, rx, ry = rx, n = 40, a0 = 0, sweep = Math.PI * 2) => Array.from({ length: n + 1 }, (_, i) => [cx + Math.cos(a0 + (sweep * i) / n) * rx, cy + Math.sin(a0 + (sweep * i) / n) * ry]);

  /**
   * A brush-pen stroke.
   * o: { w: width, color, seed, boil (the boil frame), jitter (px), taper (0..1), progress (0..1 draw-on),
   *      dry (a second, offset, faint pass), closed, alpha, wobble (slow hand wobble, px) }
   */
  PP.ink = function (ctx, ctrl, o = {}) {
    if (!ctrl || ctrl.length < 2) return;
    const w = o.w ?? 5, seed = o.seed ?? 1, b = o.boil ?? 0, jit = o.jitter ?? 1.4, wob = o.wobble ?? 1.5;
    let pts = resample(ctrl, o.step ?? 5);
    // total length, for draw-on and noise parameterisation
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const L = cum[cum.length - 1];
    if (L < 0.5) return;
    const prog = o.progress ?? 1;
    if (prog <= 0) return;
    let cut = pts.length;
    if (prog < 1) {
      const target = L * prog;
      cut = cum.findIndex((c) => c > target);
      if (cut < 0) cut = pts.length;
      cut = Math.max(2, cut);
    }
    pts = pts.slice(0, cut);
    // nudge: a slow wobble (the hand) that is fixed, plus a fast jitter that changes on the boil clock
    const nb = (i, axis) => {
      const s = cum[i] / 60;
      return PP.noise1(s, seed + axis * 17) * wob + PP.noise1(cum[i] / 14 + b * 3.7, seed * 3 + axis * 29 + b * 101) * jit;
    };
    const P = pts.map((p, i) => [p[0] + nb(i, 0), p[1] + nb(i, 1)]);
    const taper = o.taper ?? 0.6;
    const half = (i) => {
      const u = cum[i] / L;
      const ends = Math.min(1, Math.min(u, (o.closed ? 1 : prog) - u + 0.02) / 0.12);
      const t = 1 - taper + taper * Math.pow(PP.clamp(ends), 0.6);
      const swell = 1 + 0.22 * PP.noise1(cum[i] / 40 + b * 0.31, seed + 5);
      return (w / 2) * t * swell;
    };
    const left = [], right = [];
    for (let i = 0; i < P.length; i++) {
      const a = P[Math.max(0, i - 1)], c = P[Math.min(P.length - 1, i + 1)];
      let dx = c[0] - a[0], dy = c[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      dx /= l; dy /= l;
      const h = half(i);
      left.push([P[i][0] - dy * h, P[i][1] + dx * h]);
      right.push([P[i][0] + dy * h, P[i][1] - dx * h]);
    }
    PP.with(ctx, () => {
      ctx.globalAlpha *= o.alpha ?? 1;
      ctx.fillStyle = o.color || '#1d1a22';
      ctx.beginPath();
      ctx.moveTo(left[0][0], left[0][1]);
      for (let i = 1; i < left.length; i++) ctx.lineTo(left[i][0], left[i][1]);
      // round end caps
      const e = P[P.length - 1];
      ctx.arc(e[0], e[1], half(P.length - 1), Math.atan2(left.at(-1)[1] - e[1], left.at(-1)[0] - e[0]), Math.atan2(right.at(-1)[1] - e[1], right.at(-1)[0] - e[0]), false);
      for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
      const s = P[0];
      ctx.arc(s[0], s[1], half(0), Math.atan2(right[0][1] - s[1], right[0][0] - s[0]), Math.atan2(left[0][1] - s[1], left[0][0] - s[0]), false);
      ctx.closePath();
      ctx.fill();
      if (o.dry !== false && w > 2.5) {
        // a dry-brush ghost: a thinner, offset, faint pass that roughens the edge
        ctx.globalAlpha *= 0.28;
        ctx.lineWidth = Math.max(1, w * 0.35);
        ctx.strokeStyle = o.color || '#1d1a22';
        ctx.lineCap = 'round';
        ctx.beginPath();
        P.forEach((p, i) => { const q = [p[0] + PP.noise1(i * 0.7, seed + 77 + b) * w * 0.5, p[1] + PP.noise1(i * 0.7, seed + 99 + b) * w * 0.5]; i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
        ctx.stroke();
      }
    });
    return P;
  };

  // A pencil line: several faint, thin, slightly divergent passes with a grainy texture.
  PP.pencil = function (ctx, ctrl, o = {}) {
    const passes = o.passes ?? 3;
    for (let k = 0; k < passes; k++) {
      PP.ink(ctx, ctrl, { w: (o.w ?? 2.6) * (1 - k * 0.2), color: o.color || '#3a3540', seed: (o.seed ?? 1) + k * 13, boil: o.boil, jitter: (o.jitter ?? 1.1) + k * 0.4, wobble: o.wobble ?? 1.2, taper: 0.8, progress: o.progress, alpha: (o.alpha ?? 0.8) * (k ? 0.45 : 1), dry: false, step: 4 });
    }
  };

  // Crayon / coloured-pencil fill: hatching inside a closed path.
  PP.hatch = function (ctx, poly, o = {}) {
    PP.with(ctx, () => {
      PP.path(ctx, poly);
      ctx.clip();
      const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
      const x0 = Math.min(...xs) - 20, x1 = Math.max(...xs) + 20, y0 = Math.min(...ys) - 20, y1 = Math.max(...ys) + 20;
      const ang = o.angle ?? -0.9, gap = o.gap ?? 7;
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const diag = Math.hypot(x1 - x0, y1 - y0);
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      ctx.strokeStyle = o.color || 'rgba(230,100,90,0.5)';
      ctx.lineCap = 'round';
      let k = 0;
      for (let d = -diag / 2; d < diag / 2; d += gap) {
        const j = (PP.rand('h', o.seed, k, o.boil ?? 0) - 0.5) * gap * 0.7;
        ctx.lineWidth = (o.w ?? 3) * (0.7 + 0.6 * PP.rand('hw', o.seed, k));
        ctx.beginPath();
        ctx.moveTo(cx + (d + j) * -sa - (diag / 2) * ca, cy + (d + j) * ca - (diag / 2) * sa);
        ctx.lineTo(cx + (d + j) * -sa + (diag / 2) * ca, cy + (d + j) * ca + (diag / 2) * sa);
        ctx.stroke();
        k++;
      }
    });
  };

  // A five-point star doodle (or a sticker star when filled).
  PP.starPts = (cx, cy, r, rot = 0, inner = 0.45) => Array.from({ length: 11 }, (_, i) => { const a = rot - Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 ? r * inner : r; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; });

  // A dashed flight trail: hand-drawn dashes along a path, revealed up to `progress`.
  PP.dashTrail = function (ctx, pts, o = {}) {
    const P = resample(pts, 4);
    const dash = o.dash ?? 16, gap = o.gap ?? 13;
    let acc = 0, on = true, seg = [P[0]];
    const total = P.length;
    const upto = Math.floor(total * (o.progress ?? 1));
    const from = Math.floor(total * (o.from ?? 0));
    for (let i = 1; i < upto; i++) {
      acc += 4;
      if (on) seg.push(P[i]);
      if (acc >= (on ? dash : gap)) {
        if (on && seg.length > 1 && i > from) PP.ink(ctx, seg, { w: o.w ?? 4, color: o.color || '#f6efe0', seed: (o.seed ?? 3) + i, boil: o.boil, jitter: 0.6, wobble: 0.5, taper: 0.3, dry: false, alpha: o.alpha ?? 0.9 });
        on = !on; acc = 0; seg = [P[i]];
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
