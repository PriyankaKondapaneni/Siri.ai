// 11:11, Episode 1, "The Voice From My Phone": the shot list. Each shot is a pure function of time, cut on the
// words of the narration: wides to set a place, close-ups for feeling, inserts for the clues (clock, phone, watch).
(function (g) {
  const PP = g.PP;
  const C = PP.CUES, T = g.TIMING;
  const E = PP.ease;
  const W = PP.W, H = PP.H;
  const ENV = g.ENVELOPE || { live: [] };
  const line = (id) => T.lines.find((l) => l.id === id);
  const word = (id, w, n = 0) => T.words.filter((x) => x.line === id && x.w.toLowerCase().replace(/[^a-z0-9:']/g, '') === w)[n].s;
  const msg = (id, extra = {}) => ({ s: line(id).s, e: line(id).e, text: line(id).text, words: C.noteWords[id], time: '11:11 PM', ...extra });
  const lerpCam = (u, a, b, e = E.inOut) => { const k = e(PP.clamp(u)); return { x: PP.lerp(a.x, b.x, k), y: PP.lerp(a.y, b.y, k), z: PP.lerp(a.z, b.z, k) }; };
  const linear = (x) => x;
  const F = (PP.FRAME = PP.FRAME || {});

  // a character, lit by the scene: breathing, blinking, a soft shadow and a rim of the key light; `talk` lip-syncs
  function char(ctx, t, name, x, y, h, o = {}) {
    let state = PP.blinking(t, name + (o.id || '')) && PP.FACES[name]?.eyes?.length ? 'b' : '';
    if (o.talk) { const fr = Math.round(t * 30), v = Math.max(ENV.live[fr] || 0, ENV.live[fr - 1] || 0); state += v > 0.45 ? 'm2' : v > 0.12 ? 'm1' : ''; }
    const breath = o.breath ?? Math.sin(t * 1.5 + name.length) * 0.005;
    PP.drawCut(ctx, name, x, y, h, { sticker: false, shadow: { a: 0.3, dx: 18, dy: 26 }, ...o, state, breath });
  }
  const onCut = (name, x, y, h, [ax, ay], u, v) => { const im = PP.IMG[name], s = h / im.height; return [x + (u - ax) * im.width * s, y + (v - ay) * im.height * s, s]; };
  // a blurred foreground shoulder for over-the-shoulder framing
  function foreground(ctx, name, x, y, h, o = {}) {
    PP.with(ctx, () => { ctx.filter = `blur(${o.blur ?? 16}px) brightness(${o.bright ?? 0.55})`; PP.drawCut(ctx, name, x, y, h, { sticker: false, flip: o.flip, anchor: o.anchor }); });
  }
  function clockHands(ctx, x, y, r, hh, mm, color = '#2a2226') {
    const ha = ((hh % 12) + mm / 60) / 12 * Math.PI * 2, ma = (mm / 60) * Math.PI * 2;
    PP.with(ctx, () => {
      ctx.strokeStyle = color; ctx.lineCap = 'round';
      ctx.lineWidth = r * 0.085; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(ha) * r * 0.5, y - Math.cos(ha) * r * 0.5); ctx.stroke();
      ctx.lineWidth = r * 0.055; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(ma) * r * 0.78, y - Math.cos(ma) * r * 0.78); ctx.stroke();
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r * 0.07, 0, 7); ctx.fill();
    });
  }
  function digital(ctx, x, y, size, text, a = 0.95) {
    PP.with(ctx, () => { ctx.font = `500 ${Math.round(size)}px Inter`; ctx.fillStyle = `rgba(160,228,255,${a})`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(110,200,255,0.95)'; ctx.shadowBlur = size * 0.5; ctx.fillText(text, x, y); });
  }
  // the bedroom set: depth-layered room, rain on the window, the lamp, the bedside clock
  function bedroom(ctx, t, cam, o = {}) {
    const bg = PP.drawBgDepth(ctx, 'B1', { ...cam, z0: 1 }, { horizon: 0.35, k: 0.9, variant: o.variant });
    const [wx, wy] = bg.map(0.57, 0), [wx2, wy2] = bg.map(1, 0.4);
    PP.rain(ctx, t, [wx, wy, wx2 - wx, wy2 - wy], { n: 60 });
    const [lx, ly] = bg.map(0.19, 0.45);
    PP.glowAt(ctx, lx, ly, 360 * bg.s / 1.25, '255,196,120', 0.42);
    const [cx, cy] = bg.map(0.31, 0.553);
    const pulse = o.pulse ?? 0;
    PP.glowAt(ctx, cx, cy, (90 + pulse * 140) * bg.s / 1.25, '120,200,255', 0.35 + pulse * 0.45);
    digital(ctx, cx, cy, 30 * bg.s, o.clock || '11:11');
    return bg;
  }
  // a phone insert: the screen close, its room soft and dark behind, the light of the screen on everything
  function phoneShot(ctx, t, bgName, msgs, o = {}) {
    const u = o.u ?? 0;
    PP.drawBg(ctx, bgName, { x: 0.5, y: 0.5, z: 1.15 + u * 0.06 }, { variant: 'dark' });
    PP.with(ctx, () => { ctx.fillStyle = 'rgba(4,6,14,0.45)'; ctx.fillRect(0, 0, W, H); });
    const [hx, hy, hr] = PP.handheld(t, 4, o.seed ?? 3);
    const sc = (o.scale ?? 1.02) * (1 + u * (o.push ?? 0.05));
    const fy = o.y ?? 850;
    PP.with(ctx, () => {
      if (o.focus) { ctx.translate(540, fy); ctx.scale(o.focus, o.focus); ctx.translate(-540, -fy - (o.focusY ?? 0)); }
      PP.phone(ctx, 540 + hx, fy + hy + (o.rise ?? 0), sc, { t, rot: (o.rot ?? -0.02) + hr, glow: 1, urgent: o.urgent, banner: o.banner, msgs });
    });
    F.phone = true;
  }

  const S = [];
  const shot = (s, e, look, fn, tr) => S.push([s, e, look, fn, tr]);

  // ---------------------------------------------------------------- 1. Night. The clock. Mira.
  const clockCut = C.clock1111 - 0.12;
  shot(0, clockCut, 'night', (ctx, t, u) => {
    bedroom(ctx, t, lerpCam(u, { x: 0.5, y: 0.5, z: 1.0 }, { x: 0.45, y: 0.53, z: 1.12 }), { clock: '11:10' });
  }, 'fadeIn');
  shot(clockCut, 3.1, 'night', (ctx, t, u) => {
    const pulse = t > C.clock1111 ? Math.max(0, 1 - (t - C.clock1111) / 1.4) : 0;
    bedroom(ctx, t, lerpCam(u, { x: 0.31, y: 0.553, z: 4.2 }, { x: 0.31, y: 0.553, z: 4.6 }, E.out), { clock: t < C.clock1111 ? '11:10' : '11:11', pulse });
  });
  shot(3.1, 6.6, 'night', (ctx, t, u) => {
    bedroom(ctx, t, { x: 0.55, y: 0.5, z: 1.25 }, { variant: 'blur' });
    const h = 1900 * (1 + u * 0.05);
    char(ctx, t, 'M2', 600, 2080, h, { tint: 'rgba(30,40,110,0.08)', light: { x: 0.62, y: 0.3, r: 0.55, color: 'rgba(200,225,255,0.22)' }, rim: { color: 'rgba(255,200,140,0.9)', dx: -5, dy: -2, a: 0.7 } });
  });
  // the title: the window in the rain, the name of the show
  shot(6.6, C.note1, 'night', (ctx, t, u) => {
    bedroom(ctx, t, lerpCam(u, { x: 0.72, y: 0.22, z: 1.9 }, { x: 0.7, y: 0.24, z: 2.05 }, linear), { variant: 'soft' });
    PP.with(ctx, () => { ctx.fillStyle = 'rgba(3,5,14,0.45)'; ctx.fillRect(0, 0, W, H); });
    const a = Math.min(PP.clamp((t - 7.0) / 0.9), PP.clamp((C.note1 - 0.1 - t) / 0.4));
    PP.spaced(ctx, '11:11', 540, 820, { font: '200 230px Inter', spacing: 14, glow: 'rgba(130,200,255,0.75)', blur: 40, alpha: a });
    PP.spaced(ctx, 'EPISODE 1', 540, 1010, { font: '500 30px Inter', spacing: 14, alpha: a * PP.clamp((t - 7.6) / 0.6), color: 'rgba(225,232,255,0.85)' });
    PP.spaced(ctx, 'THE VOICE FROM MY PHONE', 540, 1062, { font: '300 34px Inter', spacing: 8, alpha: a * PP.clamp((t - 7.8) / 0.6), color: 'rgba(225,232,255,0.85)' });
  }, 'dissolve');

  // ---------------------------------------------------------------- 2. The first voice note
  const wearCut = word('k1', 'wear') - 0.05;
  shot(C.note1, wearCut, 'phone', (ctx, t, u) => {
    const rise = E.out(PP.clamp((t - C.note1) / 0.6));
    phoneShot(ctx, t, 'B5', [msg('k1', { deleted: C.delete + 0.2 })], { u, banner: C.buzz[0], rise: (1 - rise) * 120 });
  });
  shot(wearCut, C.cafe, 'night', (ctx, t, u) => {
    bedroom(ctx, t, { x: 0.6, y: 0.45, z: 1.6 }, { variant: 'blur' });
    char(ctx, t, 'M2', 540, 880, 2500 * (1 + u * 0.04), { id: 'cu', anchor: [0.55, 0.38], tint: 'rgba(30,40,110,0.08)', light: { x: 0.6, y: 0.4, r: 0.5, color: 'rgba(200,225,255,0.22)' }, rim: { color: 'rgba(255,200,140,0.9)', dx: -6, a: 0.6 } });
  });
  shot(C.cafe, C.cafeCut, 'phone', (ctx, t, u) => {
    phoneShot(ctx, t, 'B5', [msg('k1', { deleted: C.delete + 0.2 })], { u, push: 0.03, seed: 5 });
  });

  // ---------------------------------------------------------------- 3. The café, 8:02
  const cafeWide = C.cafeCut + 0.9;
  shot(C.cafeCut, cafeWide, 'morning', (ctx, t, u) => {
    const bg = PP.drawBg(ctx, 'B2', lerpCam(u, { x: 0.8, y: 0.15, z: 3.4 }, { x: 0.8, y: 0.15, z: 3.7 }, E.out));
    const [kx, ky] = bg.map(0.8, 0.142);
    clockHands(ctx, kx, ky, 0.085 * 1024 * bg.s, 8, 2);
  });
  shot(cafeWide, C.train, 'morning', (ctx, t, u) => {
    const [sx, sy, sr] = PP.shake(t, C.spill, 18, 0.45);
    PP.with(ctx, () => {
      ctx.translate(sx, sy); ctx.rotate(sr);
      const bg = PP.drawBg(ctx, 'B2', lerpCam(u, { x: 0.5, y: 0.52, z: 1.25 }, { x: 0.5, y: 0.52, z: 1.32 }), { variant: 'soft' });
      const [kx, ky] = bg.map(0.8, 0.142);
      clockHands(ctx, kx, ky, 0.085 * 1024 * bg.s, 8, 2);
      const [wx, wy] = bg.map(0.0, 0.1);
      PP.dust(ctx, t, [wx, wy, 0.3 * 1024 * bg.s, 0.5 * 1536 * bg.s], 40);
      const spilled = t >= C.spill - 0.04;
      char(ctx, t, spilled ? 'M3' : 'M1', 540, 2000, 1800, { light: { x: 0.05, y: 0.3, r: 0.8, color: 'rgba(255,215,160,0.3)' }, rim: { color: 'rgba(255,225,170,0.95)', dx: -6, dy: -3, a: 0.8 } });
      if (spilled) for (let k = 0; k < 12; k++) {
        const v = (t - C.spill) / 0.8;
        if (v > 1) break;
        const ang = -1.3 + PP.rand('dr', k) * 1.5, sp = 400 + PP.rand('ds', k) * 600;
        const x = 950 + Math.cos(ang) * sp * v, y = 1080 + Math.sin(ang) * sp * v + 900 * v * v;
        PP.with(ctx, () => { ctx.fillStyle = '#6b3f22'; ctx.strokeStyle = '#1d1a1d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, 7 + PP.rand('dz', k) * 7, 9 + PP.rand('dz', k) * 9, ang, 0, 7); ctx.fill(); ctx.stroke(); });
      }
    });
  });

  // ---------------------------------------------------------------- 4. The warning; the train
  const trainCut = line('n4').s - 0.05, liedCut = word('n4', 'i') - 0.08, handsCut = word('n4', 'hands') - 0.1;
  shot(C.train, trainCut, 'phone', (ctx, t, u) => {
    phoneShot(ctx, t, 'B5', [msg('k2')], { u, banner: C.buzz[1], seed: 7 });
  });
  shot(trainCut, liedCut, 'train', (ctx, t, u) => {
    PP.drawBgDepth(ctx, 'B3', { ...lerpCam(u, { x: 0.5, y: 0.42, z: 1.0 }, { x: 0.5, y: 0.43, z: 1.08 }), z0: 1 }, { horizon: 0.375, k: 1.4 });
    const lean = E.inOut(PP.clamp((t - C.asked + 0.1) / 0.5));
    char(ctx, t, 'M4', 350, 2150, 1580, { tint: 'rgba(20,50,60,0.12)', rim: { color: 'rgba(220,255,250,0.8)', dx: 5, a: 0.5 } });
    char(ctx, t, 'S1', 860 - lean * 70, 2120, 1480 * (1 + lean * 0.05), { tint: 'rgba(10,30,40,0.2)' });
  });
  shot(liedCut, handsCut, 'train', (ctx, t, u) => {
    const [hx, hy, hr] = PP.handheld(t, 5 + u * 6, 11);
    PP.with(ctx, () => {
      ctx.translate(hx, hy); ctx.rotate(hr);
      PP.drawBg(ctx, 'B3', { x: 0.35, y: 0.45, z: 1.5 }, { variant: 'blur' });
      char(ctx, t, 'M4', 560, 900, 2750 * (1 + u * 0.04), { id: 'c', anchor: [0.55, 0.34], tint: 'rgba(20,50,60,0.12)', rim: { color: 'rgba(220,255,250,0.8)', dx: 6, a: 0.5 } });
      foreground(ctx, 'S1', 1250, 2300, 2600, { blur: 22, bright: 0.4 });
    });
  });
  shot(handsCut, C.note3, 'train', (ctx, t, u) => {
    const [hx, hy] = PP.handheld(t, 10, 13), tr = Math.sin(t * 38) * 4;
    PP.with(ctx, () => {
      ctx.translate(hx + tr, hy);
      PP.drawBg(ctx, 'B3', { x: 0.5, y: 0.7, z: 1.8 }, { variant: 'blur' });
      char(ctx, t, 'M4', 540, 960, 3600 * (1 + u * 0.05), { id: 'h', anchor: [0.5, 0.72], breath: 0, tint: 'rgba(20,50,60,0.15)' });
    });
    PP.with(ctx, () => { const p = 0.5 + 0.5 * Math.sin(t * 9); const gr = ctx.createRadialGradient(540, 960, 380, 540, 960, 1200); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(110,0,0,${0.28 * p})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); });
  });

  // ---------------------------------------------------------------- 5. The urgent message
  const curbCut = word('k3', 'stay') - 0.05;
  shot(C.note3, curbCut, 'danger', (ctx, t, u) => {
    phoneShot(ctx, t, 'B1', [msg('k3', { urgent: true })], { u, urgent: true, banner: C.buzz[2], seed: 9, push: 0.06 });
  });
  shot(curbCut, C.street, 'danger', (ctx, t, u) => {
    phoneShot(ctx, t, 'B1', [msg('k3', { urgent: true })], { u, urgent: true, seed: 9, focus: 1.55 + u * 0.08, focusY: 260 });
  });

  // ---------------------------------------------------------------- 6. Fifth Street, 6:40
  const carCut = C.car - 0.1, lightCut = C.redLight - 0.12, rushCut = C.redLight + 0.55;
  shot(C.street, carCut, 'dusk', (ctx, t, u) => {
    const bg = PP.drawBgDepth(ctx, 'B4', { ...lerpCam(u, { x: 0.52, y: 0.5, z: 1.0 }, { x: 0.52, y: 0.52, z: 1.06 }), z0: 1 }, { horizon: 0.52, k: 1.5 });
    const [rx, ry] = bg.map(0.594, 0.146);
    PP.glowAt(ctx, rx, ry, 120, '255,60,40', 0.55);
    char(ctx, t, 'M5', 330, 2000, 1250, { sway: { amp: 5, t, from: 0, to: 0.45, speed: 3 }, rim: { color: 'rgba(255,190,130,0.95)', dx: 5, dy: -3, a: 0.8 } });
  });
  shot(carCut, lightCut, 'dusk', (ctx, t, u) => {
    const bg = PP.drawBgDepth(ctx, 'B4', { ...lerpCam(u, { x: 0.45, y: 0.5, z: 1.2 }, { x: 0.45, y: 0.5, z: 1.24 }), z0: 1 }, { horizon: 0.52, k: 1.5, variant: 'soft' });
    const [vx, vy] = bg.map(0.594, 0.52);
    PP.flare(ctx, vx, vy, 0.3 + u * 0.5);
    char(ctx, t, 'M5', 520, 2000, 1850, { sway: { amp: 8, t, from: 0, to: 0.45, speed: 4 }, light: { x: 0.05, y: 0.35, r: 0.8, color: `rgba(255,230,190,${0.15 + u * 0.3})` }, rim: { color: 'rgba(255,200,140,0.95)', dx: -6, a: 0.8 } });
  });
  shot(lightCut, rushCut, 'danger', (ctx, t, u) => {
    const bg = PP.drawBg(ctx, 'B4', lerpCam(u, { x: 0.594, y: 0.146, z: 4.0 }, { x: 0.594, y: 0.146, z: 4.6 }, E.out), {});
    const [rx, ry] = bg.map(0.594, 0.146);
    PP.glowAt(ctx, rx, ry, 360, '255,40,30', 0.85);
    PP.flare(ctx, rx, ry, 0.9, '255,80,60');
  });
  shot(rushCut, C.impact, 'dusk', (ctx, t, u) => {
    const [hx, hy, hr] = PP.handheld(t, 8, 17);
    const [sx, sy, sr] = PP.shake(t, C.pulled, 22, 0.6);
    PP.with(ctx, () => {
      ctx.translate(hx + sx, hy + sy); ctx.rotate(hr + sr);
      const bg = PP.drawBgDepth(ctx, 'B4', { ...lerpCam(u, { x: 0.53, y: 0.55, z: 1.08 }, { x: 0.53, y: 0.56, z: 1.2 }, E.in), z0: 1 }, { horizon: 0.52, k: 1.5 });
      const [vx, vy] = bg.map(0.594, 0.52);
      PP.headlights(ctx, t, rushCut - 0.1, C.impact + 0.05, vx, vy);
      const pull = E.out(PP.clamp((t - C.pulled) / 0.3));
      const lit = PP.clamp((t - rushCut) / 1.4);
      char(ctx, t, 'M5', 360 + pull * 90, 2000, 1750, { rot: pull * 0.06, sway: { amp: 10 + lit * 10, t, from: 0, to: 0.45, speed: 6 }, light: { x: 0.1, y: 0.4, r: 0.9, color: `rgba(255,235,200,${0.2 + 0.45 * lit})` }, rim: { color: 'rgba(255,240,210,1)', dx: -7, a: 0.9 } });
      if (t > C.pulled) {
        const inn = E.out(PP.clamp((t - C.pulled) / 0.22));
        char(ctx, t, 'K2', 1600 - inn * 520, 2060, 1650, { light: { x: 0.2, y: 0.3, r: 0.8, color: `rgba(255,235,200,${0.2 + 0.4 * lit})` }, rim: { color: 'rgba(255,240,210,1)', dx: -7, a: 0.9 } });
      }
    });
  });
  // after the miss: the white of the headlights fading into the street, everything still
  shot(C.impact, C.eyes, 'dusk', (ctx, t, u) => {
    PP.drawBg(ctx, 'B4', { x: 0.5, y: 0.5, z: 1.3 }, { variant: 'blur' });
    PP.with(ctx, () => { ctx.fillStyle = `rgba(255,250,240,${0.9 * (1 - E.out(u))})`; ctx.fillRect(0, 0, W, H); });
  });

  // ---------------------------------------------------------------- 7. Him
  shot(C.eyes, C.watch, 'dusk', (ctx, t, u) => {
    PP.drawBg(ctx, 'B4', { x: 0.4, y: 0.4, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'K3', 540, 860, 2300 * (1 + u * 0.06), { anchor: [0.52, 0.42], light: { x: 0.1, y: 0.35, r: 0.7, color: 'rgba(255,190,120,0.35)' }, rim: { color: 'rgba(255,180,110,1)', dx: -7, dy: -2, a: 0.85 } });
  });
  shot(C.watch, C.okay, 'dusk', (ctx, t, u) => {
    PP.drawBg(ctx, 'B4', { x: 0.6, y: 0.5, z: 1.7 }, { variant: 'blur' });
    const h = 2300 * (1 + u * 0.1);
    char(ctx, t, 'K5', 560, 960, h, { anchor: [0.5156, 0.5195], breath: 0, light: { x: 0.52, y: 0.5, r: 0.3, color: 'rgba(255,225,190,0.3)' }, rim: { color: 'rgba(255,190,120,0.9)', dx: -6, a: 0.7 } });
    clockHands(ctx, 560, 960, 0.1406 * 1024 * (h / 1536), 11, 11);
    const [gx, gy] = onCut('K5', 560, 960, h, [0.5156, 0.5195], 0.44, 0.47);
    PP.flare(ctx, gx, gy, 0.35 + 0.25 * Math.sin(t * 2));
  });
  shot(C.okay, C.stunned, 'dusk', (ctx, t, u) => {
    PP.drawBg(ctx, 'B4', { x: 0.38, y: 0.42, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'K3', 600, 900, 2150 * (1 + u * 0.03), { id: 'o', anchor: [0.52, 0.42], talk: true, light: { x: 0.1, y: 0.35, r: 0.7, color: 'rgba(255,190,120,0.35)' }, rim: { color: 'rgba(255,180,110,1)', dx: -7, a: 0.85 } });
    foreground(ctx, 'M6', -260, 2300, 2400, { blur: 20, bright: 0.45, flip: true });
  });
  shot(C.stunned, C.met, 'dusk', (ctx, t, u) => {
    PP.drawBg(ctx, 'B4', { x: 0.6, y: 0.42, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'M6', 500, 870, 2250 * (1 + u * 0.06), { anchor: [0.55, 0.35], light: { x: 0.85, y: 0.3, r: 0.7, color: 'rgba(255,200,150,0.3)' }, rim: { color: 'rgba(255,190,130,1)', dx: 7, a: 0.8 } });
    foreground(ctx, 'K3', 1250, 2350, 2600, { blur: 22, bright: 0.4 });
  });
  shot(C.met, C.noIdea, 'dusk', (ctx, t, u) => {
    PP.drawBg(ctx, 'B4', { x: 0.38, y: 0.42, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'K4', 580, 900, 2150 * (1 + u * 0.03), { anchor: [0.53, 0.42], talk: true, light: { x: 0.1, y: 0.35, r: 0.7, color: 'rgba(255,190,120,0.3)' }, rim: { color: 'rgba(255,180,110,1)', dx: -7, a: 0.85 } });
    foreground(ctx, 'M6', -260, 2300, 2400, { blur: 20, bright: 0.45, flip: true });
  });
  // "He had no idea who I was": the world goes cold around her, the camera drifts away
  shot(C.noIdea, C.night, 'cold', (ctx, t, u) => {
    PP.drawBg(ctx, 'B4', { x: 0.5, y: 0.5, z: 1.35 - u * 0.1 }, { variant: 'blur' });
    char(ctx, t, 'M6', 540, 900 + u * 60, 2250 * (1 - u * 0.14), { id: 'n', anchor: [0.55, 0.35], tint: `rgba(40,50,80,${0.1 + u * 0.15})` });
  });

  // ---------------------------------------------------------------- 8. That night: the last message
  shot(C.night, C.last, 'night', (ctx, t, u) => {
    bedroom(ctx, t, lerpCam(u, { x: 0.36, y: 0.52, z: 1.5 }, { x: 0.32, y: 0.55, z: 2.3 }), { clock: '11:11', pulse: 0.3 + 0.2 * Math.sin(t * 3) });
  }, 'dissolve');
  shot(C.last, C.tearCut, 'phone', (ctx, t, u) => {
    phoneShot(ctx, t, 'B5', [msg('k6')], { u, banner: C.buzz[3], seed: 19 });
  });
  shot(C.tearCut, C.seven, 'night', (ctx, t, u) => {
    PP.drawBg(ctx, 'B1', { x: 0.5, y: 0.45, z: 1.5 }, { variant: 'blur' });
    const h = 2250 * (1 + u * 0.06), A = [0.58, 0.42];
    char(ctx, t, 'M7', 540, 880, h, { anchor: A, tint: 'rgba(20,30,90,0.08)', light: { x: 0.85, y: 0.8, r: 0.8, color: 'rgba(200,225,255,0.22)' }, rim: { color: 'rgba(150,200,255,0.9)', dx: 6, a: 0.7 } });
    const [ex, ey, sc] = onCut('M7', 540, 880, h, A, 0.678, 0.44);
    const v = PP.clamp((t - C.tearCut - 0.6) / 1.8);
    if (v > 0 && v < 1) PP.with(ctx, () => {
      const y = ey + E.inOut(v) * 210 * sc;
      ctx.globalAlpha = Math.min(1, (1 - v) * 4);
      ctx.fillStyle = '#c6e8ff'; ctx.strokeStyle = '#1d1a1d'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(ex, y - 26); ctx.quadraticCurveTo(ex + 16, y, ex, y + 14); ctx.quadraticCurveTo(ex - 16, y, ex, y - 26); ctx.fill(); ctx.stroke();
    });
  });
  const lastWords = word('k7', 'i') - 0.08;
  shot(C.seven, lastWords, 'phone', (ctx, t, u) => {
    phoneShot(ctx, t, 'B5', [msg('k7', { urgent: true })], { u, urgent: true, banner: C.buzz[4], seed: 23 });
  });
  shot(lastWords, C.makeIt, 'danger', (ctx, t, u) => {
    phoneShot(ctx, t, 'B5', [msg('k7', { urgent: true })], { u, urgent: true, seed: 23, focus: 1.5 + u * 0.12, focusY: 300 });
  });
  shot(C.makeIt, C.endCard, null, (ctx) => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); });

  // ---------------------------------------------------------------- 9. End card
  shot(C.endCard, C.total, null, (ctx, t) => {
    ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, W, H);
    const t0 = C.endCard, a = PP.clamp((t - t0 - 0.1) / 0.6);
    PP.spaced(ctx, '11:11', 540, 860, { font: '200 200px Inter', spacing: 14, glow: 'rgba(130,200,255,0.7)', blur: 36, alpha: a });
    PP.spaced(ctx, 'SIX DAYS LEFT', 540, 1040, { font: '500 32px Inter', spacing: 12, color: 'rgba(255,120,110,0.95)', alpha: PP.clamp((t - t0 - 0.5) / 0.5) });
    PP.spaced(ctx, 'TO BE CONTINUED', 540, 1110, { font: '300 30px Inter', spacing: 10, color: 'rgba(225,232,255,0.8)', alpha: PP.clamp((t - t0 - 0.8) / 0.5) });
  });

  PP.SHOTS = S;
})(typeof window !== 'undefined' ? window : globalThis);
