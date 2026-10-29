// Sets: the alley world (two buildings facing each other across a narrow alley, as one big collage board the camera
// moves over), the skies, the city behind, and the desk for close-ups. Static boards are pre-rendered once per
// mode and boil variant; the windows' interiors, lights and people are drawn live on top.
(function (g) {
  const PP = g.PP;
  const INK = '#221c24';

  // ---------------------------------------------------------------- the alley world, in world coordinates
  const WW = 1800, WH = 3000, GROUND = 2800, FLOOR = 400;
  const floorTop = (k) => GROUND - FLOOR * k; // floor k spans floorTop(k) .. floorTop(k) + FLOOR
  const HER = { x0: 0, x1: 780, roof: floorTop(5) };
  const HIS = { x0: 1020, x1: 1800, roof: floorTop(4) };
  const win = (x, k) => ({ x, y: floorTop(k) + 70, w: 220, h: 260 });
  PP.WORLD = {
    W: WW, H: WH, GROUND, FLOOR, floorTop, HER, HIS,
    her: win(470, 5), // Mira's window: fifth floor, by the alley
    his: win(1110, 4), // the stranger's window: fourth floor, by the alley
    herWindows: [1, 2, 3, 4, 5].flatMap((k) => [win(140, k), win(470, k)]),
    hisWindows: [1, 2, 3, 4].flatMap((k) => [win(1110, k), win(1440, k)]),
  };
  const Wd = PP.WORLD;
  const same = (a, b) => a.x === b.x && a.y === b.y;
  // which other windows glow at night (people who never notice her), and what they're doing
  const LIT = { '140,1270': 'tv', '1440,1670': 'lamp', '140,2070': 'lamp', '1440,2470': 'tv', '470,2470': 'plant', '1110,2070': 'lamp' };

  function bricks(ctx, x0, y0, x1, y1, seed, b) {
    // brick paper, then a sparse hand-drawn suggestion of courses (not every brick: collage, not architecture)
    ctx.fillStyle = PP.pattern(ctx, 'brick');
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let y = y0 + 30, row = 0; y < y1; y += 44, row++) {
      for (let x = x0 + ((row % 2) * 60) - 20; x < x1; x += 120) {
        if (PP.rand('br', seed, x, y) > 0.33) continue;
        const w = 70 + PP.rand('bw', seed, x, y) * 40;
        PP.ink(ctx, [[x, y], [x + w, y + (PP.rand('bs', seed, x) - 0.5) * 3]], { w: 1.8, color: 'rgba(80,30,20,0.45)', seed: PP.hash(seed, x, y), boil: b, dry: false, jitter: 0.5 });
        PP.ink(ctx, [[x + w, y], [x + w, y + 40]], { w: 1.6, color: 'rgba(80,30,20,0.35)', seed: PP.hash(seed, x, y, 1), boil: b, dry: false, jitter: 0.5 });
      }
    }
    // a few paper patches of darker brick, collaged on
    for (let k = 0; k < 6; k++) {
      const px = x0 + PP.rand('pb', seed, k) * (x1 - x0 - 160), py = y0 + PP.rand('pby', seed, k) * (y1 - y0 - 140);
      PP.paperPiece(ctx, PP.rectPoly(px, py, 120 + PP.rand('pw', seed, k) * 80, 70 + PP.rand('ph', seed, k) * 60), 'brickDark', { seed: PP.hash(seed, 'p', k), rough: 5, shadow: { blur: 6, dx: 2, dy: 3, a: 0.25 }, rim: 2 });
    }
  }

  function windowFrame(ctx, w, b, seed, o = {}) {
    // the sill, the frame and the cross bars, in cream paper with an ink line
    const { x, y } = w, ww = w.w, hh = w.h;
    PP.paperPiece(ctx, PP.rectPoly(x - 18, y - 16, ww + 36, 20), 'cream', { seed: seed + 1, rough: 2.5, shadow: { blur: 8, dx: 3, dy: 5, a: 0.3 }, rim: 0 });
    PP.paperPiece(ctx, PP.rectPoly(x - 30, y + hh - 4, ww + 60, 26), 'cream', { seed: seed + 2, rough: 2.5, shadow: { blur: 10, dx: 3, dy: 7, a: 0.35 }, rim: 0 });
    PP.with(ctx, () => {
      ctx.strokeStyle = PP.pattern(ctx, 'cream');
      ctx.lineWidth = 14;
      ctx.strokeRect(x, y, ww, hh);
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(x + ww / 2, y); ctx.lineTo(x + ww / 2, y + hh);
      ctx.moveTo(x, y + hh * 0.45); ctx.lineTo(x + ww, y + hh * 0.45);
      ctx.stroke();
    });
    PP.ink(ctx, [[x - 7, y - 7], [x + ww + 7, y - 7], [x + ww + 7, y + hh + 2], [x - 7, y + hh + 2], [x - 7, y - 7]], { w: 3, seed, boil: b, color: INK, taper: 0.1, dry: false });
    PP.ink(ctx, [[x + ww / 2, y], [x + ww / 2, y + hh]], { w: 2.2, seed: seed + 5, boil: b, color: INK, dry: false, alpha: 0.8 });
    PP.ink(ctx, [[x, y + hh * 0.45], [x + ww, y + hh * 0.45]], { w: 2.2, seed: seed + 6, boil: b, color: INK, dry: false, alpha: 0.8 });
    if (o.plant) {
      // a pot of something green on the sill
      const px = x + ww * 0.72, py = y + hh - 4;
      PP.paperPiece(ctx, [[px - 30, py - 44], [px + 30, py - 44], [px + 22, py], [px - 22, py]], 'orange', { seed: seed + 7, rough: 1.5, rim: 0, shadow: { blur: 6, dx: 2, dy: 3, a: 0.3 } });
      for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.4; PP.paperPiece(ctx, PP.ellipsePoly(px + Math.cos(a) * 34, py - 50 + Math.sin(a) * 34, 18, 9, 10).map((p) => p), 'sage', { seed: seed + 20 + k, rough: 1.5, rim: 0, shadow: { blur: 4, dx: 1, dy: 2, a: 0.25 } }); }
    }
  }

  function darkGlass(ctx, w, b, seed, mode) {
    PP.with(ctx, () => {
      ctx.fillStyle = mode === 'dawn' ? '#3d3a52' : '#18203a';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = PP.pattern(ctx, 'navy');
      ctx.globalAlpha = 0.5;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.globalAlpha = 1;
      // reflections: two pale diagonal swipes
      ctx.beginPath(); ctx.rect(w.x, w.y, w.w, w.h); ctx.clip();
      ctx.strokeStyle = mode === 'dawn' ? 'rgba(255,200,170,0.22)' : 'rgba(170,190,255,0.12)';
      ctx.lineWidth = 16;
      ctx.beginPath(); ctx.moveTo(w.x + 30, w.y + w.h); ctx.lineTo(w.x + 120, w.y); ctx.stroke();
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(w.x + 70, w.y + w.h); ctx.lineTo(w.x + 160, w.y); ctx.stroke();
    });
  }

  // Other people's windows, lit at night: each a little scene with its back to Mira.
  function litWindow(ctx, w, kind, b, seed) {
    PP.with(ctx, () => {
      const gr = ctx.createLinearGradient(w.x, w.y, w.x, w.y + w.h);
      gr.addColorStop(0, kind === 'tv' ? '#7da7c9' : '#f3c66e');
      gr.addColorStop(1, kind === 'tv' ? '#3e5f8f' : '#d88d3f');
      ctx.fillStyle = gr;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.beginPath(); ctx.rect(w.x, w.y, w.w, w.h); ctx.clip();
      ctx.fillStyle = 'rgba(40,24,30,0.78)';
      if (kind === 'tv' || kind === 'lamp') {
        // someone with their back turned, on a sofa
        ctx.beginPath(); ctx.ellipse(w.x + w.w * 0.42, w.y + w.h * 0.62, 34, 40, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(w.x + w.w * 0.42, w.y + w.h * 0.95, 70, 60, 0, 0, 7); ctx.fill();
        ctx.fillRect(w.x, w.y + w.h * 0.82, w.w, 60);
      }
      if (kind === 'lamp') { ctx.fillStyle = 'rgba(60,30,20,0.7)'; ctx.fillRect(w.x + w.w * 0.78, w.y + w.h * 0.35, 6, 120); ctx.beginPath(); ctx.moveTo(w.x + w.w * 0.7, w.y + w.h * 0.38); ctx.lineTo(w.x + w.w * 0.9, w.y + w.h * 0.38); ctx.lineTo(w.x + w.w * 0.86, w.y + w.h * 0.22); ctx.lineTo(w.x + w.w * 0.74, w.y + w.h * 0.22); ctx.fill(); }
      if (kind === 'plant') { ctx.fillStyle = 'rgba(40,60,30,0.7)'; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.ellipse(w.x + 40 + k * 18, w.y + w.h * 0.5 + Math.sin(k) * 30, 16, 40, k * 0.5, 0, 7); ctx.fill(); } }
      // a curtain on one side
      ctx.fillStyle = PP.pattern(ctx, 'rose');
      ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.lineTo(w.x + 52, w.y); ctx.quadraticCurveTo(w.x + 30, w.y + w.h * 0.5, w.x + 46, w.y + w.h); ctx.lineTo(w.x, w.y + w.h); ctx.fill();
    });
  }

  function buildWorld(mode, b) {
    const c = PP.canvas(WW, WH);
    buildWorldInto(c.getContext('2d'), mode, b);
    return c;
  }
  // draws the whole board into any context (the close-up boards draw it scaled into a region)
  function buildWorldInto(ctx, mode, b) {
    // her building
    PP.with(ctx, () => {
      ctx.beginPath(); ctx.rect(HER.x0, HER.roof, HER.x1 - HER.x0, GROUND - HER.roof); ctx.clip();
      bricks(ctx, HER.x0, HER.roof, HER.x1, GROUND, 11, b);
    });
    PP.with(ctx, () => {
      ctx.beginPath(); ctx.rect(HIS.x0, HIS.roof, HIS.x1 - HIS.x0, GROUND - HIS.roof); ctx.clip();
      ctx.filter = 'hue-rotate(-12deg) saturate(0.8) brightness(0.92)';
      bricks(ctx, HIS.x0, HIS.roof, HIS.x1, GROUND, 23, b);
    });
    // the edges of each building, cut as paper with a shadow into the alley
    PP.paperPiece(ctx, PP.rectPoly(HER.x1 - 26, HER.roof - 10, 40, GROUND - HER.roof + 10), 'brickDark', { seed: 31, rough: 4, rim: 0, shadow: { blur: 30, dx: 14, dy: 0, a: 0.45 } });
    PP.paperPiece(ctx, PP.rectPoly(HIS.x0 - 14, HIS.roof - 10, 40, GROUND - HIS.roof + 10), 'brickDark', { seed: 32, rough: 4, rim: 0, shadow: { blur: 30, dx: -14, dy: 0, a: 0.45 } });
    // rooflines: a cornice of cream paper and a parapet
    for (const B of [HER, HIS]) {
      PP.paperPiece(ctx, PP.rectPoly(B.x0 - 20, B.roof - 46, B.x1 - B.x0 + 40, 50), 'cream', { seed: B.x0 + 41, rough: 3, shadow: { blur: 14, dx: 4, dy: 9, a: 0.4 } });
      for (let x = B.x0 + 10; x < B.x1 - 20; x += 46) PP.ink(ctx, [[x, B.roof - 6], [x + 20, B.roof - 6]], { w: 3, seed: x, boil: b, color: INK, alpha: 0.5, dry: false });
    }
    // floor ledges, painted floor numbers on her building (for the fall), the drainpipe by the alley
    for (let k = 1; k <= 5; k++) {
      if (k < 5) PP.paperPiece(ctx, PP.rectPoly(HER.x0, floorTop(k) - 8, HER.x1 - HER.x0, 16), 'cream', { seed: 50 + k, rough: 2, rim: 0, shadow: { blur: 8, dx: 2, dy: 6, a: 0.3 } });
      if (k < 4) PP.paperPiece(ctx, PP.rectPoly(HIS.x0, floorTop(k) - 8, HIS.x1 - HIS.x0, 16), 'cream', { seed: 60 + k, rough: 2, rim: 0, shadow: { blur: 8, dx: 2, dy: 6, a: 0.3 } });
      PP.with(ctx, () => {
        ctx.font = '700 74px "Alfa Slab One"';
        ctx.fillStyle = 'rgba(246,238,220,0.82)';
        ctx.textAlign = 'center';
        ctx.fillText(String(k), 405, floorTop(k) + 210);
      });
    }
    PP.paperPiece(ctx, PP.rectPoly(730, HER.roof - 30, 22, GROUND - HER.roof + 30), 'slate', { seed: 71, rough: 1.5, rim: 0, shadow: { blur: 8, dx: 4, dy: 0, a: 0.4 } });
    for (let y = HER.roof + 200; y < GROUND; y += 400) PP.paperPiece(ctx, PP.rectPoly(722, y, 38, 14), 'slate', { seed: 72 + y, rough: 1, rim: 0, shadow: { blur: 4, dx: 2, dy: 3, a: 0.3 } });
    // a fire escape on his building, in ink
    for (let k = 1; k <= 3; k++) {
      const y = floorTop(k) + 360;
      PP.ink(ctx, [[1400, y], [1700, y]], { w: 5, seed: 80 + k, boil: b, color: '#2a2630' });
      for (let x = 1405; x <= 1700; x += 22) PP.ink(ctx, [[x, y], [x, y - 70]], { w: 2.4, seed: 90 + x + k, boil: b, color: '#2a2630', dry: false });
      PP.ink(ctx, [[1400, y - 70], [1700, y - 70]], { w: 3.4, seed: 85 + k, boil: b, color: '#2a2630' });
      PP.ink(ctx, [[1420, y], [1680, y - 400 + 30]], { w: 4, seed: 95 + k, boil: b, color: '#2a2630' });
    }
    // windows
    for (const w of [...Wd.herWindows, ...Wd.hisWindows]) {
      const key = `${w.x},${w.y}`;
      if (same(w, Wd.her) || same(w, Wd.his)) continue; // drawn live
      if (mode === 'night' && LIT[key]) litWindow(ctx, w, LIT[key], b, w.x + w.y);
      else darkGlass(ctx, w, b, w.x + w.y, mode);
      windowFrame(ctx, w, b, w.x * 3 + w.y, { plant: PP.rand('plant', key) < 0.25 });
    }
    // the alley floor: cobbles of grey paper, the tomato pots, a crate
    PP.paperPiece(ctx, PP.rectPoly(-20, GROUND - 6, WW + 40, WH - GROUND + 30), 'slate', { seed: 101, rough: 6, shadow: { blur: 20, dx: 0, dy: -6, a: 0.4 } });
    for (let k = 0; k < 40; k++) {
      const x = PP.rand('cb', k) * WW, y = GROUND + 30 + PP.rand('cby', k) * 160;
      PP.ink(ctx, PP.circlePts(x, y, 26 + PP.rand('cbr', k) * 14, 12, 16), { w: 2, seed: 110 + k, boil: b, color: 'rgba(20,20,30,0.45)', dry: false });
    }
    const pot = (x, y, s, seed) => {
      PP.paperPiece(ctx, [[x - 50 * s, y - 80 * s], [x + 50 * s, y - 80 * s], [x + 38 * s, y], [x - 38 * s, y]], 'orange', { seed, rough: 2, rim: 0, shadow: { blur: 10, dx: 4, dy: 6, a: 0.4 } });
      for (let k = 0; k < 7; k++) PP.paperPiece(ctx, PP.ellipsePoly(x + (k - 3) * 16 * s, y - (110 + (k % 3) * 34) * s, 22 * s, 12 * s, 10), 'sage', { seed: seed + k, rough: 1.5, rim: 0, shadow: { blur: 4, dx: 1, dy: 2, a: 0.3 } });
      for (let k = 0; k < 3; k++) PP.paperPiece(ctx, PP.ellipsePoly(x + (k - 1) * 26 * s, y - (120 + k * 30) * s, 14 * s, 14 * s, 12), 'coral', { seed: seed + 20 + k, rough: 1, rim: 0, shadow: { blur: 4, dx: 1, dy: 2, a: 0.3 } });
    };
    pot(820, GROUND + 70, 1, 130);
    pot(965, GROUND + 50, 0.8, 140);
    pot(1240, GROUND + 80, 1.1, 150);
    PP.paperPiece(ctx, PP.rectPoly(1050, GROUND - 40, 150, 110), 'kraft', { seed: 160, rough: 2, rim: 0, shadow: { blur: 14, dx: 5, dy: 8, a: 0.4 } });
    PP.ink(ctx, [[1050, GROUND + 15], [1200, GROUND + 15]], { w: 2.5, seed: 161, boil: b, color: INK, alpha: 0.6 });
    // the whole board in the light of the mode: night is blue and dim, dawn is warm
    PP.with(ctx, () => {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = mode === 'night' ? 'rgba(70,90,160,0.62)' : 'rgba(255,190,160,0.32)';
      ctx.fillRect(0, 0, WW, WH);
    });
  }
  PP.buildWorldInto = buildWorldInto;
  PP.world = (mode, b) => PP.cached(`world:${mode}:${b % 2}`, () => buildWorld(mode, b % 2));

  // the two live windows' frames, drawn above their interiors
  PP.liveFrames = (b) => PP.cached(`frames:${b % 2}`, () => {
    const c = PP.canvas(WW, WH), ctx = c.getContext('2d');
    windowFrame(ctx, Wd.her, b % 2, 9001, { plant: false });
    windowFrame(ctx, Wd.his, b % 2, 9002, { plant: false });
    return c;
  });

  // ---------------------------------------------------------------- skies and the city behind
  // A sky fills the frame; it moves less than the world (parallax) so the camera feels deep.
  function buildSky(mode, w, h) {
    const c = PP.canvas(w, h), ctx = c.getContext('2d');
    if (mode === 'night') {
      ctx.drawImage(PP.bigPaper('night', w, h, 3), 0, 0);
      const gr = ctx.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, 'rgba(8,10,30,0.6)');
      gr.addColorStop(1, 'rgba(60,70,130,0.25)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
      // torn bands of slightly different navy, overlapping like layered tissue
      for (let k = 0; k < 4; k++) {
        const y = h * (0.25 + k * 0.17);
        PP.paperPiece(ctx, [[-40, y], [w + 40, y - 40 + k * 20], [w + 40, h + 40], [-40, h + 40]], k % 2 ? 'navy' : 'night', { seed: 300 + k, rough: 12, shadow: { blur: 30, dx: 0, dy: -8, a: 0.35 }, rim: 3, rimColor: 'rgba(200,210,240,0.35)', tint: `rgba(${30 + k * 10},${40 + k * 12},${90 + k * 14},0.25)` });
      }
    } else {
      ctx.drawImage(PP.bigPaper('dawnYellow', w, h, 4), 0, 0);
      const bands = ['sky', 'dawnPink', 'peach', 'dawnYellow', 'peach'];
      bands.forEach((p, k) => {
        const y = h * (k * 0.16);
        PP.paperPiece(ctx, [[-40, y], [w + 40, y + 30 - k * 12], [w + 40, h + 40], [-40, h + 40]], p, { seed: 320 + k, rough: 12, shadow: { blur: 26, dx: 0, dy: -6, a: 0.22 }, rim: 4 });
      });
    }
    return c;
  }
  PP.sky = (mode, w = 1400, h = 2400) => PP.cached(`sky:${mode}:${w}x${h}`, () => buildSky(mode, w, h));

  // star stickers that twinkle (scale pulse) on the boil clock
  PP.stars = function (ctx, w, h, t, n = 34, seed = 5, o = {}) {
    for (let i = 0; i < n; i++) {
      const x = PP.rand('stx', seed, i) * w, y = PP.rand('sty', seed, i) * h * (o.maxY ?? 0.75);
      const r = 8 + PP.rand('str', seed, i) * 12;
      const tw = 1 + 0.18 * Math.sin(t * (2 + PP.rand('stw', seed, i) * 3) + i);
      const s = PP.sticker(`star:${seed}:${i % 6}`, 70, 70, 35, 35, (c) => { PP.path(c, PP.starPts(0, 0, 22, PP.rand('srt', i % 6) * 0.6)); c.fillStyle = i % 5 === 0 ? '#f7e6b0' : '#f2cd5e'; c.fill(); PP.ink(c, [...PP.starPts(0, 0, 22, PP.rand('srt', i % 6) * 0.6), PP.starPts(0, 0, 22, PP.rand('srt', i % 6) * 0.6)[0]], { w: 1.6, seed: i, color: 'rgba(120,80,20,0.6)', dry: false }); }, { border: 4, shadowBlur: 4, shadowDx: 2, shadowDy: 3, shadowAlpha: 0.4 });
      PP.drawSprite(ctx, s, x, y, PP.rand('srr', i) * 0.8, (r / 22) * tw);
    }
  };

  PP.moon = (b) => PP.sticker('moon:' + (b % 2), 300, 300, 150, 150, (c) => {
    PP.path(c, PP.torn(PP.ellipsePoly(0, 0, 120, 120, 60), { rough: 2.5, seed: 400 }).pts);
    c.fillStyle = PP.pattern(c, 'cream');
    c.fill();
    c.fillStyle = 'rgba(200,180,140,0.35)';
    for (const [x, y, r] of [[-40, -30, 22], [30, 20, 30], [-10, 55, 14], [50, -50, 12]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
    PP.ink(c, PP.circlePts(0, 0, 121, 121, 50), { w: 2.6, seed: 401, boil: b, color: 'rgba(90,70,40,0.6)', dry: false });
  }, { border: 0, shadowBlur: 30, shadowAlpha: 0.5 });

  PP.sun = (b) => PP.sticker('sun:' + (b % 2), 340, 340, 170, 170, (c) => {
    for (let k = 0; k < 14; k++) { c.save(); c.rotate((k / 14) * Math.PI * 2); PP.path(c, [[-14, -112], [14, -112], [0, -160]]); c.fillStyle = PP.pattern(c, 'amber'); c.fill(); c.restore(); }
    PP.path(c, PP.torn(PP.ellipsePoly(0, 0, 100, 100, 50), { rough: 2, seed: 410 }).pts);
    c.fillStyle = PP.pattern(c, 'amber'); c.fill();
    PP.hatch(c, PP.ellipsePoly(0, 0, 96, 96, 30), { color: 'rgba(240,140,60,0.35)', gap: 6, seed: 411, boil: b });
  }, { border: 6, shadowBlur: 14, shadowAlpha: 0.3 });

  // distant city: rows of dark cut-out towers with a few lit windows
  PP.city = (mode) => PP.cached('city:' + mode, () => {
    const w = 2200, h = 900, c = PP.canvas(w, h), ctx = c.getContext('2d');
    for (let row = 0; row < 2; row++) {
      let x = -40;
      while (x < w) {
        const bw = 90 + PP.rand('cw', row, x) * 140, bh = (row ? 260 : 420) + PP.rand('ch', row, x) * 380;
        const top = h - bh;
        PP.paperPiece(ctx, [[x, h + 20], [x, top + 20], [x + bw * 0.5, top - (PP.rand('cp', x) < 0.2 ? 40 : 0)], [x + bw, top + 20], [x + bw, h + 20]], row ? 'slate' : 'ink', { seed: PP.hash('city', row, x), rough: 3, rim: 0, shadow: { blur: 18, dx: 0, dy: -4, a: 0.4 }, tint: mode === 'night' ? (row ? 'rgba(30,40,80,0.55)' : 'rgba(20,24,50,0.3)') : (row ? 'rgba(200,120,120,0.35)' : 'rgba(120,80,110,0.45)') });
        if (mode === 'night') for (let k = 0; k < 10; k++) { if (PP.rand('cl', row, x, k) > 0.45) continue; ctx.fillStyle = 'rgba(246,200,110,0.75)'; ctx.fillRect(x + 12 + PP.rand('clx', x, k) * (bw - 30), top + 40 + PP.rand('cly', x, k) * (bh - 80), 10, 14); }
        x += bw - 6;
      }
    }
    return c;
  });

  // ---------------------------------------------------------------- the desk, from above, for the close-ups
  PP.desk = (b) => PP.cached('desk:' + (b % 2), () => {
    const w = 1300, h = 2100, c = PP.canvas(w, h), ctx = c.getContext('2d');
    ctx.drawImage(PP.bigPaper('kraft', w, h, 8), 0, 0);
    // wood grain in ink
    for (let k = 0; k < 26; k++) {
      const y = 40 + k * 80 + PP.rand('wg', k) * 30;
      PP.ink(ctx, PP.curve([[0, y], [300, y + PP.rand('wa', k) * 20 - 10], [700, y + PP.rand('wb', k) * 24 - 12], [1300, y + 6]], 10), { w: 2.2, seed: 500 + k, boil: b % 2, color: 'rgba(90,55,25,0.35)', dry: false });
    }
    // a coffee ring and a pencil
    PP.ink(ctx, PP.circlePts(1040, 360, 110, 104, 50), { w: 9, seed: 520, boil: b % 2, color: 'rgba(110,60,25,0.35)', dry: false });
    PP.with(ctx, () => { ctx.translate(180, 1760); ctx.rotate(-0.5); PP.paperPiece(ctx, PP.rectPoly(0, -14, 360, 28), 'amber', { seed: 530, rough: 1, rim: 0 }); PP.paperPiece(ctx, [[360, -14], [420, 0], [360, 14]], 'kraft', { seed: 531, rough: 1, rim: 0 }); PP.paperPiece(ctx, PP.rectPoly(-40, -14, 40, 28), 'rose', { seed: 532, rough: 1, rim: 0 }); });
    return c;
  });
})(typeof window !== 'undefined' ? window : globalThis);
