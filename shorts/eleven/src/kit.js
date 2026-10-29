// Cut-paper helpers shared by the cast: a filled paper shape with an ink line, a tapered sleeve with a hand, slender
// hands, and two small props kept from the first draft (an old hand, cat's eyes).
(function (g) {
  const PP = g.PP;
  const INK = '#221c24';

  // a filled paper shape with an ink outline (closed curve through control points)
  function shape(ctx, ctrl, paper, o = {}) {
    const pts = o.raw ? ctrl : PP.curve(ctrl, o.n ?? 8, true);
    PP.with(ctx, () => {
      PP.path(ctx, pts);
      ctx.fillStyle = PP.PAPERS[paper] ? PP.pattern(ctx, paper) : paper;
      ctx.fill();
      if (o.shade) { ctx.clip(); o.shade(ctx); }
    });
    if (o.line !== false) PP.ink(ctx, [...pts, pts[0], pts[1]], { w: o.w ?? 3.2, color: o.color || INK, seed: o.seed ?? 1, boil: o.boil, jitter: 0.8, wobble: 1, taper: 0.2, dry: false, step: 5 });
    return pts;
  }
  PP.shape = shape;

  // a limb: a tapered sleeve along a polyline, with a mitten hand at the end
  function limb(ctx, pts, o) {
    const P = PP.curve(pts, 10);
    const w0 = o.w0 ?? 34, w1 = o.w1 ?? 26;
    const left = [], right = [];
    for (let i = 0; i < P.length; i++) {
      const a = P[Math.max(0, i - 1)], c = P[Math.min(P.length - 1, i + 1)];
      let dx = c[0] - a[0], dy = c[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      dx /= l; dy /= l;
      const h = PP.lerp(w0, w1, i / (P.length - 1)) / 2;
      left.push([P[i][0] - dy * h, P[i][1] + dx * h]);
      right.push([P[i][0] + dy * h, P[i][1] - dx * h]);
    }
    shape(ctx, [...left, ...right.reverse()], o.paper || 'mustard', { raw: true, boil: o.boil, seed: o.seed, shade: (c) => { c.fillStyle = 'rgba(120,60,0,0.16)'; c.fillRect(-400, -400, 800, 800); } });
    const e = P[P.length - 1], pe = P[P.length - 2];
    const ang = Math.atan2(e[1] - pe[1], e[0] - pe[0]);
    // the cuff
    PP.with(ctx, () => {
      ctx.translate(e[0], e[1]);
      ctx.rotate(ang);
      shape(ctx, [[-4, -w1 / 2 - 1], [6, -w1 / 2 - 1], [6, w1 / 2 + 1], [-4, w1 / 2 + 1]], o.cuff || 'cream', { raw: true, boil: o.boil, seed: (o.seed ?? 1) + 3, w: 2.5 });
      if (o.watch && PP.watch) PP.with(ctx, () => { ctx.translate(-16, 0); PP.watch(ctx, o.boil); });
      if (o.hand !== false) hand(ctx, o.handKind || 'open', o.boil, (o.seed ?? 1) + 9, o.handFlip ? -1 : 1, o.skin || 'skin');
    });
  }

  // a slender hand pointing along +x from the wrist; kinds: open, fist, hold (pinching something), point
  function hand(ctx, kind, boil, seed, flip = 1, skin = 'skin') {
    ctx.scale(1, flip);
    const finger = (pts, w, sd) => PP.with(ctx, () => {
      const P = PP.curve(pts, 6);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = INK; ctx.lineWidth = w + 4.4; ctx.beginPath(); P.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke();
      ctx.strokeStyle = PP.pattern(ctx, skin); ctx.lineWidth = w; ctx.stroke();
    });
    // fingers first (the palm covers their roots), then the palm, then the thumb
    if (kind === 'open') { finger([[20, -8], [40, -11], [52, -12]], 7.5); finger([[22, -2], [44, -2], [57, -1]], 7.5); finger([[22, 4], [43, 6], [54, 8]], 7.2); finger([[20, 9], [36, 13], [45, 16]], 6.4); }
    else if (kind === 'point') { finger([[20, -6], [44, -8], [60, -9]], 7.5); finger([[22, 0], [32, 6], [28, 12]], 7.5); finger([[21, 5], [30, 11], [25, 15]], 7); }
    else { finger([[20, -7], [34, -8], [36, 2]], 7.5); finger([[22, -1], [36, 0], [36, 9]], 7.5); finger([[21, 5], [33, 7], [31, 14]], 7); }
    shape(ctx, [[2, -11], [20, -13], [27, -4], [26, 8], [18, 14], [2, 12]], skin, { boil, seed, w: 2.4 });
    finger(kind === 'hold' ? [[12, -8], [24, -16], [34, -10]] : [[10, -9], [20, -19], [30, -22]], 7.6);
  }
  PP.hand = hand;
  PP.limb = limb;

  // ---------------------------------------------------------------- the someone: an old hand with bangles
  PP.oldHand = function (boil, grip = 0) {
    return PP.sticker('oldhand:' + boil + ':' + grip, 520, 300, 470, 150, (ctx) => {
      // a sleeve of patterned cotton
      shape(ctx, [[0, -70], [140, -60], [150, 60], [0, 70]], 'plum', { raw: true, boil, seed: 201, shade: (c) => { c.fillStyle = 'rgba(240,190,120,0.55)'; for (let k = 0; k < 30; k++) { c.beginPath(); c.arc(PP.rand('fl', k) * 150, -70 + PP.rand('fly', k) * 140, 4 + PP.rand('flr', k) * 4, 0, 7); c.fill(); } } });
      ctx.translate(-120 + 0, 0);
      // forearm and the back of the hand, fingers curling to pick something up (grip 0..1)
      shape(ctx, [[260, -52], [130, -44], [40, -40], [-10, -26], [-40, -4], [-36, 20], [10, 36], [130, 46], [260, 52]], 'skinOld', { boil, seed: 202 });
      for (let f = 0; f < 4; f++) {
        const fy = -24 + f * 15, curl = grip * (0.9 + f * 0.1);
        const p0 = [-30, fy], p1 = [-72 + curl * 20, fy - 4 + curl * 20], p2 = [-96 + curl * 52, fy + curl * 44];
        PP.with(ctx, () => { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 17; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(...p0); ctx.lineTo(...p1); ctx.lineTo(...p2); ctx.stroke(); ctx.lineWidth = 12; ctx.strokeStyle = PP.pattern(ctx, 'skinOld'); ctx.stroke(); });
      }
      // thumb
      PP.with(ctx, () => { ctx.lineCap = 'round'; ctx.lineWidth = 19; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(10, 30); ctx.lineTo(-30, 52 - grip * 10); ctx.lineTo(-60 + grip * 20, 58 - grip * 20); ctx.stroke(); ctx.lineWidth = 13; ctx.strokeStyle = PP.pattern(ctx, 'skinOld'); ctx.stroke(); });
      // wrinkles and knuckles
      for (let k = 0; k < 6; k++) PP.ink(ctx, PP.curve([[40 + k * 22, -30], [46 + k * 22, -10], [40 + k * 22, 10]], 4), { w: 1.6, color: '#7a4a38', seed: 210 + k, boil, alpha: 0.6, dry: false });
      // gold bangles
      for (let k = 0; k < 3; k++) shape(ctx, [[150 + k * 16, -58], [162 + k * 16, -58], [162 + k * 16, 58], [150 + k * 16, 58]], 'amber', { raw: true, boil, seed: 220 + k, w: 2.4, shade: (c) => { c.fillStyle = 'rgba(255,255,220,0.5)'; c.fillRect(150 + k * 16, -58, 4, 116); } });
    }, { border: 7 });
  };

  // Biscuit, in the dark: just two eyes that blink
  PP.catEyes = function (ctx, x, y, s, t, open = 1) {
    PP.with(ctx, () => {
      ctx.translate(x, y);
      ctx.scale(s, s);
      for (const sx of [-1, 1]) {
        const gr = ctx.createRadialGradient(sx * 26, 0, 0, sx * 26, 0, 40);
        gr.addColorStop(0, 'rgba(210,240,120,0.5)');
        gr.addColorStop(1, 'rgba(210,240,120,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(sx * 26 - 40, -40, 80, 80);
        ctx.fillStyle = '#d8f07a';
        ctx.beginPath();
        ctx.ellipse(sx * 26, 0, 13, 11 * open + 0.5, 0, 0, 7);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.ellipse(sx * 26, 0, 3.2, 10 * open + 0.3, 0, 0, 7);
        ctx.fill();
      }
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
