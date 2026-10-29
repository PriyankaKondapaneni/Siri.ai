// Episode 1, "The Grocery List": the scenes. Each is a pure function of time, drawn against the cue sheet (PP.CUES).
(function (g) {
  const PP = g.PP;
  const C = PP.CUES;
  const Wd = PP.WORLD;
  const INK = '#221c24';
  const E = PP.ease;
  const W = PP.W, H = PP.H;

  // camera keyframes: [[t, {x, y, z}, ease], ...]
  const cam = (t, keys) => {
    const k = keys.map(([tt, v, e]) => [tt, [v.x, v.y, v.z], e]);
    const [x, y, z] = PP.kf(t, k);
    return { x, y, z };
  };
  const HER_MIRA = [Wd.her.x + Wd.her.w / 2, Wd.her.y + Wd.her.h + 6]; // where her bust stands
  const HER_FACE = [HER_MIRA[0], HER_MIRA[1] - 159]; // her face at scale 0.5
  const HER_HAND = [HER_MIRA[0] + 115, HER_MIRA[1] - 115]; // her throwing hand
  const HIS_SILL = [Wd.his.x + 70, Wd.his.y + Wd.his.h - 10];

  // ---------------------------------------------------------------- shared pieces
  // a night sky board in screen space, for the cold open
  function nightBoard(ctx, t, o = {}) {
    const sky = PP.sky('night');
    ctx.drawImage(sky, (W - sky.width) / 2, (H - sky.height) / 2 - (o.rise ?? 0));
    PP.stars(ctx, W, H, t, 38, 9, { maxY: 0.7 });
    PP.drawSprite(ctx, PP.moon(PP.boil(t)), 860, 330, 0, 0.8);
    const city = PP.city('night');
    const k = 0.62;
    ctx.drawImage(city, W / 2 - (city.width * k) / 2, H - city.height * k + 40 + (o.cityDrop ?? 0), city.width * k, city.height * k);
  }

  // the planes of the cold open: 47 of them on their own arcs, then gathering into a heart
  const FLOCK = Array.from({ length: 47 }, (_, i) => {
    const r = (k) => PP.rand('flock', i, k);
    const depth = r(0);
    const y0 = 1500 + r(1) * 500, y1 = 200 + r(2) * 900;
    return {
      t0: 0.08 + i * 0.07 + r(3) * 0.15,
      dur: 2.7 - depth * 1.0,
      size: 70 + depth * 120,
      paper: ['white', 'notebook', 'newsprint', 'cream', 'white', 'graph', 'coral', 'notebook', 'sky'][Math.floor(r(4) * 9)],
      path: [[-180 - r(5) * 120, y0], [260 + r(6) * 200, y0 - 300 - r(7) * 300], [700 + r(8) * 200, y1 + 200], [1300 + r(9) * 200, y1]],
      heart: i / 47,
      seed: 30 + i,
    };
  }).sort((a, b) => a.size - b.size);
  const heartPt = (u) => {
    const th = u * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(th), 3), y = 13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th);
    return [540 + x * 24, 860 - y * 24];
  };
  function flock(ctx, t) {
    const b = PP.boil(t);
    const g0 = C.gather - 0.15, g1 = C.gather + 0.55, s0 = C.one - 0.35;
    for (const p of FLOCK) {
      const u = (t - p.t0) / p.dur;
      let x, y, heading, roll, size = p.size;
      const fl = PP.flight(p.path, PP.clamp(u));
      x = fl.x; y = fl.y; heading = fl.heading; roll = fl.bank + Math.sin(t * 3 + p.seed) * 0.15;
      if (t > g0) {
        // every plane swoops back into the heart, then bursts outward
        const k = E.inOut(PP.clamp((t - g0) / (g1 - g0)));
        const [hx, hy] = heartPt(p.heart + t * 0.03);
        const [nx, ny] = heartPt(p.heart + t * 0.03 + 0.01);
        x = PP.lerp(x, hx, k); y = PP.lerp(y, hy, k);
        heading = PP.lerp(heading, Math.atan2(ny - hy, nx - hx), k);
        size = PP.lerp(size, 76, k);
        if (t > s0) {
          const q = E.in(PP.clamp((t - s0) / 0.5));
          const a = Math.atan2(hy - 860, hx - 540);
          x += Math.cos(a) * q * 1400; y += Math.sin(a) * q * 1400; heading = a;
        }
      } else if (u < 0 || u > 1) continue;
      PP.plane(ctx, x, y, size, { heading, roll, yaw: 0.2, paper: p.paper, seed: p.seed, boil: b, shadowDrop: 0.5 });
    }
  }

  // the grocery list, from flat sheet to plane, in stop-motion states; local units, centre origin
  const LIST = ['grocery list', '• milk', '• eggs (lots)', '• bread', '• something nice?'];
  function foldedPaper(ctx, state, x, y, s, rot, t, o = {}) {
    const b = PP.boil(t);
    PP.with(ctx, () => {
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(s, s);
      const piece = (poly, seed, tint) => PP.paperPiece(ctx, poly, o.paper || 'notebook', { seed, rough: 1.2, rim: 0, shadow: { blur: 22, dx: 8, dy: 14, a: 0.35 }, tint });
      const line = (pts, a = 0.75, w = 2.6) => PP.ink(ctx, pts, { w, seed: PP.hash(pts[0][0], pts[0][1]), boil: b, color: INK, alpha: a, dry: false, jitter: 0.6 });
      if (state === 0) {
        piece([[-280, -360], [280, -360], [280, 360], [-280, 360]], 11);
        line([[-280, -360], [280, -360], [280, 360], [-280, 360], [-280, -360]], 0.8);
        if (o.text !== false) PP.handwrite(ctx, LIST, -220, -250, { font: '62px Caveat', lineHeight: 92, color: '#2b3366' });
        if (o.doodle !== false) PP.ink(ctx, PP.curve([[140, 140], [170, 110], [200, 140], [170, 180], [140, 140]], 6), { w: 3, seed: 12, boil: b, color: '#c23b2e', dry: false });
      } else if (state === 1) {
        piece([[-280, -360], [280, -360], [280, 360], [-280, 360]], 11);
        line([[-280, -360], [280, -360], [280, 360], [-280, 360], [-280, -360]], 0.8);
        line([[0, -360], [0, 360]], 0.4, 2);
        // the half being folded over, lifted, casting a shadow
        piece([[0, -360], [-230, -340], [-230, 380], [0, 360]], 13, 'rgba(255,255,255,0.15)');
        line([[0, -360], [-230, -340], [-230, 380], [0, 360]], 0.8);
      } else if (state === 2) {
        const house = [[-280, -70], [0, -360], [280, -70], [280, 360], [-280, 360]];
        piece(house, 14);
        line([...house, house[0]], 0.8);
        line([[-280, -70], [0, -70], [280, -70]], 0.45, 2);
        line([[0, -360], [0, 360]], 0.45, 2);
        PP.with(ctx, () => { ctx.fillStyle = 'rgba(60,40,60,0.12)'; PP.path(ctx, [[-280, -70], [0, -360], [0, -70]]); ctx.fill(); });
      } else if (state === 3) {
        const dart = [[-170, 180], [0, -360], [170, 180], [170, 360], [-170, 360]];
        piece(dart, 15);
        line([...dart, dart[0]], 0.8);
        line([[0, -360], [0, 360]], 0.5, 2);
        line([[-170, 180], [0, -360]], 0.4, 2);
        line([[-90, 360], [0, -360], [90, 360]], 0.35, 2);
      } else {
        PP.plane(ctx, 0, 0, 760, { heading: -Math.PI / 2, view: -1.42, roll: 0.05, paper: o.paper || 'notebook', seed: 21, boil: b, shadowDrop: 0.08, scribble: o.scribble });
      }
    });
  }

  // two hands (and mustard cuffs) holding something at the bottom of the frame
  function hands(ctx, t, lx, ly, rx, ry, o = {}) {
    const b = PP.boil(t);
    PP.with(ctx, () => {
      ctx.scale(o.s ?? 2.4, o.s ?? 2.4);
      const k = 1 / (o.s ?? 2.4);
      PP.limb(ctx, [[lx * k - 120, H * k + 60], [lx * k - 70, ly * k + 120], [lx * k - 6, ly * k]], { boil: b, seed: 70, handKind: o.kind || 'hold', w0: 40, w1: 30 });
      PP.limb(ctx, [[rx * k + 120, H * k + 60], [rx * k + 70, ry * k + 120], [rx * k + 6, ry * k]], { boil: b, seed: 71, handKind: o.kind || 'hold', w0: 40, w1: 30, handFlip: true });
    });
  }

  // Leo's drawing of Mira: honest, enthusiastic, bad. Strokes in paper-local units (sheet 560 x 720).
  const BAD = [
    PP.circlePts(0, -150, 112, 120, 30).map(([x, y], i) => [x + Math.sin(i * 1.7) * 7, y]),
    PP.curve([[-120, -170], [-130, -260], [-60, -290], [0, -280], [70, -296], [128, -250], [118, -150], [126, -80]], 6),
    PP.curve([[-120, -170], [-128, -100], [-116, -60]], 4),
    [[-42, -170], [-36, -166]], [[38, -168], [44, -164]],
    PP.curve([[-60, -110], [-20, -70], [30, -70], [66, -112]], 6),
    [[0, -30], [0, 30]],
    [[0, 30], [-150, 260], [150, 260], [0, 30]],
    [[-50, 80], [-200, 40]], [[50, 80], [210, 10], [240, -30]],
    [[-50, 260], [-70, 340]], [[50, 260], [70, 340]],
  ];
  const LAMPQ = [
    [[-170, 320], [-110, 320]], [[-140, 320], [-150, 250], [-110, 210]], [[-135, 215], [-85, 215], [-70, 175], [-120, 175], [-135, 215]],
  ];
  const QMARK = [PP.curve([[90, 210], [100, 160], [160, 150], [180, 200], [140, 240], [130, 290]], 8), PP.circlePts(130, 330, 7, 7, 10)];
  function drawStrokes(ctx, strokes, progress, t, o = {}) {
    const total = strokes.length;
    strokes.forEach((s, i) => {
      const p = PP.clamp(progress * total - i);
      if (p > 0) PP.pencil(ctx, s, { w: o.w ?? 5, seed: 600 + i, boil: PP.boil(t), progress: p, color: o.color || '#2a2a44', alpha: 0.95, passes: 2 });
    });
  }
  function unfoldedList(ctx, x, y, s, rot, t, o = {}) {
    PP.with(ctx, () => {
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(s, s);
      PP.paperPiece(ctx, [[-280, -360], [280, -360], [280, 360], [-280, 360]], 'notebook', { seed: 31, rough: 1.4, rim: 0, shadow: { blur: 22, dx: 8, dy: 14, a: 0.35 } });
      // the creases of having been a plane
      for (const l of [[[0, -360], [0, 360]], [[-280, -70], [0, -360], [280, -70]], [[-170, 180], [0, -360], [170, 180]]]) PP.ink(ctx, l, { w: 2, seed: PP.hash(l[0]), color: 'rgba(80,70,90,0.35)', boil: PP.boil(t), dry: false });
      drawStrokes(ctx, BAD, o.bad ?? 1, t);
      if (o.lamp != null) drawStrokes(ctx, LAMPQ, o.lamp, t, { w: 4.5 });
      if (o.lampGlow) PP.hatch(ctx, [[-135, 215], [-85, 215], [-70, 175], [-120, 175]], { color: `rgba(245,190,70,${0.7 * o.lampGlow})`, gap: 5, w: 3, seed: 640, boil: PP.boil(t) });
      if (o.q != null) drawStrokes(ctx, QMARK, o.q, t, { w: 7 });
    });
  }

  function polaroid(ctx, x, y, rot, label, t, t0) {
    const p = PP.pop(t, t0, 0.28);
    if (p <= 0) return;
    const b = PP.boil(t);
    PP.with(ctx, () => {
      ctx.translate(x, y);
      ctx.rotate(rot + (1 - p) * 0.4);
      ctx.scale(p * 1.0 + (1 - p) * 1.6, p * 1.0 + (1 - p) * 1.6);
      ctx.globalAlpha = PP.clamp(p * 2);
      PP.paperPiece(ctx, PP.rectPoly(-150, -170, 300, 350), 'white', { seed: PP.hash(label), rough: 1.2, rim: 0, shadow: { blur: 22, dx: 8, dy: 12, a: 0.45 } });
      // the snapshot: his building at night, his window lit, the time the same
      ctx.fillStyle = '#1b2340'; ctx.fillRect(-126, -146, 252, 240);
      ctx.fillStyle = PP.pattern(ctx, 'brick'); ctx.globalAlpha *= 0.55; ctx.fillRect(-126, -60, 252, 154); ctx.globalAlpha = PP.clamp(p * 2);
      const gr = ctx.createRadialGradient(0, 0, 4, 0, 0, 90); gr.addColorStop(0, 'rgba(255,200,110,0.7)'); gr.addColorStop(1, 'rgba(255,200,110,0)');
      ctx.fillStyle = gr; ctx.fillRect(-126, -146, 252, 240);
      ctx.fillStyle = '#f3c66e'; ctx.fillRect(-40, -40, 80, 90);
      ctx.fillStyle = 'rgba(70,38,22,0.8)'; ctx.beginPath(); ctx.ellipse(6, 10, 16, 18, 0.3, 0, 7); ctx.fill(); ctx.fillRect(-30, 30, 60, 20);
      for (let k = 0; k < 9; k++) { ctx.fillStyle = '#f2cd5e'; ctx.beginPath(); ctx.arc(-110 + PP.rand('pst', label, k) * 220, -136 + PP.rand('psy', label, k) * 60, 2.4, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#2b3366'; ctx.font = '50px Caveat'; ctx.textAlign = 'center';
      ctx.fillText(label, -40, 150);
      ctx.font = '34px "Special Elite"'; ctx.fillStyle = '#c23b2e'; ctx.fillText('2:00', 80, 146);
      PP.tape(ctx, 0, -172, 130, 40, 0.06, '#e9b8b0', { stripes: true, seed: PP.hash(label, 't') });
    });
  }

  function clockDoodle(ctx, x, y, r, t, t0) {
    const p = PP.clamp((t - t0) / 0.7);
    if (p <= 0) return;
    const b = PP.boil(t);
    PP.pencil(ctx, PP.circlePts(x, y, r, r, 40, -Math.PI / 2), { w: 5, seed: 650, boil: b, progress: PP.clamp(p * 1.6), color: '#f6efe0' });
    PP.ink(ctx, [[x, y], [x, y - r * 0.62]], { w: 5, seed: 651, boil: b, progress: PP.clamp(p * 3 - 1.2), color: '#f6efe0', dry: false });
    PP.ink(ctx, [[x, y], [x + r * 0.42, y + r * 0.2]], { w: 5, seed: 652, boil: b, progress: PP.clamp(p * 3 - 1.6), color: '#f6efe0', dry: false });
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; if (p > 0.4 + k * 0.03) PP.ink(ctx, [[x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82], [x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92]], { w: 3, seed: 660 + k, boil: b, color: '#f6efe0', dry: false }); }
    if (p > 0.6) PP.handwrite(ctx, ['2 a.m.'], x, y + r + 70, { font: '62px Caveat', color: '#f6efe0', progress: PP.clamp((p - 0.6) / 0.4), align: 'center' });
  }

  function nameTag(ctx, x, y, t, t0) {
    const p = PP.pop(t, t0, 0.4);
    if (p <= 0) return;
    const b = PP.boil(t);
    const sway = Math.sin((t - t0) * 6) * Math.exp(-(t - t0) * 2.5) * 0.25;
    PP.with(ctx, () => {
      ctx.translate(x, y);
      ctx.rotate(-0.08 + sway);
      ctx.scale(p, p);
      PP.ink(ctx, PP.curve([[-120, -110], [-70, -70], [-20, -36]], 6), { w: 2.4, seed: 670, boil: b, color: '#f6efe0', dry: false });
      PP.paperPiece(ctx, [[-20, -40], [170, -40], [210, 0], [170, 40], [-20, 40]], 'kraft', { seed: 671, rough: 1.2, rim: 0, shadow: { blur: 12, dx: 4, dy: 7, a: 0.45 } });
      ctx.fillStyle = '#f6efe0'; ctx.beginPath(); ctx.arc(170, 0, 9, 0, 7); ctx.fill();
      ctx.fillStyle = INK; ctx.font = '50px "Permanent Marker"'; ctx.textBaseline = 'middle';
      ctx.fillText('MIRA, 22', -6, 4);
    });
  }

  function windSwirls(ctx, t, t0, cx, cy) {
    const b = PP.boil(t);
    for (let k = 0; k < 6; k++) {
      const p = (t - t0 - k * 0.12) / 1.6;
      if (p < 0 || p > 1) continue;
      const x = cx - 500 + p * 1100, y = cy - 200 + k * 70 + Math.sin(k * 2) * 40;
      const pts = [];
      for (let i = 0; i <= 26; i++) { const a = i * 0.36; const r = 40 - i * 1.3; pts.push([x + i * 9 + Math.cos(a) * r * (i > 14 ? 1 : 0), y + Math.sin(a) * r * (i > 14 ? 1 : 0.2)]); }
      PP.ink(ctx, pts, { w: 4, seed: 680 + k, boil: b, color: 'rgba(230,238,255,0.8)', progress: PP.clamp(p * 3), dry: false, taper: 0.9 });
    }
  }

  function bonkStars(ctx, x, y, t, t0) {
    const k = t - t0;
    if (k < 0 || k > 1.4) return;
    const b = PP.boil(t);
    for (let i = 0; i < 4; i++) {
      const a = k * 6 + (i * Math.PI) / 2;
      const s = PP.sticker('bonkstar' + i, 60, 60, 30, 30, (c) => { PP.path(c, PP.starPts(0, 0, 20, 0)); c.fillStyle = '#f2cd5e'; c.fill(); }, { border: 4 });
      PP.drawSprite(ctx, s, x + Math.cos(a) * 70, y - 30 + Math.sin(a) * 22, a, 0.8 * (1 - k / 1.6));
    }
    if (k < 0.25) for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; PP.ink(ctx, [[x + Math.cos(a) * 34, y + Math.sin(a) * 34], [x + Math.cos(a) * (50 + k * 120), y + Math.sin(a) * (50 + k * 120)]], { w: 4, seed: 700 + i, boil: b, color: INK, dry: false }); }
  }

  // ---------------------------------------------------------------- the scenes
  const S = {};

  // 1. cold open: forty-seven planes, the title, the heart
  S.hook = (ctx, t) => {
    nightBoard(ctx, t);
    flock(ctx, t);
    const out = C.gather - 0.1;
    PP.ransom(ctx, '47', 540, 640, 230, t, C.titleIn - 0.1, { seed: 3, out });
    PP.ransom(ctx, 'PAPER', 540, 870, 140, t, C.titleIn + 0.05, { seed: 5, out });
    PP.ransom(ctx, 'PLANES', 540, 1040, 140, t, C.titleIn + 0.25, { seed: 7, out });
  };

  // 2. "This is plane number one": one plane left, and it comes straight at us
  S.one = (ctx, t) => {
    nightBoard(ctx, t);
    if (t < C.one + 0.4) flock(ctx, t);
    const a = C.one, zoom0 = C.mira - 0.42;
    const glide = PP.flight([[-160, 1350], [260, 1100], [620, 780], [760, 900], [540, 880]], E.out(PP.clamp((t - a) / 1.3)));
    let x = glide.x, y = glide.y + Math.sin(t * 2.4) * 10, size = 200, heading = glide.heading, roll = glide.bank;
    if (t > a + 1.3) { heading = PP.lerp(heading, -0.15, 0.6); }
    if (t > zoom0) {
      const k = E.in(PP.clamp((t - zoom0) / 0.42));
      size = PP.lerp(200, 2600, k); x = PP.lerp(x, 560, k); y = PP.lerp(y, 980, k); roll = PP.lerp(roll, 0.5, k); heading = PP.lerp(heading, -0.1, k);
    }
    PP.plane(ctx, x, y, size, { heading, roll, yaw: 0.25, paper: 'notebook', seed: 21, boil: PP.boil(t), scribble: 'milk\neggs' });
  };

  // 3-4. Mira at her window; the city that never noticed her; the whip pan to his lamp at 2 a.m.
  S.alley = (ctx, t) => {
    const c0 = C.mira, cw = C.whip;
    const camK = [
      [c0, { x: 560, y: 2480, z: 1.1 }],
      [c0 + 1.55, { x: 592, y: 1040, z: 1.72 }, E.inOut],
      [C.cityPull, { x: 600, y: 1060, z: 1.8 }, E.inOut],
      [C.cityPull + 1.6, { x: 760, y: 1480, z: 0.74 }, E.inOut],
      [cw, { x: 780, y: 1500, z: 0.74 }],
      [cw + 0.55, { x: 1228, y: 1412, z: 1.74 }, E.inOut],
      [C.fold, { x: 1232, y: 1418, z: 1.86 }, E.out],
    ];
    const c = cam(t, camK);
    const whipping = t > cw + 0.05 && t < cw + 0.5;
    const sighing = t > C.mira + 4.4 && t < C.mira + 5.1;
    const blink = (t % 3.1) > 2.95;
    const miraPose = { arms: 'chin', eyes: sighing || blink ? 'closed' : 'half', mouth: 'pout', brows: 'soft', tilt: -0.1, turn: 0.35, look: [3, 1] };
    const drawing = PP.step(t, 4);
    const leoPose = { arms: 'draw', eyes: 'down', mouth: 'soft', brows: 'soft', turn: -0.2 + Math.sin(drawing * 3) * 0.04 };
    PP.worldView(ctx, c, t, {
      mode: 'night', herLit: true, lampOn: true,
      mira: PP.miraInWindow(miraPose, t),
      leo: PP.leoInWindow(leoPose, t),
      blur: whipping ? [cam(t - 0.06, camK), c] : null,
      overWorld: (wctx) => {
        nameTag(wctx, Wd.her.x + Wd.her.w + 80, Wd.her.y + 40, t, C.nameTag);
        clockDoodle(wctx, Wd.his.x + Wd.his.w + 140, Wd.his.y + 70, 62, t, C.clock);
      },
    });
    C.nights.forEach((tn, i) => polaroid(ctx, 250 + i * 290, 1080 + (i % 2) * 70, -0.12 + i * 0.12, ['MON', 'TUE', 'WED'][i], t, tn));
  };

  // 5. she folds the grocery list into a plane
  S.fold = (ctx, t) => {
    const b = PP.boil(t);
    const z = 1 + (t - C.fold) * 0.025;
    PP.with(ctx, () => { ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.drawImage(PP.desk(b), -650, -1050); });
    // warm lamplight from the top left
    PP.glow(ctx, 160, 220, 900, '255,200,130', 0.35);
    const st = C.folds.filter((ft) => t >= ft + 0.05).length;
    const lift = t > C.throwScene - 0.4 ? E.in(PP.clamp((t - (C.throwScene - 0.4)) / 0.4)) : 0;
    const settle = C.folds.reduce((acc, ft) => acc + (t > ft + 0.05 && t < ft + 0.2 ? 6 : 0), 0);
    const [jx, jy] = PP.jit(t, 'fold', 1.5);
    foldedPaper(ctx, st, 540 + jx, 900 + jy - lift * 500 + settle, st >= 4 ? 0.9 : 1, -0.04 + st * 0.02, t);
    const hw = [300, 300, 300, 200, 150][st];
    hands(ctx, t, 540 - hw + jx, 1060 - lift * 500 + jy, 540 + hw + jx, 1060 - lift * 500 + jy);
  };

  // 6. the throw, the flight across the alley, the landing; 7a. his lamp goes off
  S.across = (ctx, t) => {
    const a = C.throwScene;
    const wide = t > C.flyFrom - 0.02;
    const camK = wide
      ? [[C.flyFrom, { x: 900, y: 1300, z: 0.95 }], [C.landAt, { x: 940, y: 1340, z: 1.0 }], [C.landAt + 1.1, { x: 1222, y: 1430, z: 1.72 }, E.inOut], [C.great, { x: 1226, y: 1434, z: 1.8 }]]
      : [[a, { x: 640, y: 1010, z: 1.55 }], [C.flyFrom, { x: 660, y: 1000, z: 1.6 }]];
    const c = cam(t, camK);
    const throwPose = t < C.throwAt ? 'windup' : t < C.throwAt + 0.16 ? 'throw' : 'follow';
    const miraPose = { arms: throwPose, eyes: t < C.throwAt + 0.1 ? 'open' : 'happy', mouth: t < C.throwAt ? 'smile' : 'grin', brows: 'up', turn: 0.35, look: [5, -2], blow: 0 };
    const off = t > C.lampOff;
    const looks = t > C.leoLooks;
    const leoPose = { arms: looks ? 'rest' : 'draw', eyes: looks ? (t > C.leoLooks + 0.5 && t < C.lampOff - 0.2 ? 'open' : 'open') : 'down', mouth: looks ? 'o' : 'soft', brows: looks ? 'up' : 'soft', turn: looks ? -0.45 : -0.2, look: looks ? [-6, 4] : [0, 0] };
    const fl = PP.flight([HER_HAND, [800, 960], [1020, 1180], [1130, 1430], HIS_SILL], PP.clamp((t - C.flyFrom) / (C.landAt - C.flyFrom)));
    PP.worldView(ctx, c, t, {
      mode: 'night', herLit: true, lampOn: !off,
      mira: PP.miraInWindow(miraPose, t),
      miraOutside: !wide,
      leo: off ? null : PP.leoInWindow(leoPose, t),
      overWorld: (wctx) => {
        const b = PP.boil(t);
        if (t < C.throwAt + 0.08) {
          // the plane in her hand, wound back
          PP.plane(wctx, HER_MIRA[0] + 40, HER_MIRA[1] - 290, 90, { heading: -0.4, roll: 0.3, paper: 'notebook', seed: 21, boil: b, shadow: false });
        } else if (t < C.landAt) {
          PP.dashTrail(wctx, fl.path, { progress: PP.clamp((t - C.flyFrom) / (C.landAt - C.flyFrom)), boil: b, w: 3.4, color: 'rgba(246,239,224,0.85)' });
          PP.plane(wctx, fl.x, fl.y, 95, { heading: fl.heading, roll: fl.bank * 0.8, yaw: 0.25, paper: 'notebook', seed: 21, boil: b, scribble: 'milk\neggs' });
        } else {
          // landed: resting on the sill, a few impact lines
          PP.plane(wctx, HIS_SILL[0], HIS_SILL[1] - 6, 95, { heading: 0.15, roll: 0.15, yaw: 0.6, paper: 'notebook', seed: 21, boil: b, shadowDrop: 0.08 });
          const k = t - C.landAt;
          if (k < 0.35) for (let i = 0; i < 5; i++) { const ang = -Math.PI / 2 + (i - 2) * 0.5; PP.ink(wctx, [[HIS_SILL[0] + Math.cos(ang) * 50, HIS_SILL[1] - 10 + Math.sin(ang) * 50], [HIS_SILL[0] + Math.cos(ang) * (70 + k * 120), HIS_SILL[1] - 10 + Math.sin(ang) * (70 + k * 120)]], { w: 3, seed: 720 + i, boil: b, color: '#f6efe0', dry: false }); }
        }
        if (off && t - C.lampOff < 0.4) PP.handwrite(wctx, ['click.'], Wd.his.x + Wd.his.w + 30, Wd.his.y + 120, { font: '52px Caveat', color: '#f6efe0', progress: PP.clamp((t - C.lampOff) / 0.15) });
      },
    });
  };

  // 7b. "Great. She'd scared him." Mira, close.
  S.great = (ctx, t) => {
    const c = cam(t, [[C.great, { x: 588, y: 1070, z: 2.55 }], [C.morning, { x: 588, y: 1080, z: 2.7 }]]);
    const scared = t > C.scared;
    const sink = scared ? E.out(PP.clamp((t - C.scared) / 0.5)) * 46 : 0;
    const pose = scared ? { arms: 'cheeks', eyes: 'squeeze', mouth: 'wobble', brows: 'worried', blush: 1.4, sweat: 1, turn: 0.1 } : { arms: 'sill', eyes: 'half', mouth: 'flat', brows: 'flat', turn: 0.05, look: [0, 0] };
    PP.worldView(ctx, c, t, {
      mode: 'night', herLit: true, lampOn: false,
      mira: PP.miraInWindow(pose, t, { dy: PP.step(sink, 1 / 6) }),
      overWorld: (wctx) => { if (scared) PP.handwrite(wctx, ['oops.'], Wd.her.x + Wd.her.w + 10, Wd.her.y + 70, { font: '58px Caveat', color: '#f6efe0', progress: PP.clamp((t - C.scared - 0.15) / 0.3) }); },
    });
  };

  // 8. morning: the plane flies back, straight into her forehead
  S.morning = (ctx, t) => {
    const c = cam(t, [[C.morning, { x: 660, y: 1050, z: 1.45 }], [C.bonk, { x: 620, y: 1040, z: 1.7 }, E.inOut], [C.drawing, { x: 610, y: 1040, z: 1.75 }]]);
    const bonked = t > C.bonk;
    const pose = bonked ? { arms: 'sill', eyes: 'x', mouth: 'o', brows: 'up', sleepy: 1, turn: 0.2, tilt: 0.06 } : { arms: 'chin', eyes: t > C.backFly + 0.5 ? 'wide' : 'half', mouth: t > C.backFly + 0.5 ? 'o' : 'pout', brows: t > C.backFly + 0.5 ? 'up' : 'soft', sleepy: 1, turn: 0.35, look: [5, 0], tilt: -0.08 };
    const fl = PP.flight([[1250, 1250], [1050, 1000], [800, 930], [HER_FACE[0] + 10, HER_FACE[1] - 30]], PP.clamp((t - C.backFly) / (C.bonk - C.backFly)));
    PP.worldView(ctx, c, t, {
      mode: 'dawn', herLit: false, lampOn: false, sunRise: PP.clamp((t - C.morning) / 2.5),
      mira: PP.miraInWindow(pose, t),
      overWorld: (wctx) => {
        const b = PP.boil(t);
        if (!bonked && t > C.backFly) PP.plane(wctx, fl.x, fl.y, 90, { heading: fl.heading, roll: fl.bank, yaw: 0.2, paper: 'notebook', seed: 21, boil: b });
        if (bonked) {
          PP.plane(wctx, HER_FACE[0] + 30, HER_FACE[1] + 120 + Math.min(1, (t - C.bonk) * 4) * 20, 90, { heading: 2.2, roll: 0.9, paper: 'notebook', seed: 21, boil: b, shadowDrop: 0.1 });
          bonkStars(wctx, HER_FACE[0], HER_FACE[1] - 40, t, C.bonk);
        }
      },
    });
  };

  // 9-10. the drawing on the back of her list; "Badly."; the lamp and the question mark
  const paperBoard = (ctx, t, z, focus) => {
    const b = PP.boil(t);
    PP.with(ctx, () => {
      ctx.translate(W / 2, H / 2);
      ctx.scale(z, z);
      ctx.translate(-focus[0], -focus[1]);
      ctx.drawImage(PP.desk(b), 540 - 650, 960 - 1050);
      PP.glow(ctx, 900, 200, 1100, '255,214,170', 0.35);
      const qz = t > C.question;
      unfoldedList(ctx, 540, 900, 1, -0.03, t, {
        bad: PP.clamp((t - C.drawFrom) / (C.drawTo - C.drawFrom)),
        lamp: qz ? PP.clamp((t - C.lampDraw) / 0.7) : null,
        lampGlow: qz ? PP.clamp((t - C.lampDraw - 0.8) / 0.4) : 0,
        q: qz ? PP.clamp((t - C.qDraw) / 0.7) : null,
      });
      // his pencil, drawing (it follows the stroke being drawn)
      const drawingNow = t < C.drawTo ? 'bad' : qz && t < C.qDraw + 0.7 ? (t < C.lampDraw + 0.7 ? 'lamp' : 'q') : null;
      if (drawingNow && t > (drawingNow === 'bad' ? C.drawFrom : drawingNow === 'lamp' ? C.lampDraw : C.qDraw)) {
        const strokes = drawingNow === 'bad' ? BAD : drawingNow === 'lamp' ? LAMPQ : QMARK;
        const p = drawingNow === 'bad' ? (t - C.drawFrom) / (C.drawTo - C.drawFrom) : drawingNow === 'lamp' ? (t - C.lampDraw) / 0.7 : (t - C.qDraw) / 0.7;
        const i = Math.min(strokes.length - 1, Math.floor(PP.clamp(p) * strokes.length));
        const s = strokes[i], f = PP.clamp(p * strokes.length - i);
        const pt = s[Math.min(s.length - 1, Math.floor(f * (s.length - 1)))];
        PP.with(ctx, () => {
          ctx.translate(540 + pt[0], 900 + pt[1]);
          ctx.rotate(-0.6);
          PP.paperPiece(ctx, PP.rectPoly(0, -11, 360, 22), 'amber', { seed: 740, rough: 1, rim: 0, shadow: { blur: 14, dx: 18, dy: 22, a: 0.35 } });
          PP.paperPiece(ctx, [[0, -11], [-40, 0], [0, 11]], 'kraft', { seed: 741, rough: 0.5, rim: 0, shadow: false });
          PP.paperPiece(ctx, PP.rectPoly(360, -11, 40, 22), 'rose', { seed: 742, rough: 0.5, rim: 0, shadow: false });
        });
      }
    });
  };
  S.drawing = (ctx, t) => paperBoard(ctx, t, 1.08 + (t - C.drawing) * 0.02, [540, 820]);
  S.badly = (ctx, t) => {
    const c = cam(t, [[C.badly, { x: 560, y: 1000, z: 2.35 }], [C.question, { x: 560, y: 1000, z: 2.45 }]]);
    const pose = { arms: 'hold', eyes: 'half', mouth: 'flat', brows: 'flat', turn: 0.15, look: [2, 0] };
    PP.worldView(ctx, c, t, {
      mode: 'dawn', herLit: false,
      mira: PP.miraInWindow(pose, t),
      miraOutside: true,
      overWorld: (wctx) => {
        // the drawing held up beside her face, for comparison
        PP.with(wctx, () => {
          wctx.translate(HER_MIRA[0] - 82, HER_MIRA[1] - 168);
          wctx.rotate(-0.08);
          wctx.scale(0.14, 0.14);
          PP.paperPiece(wctx, [[-280, -360], [280, -360], [280, 360], [-280, 360]], 'notebook', { seed: 31, rough: 1.4, rim: 0, shadow: { blur: 30, dx: 30, dy: 40, a: 0.35 } });
          drawStrokes(wctx, BAD, 1, t, { w: 9 });
        });
      },
    });
  };
  S.question = (ctx, t) => {
    const k = E.inOut(PP.clamp((t - C.qDraw) / 1.1));
    paperBoard(ctx, t, PP.lerp(1.1, 1.7, k), [PP.lerp(540, 640, k), PP.lerp(860, 1130, k)]);
  };

  // 11. night again: plane number two, and the one word on it
  S.hi = (ctx, t) => {
    if (t < C.hiWrite - 0.05) {
      const c = cam(t, [[C.hi, { x: 600, y: 1030, z: 1.65 }], [C.hiWrite, { x: 596, y: 1040, z: 1.85 }]]);
      const st = C.hiFolds.filter((ft) => t >= ft + 0.05).length;
      const pose = { arms: 'write', eyes: 'down', mouth: 'soft', brows: 'soft', turn: 0.2, look: [0, 3] };
      PP.worldView(ctx, c, t, {
        mode: 'night', herLit: true, lampOn: true,
        mira: PP.miraInWindow(pose, t),
        overWorld: (wctx) => foldedPaper(wctx, [0, 2, 3, 4][st], HER_MIRA[0] + 18, HER_MIRA[1] - 34, st >= 3 ? 0.09 : 0.1, -0.1, t, { paper: 'white', text: false, doodle: false }),
      });
    } else {
      // close on the wing: "Hi." in marker
      const b = PP.boil(t);
      PP.with(ctx, () => { ctx.translate(W / 2, H / 2); ctx.scale(1.05, 1.05); ctx.drawImage(PP.desk(b), -650, -1050); });
      PP.with(ctx, () => { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(80,90,150,0.55)'; ctx.fillRect(0, 0, W, H); });
      PP.glow(ctx, 540, 880, 700, '255,200,130', 0.4);
      foldedPaper(ctx, 4, 540, 900, 1.05, 0.0, t, { paper: 'white' });
      const p = PP.clamp((t - C.hiWrite) / (C.hiWord + 0.12 - C.hiWrite));
      PP.with(ctx, () => {
        ctx.translate(408, 1030);
        ctx.rotate(-1.38);
        PP.handwrite(ctx, ['Hi.'], 0, 0, { font: '150px "Permanent Marker"', color: '#1d1a22', progress: p });
      });
      // the marker, writing
      if (p > 0 && p < 1) PP.with(ctx, () => { ctx.translate(430 + 20 * Math.sin(p * 10), 1030 - p * 230); ctx.rotate(-0.5); PP.paperPiece(ctx, PP.rectPoly(0, -26, 380, 52), 'ink', { seed: 750, rough: 1, rim: 0, shadow: { blur: 18, dx: 20, dy: 26, a: 0.4 } }); PP.paperPiece(ctx, PP.rectPoly(-30, -16, 30, 32), 'ink', { seed: 751, rough: 0.5, rim: 0, shadow: false }); PP.paperPiece(ctx, PP.rectPoly(250, -27, 60, 54), 'coral', { seed: 752, rough: 0.5, rim: 0, shadow: false }); });
    }
  };

  // 12. the wind: the plane loops, tumbles and falls five floors
  S.wind = (ctx, t) => {
    const fallA = C.dropFrom, fallB = C.dropTo;
    const camK = [[C.wind, { x: 860, y: 1220, z: 0.98 }], [fallA - 0.1, { x: 880, y: 1300, z: 1.0 }], [fallB - 0.2, { x: 900, y: 2470, z: 1.05 }, E.inOut], [C.someone, { x: 900, y: 2500, z: 1.08 }]];
    const c = cam(t, camK);
    const throwPose = t < C.throwTwo + 0.12 ? 'windup' : t < C.throwTwo + 0.3 ? 'throw' : 'follow';
    const worried = t > C.gust + 0.3;
    const miraPose = { arms: throwPose, eyes: worried ? 'wide' : 'happy', mouth: worried ? 'o' : 'grin', brows: worried ? 'up' : 'soft', turn: 0.35, look: worried ? [4, 6] : [5, -2], blow: worried ? 0.4 : 0 };
    // the flight: out toward his window, caught by the gust into a loop, then the fall
    const loopA = C.throwTwo + 0.25, loopB = fallA;
    let x, y, heading, roll, yaw = 0.2;
    if (t < loopA) { x = HER_HAND[0]; y = HER_HAND[1]; heading = -0.3; roll = 0; }
    else if (t < loopB) {
      const u = (t - loopA) / (loopB - loopA);
      const fl = PP.flight([HER_HAND, [830, 980], [960, 900], [1010, 1020], [930, 1110], [860, 1000], [920, 900], [1000, 980], [900, 1180]], u);
      x = fl.x; y = fl.y; heading = fl.heading; roll = fl.bank * 1.3 + Math.sin(t * 9) * 0.3;
    } else {
      const u = PP.clamp((t - fallA) / (fallB - fallA));
      const fy = PP.lerp(1180, Wd.GROUND + 70, E.inQuad(u) * 0.5 + u * 0.5);
      x = 900 + Math.sin(u * 13) * 70 * (1 - u * 0.5); y = fy;
      heading = Math.PI / 2 + Math.cos(u * 13) * 0.9; roll = Math.sin(u * 13 + 1) * 1.1; yaw = Math.cos(u * 9) * 0.6;
    }
    const landed = t > fallB;
    PP.worldView(ctx, c, t, {
      mode: 'night', herLit: true, lampOn: true,
      mira: PP.miraInWindow(miraPose, t),
      miraOutside: t < loopA + 0.2,
      overWorld: (wctx) => {
        const b = PP.boil(t);
        windSwirls(wctx, t, C.gust - 0.1, 920, 1000);
        if (landed) PP.plane(wctx, 905, Wd.GROUND + 72, 92, { heading: 0.4, roll: 0.4, yaw: 0.7, paper: 'white', seed: 22, boil: b, shadowDrop: 0.08 });
        else if (t >= loopA) PP.plane(wctx, x, y, 92, { heading, roll, yaw, paper: 'white', seed: 22, boil: b });
        else PP.plane(wctx, HER_MIRA[0] + 40, HER_MIRA[1] - 290, 90, { heading: -0.4, roll: 0.3, paper: 'white', seed: 22, boil: b, shadow: false });
      },
    });
  };

  // 13. "...where someone picked it up. And it wasn't him."
  S.someone = (ctx, t) => {
    const b = PP.boil(t);
    const push = 1 + E.inOut(PP.clamp((t - C.someone) / 3.6)) * 0.12;
    PP.with(ctx, () => {
      ctx.translate(W / 2, H / 2);
      ctx.scale(push, push);
      ctx.translate(-W / 2, -H / 2);
      // cobbles in the dark, a pool of light from the alley lamp above
      ctx.drawImage(PP.bigPaper('slate', W, H, 12), 0, 0);
      for (let k = 0; k < 60; k++) {
        const x = (k % 6) * 200 + ((Math.floor(k / 6) % 2) * 100) - 40, y = Math.floor(k / 6) * 200 - 40;
        PP.ink(ctx, PP.circlePts(x + 100, y + 100, 82 + PP.rand('cbk', k) * 10, 70, 18), { w: 4, seed: 760 + k, boil: b, color: 'rgba(20,20,34,0.55)', dry: false });
      }
      // tomato leaves at the edge
      for (let k = 0; k < 8; k++) PP.paperPiece(ctx, PP.ellipsePoly(980 + Math.cos(k) * 60, 300 + k * 60, 70, 30, 12), 'sage', { seed: 780 + k, rough: 2, rim: 0, shadow: { blur: 16, dx: 6, dy: 10, a: 0.5 } });
      PP.with(ctx, () => { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(40,46,90,0.85)'; ctx.fillRect(0, 0, W, H); });
      PP.glow(ctx, 520, 960, 620, '255,196,120', 0.55);
      // the plane, and the hand that takes it
      const handX = PP.kf(t, [[C.handIn, 1500], [C.grip, 760, E.out], [C.lift, 760], [C.lift + 0.7, 830, E.inOut]]);
      const handY = PP.kf(t, [[C.handIn, 1040], [C.grip, 980, E.out], [C.lift, 980], [C.lift + 0.7, 860, E.inOut]]);
      const grip = PP.clamp((t - C.grip) / 0.25);
      const lifted = PP.clamp((t - C.lift) / 0.7);
      const px = PP.lerp(500, 500 + (handX - 760), lifted), py = PP.lerp(980, 980 + (handY - 980), lifted);
      PP.plane(ctx, px, py, 430, { heading: 0.35 - lifted * 0.2, roll: 0.35, yaw: 0.75, paper: 'white', seed: 22, boil: b, shadowDrop: 0.06 + lifted * 0.2 });
      PP.with(ctx, () => { ctx.translate(px - 30, py + 18); ctx.rotate(0.3 - lifted * 0.2); ctx.font = '62px "Permanent Marker"'; ctx.fillStyle = 'rgba(29,26,34,0.85)'; ctx.fillText('Hi.', 0, 0); });
      if (t > C.handIn) PP.drawSprite(ctx, PP.oldHand(b, PP.step(grip, 6)), handX + 330, handY, -0.12, 1.15);
      if (t > C.wasnt - 0.3) PP.catEyes(ctx, 170, 520, 1.15, t, t > C.catBlink && t < C.catBlink + 0.12 ? 0.08 : PP.clamp((t - C.wasnt + 0.3) / 0.3));
    });
    // the sting: the light tightens
    if (t > C.sting) PP.with(ctx, () => { const k = E.out(PP.clamp((t - C.sting) / 0.4)); const gr = ctx.createRadialGradient(560, 960, 200, 560, 960, 1100); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(5,6,16,${0.6 * k})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); });
  };

  // 14. end card: part two
  S.endCard = (ctx, t) => {
    const b = PP.boil(t);
    ctx.drawImage(PP.bigPaper('kraft', W, H, 20), 0, 0);
    PP.paperPiece(ctx, PP.rectPoly(70, 340, 940, 1180), 'night', { seed: 801, rough: 9, shadow: { blur: 30, dx: 8, dy: 16, a: 0.45 } });
    PP.with(ctx, () => { ctx.beginPath(); ctx.rect(80, 350, 920, 1160); ctx.clip(); PP.stars(ctx, W, 1500, t, 22, 13, { maxY: 0.9 }); });
    const t0 = C.endCard + 0.25;
    PP.ransom(ctx, 'PART', 540, 640, 170, t, t0, { seed: 31 });
    PP.ransom(ctx, '2', 540, 860, 260, t, t0 + 0.3, { seed: 33 });
    PP.handwrite(ctx, ['who picked it up?'], 540, 1130, { font: '96px Caveat', color: '#f6efe0', align: 'center', progress: PP.clamp((t - t0 - 0.7) / 0.9) });
    const fl = PP.flight([[-120, 1400], [300, 1260], [700, 1420], [1200, 1250]], PP.clamp((t - t0) / 3));
    PP.dashTrail(ctx, fl.path, { progress: PP.clamp((t - t0) / 3), boil: b, color: 'rgba(246,239,224,0.8)', w: 4 });
    PP.plane(ctx, fl.x, fl.y, 130, { heading: fl.heading, roll: fl.bank, paper: 'white', seed: 22, boil: b });
    PP.tape(ctx, 150, 345, 180, 50, -0.4, '#e9b8b0', { stripes: true, seed: 802 });
    PP.tape(ctx, 930, 345, 180, 50, 0.35, '#9fc3b8', { dots: true, seed: 803 });
    PP.with(ctx, () => { ctx.fillStyle = 'rgba(34,28,36,0.85)'; ctx.font = '44px "Special Elite"'; ctx.textAlign = 'center'; ctx.globalAlpha = PP.clamp((t - t0 - 1.2) / 0.4); ctx.fillText('47 PAPER PLANES · EPISODE 1', 540, 1640); });
  };

  // the running order: [start, end, scene]
  PP.SCENES = [
    [C.hook, C.one, S.hook],
    [C.one, C.mira, S.one],
    [C.mira, C.fold, S.alley],
    [C.fold, C.throwScene, S.fold],
    [C.throwScene, C.great, S.across],
    [C.great, C.morning, S.great],
    [C.morning, C.drawing, S.morning],
    [C.drawing, C.badly, S.drawing],
    [C.badly, C.question, S.badly],
    [C.question, C.hi, S.question],
    [C.hi, C.wind, S.hi],
    [C.wind, C.someone, S.wind],
    [C.someone, C.endCard, S.someone],
    [C.endCard, C.total, S.endCard],
  ];
  // transitions into a scene: torn-paper wipes, a slide; the rest are cuts
  PP.TRANSITIONS = { [C.morning]: 'tear', [C.question + 0.0001]: null, [C.hi]: 'tear', [C.endCard]: 'tear', [C.fold]: 'slide', [C.someone]: 'slide' };
})(typeof window !== 'undefined' ? window : globalThis);
