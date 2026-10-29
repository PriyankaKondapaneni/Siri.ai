// The cast of 11:11, as illustrated paper dolls: Mira (22), Kabir (25) and the man on the train.
// Faces: shaded skin, almond eyes with striated irises, catchlights and lashes, tapered brows, a nose with a bridge,
// shaped lips. Hair: built lock by lock (tapered ribbons, dark at the root, lighter through the length) under a
// sheen band. Each pose renders to one sticker; lighting (night, phone glow, streetlight) is applied on top.
(function (g) {
  const PP = g.PP;
  const shape = PP.shape;

  Object.assign(PP.PAPERS, {
    skinM: { base: '#f4d2bb', mottle: 0.03, grain: 0.022 },
    skinK: { base: '#d9a684', mottle: 0.035, grain: 0.025 },
    skinT: { base: '#d8cdc4', mottle: 0.05, grain: 0.03 },
    dressBlue: { base: '#3f64b8', mottle: 0.07, grain: 0.045 },
    scarfRed: { base: '#c7332e', mottle: 0.07, grain: 0.05 },
    coat: { base: '#4a4e58', mottle: 0.08, grain: 0.05 },
    knitDark: { base: '#23262f', mottle: 0.08, grain: 0.05 },
    coatBlack: { base: '#1c1b21', mottle: 0.08, grain: 0.05 },
    capTweed: { base: '#3b3a36', mottle: 0.12, grain: 0.07 },
    strap: { base: '#6b3f24', mottle: 0.08, grain: 0.05 },
  });

  const SPEC = {
    mira: {
      skin: 'skinM', shade: 'rgba(205,120,100,0.26)', ink: '#2b1b1c', iris: ['#e8ac56', '#a8662a', '#4a2a14'], irisR: 16.2, open: 1, blush: 0.45,
      eyeX: 28, eyeY: 14, eyeW: 24, lidW: 5.4, lashes: 3, lowerLashes: 1, shadow: 'rgba(170,90,100,0.2)',
      brow: { col: '#3a2420', w: 4.4, arch: 6, gap: 36, len: 46 },
      noseY: 50, noseLen: 18, mouthY: 70, mouthW: 12.5, lips: ['#e2717f', '#b44a5c'], lipFull: 1.35, gloss: 0.6,
      contour: [[0, -110], [42, -104], [65, -78], [71, -30], [68, 14], [57, 50], [38, 80], [18, 98], [0, 104], [-18, 98], [-38, 80], [-57, 50], [-68, 14], [-71, -30], [-65, -78], [-42, -104]],
      hair: { root: '#24130f', mid: '#5b3324', tip: '#3a2018', sheen: 'rgba(214,170,146,0.42)', ink: 'rgba(30,14,12,0.85)' },
    },
    kabir: {
      skin: 'skinK', shade: 'rgba(140,78,52,0.32)', ink: '#231918', iris: ['#8a5a32', '#57351c', '#21130b'], irisR: 12.6, open: 0.72, blush: 0,
      eyeX: 28, eyeY: 10, eyeW: 22, lidW: 5.2, lashes: 0, lowerLashes: 0, shadow: 'rgba(110,60,45,0.18)',
      brow: { col: '#1d1312', w: 7.4, arch: 1.5, gap: 20, len: 52 },
      noseY: 48, noseLen: 38, mouthY: 70, mouthW: 15, lips: ['#b97866', '#8a5040'], lipFull: 0.6, gloss: 0.1,
      contour: [[0, -116], [44, -110], [70, -80], [76, -34], [74, 10], [67, 44], [52, 74], [30, 96], [11, 106], [0, 108], [-11, 106], [-30, 96], [-52, 74], [-67, 44], [-74, 10], [-76, -34], [-70, -80], [-44, -110]],
      hair: { root: '#120c0b', mid: '#2d211f', tip: '#1c1413', sheen: 'rgba(170,155,150,0.35)', ink: 'rgba(10,6,6,0.9)' },
    },
    stranger: {
      skin: 'skinT', shade: 'rgba(60,70,100,0.42)', ink: '#141418', iris: ['#7c8a96', '#3f4a55', '#14181c'], irisR: 10, open: 0.62, blush: 0,
      eyeX: 30, eyeY: 4, eyeW: 19, lidW: 4.4, lashes: 0, lowerLashes: 0, shadow: 'rgba(40,40,70,0.3)',
      brow: { col: '#1a1a1e', w: 6, arch: -1, gap: 18, len: 46 },
      noseY: 50, noseLen: 46, mouthY: 78, mouthW: 18, lips: ['#a07a78', '#6e4c4c'], lipFull: 0.35, gloss: 0,
      contour: [[0, -120], [42, -114], [66, -84], [72, -34], [70, 18], [62, 56], [48, 88], [24, 110], [0, 118], [-24, 110], [-48, 88], [-62, 56], [-70, 18], [-72, -34], [-66, -84], [-42, -114]],
      hair: { root: '#141212', mid: '#2a2626', tip: '#181616', sheen: 'rgba(120,120,130,0.3)', ink: 'rgba(8,8,10,0.9)' },
    },
  };
  // Authored geometry (SVG path data, front view; the turn warp bends it into three-quarter view).
  SPEC.mira.face = 'M -62 -40 C -64 6 -56 44 -38 74 C -24 94 -11 103 0 103 C 11 103 24 94 38 74 C 56 44 64 6 62 -40 C 59 -88 32 -108 0 -108 C -32 -108 -59 -88 -62 -40 Z';
  SPEC.kabir.face = 'M -68 -40 C -70 4 -64 38 -52 62 C -42 82 -26 98 -12 104 C -6 106 6 106 12 104 C 26 98 42 82 52 62 C 64 38 70 4 68 -40 C 65 -90 35 -112 0 -112 C -35 -112 -65 -90 -68 -40 Z';
  SPEC.stranger.face = 'M -70 -40 C -72 10 -66 52 -50 84 C -36 106 -16 118 0 118 C 16 118 36 106 50 84 C 66 52 72 10 70 -40 C 66 -94 36 -118 0 -118 C -36 -118 -66 -94 -70 -40 Z';
  // eyes, in the right eye's frame (iris centre at 0,0); the left eye mirrors it
  SPEC.mira.eye = { inner: [-19, 4], outer: [19, -4], up: [[-13, -14], [7, -19]], lo: [[13, 11], [-7, 12]], lid: [1.8, 6.6], wing: [26, -1], lash: 3, crease: 0.18 };
  SPEC.kabir.eye = { inner: [-20, 3], outer: [20, -3], up: [[-13, -10], [8, -13]], lo: [[13, 9], [-8, 10]], lid: [2.2, 5.4], wing: [25, -1], lash: 0, crease: 0.16 };
  SPEC.stranger.eye = { inner: [-19, 2], outer: [19, -4], up: [[-12, -8], [8, -11]], lo: [[12, 7], [-8, 8]], lid: [2, 5], wing: [23, -3], lash: 0, crease: 0.1 };
  SPEC.mira.browPath = [[-17, -26], [-5, -32], [9, -33], [21, -27]];
  SPEC.kabir.browPath = [[-19, -22], [-5, -27], [10, -28], [23, -24]];
  SPEC.stranger.browPath = [[-20, -22], [-6, -24], [10, -25], [24, -24]];
  PP.SPEC = SPEC;

  // ---------------------------------------------------------------- the three-quarter warp
  let TURN = 0;
  const wf = (x) => { const far = TURN !== 0 && Math.sign(x) === Math.sign(TURN); return x * (far ? 1 - 0.32 * Math.abs(TURN) : 1 + 0.04 * Math.abs(TURN)) + 20 * TURN; };
  const wc = (x) => { const far = TURN !== 0 && Math.sign(x) === Math.sign(TURN); return x * (far ? 1 - 0.13 * Math.abs(TURN) : 1 + 0.03 * Math.abs(TURN)) + 6 * TURN; };
  const farK = (sx) => (TURN !== 0 && Math.sign(sx) === Math.sign(TURN) ? 1 - 0.22 * Math.abs(TURN) : 1);

  // ---------------------------------------------------------------- hair: tapered ribbons
  // A lock of hair along a centreline: width w0 at the root tapering to w1, a gradient through its length, a
  // highlight running down it, and a soft ink edge.
  function lock(ctx, ctrl, w0, w1, H, b, seed, o = {}) {
    const P = PP.curve(ctrl, 10);
    const L = [], R = [];
    for (let i = 0; i < P.length; i++) {
      const a = P[Math.max(0, i - 1)], c = P[Math.min(P.length - 1, i + 1)];
      let dx = c[0] - a[0], dy = c[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      dx /= l; dy /= l;
      const u = i / (P.length - 1);
      const w = (w0 + (w1 - w0) * Math.pow(u, o.taperPow ?? 1.3)) / 2;
      L.push([P[i][0] - dy * w, P[i][1] + dx * w]);
      R.push([P[i][0] + dy * w, P[i][1] - dx * w]);
    }
    const poly = [...L, ...R.reverse()];
    PP.with(ctx, () => {
      PP.path(ctx, poly);
      const s = P[0], e = P[P.length - 1];
      const gr = ctx.createLinearGradient(s[0], s[1], e[0], e[1]);
      gr.addColorStop(0, H.root);
      gr.addColorStop(0.5, o.light ? H.mid : H.mid);
      gr.addColorStop(1, H.tip);
      ctx.fillStyle = gr;
      ctx.fill();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = PP.pattern(ctx, 'hair');
      ctx.globalCompositeOperation = 'overlay';
      ctx.fill();
    });
    // the highlight: a thin lighter line down the lock, offset to the lit side
    const hl = P.map((p, i) => [p[0] + (o.hlSide ?? 1) * ((w0 + (w1 - w0) * (i / P.length)) * 0.18), p[1]]).slice(Math.round(P.length * 0.12), Math.round(P.length * 0.8));
    if (hl.length > 2) PP.ink(ctx, hl, { w: Math.max(1.5, w0 * 0.07), color: H.sheen, seed, boil: b, dry: false, taper: 0.95, jitter: 0.5 });
    PP.ink(ctx, [...poly, poly[0]], { w: o.edge ?? 2.2, color: H.ink, seed: seed + 1, boil: b, dry: false, taper: 0.4, jitter: 0.6, alpha: 0.9 });
  }

  // the sheen: the band of light across the crown that makes hair look glossy
  function sheen(ctx, cx, cy, rx, ry, H, b, seed, clipPoly) {
    PP.with(ctx, () => {
      if (clipPoly) { PP.path(ctx, clipPoly); ctx.clip(); }
      ctx.lineCap = 'round';
      ctx.strokeStyle = H.sheen;
      ctx.filter = 'blur(2px)';
      for (const [w, a0, a1, d] of [[10, 1.12, 1.62, 0], [5, 1.66, 1.86, 2], [4, 1.02, 1.1, 2]]) {
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx - 14 - d, ry - 14 - d, 0, Math.PI * a0, Math.PI * a1);
        ctx.stroke();
      }
    });
  }

  // ---------------------------------------------------------------- the face
  function eye(ctx, F, p, sx, b) {
    const E = F.eye, o = sx, k = farK(sx);
    const cx = wf(sx * F.eyeX), cy = F.eyeY;
    const kind = p.eyes || 'open';
    const [lx, ly] = p.look || [0, 0];
    const ink = F.ink, seed = 300 + sx;
    const X = (q, open = 1) => [cx + o * q[0] * k, cy + q[1] * (q[1] < 0 ? open : 1)];
    const open = (kind === 'wide' ? 1.28 : kind === 'half' ? 0.42 : kind === 'down' ? 0.5 : kind === 'narrow' ? 0.62 : 1) * (kind === 'wide' ? 1 : F.open);
    // the soft colour of the lid above the eye
    PP.with(ctx, () => { const gr = ctx.createRadialGradient(cx, cy - 10, 2, cx, cy - 10, 30 * k); gr.addColorStop(0, F.shadow); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(cx - 40, cy - 44, 80, 50); });
    const lidShape = (curve, t0, t1, wing) => {
      // a filled crescent along the lid: thin at the inner corner, thick at the outer, ending in a soft wing
      const L = [], R = [];
      curve.forEach((q, i) => { const u = i / (curve.length - 1); const t = t0 + (t1 - t0) * Math.pow(u, 1.4); L.push([q[0], q[1] - t * 0.75]); R.push([q[0], q[1] + t * 0.25]); });
      const tip = wing ? [X(wing)] : [];
      PP.with(ctx, () => { PP.path(ctx, [...L, ...tip, ...R.reverse()]); ctx.fillStyle = ink; ctx.fill(); });
    };
    if (kind === 'squeeze') { PP.ink(ctx, [[cx - o * 15, cy - 9], [cx + o * 6, cy], [cx - o * 15, cy + 9]], { w: 4.4, seed, boil: b, color: ink, dry: false }); return; }
    if (kind === 'x') { PP.ink(ctx, [[cx - 10, cy - 10], [cx + 10, cy + 10]], { w: 4, seed, boil: b, dry: false }); PP.ink(ctx, [[cx + 10, cy - 10], [cx - 10, cy + 10]], { w: 4, seed: seed + 1, boil: b, dry: false }); return; }
    if (kind === 'happy' || kind === 'closed') {
      const up = kind === 'happy';
      const c = PP.curve([X(E.inner), X([0, up ? -9 : 7]), X(E.outer)], 10);
      lidShape(c, E.lid[0] * 0.8, E.lid[1] * 0.8, null);
      for (let n = 0; n < E.lash; n++) { const q = c[c.length - 1 - n * 3]; PP.ink(ctx, [q, [q[0] + o * (5 - n), q[1] + (up ? -4 : 4)]], { w: 2, seed: seed + 50 + n, boil: b, color: ink, dry: false, taper: 0.9 }); }
      return;
    }
    const upper = PP.curve([X(E.inner), X(E.up[0], open), X(E.up[1], open), X(E.outer)], 8);
    const lower = PP.curve([X(E.outer), X(E.lo[0]), X(E.lo[1]), X(E.inner)], 8);
    PP.with(ctx, () => {
      PP.path(ctx, [...upper, ...lower]);
      ctx.fillStyle = '#fbf6f0';
      ctx.fill();
      ctx.clip();
      const R = F.irisR * k;
      const ix = cx + lx * k, iy = cy + ly + (kind === 'down' ? 5 : 0.5);
      const gr = ctx.createRadialGradient(ix, iy + R * 0.35, 1, ix, iy, R);
      gr.addColorStop(0, F.iris[0]); gr.addColorStop(0.55, F.iris[1]); gr.addColorStop(1, F.iris[2]);
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.ellipse(ix, iy, R * 0.92, R, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(40,20,10,0.22)'; ctx.lineWidth = 1;
      for (let n = 0; n < 16; n++) { const a = (n / 16) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(ix + Math.cos(a) * R * 0.42, iy + Math.sin(a) * R * 0.42); ctx.lineTo(ix + Math.cos(a) * R * 0.88, iy + Math.sin(a) * R * 0.88); ctx.stroke(); }
      ctx.fillStyle = '#0e0705'; ctx.beginPath(); ctx.ellipse(ix, iy, R * 0.4, R * 0.44, 0, 0, 7); ctx.fill();
      // the lid's shadow across the top of the iris, then catchlights
      const sh = ctx.createLinearGradient(0, cy - 20, 0, cy - 2); sh.addColorStop(0, 'rgba(40,18,16,0.55)'); sh.addColorStop(1, 'rgba(40,18,16,0)');
      ctx.fillStyle = sh; ctx.fillRect(cx - 30, cy - 24, 60, 24);
      ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.ellipse(ix + R * 0.36, iy - R * 0.32, R * 0.24, R * 0.28, -0.4, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.arc(ix - R * 0.3, iy + R * 0.4, R * 0.1, 0, 7); ctx.fill();
      if (p.tears) { ctx.fillStyle = 'rgba(205,232,255,0.5)'; ctx.fillRect(cx - 24, cy + 5, 48, 6); }
    });
    lidShape(upper, E.lid[0], E.lid[1], E.wing);
    if (open > 0.7) PP.ink(ctx, PP.curve([X([E.inner[0] + 7, E.up[0][1] * open - 8]), X([2, E.up[1][1] * open - 9]), X([E.outer[0] - 3, E.outer[1] - 9])], 6), { w: 1.5, seed: seed + 4, boil: b, color: ink, dry: false, alpha: E.crease, taper: 0.9 });
    for (let n = 0; n < E.lash; n++) {
      const q = upper[upper.length - 2 - n * 3];
      PP.ink(ctx, PP.curve([[q[0], q[1] - 2], [q[0] + o * (4 + n), q[1] - 6 - n], [q[0] + o * (7 + n * 1.5), q[1] - 7 - n]], 3), { w: 2.2 - n * 0.3, seed: seed + 40 + n, boil: b, color: ink, dry: false, taper: 0.95, jitter: 0.2 });
    }
    // only the outer half of the lower lid, faint
    PP.ink(ctx, lower.slice(1, Math.ceil(lower.length * 0.55)), { w: 1.7, seed: seed + 3, boil: b, color: ink, dry: false, alpha: 0.55, taper: 0.85 });
    if (p.tears) PP.ink(ctx, PP.curve([[cx + o * 4, cy + 14], [cx + o * 6, cy + 30], [cx + o * 4, cy + 48]], 5), { w: 3, seed: seed + 9, boil: b, color: 'rgba(190,225,255,0.85)', dry: false, taper: 0.8 });
  }

  function brows(ctx, F, p, b) {
    const kind = p.brows || 'neutral', B = F.brow;
    for (const sx of [-1, 1]) {
      const o = sx, k = farK(sx), cx = wf(sx * F.eyeX) + (p.look ? p.look[0] * 0.3 : 0), cy = F.eyeY;
      const lift = (i) => {
        if (kind === 'up') return -8;
        if (kind === 'worried') return i === 0 ? -10 : i === 3 ? 3 : -4;
        if (kind === 'flat') return i === 1 || i === 2 ? 4 : 2;
        if (kind === 'angry' || kind === 'focused') return i === 0 ? (kind === 'angry' ? 8 : 5) : i === 3 ? -2 : 2;
        if (kind === 'soft') return -2;
        return 0;
      };
      const pts = F.browPath.map(([x, y], i) => [cx + o * x * k, cy + y + lift(i)]);
      const mid = PP.curve(pts, 8);
      const L = [], R = [];
      mid.forEach((q, i) => { const u = i / (mid.length - 1); const w = B.w * (1 - Math.pow(u, 1.2) * 0.8); L.push([q[0], q[1] - w * 0.55]); R.push([q[0], q[1] + w * 0.45]); });
      PP.with(ctx, () => { PP.path(ctx, [...L, ...R.reverse()]); ctx.fillStyle = B.col; ctx.globalAlpha = 0.9; ctx.fill(); });
      for (let i = 0; i < 6; i++) { const q = mid[1 + i * 4]; if (q) PP.ink(ctx, [[q[0] - o * 2, q[1] + 2], [q[0] + o * 4, q[1] - 2]], { w: 1.1, seed: 360 + sx * 10 + i, boil: b, color: B.col, dry: false, alpha: 0.55 }); }
    }
  }

  function nose(ctx, F, b) {
    const y = F.noseY, L = F.noseLen;
    PP.with(ctx, () => {
      ctx.translate(wf(0) + TURN * 9, 0);
      // the bridge: a soft shadow down the shaded side, then the tip and nostrils
      const gr = ctx.createLinearGradient(4, 0, 14, 0); gr.addColorStop(0, F.shade); gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr; ctx.fillRect(3, y - L, 10, L);
      PP.ink(ctx, PP.curve([[5, y - L - 2], [8, y - L * 0.45], [10, y - 7]], 6), { w: 1.8, seed: 350, boil: b, color: F.ink, dry: false, alpha: 0.22, taper: 0.9 });
      PP.ink(ctx, PP.curve([[-7, y - 2], [1, y + 2], [9, y - 3]], 6), { w: 2.3, seed: 351, boil: b, color: F.ink, dry: false, alpha: 0.7, taper: 0.6 });
      ctx.fillStyle = PP.hex('#4a2a26', 0.36); for (const x of [-6, 8]) { ctx.beginPath(); ctx.ellipse(x, y - 2, 2.6, 1.6, 0, 0, 7); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,245,235,0.5)'; ctx.beginPath(); ctx.ellipse(1, y - 8, 3, 2.2, 0, 0, 7); ctx.fill();
    });
  }

  function mouth(ctx, F, p, b) {
    const m = p.mouth || 'soft', y = F.mouthY, f = F.lipFull;
    ctx.save();
    ctx.translate(wf(0) + TURN * 4, 0);
    ctx.scale(1 - 0.16 * Math.abs(TURN), 1);
    try {
      if (m === 'o' || m === 'gasp') {
        const r = m === 'gasp' ? [10, 9] : [8, 11];
        shape(ctx, PP.ellipsePoly(0, y + 5, r[0], r[1], 14), '#5e2028', { raw: true, boil: b, seed: 360, w: 2.2, color: F.ink });
        PP.with(ctx, () => { ctx.fillStyle = PP.hex(F.lips[0], 0.7); ctx.beginPath(); ctx.ellipse(0, y + 5 + r[1] + 1, r[0] * 0.9, 3, 0, 0, 7); ctx.fill(); });
        return;
      }
      if (m === 'grin' || m === 'laugh' || m === 'parted') {
        const h = m === 'laugh' ? 18 : m === 'grin' ? 12 : 6;
        const W = F.mouthW + (m === 'parted' ? -3 : 3);
        const lips = [[-W, y - 3], [-W * 0.4, y - 6], [0, y - 4], [W * 0.4, y - 6], [W, y - 3], [W * 0.6, y + h], [0, y + h + 3], [-W * 0.6, y + h]];
        shape(ctx, lips, '#6e2430', { boil: b, seed: 361, w: 2.4, color: F.ink, n: 6 });
        PP.with(ctx, () => { PP.path(ctx, PP.curve(lips, 6, true)); ctx.clip(); ctx.fillStyle = '#fbf6f0'; ctx.fillRect(-W, y - 8, W * 2, 8 + h * 0.25); ctx.fillStyle = PP.hex(F.lips[0], 0.9); ctx.beginPath(); ctx.ellipse(0, y + h + 6, W * 0.7, 6, 0, 0, 7); ctx.fill(); });
        return;
      }
      const lift = m === 'smile' ? 4.5 : m === 'soft' ? 1.5 : m === 'smirk' ? 3 : m === 'sad' ? -3 : m === 'tight' ? 0 : 0;
      const w = m === 'small' ? F.mouthW * 0.7 : F.mouthW;
      const asym = m === 'smirk' ? 5 : 0;
      PP.with(ctx, () => {
        const up = PP.curve([[-w, y - lift * 0.4], [-w * 0.45, y - 4 * f], [-2, y - 2.2 * f], [2, y - 2.2 * f], [w * 0.45, y - 4 * f], [w + asym, y - lift * 0.4 - asym], [0, y + 1]], 5, true);
        const lo = PP.curve([[-w * 0.86, y + 1 - lift * 0.3], [0, y + 1], [w * 0.86 + asym, y + 1 - lift * 0.3 - asym], [w * 0.42, y + 7.5 * f + 1], [-w * 0.42, y + 7.5 * f + 1]], 5, true);
        for (const [poly, top] of [[up, true], [lo, false]]) {
          PP.path(ctx, poly);
          const gr = ctx.createLinearGradient(0, y - 6 * f, 0, y + 8 * f);
          gr.addColorStop(0, top ? F.lips[1] : F.lips[0]);
          gr.addColorStop(1, top ? F.lips[0] : F.lips[1]);
          ctx.fillStyle = gr;
          ctx.fill();
        }
        if (F.gloss) { ctx.fillStyle = `rgba(255,245,240,${F.gloss})`; ctx.beginPath(); ctx.ellipse(3, y + 4 * f + 1, w * 0.26, 1.7 * f + 0.4, -0.1, 0, 7); ctx.fill(); }
      });
      const line = m === 'tight' ? [[-w - 1, y + 1], [w + 1, y + 1]] : [[-w - 1, y - lift], [-w * 0.4, y + 1], [w * 0.4, y + 1], [w + 1 + asym, y - lift - asym]];
      PP.ink(ctx, PP.curve(line, 6), { w: 2.4, seed: 362, boil: b, color: F.ink, dry: false, taper: 0.7 });
    } finally { ctx.restore(); }
  }

  function face(ctx, F, p, b) {
    TURN = p.turn || 0;
    const contour = PP.svgPts(F.face, 4).map(([x, y]) => [wc(x) + (y > 60 ? TURN * (y - 60) * 0.1 : 0), y]);
    PP.with(ctx, () => {
      PP.path(ctx, contour);
      ctx.fillStyle = PP.pattern(ctx, F.skin);
      ctx.fill();
      ctx.clip();
      // form: a light on the brow and cheeks, the far side in shade, a shadow under the hairline
      ctx.filter = 'blur(12px)';
      ctx.fillStyle = 'rgba(255,240,225,0.35)';
      ctx.beginPath(); ctx.ellipse(wf(-20), -30, 60, 46, 0, 0, 7); ctx.fill();
      ctx.fillStyle = F.shade;
      ctx.beginPath(); ctx.ellipse(110 + TURN * 30, 30, 62, 150, 0.1, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, -132, 120, 44, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(wf(0), 120, 70, 30, 0, 0, 7); ctx.fill();
      ctx.filter = 'none';
      const bl = p.blush ?? F.blush;
      if (bl > 0) for (const sx of [-1, 1]) {
        const bx = wf(sx * 46);
        const gr = ctx.createRadialGradient(bx, 44, 2, bx, 44, (26 + bl * 8) * farK(sx));
        gr.addColorStop(0, `rgba(240,118,118,${0.18 + bl * 0.3})`);
        gr.addColorStop(1, 'rgba(240,118,118,0)');
        ctx.fillStyle = gr; ctx.fillRect(bx - 50, -6, 100, 100);
      }
      if (p.phoneLit) { const gr = ctx.createLinearGradient(0, 120, 0, -60); gr.addColorStop(0, 'rgba(170,215,255,0.55)'); gr.addColorStop(1, 'rgba(170,215,255,0)'); ctx.fillStyle = gr; ctx.fillRect(-120, -120, 240, 240); }
    });
    PP.ink(ctx, [...contour, contour[0], contour[1]], { w: 3.2, seed: 380, boil: b, color: F.ink, jitter: 0.6, wobble: 0.7, taper: 0.25, dry: false });
    if (F === SPEC.kabir || F === SPEC.stranger) {
      PP.ink(ctx, PP.curve([[wf(56), 32], [wf(50), 52], [wf(42), 62]], 6), { w: 1.5, seed: 385, boil: b, color: F.ink, dry: false, alpha: 0.12, taper: 0.9 });
      PP.ink(ctx, PP.curve([[-7, 100], [0, 103], [7, 100]], 4), { w: 1.6, seed: 386, boil: b, color: F.ink, dry: false, alpha: 0.3, taper: 0.8 });
    }
    brows(ctx, F, p, b);
    eye(ctx, F, p, -1, b);
    eye(ctx, F, p, 1, b);
    nose(ctx, F, b);
    mouth(ctx, F, p, b);
    if (p.sweat) shape(ctx, [[86, -46], [97, -22], [90, -10], [80, -20]], '#9fd0ea', { boil: b, seed: 390, w: 2.2 });
  }

  function ear(ctx, F, x, y, s, b, seed, k = 0.8) {
    shape(ctx, [[x, y - 18 * k], [x + s * 13 * k, y - 23 * k], [x + s * 18 * k, y - 2 * k], [x + s * 12 * k, y + 22 * k], [x, y + 18 * k]], F.skin, { boil: b, seed, w: 2.4, color: F.ink, shade: (c) => { c.fillStyle = F.shade; c.fillRect(x - 30, y - 30, 60, 60); } });
    PP.ink(ctx, PP.curve([[x + s * 4, y - 10], [x + s * 11, y - 8], [x + s * 9, y + 10]], 5), { w: 1.6, seed: seed + 1, boil: b, color: F.ink, alpha: 0.45, dry: false });
  }

  // ---------------------------------------------------------------- heads
  function hairFill(ctx, d, H, b, seed, o = {}) {
    const pts = PP.svgPts(d, 4);
    PP.with(ctx, () => {
      PP.path(ctx, pts);
      const gr = ctx.createLinearGradient(0, o.y0 ?? -150, 0, o.y1 ?? 260);
      gr.addColorStop(0, H.root); gr.addColorStop(0.35, H.mid); gr.addColorStop(1, H.tip);
      ctx.fillStyle = gr; ctx.fill();
      ctx.globalAlpha = 0.3; ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = PP.pattern(ctx, 'hair'); ctx.fill();
    });
    PP.ink(ctx, pts, { w: o.w ?? 2.4, color: H.ink, seed, boil: b, dry: false, taper: 0.3, jitter: 0.5 });
    return pts;
  }
  // strand lines that follow the flow (lighter on the lit side, darker in the shade)
  function flow(ctx, list, col, b, seed, w = 2) { list.forEach((d, i) => PP.ink(ctx, PP.svgPts(d, 4), { w, color: col, seed: seed + i, boil: b, dry: false, taper: 0.92, jitter: 0.4 })); }

  function miraBack(ctx, p, b) {
    const H = SPEC.mira.hair;
    PP.with(ctx, () => {
      ctx.translate(-(p.turn || 0) * 10, 0);
      hairFill(ctx, 'M -78 -34 C -94 -120 -38 -150 10 -148 C 66 -146 98 -102 86 -34 C 98 36 90 104 104 160 C 112 204 98 246 72 262 C 38 276 -38 276 -72 262 C -100 248 -116 204 -104 160 C -92 108 -96 36 -78 -34 Z', H, b, 401);
      flow(ctx, ['M -96 40 C -104 100 -96 160 -112 220', 'M 98 40 C 104 100 98 160 110 220', 'M -70 150 C -76 190 -66 230 -76 258', 'M 70 150 C 76 190 66 230 76 258'], 'rgba(150,100,80,0.55)', b, 405, 2.2);
    });
  }
  function miraFront(ctx, p, b) {
    const H = SPEC.mira.hair;
    PP.with(ctx, () => {
      ctx.translate((p.turn || 0) * 6, 0);
      // the right side of the crown, from the parting, tucked behind her ear
      const right = hairFill(ctx, 'M 22 -132 C 60 -132 88 -104 90 -58 C 92 -30 86 -6 78 8 C 74 -22 68 -50 54 -70 C 42 -86 30 -96 22 -102 Z', H, b, 420, { y0: -140, y1: 20 });
      // the sweep: across her forehead, down the left side of her face and over her shoulder
      const left = hairFill(ctx, 'M 22 -132 C -20 -134 -68 -110 -80 -60 C -88 -28 -87 22 -88 62 C -90 112 -100 152 -110 196 C -92 176 -78 136 -74 94 C -70 54 -68 12 -60 -20 C -52 -50 -28 -64 -2 -71 C 10 -75 18 -90 22 -102 Z', H, b, 425, { y0: -140, y1: 200 });
      flow(ctx, ['M 14 -126 C -24 -116 -58 -92 -74 -50', 'M 6 -112 C -28 -98 -54 -76 -66 -40', 'M -84 -10 C -88 40 -88 100 -104 170', 'M 40 -124 C 66 -112 84 -86 90 -46'], 'rgba(160,112,88,0.6)', b, 430, 2.2);
      flow(ctx, ['M -78 20 C -82 70 -86 120 -96 160'], 'rgba(20,8,6,0.5)', b, 436, 1.8);
      // the sheen: a soft band of light across the crown
      PP.with(ctx, () => {
        PP.path(ctx, [...right, ...left]);
        ctx.clip();
        ctx.filter = 'blur(5px)';
        ctx.strokeStyle = H.sheen; ctx.lineCap = 'round';
        ctx.lineWidth = 15; ctx.beginPath(); ctx.ellipse(6, -14, 80, 104, 0, Math.PI * 1.15, Math.PI * 1.55); ctx.stroke();
        ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(6, -14, 80, 104, 0, Math.PI * 1.62, Math.PI * 1.82); ctx.stroke();
      });
      // the coral clip above her ear
      PP.with(ctx, () => { ctx.translate(72, -76); ctx.rotate(0.6); shape(ctx, [[-16, -5], [16, -7], [18, 3], [-16, 5]], 'coral', { raw: true, boil: b, seed: 438, w: 2.2 }); });
    });
  }
  function miraHead(ctx, p, b) {
    if (p.back !== false) miraBack(ctx, p, b);
    face(ctx, SPEC.mira, p, b);
    if (!((p.turn || 0) > 0.45)) {
      ear(ctx, SPEC.mira, 59 * (1 - 0.13 * Math.max(0, p.turn || 0)) + 6 * (p.turn || 0), 18, 1, b, 448, 0.75);
      PP.with(ctx, () => { ctx.fillStyle = '#ead28a'; ctx.beginPath(); ctx.arc(62 + 6 * (p.turn || 0), 36, 3.8, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(61 + 6 * (p.turn || 0), 35, 1.3, 0, 7); ctx.fill(); });
    }
    miraFront(ctx, p, b);
  }

  function kabirHead(ctx, p, b) {
    const H = SPEC.kabir.hair, T = p.turn || 0;
    hairFill(ctx, 'M -82 0 C -96 -80 -60 -154 6 -156 C 72 -158 100 -96 86 0 C 82 18 -78 18 -82 0 Z', H, b, 501, { y0: -160, y1: 20 });
    if (T > -0.4) ear(ctx, SPEC.kabir, -66 * (1 - 0.13 * Math.max(0, -T)) + 6 * T, 14, -1, b, 510, 0.78);
    face(ctx, SPEC.kabir, p, b);
    if (T < 0.4) ear(ctx, SPEC.kabir, 66 * (1 - 0.13 * Math.max(0, T)) + 6 * T, 14, 1, b, 512, 0.78);
    PP.with(ctx, () => {
      ctx.translate(T * 6, 0);
      // a full crown and a fringe of tapered locks falling to his brows
      const crown = hairFill(ctx, 'M -78 2 C -92 -84 -54 -152 8 -154 C 72 -156 96 -100 82 2 C 78 -18 72 -40 64 -56 C 48 -48 32 -44 18 -46 C -6 -44 -30 -48 -52 -52 C -64 -36 -72 -18 -78 2 Z', H, b, 520, { y0: -160, y1: -10 });
      const locks = [
        'M 30 -140 C -10 -132 -48 -104 -62 -40 C -44 -62 -24 -80 6 -92 C 18 -98 26 -112 30 -140 Z',
        'M 20 -122 C 0 -102 -14 -78 -22 -36 C -8 -58 6 -74 24 -88 Z',
        'M 36 -122 C 38 -98 32 -72 22 -40 C 40 -62 50 -84 52 -110 Z',
        'M 48 -132 C 66 -114 74 -88 74 -50 C 82 -76 82 -104 70 -126 Z',
      ];
      locks.forEach((d, i) => hairFill(ctx, d, H, b, 525 + i * 3, { y0: -140, y1: -30, w: 2 }));
      flow(ctx, ['M -50 -134 C -20 -150 30 -152 70 -130', 'M -60 -116 C -30 -136 20 -140 74 -112', 'M 84 -60 C 90 -40 88 -20 86 -6', 'M -82 -60 C -84 -40 -84 -20 -82 -6'], 'rgba(150,135,130,0.5)', b, 530, 2);
      PP.with(ctx, () => {
        PP.path(ctx, crown); ctx.clip();
        ctx.filter = 'blur(5px)'; ctx.strokeStyle = H.sheen; ctx.lineCap = 'round';
        ctx.lineWidth = 13; ctx.beginPath(); ctx.ellipse(8, -40, 84, 104, 0, Math.PI * 1.18, Math.PI * 1.6); ctx.stroke();
      });
    });
  }

  function strangerHead(ctx, p, b) {
    const H = SPEC.stranger.hair;
    shape(ctx, [[-80, -20], [-86, -90], [-50, -130], [0, -138], [50, -130], [86, -90], [80, -20], [70, 20], [-70, 20]], H.root, { boil: b, seed: 601, color: H.ink, w: 2 });
    face(ctx, SPEC.stranger, p, b);
    // a flat cap: the brim's shadow hides his eyes
    PP.with(ctx, () => {
      const gr = ctx.createLinearGradient(0, -40, 0, 30);
      gr.addColorStop(0, 'rgba(8,10,20,0.78)');
      gr.addColorStop(1, 'rgba(8,10,20,0)');
      ctx.fillStyle = gr;
      PP.path(ctx, PP.svgPts(SPEC.stranger.face, 4));
      ctx.fill();
    });
    shape(ctx, [[-96, -48], [-90, -120], [-40, -160], [30, -164], [88, -132], [104, -70], [96, -46]], 'capTweed', { boil: b, seed: 610, color: '#0c0c10', w: 2.4 });
    shape(ctx, [[-104, -50], [104, -50], [120, -30], [60, -18], [-60, -18], [-118, -30]], 'capTweed', { boil: b, seed: 611, color: '#0c0c10', w: 2.4, shade: (c) => { c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(-130, -40, 260, 30); } });
    // the only light in his eyes: a cold glint
    if (p.glint !== false) PP.with(ctx, () => { ctx.fillStyle = 'rgba(220,235,255,0.9)'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(wf(sx * 30) + 3, 4, 2.2, 0, 7); ctx.fill(); } });
  }

  // ---------------------------------------------------------------- busts and wardrobe
  const HEAD_Y = -330;
  function watch(ctx, b) {
    // the watch, stopped at 11:11: a leather strap and a small round face
    shape(ctx, [[-6, -14], [8, -14], [8, 14], [-6, 14]], 'strap', { raw: true, boil: b, seed: 700, w: 2 });
    PP.with(ctx, () => {
      ctx.translate(2, 0);
      ctx.fillStyle = '#d8c38a'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, 7); ctx.fill();
      ctx.fillStyle = '#f6f0e2'; ctx.beginPath(); ctx.arc(0, 0, 8.4, 0, 7); ctx.fill();
      ctx.strokeStyle = '#2a2020'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      const hand = (a, l) => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(a) * l, -Math.cos(a) * l); ctx.stroke(); };
      hand(((11 + 11 / 60) / 12) * Math.PI * 2, 4.6);
      hand((11 / 60) * Math.PI * 2, 6.8);
    });
  }
  PP.watch = watch;

  const ARMS = {
    mira: {
      down: { L: [[-60, -136], [-100, -50], [-88, 20]], R: [[60, -136], [100, -50], [88, 20]] },
      phoneUp: { L: [[-60, -136], [-100, -50], [-88, 20]], R: [[60, -136], [104, -60], [46, -98]] },
      phoneEar: { L: [[-60, -136], [-100, -50], [-88, 20]], R: [[60, -136], [112, -120], [74, -268]] },
      cup: { L: [[-60, -136], [-92, -60], [-24, -80]], R: [[60, -136], [92, -60], [24, -80]] },
      startled: { L: [[-60, -136], [-90, -80], [-30, -150]], R: [[60, -136], [96, -70], [40, -132]] },
      gasp: { L: [[-60, -136], [-84, -100], [-26, -196]], R: [[60, -136], [100, -60], [90, 20]] },
    },
    kabir: {
      down: { L: [[-90, -150], [-130, -50], [-120, 30]], R: [[90, -150], [130, -50], [120, 30]] },
      reach: { L: [[-90, -150], [-130, -50], [-120, 30]], R: [[90, -150], [180, -120], [270, -100]] },
      pull: { L: [[-90, -150], [-130, -50], [-120, 30]], R: [[90, -150], [160, -60], [110, -10]] },
      watch: { L: [[-90, -150], [-120, -60], [-40, -110]], R: [[90, -150], [130, -50], [120, 30]] },
    },
  };

  function miraBust(ctx, p, b) {
    const A = ARMS.mira[p.arms || 'down'];
    PP.with(ctx, () => { ctx.translate(0, HEAD_Y); ctx.rotate(p.tilt || 0); miraBack(ctx, p, b); });
    // neck and collarbones
    shape(ctx, [[-22, -240], [22, -240], [27, -142], [-27, -142]], 'skinM', { boil: b, seed: 801, w: 2.4, color: SPEC.mira.ink, shade: (c) => { c.fillStyle = 'rgba(200,110,90,0.38)'; c.beginPath(); c.ellipse(0, -232, 42, 26, 0, 0, 7); c.fill(); } });
    // the blue dress: soft shoulders, a scooped neckline, a few folds
    shape(ctx, [[-30, -148], [-70, -150], [-108, -128], [-118, -60], [-116, 0], [116, 0], [118, -60], [108, -128], [70, -150], [30, -148], [0, -118]], 'dressBlue', { boil: b, seed: 802, color: '#1c2346', shade: (c) => { c.fillStyle = 'rgba(10,20,60,0.25)'; c.fillRect(30, -160, 120, 170); } });
    for (const [x0, y0, x1, y1] of [[-40, -60, -50, 0], [30, -80, 44, 0], [-80, -110, -90, -40]]) PP.ink(ctx, PP.curve([[x0, y0], [(x0 + x1) / 2 + 4, (y0 + y1) / 2], [x1, y1]], 5), { w: 1.8, seed: 803 + x0, boil: b, color: 'rgba(15,22,60,0.5)', dry: false, taper: 0.9 });
    // the red scarf, loose around her neck, one end hanging down the front
    shape(ctx, [[-44, -182], [44, -182], [52, -150], [30, -132], [-30, -132], [-52, -150]], 'scarfRed', { boil: b, seed: 804, color: '#4a1012', shade: (c) => { c.strokeStyle = 'rgba(90,10,10,0.35)'; c.lineWidth = 2; for (let x = -52; x < 56; x += 7) { c.beginPath(); c.moveTo(x, -184); c.lineTo(x + 3, -130); c.stroke(); } } });
    shape(ctx, [[14, -146], [44, -142], [50, -60], [42, 6], [14, 4], [20, -60]], 'scarfRed', { boil: b, seed: 805, color: '#4a1012', shade: (c) => { c.strokeStyle = 'rgba(90,10,10,0.35)'; c.lineWidth = 2; for (let y = -140; y < 6; y += 7) { c.beginPath(); c.moveTo(10, y); c.lineTo(54, y + 2); c.stroke(); } } });
    for (let k = 0; k < 5; k++) PP.ink(ctx, [[16 + k * 7, 4], [16 + k * 7, 22]], { w: 2.4, seed: 806 + k, boil: b, color: '#a52a26', dry: false });
    PP.with(ctx, () => { ctx.translate(0, HEAD_Y); ctx.rotate(p.tilt || 0); miraHead(ctx, { ...p, back: false }, b); });
    PP.limb(ctx, A.L, { boil: b, seed: 810, paper: 'dressBlue', handKind: p.arms === 'cup' ? 'hold' : 'open', handFlip: true, w0: 30, w1: 22, skin: 'skinM', cuff: 'dressBlue' });
    PP.limb(ctx, A.R, { boil: b, seed: 811, paper: 'dressBlue', handKind: p.arms?.startsWith('phone') || p.arms === 'cup' ? 'hold' : 'open', w0: 30, w1: 22, skin: 'skinM', cuff: 'dressBlue' });
  }

  function kabirBust(ctx, p, b) {
    const A = ARMS.kabir[p.arms || 'down'];
    shape(ctx, [[-32, -250], [32, -250], [36, -150], [-36, -150]], 'skinK', { boil: b, seed: 901, w: 2.4, color: SPEC.kabir.ink, shade: (c) => { c.fillStyle = 'rgba(130,70,48,0.42)'; c.beginPath(); c.ellipse(0, -240, 52, 30, 0, 0, 7); c.fill(); } });
    // dark turtleneck, then the charcoal coat with its lapels open
    shape(ctx, [[-44, -214], [44, -214], [52, -160], [96, -150], [110, 0], [-110, 0], [-96, -150], [-52, -160]], 'knitDark', { boil: b, seed: 902, color: '#0d0e12', shade: (c) => { c.strokeStyle = 'rgba(255,255,255,0.06)'; c.lineWidth = 3; for (let x = -110; x < 110; x += 9) { c.beginPath(); c.moveTo(x, -214); c.lineTo(x, 0); c.stroke(); } } });
    shape(ctx, [[-46, -214], [46, -214], [48, -184], [-48, -184]], 'knitDark', { boil: b, seed: 903, color: '#0d0e12', w: 2.2, shade: (c) => { c.strokeStyle = 'rgba(255,255,255,0.1)'; c.lineWidth = 2; for (let y = -212; y < -184; y += 6) { c.beginPath(); c.moveTo(-48, y); c.lineTo(48, y); c.stroke(); } } });
    for (const s of [-1, 1]) {
      shape(ctx, [[s * 56, -176], [s * 128, -150], [s * 140, -60], [s * 136, 0], [s * 64, 0], [s * 52, -80], [s * 70, -110], [s * 46, -150]], 'coat', { boil: b, seed: 904 + s, color: '#15161b', shade: (c) => { c.fillStyle = s > 0 ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.05)'; c.fillRect(s > 0 ? 0 : -150, -180, 150, 190); } });
      PP.ink(ctx, [[s * 70, -110], [s * 92, -122], [s * 84, -146]], { w: 2, seed: 908 + s, boil: b, color: '#15161b', dry: false });
    }
    PP.with(ctx, () => { ctx.translate(0, HEAD_Y - 14); ctx.rotate(p.tilt || 0); kabirHead(ctx, p, b); });
    PP.limb(ctx, A.L, { boil: b, seed: 910, paper: 'coat', handKind: 'open', handFlip: true, w0: 40, w1: 30, skin: 'skinK', cuff: 'knitDark', watch: true });
    PP.limb(ctx, A.R, { boil: b, seed: 911, paper: 'coat', handKind: p.arms === 'pull' ? 'hold' : 'open', w0: 40, w1: 30, skin: 'skinK', cuff: 'knitDark' });
  }

  function strangerBust(ctx, p, b) {
    shape(ctx, [[-30, -240], [30, -240], [34, -160], [-34, -160]], 'skinT', { boil: b, seed: 1001, w: 2.4, color: '#141418', shade: (c) => { c.fillStyle = 'rgba(40,46,80,0.5)'; c.beginPath(); c.ellipse(0, -232, 50, 30, 0, 0, 7); c.fill(); } });
    shape(ctx, [[-60, -200], [60, -200], [120, -150], [128, 0], [-128, 0], [-120, -150]], 'coatBlack', { boil: b, seed: 1002, color: '#060608' });
    // the collar turned up
    for (const s of [-1, 1]) shape(ctx, [[s * 20, -170], [s * 66, -236], [s * 92, -200], [s * 80, -150]], 'coatBlack', { boil: b, seed: 1003 + s, color: '#060608', w: 2.2, shade: (c) => { c.fillStyle = 'rgba(255,255,255,0.05)'; c.fillRect(-100, -240, 200, 100); } });
    PP.with(ctx, () => { ctx.translate(0, HEAD_Y - 6); ctx.rotate(p.tilt || 0); strangerHead(ctx, p, b); });
  }

  // ---------------------------------------------------------------- stickers and lighting
  const DRAW = { mira: miraBust, kabir: kabirBust, stranger: strangerBust };
  const HEADS = { mira: miraHead, kabir: kabirHead, stranger: strangerHead };
  /** A character as a sticker: who = mira|kabir|stranger, part = bust|head. Origin: bust bottom centre / face. */
  PP.person = function (who, part, pose, boil, scale = 1) {
    const key = `p:${who}:${part}:${JSON.stringify(pose)}:${boil}:${scale}`;
    const bust = part === 'bust';
    const w = (bust ? 640 : 340) * scale, h = (bust ? 760 : 380) * scale;
    const ox = w / 2, oy = bust ? 700 * scale : 200 * scale;
    const s = PP.sticker(key, w, h, ox, oy, (ctx) => {
      ctx.scale(scale, scale);
      // the cut: a bust ends at the chest, a head just below the chin, on a gently torn line
      const cutY = bust ? 0 : 160;
      PP.path(ctx, [[-400, -800], [400, -800], ...Array.from({ length: 41 }, (_, i) => [400 - i * 20, cutY + PP.noise1(i * 0.7, 9) * 4])]);
      ctx.clip();
      (bust ? DRAW : HEADS)[who](ctx, pose, boil);
    }, { border: 8 * scale, shadowBlur: 12 * scale, shadowDx: 6 * scale, shadowDy: 10 * scale });
    s.key = key;
    return s;
  };

  // Lighting over a sticker: night darkens and cools it; a key light (phone, street, window) adds colour from a
  // point. Cached per sprite and light.
  PP.lit = function (sprite, light) {
    if (!light) return sprite;
    return PP.sprite(`lit:${JSON.stringify(light)}:${sprite.key}`, () => {
      const c = PP.canvas(sprite.canvas.width, sprite.canvas.height), ctx = c.getContext('2d');
      ctx.drawImage(sprite.canvas, 0, 0);
      ctx.globalCompositeOperation = 'source-atop';
      if (light.ambient) { ctx.fillStyle = light.ambient; ctx.fillRect(0, 0, c.width, c.height); }
      if (light.key) {
        const [kx, ky] = [sprite.ox + light.key[0], sprite.oy + light.key[1]];
        const gr = ctx.createRadialGradient(kx, ky, 0, kx, ky, light.radius || 500);
        gr.addColorStop(0, light.color || 'rgba(170,210,255,0.55)');
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, c.width, c.height);
      }
      if (light.rim) {
        // a thin rim of light along one side, from a source behind
        const gr = ctx.createLinearGradient(light.rim[0] < 0 ? 0 : c.width, 0, c.width / 2, 0);
        gr.addColorStop(0, light.rimColor || 'rgba(255,190,120,0.5)');
        gr.addColorStop(0.25, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, c.width, c.height);
      }
      return { canvas: c, ox: sprite.ox, oy: sprite.oy };
    });
  };
  PP.LIGHTS = {
    phone: { ambient: 'rgba(14,20,52,0.55)', key: [0, -150], radius: 420, color: 'rgba(160,205,255,0.62)' },
    night: { ambient: 'rgba(16,22,60,0.42)', rim: [1, 0], rimColor: 'rgba(120,160,255,0.35)' },
    street: { ambient: 'rgba(30,20,40,0.32)', key: [-320, -500], radius: 700, color: 'rgba(255,186,110,0.5)', rim: [-1, 0], rimColor: 'rgba(255,170,90,0.45)' },
    cafe: { ambient: 'rgba(60,30,10,0.12)', key: [-300, -500], radius: 900, color: 'rgba(255,220,170,0.35)' },
    train: { ambient: 'rgba(20,30,40,0.35)', key: [0, -700], radius: 800, color: 'rgba(210,240,230,0.35)' },
  };
})(typeof window !== 'undefined' ? window : globalThis);
