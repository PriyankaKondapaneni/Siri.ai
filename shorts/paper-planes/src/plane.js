// The paper plane: a classic dart in 3D (two wings, two keel faces), rotated, lit and drawn as textured paper with
// an ink outline. Flight paths give it a heading; turns bank it, so it reads as flying, not sliding.
(function (g) {
  const PP = g.PP;

  // local frame: x forward (nose), y along the right wing, z up. Unit length nose to tail = 2.
  const V = {
    N: [1.05, 0, 0],
    T: [-1, 0, 0.02],
    L: [-1.02, -0.86, 0.16],
    R: [-1.02, 0.86, 0.16],
    K: [-0.95, 0, -0.3],
    KF: [0.35, 0, -0.06],
  };
  const FACES = [
    { id: 'kl', v: ['N', 'T', 'K'], shade: 0.78, side: -1 },
    { id: 'kr', v: ['N', 'K', 'T'], shade: 0.7, side: 1 },
    { id: 'wl', v: ['N', 'L', 'T'], shade: 1, side: -1 },
    { id: 'wr', v: ['N', 'T', 'R'], shade: 0.92, side: 1 },
  ];
  const mul = (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
  const mm = (a, b) => [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]));
  const rx = (a) => [1, 0, 0, 0, Math.cos(a), -Math.sin(a), 0, Math.sin(a), Math.cos(a)];
  const ry = (a) => [Math.cos(a), 0, Math.sin(a), 0, 1, 0, -Math.sin(a), 0, Math.cos(a)];
  const rz = (a) => [Math.cos(a), -Math.sin(a), 0, Math.sin(a), Math.cos(a), 0, 0, 0, 1];

  /**
   * Draw a plane at (x, y), `size` px from nose to tail.
   * o: heading (radians, direction of flight on screen; 0 = right), roll (bank about its own axis), yaw (turn toward
   *    the viewer, + shows the top more), pitch (nose up), paper (PAPERS name), seed, boil, outline colour, alpha,
   *    scribble: text to show on the wings (the note it carries)
   */
  PP.plane = function (ctx, x, y, size, o = {}) {
    // base view: the plane flies to screen right with its top tilted toward us a little (we see from above)
    const base = [1, 0, 0, 0, 0, -1, 0, 1, 0]; // local -> camera before tilting: x->x, z->-y (up is screen up), y->z
    const R = mm(rz(o.heading || 0), mm(rx(o.view ?? -0.55), mm(base, mm(rz(o.yaw || 0), mm(ry(-(o.pitch || 0)), rx(o.roll || 0))))));
    const s = size / 2;
    const P = {};
    for (const k in V) { const p = mul(R, V[k]); P[k] = [x + p[0] * s, y + p[1] * s, p[2]]; }
    const light = [-0.35, -0.75, 0.55];
    const faces = FACES.map((f) => {
      const [a, b, c] = f.v.map((k) => mul(R, V[k]));
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const nl = Math.hypot(...n) || 1;
      n = n.map((q) => q / nl);
      const facing = n[2];
      const lit = Math.abs(n[0] * light[0] + n[1] * light[1] + n[2] * light[2]);
      const depth = (a[2] + b[2] + c[2]) / 3;
      return { ...f, pts: f.v.map((k) => P[k]), lit, depth, facing };
    }).sort((p, q) => p.depth - q.depth);
    const ink = o.ink || '#1d1a22';
    const b = o.boil ?? 0, seed = o.seed ?? 7;
    PP.with(ctx, () => {
      ctx.globalAlpha *= o.alpha ?? 1;
      // soft cast shadow below the plane
      if (o.shadow !== false) {
        PP.with(ctx, () => {
          ctx.globalAlpha *= 0.22;
          ctx.fillStyle = '#100a05';
          ctx.filter = 'blur(6px)';
          ctx.beginPath();
          ctx.ellipse(x + size * 0.04, y + size * (o.shadowDrop ?? 0.3), size * 0.4, size * 0.06, o.heading || 0, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      for (const f of faces) {
        PP.with(ctx, () => {
          ctx.beginPath();
          f.pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
          ctx.closePath();
          ctx.fillStyle = PP.pattern(ctx, o.paper || 'white');
          ctx.fill();
          ctx.clip();
          const shade = PP.clamp(0.7 + 0.42 * f.lit * f.shade - (f.id[0] === 'k' ? 0.1 : 0), 0, 1.1);
          ctx.fillStyle = shade < 1 ? `rgba(60,40,60,${(1 - shade) * 0.75})` : `rgba(255,250,235,${(shade - 1) * 2.2})`;
          ctx.fillRect(x - size, y - size, size * 2, size * 2);
          if (o.scribble && f.id === 'wl' && f.facing > 0.2) {
            // a few lines of the note it carries, faint, running along the wing
            const [n, l, t] = f.pts;
            const ang = Math.atan2(t[1] - n[1], t[0] - n[0]);
            ctx.translate((n[0] + l[0] + t[0]) / 3, (n[1] + l[1] + t[1]) / 3);
            ctx.rotate(ang + Math.PI);
            ctx.font = `${Math.round(size * 0.11)}px Caveat`;
            ctx.fillStyle = 'rgba(40,40,70,0.55)';
            ctx.textAlign = 'center';
            o.scribble.split('\n').forEach((line, i) => ctx.fillText(line, 0, (i - 0.5) * size * 0.12));
          }
        });
      }
      // outline and the centre crease, in boiling ink
      const w = Math.max(1.6, size * 0.022);
      for (const f of faces) {
        if (f.facing < -0.05 && f.id[0] === 'k') continue;
        PP.ink(ctx, [...f.pts, f.pts[0]].map((p) => [p[0], p[1]]), { w, color: ink, seed: seed + f.id.charCodeAt(1), boil: b, jitter: 0.7, wobble: 0.6, taper: 0.15, dry: false, step: 4 });
      }
    });
    return P;
  };

  // A flight: position, heading and bank along a Catmull-Rom path at u in [0, 1].
  PP.flight = function (ctrl, u) {
    const pts = PP.cached('flight:' + JSON.stringify(ctrl), () => {
      const c = PP.curve(ctrl, 24);
      const cum = [0];
      for (let i = 1; i < c.length; i++) cum.push(cum[i - 1] + Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1]));
      return { c, cum, L: cum[cum.length - 1] };
    });
    const target = PP.clamp(u) * pts.L;
    let i = pts.cum.findIndex((d) => d >= target);
    if (i <= 0) i = 1;
    const a = pts.c[i - 1], b = pts.c[i];
    const k = (target - pts.cum[i - 1]) / (pts.cum[i] - pts.cum[i - 1] || 1);
    const x = PP.lerp(a[0], b[0], k), y = PP.lerp(a[1], b[1], k);
    const h = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const j = Math.min(pts.c.length - 1, i + 6);
    const h2 = Math.atan2(pts.c[j][1] - b[1], pts.c[j][0] - b[0]);
    let turn = h2 - h;
    while (turn > Math.PI) turn -= Math.PI * 2;
    while (turn < -Math.PI) turn += Math.PI * 2;
    return { x, y, heading: h, bank: PP.clamp(turn * 3, -1, 1), path: pts.c };
  };
})(typeof window !== 'undefined' ? window : globalThis);
