// 11:11, Episode 2, "Don't Let Me Get On The Train": the shot list, cut on the words of the narration.
// Slice of life: someone moves in every shot, and time flows between scenes (the day passing in her room, the
// street lights coming on, the café emptying around them) instead of jumping.
(function (g) {
  const PP = g.PP;
  const C = PP.CUES, T = g.TIMING;
  const K = PP.shotKit(C, T);
  const { E, W, H, line, word, msg, lerpCam, char, onCut, foreground, clockHands, bedroom, phoneShot, shot } = K;
  const tl = (t, a, b, e = E.inOut) => e(PP.clamp((t - a) / (b - a)));
  const wEnd = (id, w) => T.words.find((x) => x.line === id && x.w.toLowerCase().replace(/[^a-z0-9:']/g, '') === w).e;

  // an old message, already played: his last words from Episode 1
  const lastNight = (() => { const text = "In seven days... I don't make it."; return { s: -20, e: -16, text, words: text.split(' ').map(() => ({ s: -20 })), time: '11:11 PM', urgent: true }; })();
  // the street lights: they flicker on one after another once the street reaches dusk
  const LAMPS = [[0.12, 0.2], [0.33, 0.27], [0.86, 0.22], [0.7, 0.3]];
  const street = (ctx, t, cam, o = {}) => {
    const bg = PP.drawBgDepth(ctx, 'B4', { ...cam, z0: 1 }, { horizon: 0.52, k: 1.4, variant: o.variant });
    const [rx, ry] = bg.map(0.594, 0.146);
    PP.glowAt(ctx, rx, ry, 110 * bg.s / 1.25, '255,60,40', 0.5);
    if (o.lampsOn != null) LAMPS.forEach(([lx, ly], i) => {
      const on = o.lampsOn - i * 0.18, fl = on < 0 ? 0 : on > 0.25 ? 1 : PP.rand('lamp', i, Math.floor(t * 20)) < 0.5 ? 1 : 0.15;
      const [x, y] = bg.map(lx, ly);
      PP.glowAt(ctx, x, y, 150 * bg.s / 1.25, '255,205,140', 0.55 * fl);
    });
    // the low sun at the end of the street: rays across the crossing and dust drifting in the light
    if (PP.RIG && PP.rays) { const [sx, sy] = bg.map(0.62, 0.42); PP.rays(ctx, t, sx, sy, { angle: 2.25, spread: 1.1, a: 0.1 }); PP.dust(ctx, t, [0, 300, PP.W, 1300], 34); }
    return bg;
  };
  const cafe = (ctx, t, cam, variant = 'soft', lamp = 1, dark = 0.32) => {
    const bg = PP.drawBg(ctx, 'B2', cam, { variant });
    PP.with(ctx, () => { ctx.fillStyle = `rgba(30,14,6,${dark})`; ctx.fillRect(0, 0, W, H); });
    const [lx, ly] = bg.map(0.62, 0.3);
    PP.glowAt(ctx, lx, ly, 520, '255,190,120', 0.35 * lamp);
    return bg;
  };
  const DUSK_RIM = { color: 'rgba(255,185,120,1)', a: 0.85 };
  const CAFE_RIM = { color: 'rgba(255,205,150,0.95)', a: 0.75 };
  const WARM = { x: 0.1, y: 0.35, r: 0.7, color: 'rgba(255,190,120,0.3)' };

  // ---------------------------------------------------------------- the café table, in pieces
  // T1 is the table with an empty plate; the cookie (CK) and both hands (HM, HK) are cut-outs moved in code.
  // Image coordinates are T1 pixels (1024 x 1536). The cookie is drawn whole until it snaps, then as two halves
  // split along a jagged line a little right of centre, so hers (the left) is the bigger one.
  const CX = 520, CY = 960, CK_S = 330 / 708, R = 165;
  const JAG = [[0, -1.05], [0.05, -0.7], [-0.04, -0.4], [0.06, -0.1], [-0.05, 0.2], [0.04, 0.5], [-0.03, 0.8], [0, 1.05]];
  const BITE = [[-0.62, -0.55, 0.26], [-0.82, -0.22, 0.2], [-0.4, -0.8, 0.19]];
  function piece(side, bite) {
    return PP.cached(`ck:${side}:${bite}`, () => {
      const im = PP.IMG.CK, c = PP.canvas(im.width, im.height), cc = c.getContext('2d'), r = 354, cx = 511, cy = 511, off = 0.12;
      const edge = () => { cc.beginPath(); JAG.forEach(([dx, dy], i) => cc[i ? 'lineTo' : 'moveTo'](cx + (off + dx) * r, cy + dy * r)); };
      cc.save(); cc.beginPath(); cc.moveTo(side === 'L' ? 0 : im.width, 0);
      JAG.forEach(([dx, dy]) => cc.lineTo(cx + (off + dx) * r, cy + dy * r));
      cc.lineTo(side === 'L' ? 0 : im.width, im.height); cc.closePath(); cc.clip();
      cc.drawImage(im, 0, 0); cc.restore();
      // the broken edge and the bite get the same thin ink line as the drawing
      cc.globalCompositeOperation = 'source-atop'; cc.strokeStyle = '#2a1a10'; cc.lineWidth = 9; cc.lineJoin = 'round';
      edge(); cc.stroke();
      if (bite) {
        cc.globalCompositeOperation = 'destination-out';
        for (const [bx, by, br] of BITE) { cc.beginPath(); cc.arc(cx + bx * r, cy + by * r, br * r, 0, 7); cc.fill(); }
        cc.globalCompositeOperation = 'source-atop';
        for (const [bx, by, br] of BITE) { cc.beginPath(); cc.arc(cx + bx * r, cy + by * r, br * r + 3, 0, 7); cc.stroke(); }
      }
      return c;
    });
  }
  function cookieAt(ctx, bg, img, ix, iy, rot = 0) {
    const [x, y] = bg.map(ix / 1024, iy / 1536), s = CK_S * bg.s;
    PP.with(ctx, () => {
      ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s * 0.86);
      ctx.shadowColor = 'rgba(40,20,5,0.35)'; ctx.shadowBlur = 24 * bg.s; ctx.shadowOffsetY = 14 * bg.s;
      ctx.drawImage(img, -511, -511);
    });
  }
  function hand(ctx, bg, name, ix, iy, rot = 0) {
    const [x, y] = bg.map(ix / 1024, iy / 1536), sc = (name === 'HM' ? 0.6 : 0.46) * bg.s;
    PP.drawCut(ctx, name, x, y, 1024 * sc, { sticker: false, anchor: name === 'HM' ? [0.703, 0.503] : [0.14, 0.546], rot, breath: 0, shadow: { a: 0.3, dx: 16 * bg.s, dy: 26 * bg.s } });
    if (name === 'HK') {
      // his watch: the blank dial, stopped at 11:11, carried with his hand
      const dx = 716 * sc, dy = -69 * sc, c = Math.cos(rot), s = Math.sin(rot);
      PP.with(ctx, () => { ctx.translate(x + dx * c - dy * s, y + dx * s + dy * c); ctx.rotate(rot); clockHands(ctx, 0, 0, 0.03 * 1536 * sc, 11, 11); });
    }
  }
  const CRUMBS = Array.from({ length: 16 }, (_, i) => ({ a: PP.rand('cra', i) * 6.283, d: 30 + PP.rand('crd', i) * 140, r: 3 + PP.rand('crr', i) * 7 }));
  function crumbs(ctx, bg, t, t0, ix, iy) {
    if (t < t0) return;
    const k = 1 - Math.exp(-(t - t0) * 10);
    PP.with(ctx, () => {
      ctx.fillStyle = '#b8783a'; ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 2 * bg.s;
      for (const c of CRUMBS) {
        const [x, y] = bg.map((ix + Math.cos(c.a) * c.d * k) / 1024, (iy + Math.sin(c.a) * c.d * k * 0.86) / 1536);
        ctx.beginPath(); ctx.arc(x, y, c.r * bg.s, 0, 7); ctx.fill(); ctx.stroke();
      }
    });
  }
  // the whole table scene at story time tt: the reach, the touch and her flinch, the snap, the bigger half slid
  // to her, him letting go when she teases him, and the stolen bite
  function table(ctx, t, cam, tt = t) {
    const bg = PP.drawBg(ctx, 'T1', cam);
    PP.with(ctx, () => { ctx.fillStyle = 'rgba(30,14,6,0.2)'; ctx.fillRect(0, 0, W, H); });
    const rM = tl(tt, C.reach - 0.05, C.touch - 0.25, E.out), rK = tl(tt, C.reach + 0.1, C.touch - 0.2, E.out);
    const touch = tl(tt, C.touch - 0.22, C.touch);
    const fl = tt < C.touch + 0.05 ? 0 : tt < C.touch + 0.17 ? E.out((tt - C.touch - 0.05) / 0.12) : 1 - tl(tt, C.touch + 0.17, C.touch + 0.65);
    const sp = tl(tt, C.snap, C.snap + 0.22, E.out);
    const sl = tl(tt, word('k6', 'bigger') - 0.1, word('k6', 'bigger') + 0.5);
    const lg = tl(tt, C.letGo, C.letGo + 0.16, E.out), lgM = tl(tt, C.letGo + 0.2, C.letGo + 0.7);
    const st = C.steal, d1 = tl(tt, st, st + 0.2, E.out), d2 = tl(tt, st + 0.3, st + 0.5, E.in), d3 = tl(tt, st + 0.65, st + 0.9, E.out), d4 = tl(tt, st + 0.95, st + 1.25);
    const carry = d2 * (1 - d3), bitten = tt > st + 0.55;
    // the cookie
    const bigX = CX - 14 * sp - 70 * sl + 900 * carry, bigY = CY - 120 * carry;
    if (sp <= 0) cookieAt(ctx, bg, PP.IMG.CK, CX, CY);
    else {
      cookieAt(ctx, bg, piece('R', false), CX + 26 * sp, CY + 4 * sp, 0.05 * sp);
      cookieAt(ctx, bg, piece('L', bitten), bigX, bigY, -0.04 * sp + 0.3 * carry);
      crumbs(ctx, bg, tt, C.snap, CX + 0.12 * R, CY);
    }
    // her hand: in a beat ahead of his, a little arc as it comes; the flinch at the touch; it follows the slid half
    const mx = PP.lerp(-380, 488, rM) + 22 * touch - 16 * fl - 60 * sl - 80 * lgM + 30 * carry;
    hand(ctx, bg, 'HM', mx, 930 - 26 * Math.sin(rM * Math.PI) + 6 * fl, -0.03 * fl);
    // his hand: the reach, the touch, the slide, jerking back when she teases him, then the steal
    let kx = PP.lerp(1404, 552, rK) - 22 * touch + 16 * fl - 70 * sl + 260 * lg, ky = 950 - 20 * Math.sin(rK * Math.PI), kr = 0.08 * lg;
    if (tt > st) {
      const rest = kx, grab = bigX + 30;
      kx = tt < st + 0.3 ? PP.lerp(rest, grab, d1) : grab + (rest - grab) * d4 * (tt > st + 0.95 ? 1 : 0);
      if (tt >= st + 0.3 && tt < st + 0.95) kx = bigX + 30;
      ky = 950 - 110 * carry; kr = 0.08 * (1 - d1) + 0.25 * carry;
    }
    hand(ctx, bg, 'HK', kx, ky, kr);
    return bg;
  }

  // ---------------------------------------------------------------- 0. Cold open: love and danger in four quick shots
  // the voice starts on the first frame; the phone punches out of a shake, then their fingertips meeting, the train, her shock
  const hk = [0, 0.42, 0.86, 1.3, C.hookEnd];
  shot(hk[0], hk[1], 'danger', (ctx, t, u) => {
    const [sx, sy, sr] = PP.shake(t, 0, 16, 0.4);
    PP.with(ctx, () => {
      ctx.translate(sx, sy); ctx.rotate(sr);
      phoneShot(ctx, t, 'B5', [msg('h0', { urgent: true })], { u, urgent: true, seed: 41, focus: 2.0 - E.out(u) * 0.3, focusY: 260 });
    });
  });
  shot(hk[1], hk[2], 'dark', (ctx, t, u) => {
    table(ctx, t, lerpCam(u, { x: 0.5, y: 0.61, z: 1.9 }, { x: 0.5, y: 0.61, z: 2.15 }, E.out), C.touch - 0.3 + (t - hk[1]) * 0.8);
  });
  shot(hk[2], hk[3], 'train', (ctx, t, u) => {
    const [hx, hy, hr] = PP.handheld(t, 9, 43);
    PP.with(ctx, () => {
      ctx.translate(hx, hy); ctx.rotate(hr);
      PP.drawBgDepth(ctx, 'B3', { ...lerpCam(u, { x: 0.5, y: 0.42, z: 1.15 }, { x: 0.5, y: 0.42, z: 1.55 }, E.in), z0: 1 }, { horizon: 0.375, k: 1.6 });
    });
    const flick = PP.rand('hfl', Math.floor(t * 15)) < 0.3 ? 0.6 : 0.35;
    PP.with(ctx, () => { ctx.fillStyle = `rgba(0,6,10,${flick})`; ctx.fillRect(0, 0, W, H); });
  });
  shot(hk[3], hk[4], 'night', (ctx, t, u) => {
    PP.drawBg(ctx, 'B1', { x: 0.5, y: 0.45, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'M10', 540, 860, 3400 * (1 + E.in(u) * 0.12), { id: 'hk', blink: false, anchor: [0.58, 0.36], tint: 'rgba(20,30,90,0.08)', rim: { color: 'rgba(150,200,255,0.9)', dx: 7, a: 0.7 },
      // the shock: a snap back with her chin up, an overshoot, a small shake as it lands
      pose: (tt) => ({ pitch: PP.kf(tt, [[hk[3], 0], [hk[3] + 0.12, -0.9, E.out], [hk[3] + 0.4, -0.55, E.outBack], [hk[4], -0.5]]), tilt: PP.kf(tt, [[hk[3], 0], [hk[3] + 0.12, -0.06, E.out], [hk[4], -0.035]]), yaw: 0.25 * Math.sin((tt - hk[3]) * 40) * Math.exp(-(tt - hk[3]) * 6) * (tt > hk[3] ? 1 : 0) }) });
  });

  // ---------------------------------------------------------------- 1. "Six days left." Then the whole day passes in her room
  shot(C.hookEnd, C.lapse, 'phone', (ctx, t, u) => {
    // she lowers the phone after reading his last message again
    phoneShot(ctx, t, 'B5', [lastNight], { u, urgent: true, seed: 47, push: 0.06, rise: E.inOut(PP.clamp((u - 0.55) / 0.45)) * 160, rot: -0.02 - 0.05 * E.inOut(PP.clamp((u - 0.55) / 0.45)) });
    PP.flash(ctx, t, C.hookEnd, 0.3);
    PP.spaced(ctx, '6 DAYS LEFT', 540, 200, { font: '500 40px Inter', spacing: 14, color: 'rgba(255,120,110,0.95)', glow: 'rgba(255,60,50,0.6)', blur: 20, alpha: PP.clamp((t - C.hookEnd - 0.05) / 0.3) });
  });
  // the time-lapse: the window goes night, dawn, day, dusk; a patch of sun crosses the floor; the clock races from
  // 11:12 PM to 6:39 PM; she hops around the bed the way people do in a time-lapse, then she is gone
  const SKY = [[0, [40, 50, 110], 0], [0.25, [255, 170, 150], 0.35], [0.55, [255, 244, 222], 0.6], [0.82, [255, 150, 80], 0.35], [1, [150, 90, 120], 0.15]];
  const sky = (k) => { for (let i = 1; i < SKY.length; i++) if (k <= SKY[i][0]) { const [a0, c0, d0] = SKY[i - 1], [a1, c1, d1] = SKY[i], f = (k - a0) / (a1 - a0); return [c0.map((v, j) => Math.round(PP.lerp(v, c1[j], f))), PP.lerp(d0, d1, f)]; } return [SKY.at(-1)[1], SKY.at(-1)[2]]; };
  const POSES = [[690, 2010, 0, 1], [640, 2025, -0.03, 1], [740, 2005, 0.025, 1], [670, 2030, -0.015, 1], [790, 2015, 0.03, 1], [0, 0, 0, 0]];
  shot(C.lapse, C.street, null, (ctx, t, u) => {
    const k = PP.clamp((t - C.lapse) / (C.street - C.lapse - 0.2)), [rgb, day] = sky(k);
    const mins = Math.floor(23 * 60 + 12 + k * (19 * 60 + 27)) % (24 * 60), hh = Math.floor(mins / 60), mm = mins % 60;
    const bg = bedroom(ctx, t, lerpCam(u, { x: 0.5, y: 0.5, z: 1.1 }, { x: 0.5, y: 0.5, z: 1.2 }, E.linear || ((x) => x)), { rain: false, lamp: 1 - day * 1.4, clock: `${hh % 12 || 12}:${String(mm).padStart(2, '0')}` });
    // the sky in the window: night blue, dawn pink, a bright day, the orange of dusk
    const [w0x, w0y] = bg.map(0.57, 0), [w1x, w1y] = bg.map(1, 0.4);
    PP.with(ctx, () => {
      const gr = ctx.createLinearGradient(0, w0y, 0, w1y);
      gr.addColorStop(0, `rgba(${rgb.map((v) => Math.round(v * 0.85)).join(',')},${0.3 + day})`); gr.addColorStop(1, `rgba(${rgb.join(',')},${0.25 + day * 0.9})`);
      ctx.globalCompositeOperation = day > 0.2 ? 'screen' : 'soft-light'; ctx.fillStyle = gr; ctx.fillRect(w0x, w0y, w1x - w0x, w1y - w0y);
    });
    const p = POSES[Math.min(POSES.length - 1, Math.floor(k * POSES.length))];
    const pi = Math.min(POSES.length - 1, Math.floor(k * POSES.length)), LOOK = [[0.4, 0.04, 0.3], [-0.5, -0.05, -0.2], [0.2, 0.06, 0.5], [-0.3, -0.03, -0.4], [0.55, 0.05, 0.1], [0, 0, 0]][pi];
    if (p[3]) char(ctx, t, 'M2', p[0], p[1], 1250, { rot: p[2], rim: { color: `rgba(${rgb.join(',')},0.9)`, dx: -5, a: 0.6 }, pose: { yaw: LOOK[0], tilt: LOOK[1], pitch: LOOK[2] } });
    PP.with(ctx, () => {
      ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = `rgba(${rgb.join(',')},0.5)`; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,236,205,${day * 0.32})`; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = `rgba(10,14,40,${0.35 * (1 - day / 0.6)})`; ctx.fillRect(0, 0, W, H);
    });
    const [wx, wy] = bg.map(0.78, 0.2), [sx, sy] = bg.map(PP.lerp(0.95, 0.15, k), 0.78);
    PP.glowAt(ctx, wx, wy, 700, rgb.join(','), 0.2 + day * 0.35);
    PP.glowAt(ctx, sx, sy, 420, '255,225,170', day * 0.5);
  }, 'dissolve');

  // ---------------------------------------------------------------- 2. "Same corner. 6:40. And there he was."
  const timeCut = word('n2', '6:40') - 0.12, thereCut = C.thereHeWas - 0.15;
  shot(C.street, timeCut, 'dusk', (ctx, t, u) => {
    street(ctx, t, lerpCam(u, { x: 0.52, y: 0.5, z: 1.0 }, { x: 0.5, y: 0.52, z: 1.1 }), { lampsOn: (t - C.street) / 0.9 });
    const walk = E.out(PP.clamp(u * 1.2));
    char(ctx, t, 'M8', -150 + walk * 560, 2000 + Math.abs(Math.sin(t * 7)) * -14 * (1 - walk), 1500, { rim: { ...DUSK_RIM, dx: 5, dy: -3 }, breath: Math.sin(t * 9) * 0.006 * (1 - walk),
      pose: (tt) => { const w = E.out(PP.clamp((tt - C.street) / (timeCut - C.street) * 1.2)); return { pitch: 0.18 * Math.sin(tt * 14) * (1 - w) - 0.15 * w, yaw: PP.kf(tt, [[C.street, -0.6], [C.street + 0.9, -0.6], [C.street + 1.4, 0.35, E.outBack], [timeCut, 0.2]]), tilt: 0.03 * Math.sin(tt * 7) * (1 - w), lean: 0.02 * (1 - w) }; } });
  }, 'dissolve');
  shot(timeCut, thereCut, 'dusk', (ctx, t, u) => {
    K.F.noSubs = true;
    street(ctx, t, { x: 0.594, y: 0.3, z: 1.9 + u * 0.15 }, { variant: 'blur', lampsOn: 2 });
    PP.with(ctx, () => { ctx.fillStyle = 'rgba(10,6,4,0.3)'; ctx.fillRect(0, 0, W, H); });
    PP.spaced(ctx, '6:40', 540, 880, { font: '200 260px Inter', spacing: 12, color: '#fff3e6', glow: 'rgba(255,170,110,0.8)', blur: 40, alpha: PP.clamp((t - timeCut) / 0.2) });
  });
  // he turns from the crossing toward her
  shot(thereCut, line('k1').s - 0.1, 'dusk', (ctx, t, u) => {
    street(ctx, t, { x: 0.38, y: 0.42, z: 1.5 }, { variant: 'blur', lampsOn: 2 });
    const turn = E.inOut(PP.clamp(u * 1.3));
    char(ctx, t, 'K4', PP.lerp(640, 560, turn), 900, 2200 * (1 + u * 0.06), { anchor: [0.53, 0.42], rot: PP.lerp(-0.06, 0, turn), light: WARM, rim: { ...DUSK_RIM, dx: -7 },
      pose: (tt) => { const a = thereCut, b = line('k1').s - 0.1, m = (a + b) / 2; return { yaw: PP.kf(tt, [[a, -0.95], [a + 0.25, -1.05, E.inOut], [m, 0.12, E.out], [m + 0.3, 0, E.inOut]]), pitch: PP.kf(tt, [[a, 0.1], [a + 0.25, 0.2], [m, -0.25, E.out], [b, -0.1]]), tilt: PP.kf(tt, [[a, 0.03], [m, -0.04, E.outBack], [b, 0]]) }; } });
    PP.flare(ctx, 160, 420, 0.4 * (1 - u));
  });

  // ---------------------------------------------------------------- 3. On the corner: he remembers the car, not her
  const butCut = word('n3', 'but') - 0.1;
  shot(line('k1').s - 0.1, line('n3').s - 0.1, 'dusk', (ctx, t, u) => {
    street(ctx, t, { x: 0.38, y: 0.42, z: 1.5 }, { variant: 'blur', lampsOn: 2 });
    // a surprised lift of the head on "Hey", a tilt as he places her
    const lift = Math.sin(tl(t, line('k1').s - 0.05, line('k1').s + 0.5) * Math.PI) * -14, tilt = 0.04 * tl(t, word('k1', 'crosswalk') - 0.3, word('k1', 'crosswalk') + 0.4);
    char(ctx, t, 'K4', 600, 900 + lift, 2150 * (1 + u * 0.03), { id: 'k1', anchor: [0.53, 0.42], rot: tilt, talk: true, light: WARM, rim: { ...DUSK_RIM, dx: -7 },
      pose: (tt) => ({ pitch: PP.kf(tt, [[line('k1').s - 0.1, 0], [line('k1').s + 0.15, -0.45, E.out], [line('k1').s + 0.7, -0.1, E.inOut]]), yaw: PP.kf(tt, [[line('k1').s - 0.1, 0.05], [word('k1', 'crosswalk') - 0.3, 0.18], [word('k1', 'crosswalk') + 0.3, -0.12, E.outBack], [line('n3').s, -0.05]]), tilt: PP.kf(tt, [[word('k1', 'crosswalk') - 0.3, 0], [word('k1', 'crosswalk') + 0.2, 0.06, E.outBack], [line('n3').s, 0.03]]) }) });
    foreground(ctx, 'M8', -200 + Math.sin(t * 1.3) * 10, 2300, 2500, { blur: 20, bright: 0.45 });
  });
  shot(line('n3').s - 0.1, butCut, 'dusk', (ctx, t, u) => {
    street(ctx, t, { x: 0.6, y: 0.42, z: 1.5 }, { variant: 'blur', lampsOn: 2 });
    char(ctx, t, 'M6', 500, 870, 2250 * (1 + u * 0.05), { anchor: [0.55, 0.35], sway: { amp: 7, t, from: 0, to: 0.45 }, light: { x: 0.85, y: 0.3, r: 0.7, color: 'rgba(255,200,150,0.3)' }, rim: { ...DUSK_RIM, dx: 7 } });
    foreground(ctx, 'K4', 1250, 2350, 2600, { blur: 22, bright: 0.4 });
  });
  shot(butCut, line('k2').s - 0.1, 'dusk', (ctx, t, u) => {
    street(ctx, t, { x: 0.6, y: 0.42, z: 1.6 }, { variant: 'blur', lampsOn: 2 });
    // her face falls a little on "not one of his messages"
    const drop = tl(t, butCut + 0.2, butCut + 1.0);
    char(ctx, t, 'M6', 540, 820 + 22 * drop, 3300 * (1 + u * 0.05), { id: 'b', anchor: [0.55, 0.35], rot: 0.025 * drop, sway: { amp: 6, t, from: 0, to: 0.45 }, light: { x: 0.85, y: 0.3, r: 0.7, color: 'rgba(255,200,150,0.25)' }, rim: { ...DUSK_RIM, dx: 8 } });
  });
  // "I'm Kabir. Coffee?" with a nod toward the café across the street
  shot(line('k2').s - 0.1, C.cafe, 'dusk', (ctx, t, u) => {
    street(ctx, t, lerpCam(u, { x: 0.4, y: 0.45, z: 1.25 }, { x: 0.42, y: 0.45, z: 1.3 }), { variant: 'soft', lampsOn: 2 });
    const nod = tl(t, word('k2', 'coffee') - 0.15, word('k2', 'coffee') + 0.35);
    char(ctx, t, 'K4', 560 + 30 * nod, 1050, 1800 * (1 + u * 0.04), { id: 'k2', anchor: [0.53, 0.42], rot: 0.05 * nod, talk: true, light: WARM, rim: { ...DUSK_RIM, dx: -7 } });
  });

  // ---------------------------------------------------------------- 4. The café: the last cookie
  const reachCut = C.reach - 0.12, shyCut = word('n4a', 'and') - 0.06, snapCut = word('k6', 'you') - 0.08, laughCut = C.letGo + 0.4;
  // the door bell; they sit down across from each other as the camera drifts in
  shot(C.cafe, reachCut, 'dark', (ctx, t, u) => {
    cafe(ctx, t, lerpCam(u, { x: 0.5, y: 0.55, z: 1.15 }, { x: 0.5, y: 0.55, z: 1.25 }));
    const sitM = tl(t, C.cafe, C.cafe + 0.7, E.out), sitK = tl(t, C.cafe + 0.15, C.cafe + 0.85, E.out);
    char(ctx, t, 'M9', 250, 2230 + 70 * (1 - sitM), 1800, { rim: { ...CAFE_RIM, dx: -6 }, light: { x: 0.9, y: 0.4, r: 0.8, color: 'rgba(255,200,140,0.25)' } });
    char(ctx, t, 'K6', 860, 2230 + 70 * (1 - sitK), 1800, { rim: { ...CAFE_RIM, dx: 6 }, light: { x: 0.1, y: 0.4, r: 0.8, color: 'rgba(255,200,140,0.25)' } });
  }, 'dissolve');
  // "We both reached for the last cookie..." both hands come in; the fingertips touch; she flinches, and stays
  shot(reachCut, shyCut, 'dark', (ctx, t, u) => {
    table(ctx, t, lerpCam(u, { x: 0.5, y: 0.6, z: 1.0 }, { x: 0.5, y: 0.61, z: 1.4 }));
  });
  // "...and neither of us let go." she lowers her eyes; a blush comes up
  shot(shyCut, line('k6').s - 0.1, 'dark', (ctx, t, u) => {
    cafe(ctx, t, { x: 0.3, y: 0.45, z: 1.5 }, 'blur');
    const shy = tl(t, shyCut, shyCut + 1.2), h = 2400 * (1 + u * 0.06);
    char(ctx, t, 'M9', 520, 960 + 16 * shy, h, { id: 'shy', anchor: [0.56, 0.39], rot: -0.035 * shy, rim: { ...CAFE_RIM, dx: -7 }, light: { x: 0.9, y: 0.4, r: 0.8, color: 'rgba(255,200,140,0.28)' } });
    for (const [cu, cv] of [[0.46, 0.46], [0.66, 0.44]]) { const [bx, by] = onCut('M9', 520, 960 + 16 * shy, h, [0.56, 0.39], cu, cv); PP.glowAt(ctx, bx, by, 70, '255,120,120', 0.3 * shy); }
  });
  // "Half?" a small tilt of his head
  shot(line('k6').s - 0.1, snapCut, 'dark', (ctx, t, u) => {
    cafe(ctx, t, { x: 0.4, y: 0.45, z: 1.6 }, 'blur');
    const tilt = Math.sin(tl(t, line('k6').s - 0.1, line('k6').s + 0.7) * Math.PI);
    char(ctx, t, 'K4', 580, 900 + 8 * tilt, 2150 * (1 + u * 0.05), { id: 'k6', anchor: [0.53, 0.42], rot: 0.045 * tilt, talk: true, light: WARM, rim: { ...CAFE_RIM, dx: -7 } });
    foreground(ctx, 'M9', -260, 2350, 2500, { blur: 20, bright: 0.45 });
  });
  // "...You can have the bigger one." the snap; he slides the big half to her. "Then why are you still holding it?" he lets go
  shot(snapCut, laughCut, 'dark', (ctx, t, u) => {
    const [sx, sy] = PP.shake(t, C.snap, 7, 0.25);
    PP.with(ctx, () => { ctx.translate(sx, sy); table(ctx, t, lerpCam(u, { x: 0.47, y: 0.62, z: 1.45 }, { x: 0.45, y: 0.62, z: 1.55 })); });
  });
  // he laughs, caught
  shot(laughCut, C.steal - 0.05, 'dark', (ctx, t, u) => {
    cafe(ctx, t, { x: 0.65, y: 0.45, z: 1.5 }, 'blur');
    const k = t - laughCut, bob = Math.abs(Math.sin(k * 14)) * -12 * Math.exp(-k * 1.5);
    char(ctx, t, 'K6', 520, 900 + bob, 2700 * (1 + u * 0.04), { id: 'cu', anchor: [0.54, 0.4], rot: Math.sin(k * 7) * 0.012, rim: { ...CAFE_RIM, dx: 7 }, light: { x: 0.1, y: 0.4, r: 0.8, color: 'rgba(255,200,140,0.25)' } });
  });
  // and steals a bite of her half
  shot(C.steal - 0.05, C.closing, 'dark', (ctx, t, u) => {
    table(ctx, t, lerpCam(u, { x: 0.5, y: 0.6, z: 1.15 }, { x: 0.5, y: 0.6, z: 1.22 }));
  });

  // ---------------------------------------------------------------- 5. "...until they closed the café." the hours pass
  // the wall clock spins, the room dims and the lamp goes out, and the two of them shift and lean as the night goes on
  const LEAN = [[0, 0, 0, 0], [20, -0.02, -15, 0.02], [35, -0.03, -30, 0.03], [10, 0.01, -10, -0.01], [45, -0.04, -40, 0.035], [55, -0.045, -50, 0.04]];
  shot(C.closing, C.watch, 'dark', (ctx, t, u) => {
    const k = PP.clamp((t - C.closing) / (C.watch - C.closing));
    const bg = cafe(ctx, t, lerpCam(u, { x: 0.62, y: 0.5, z: 1.15 }, { x: 0.62, y: 0.52, z: 1.22 }), 'soft', 1 - k * 0.8, 0.3 + k * 0.25);
    const [cx, cy] = bg.map(0.8, 0.142), hrs = 6.7 + k * 3.8;
    clockHands(ctx, cx, cy, 0.085 * 1024 * bg.s * 0.82, Math.floor(hrs), (hrs % 1) * 60);
    const p = LEAN[Math.min(LEAN.length - 1, Math.floor(k * LEAN.length))];
    char(ctx, t, 'M9', 250 + p[0], 2230, 1800, { rot: p[1], rim: { ...CAFE_RIM, dx: -6 }, light: { x: 0.9, y: 0.4, r: 0.8, color: 'rgba(255,200,140,0.25)' } });
    const laugh = Math.abs(Math.sin(t * 13)) * -10 * (Math.floor(k * 6) % 2);
    char(ctx, t, 'K6', 860 + p[2], 2230 + laugh, 1800, { rot: p[3], rim: { ...CAFE_RIM, dx: 6 }, light: { x: 0.1, y: 0.4, r: 0.8, color: 'rgba(255,200,140,0.25)' } });
  }, 'dissolve');

  // ---------------------------------------------------------------- 6. The watch; his brother
  shot(C.watch, line('k3').s - 0.1, 'dark', (ctx, t, u) => {
    cafe(ctx, t, { x: 0.5, y: 0.5, z: 1.7 }, 'blur', 0.4, 0.45);
    // his wrist moves as he talks, then goes still on "Stopped"
    const still = tl(t, word('n5', 'stopped') - 0.3, word('n5', 'stopped') + 0.2), mv = 1 - still;
    const x = 560 + Math.sin(t * 2.1) * 26 * mv, y = 960 + Math.sin(t * 1.6 + 1) * 16 * mv, rot = Math.sin(t * 1.3) * 0.05 * mv, h = 2300 * (1 + u * 0.1);
    char(ctx, t, 'K5', x, y, h, { anchor: [0.5156, 0.5195], rot, breath: 0, light: { x: 0.52, y: 0.5, r: 0.3, color: 'rgba(255,225,190,0.3)' }, rim: { ...CAFE_RIM, dx: -6 } });
    PP.with(ctx, () => { ctx.translate(x, y); ctx.rotate(rot); clockHands(ctx, 0, 0, 0.1406 * 1024 * (h / 1536), 11, 11); });
    PP.flare(ctx, x - 70, y - 90, (0.35 + 0.25 * Math.sin(t * 2)) * still);
  });
  // "It stopped the night my brother died." his head goes down; "I never fixed it." and comes back up
  shot(line('k3').s - 0.1, C.goodbye, 'dark', (ctx, t, u) => {
    cafe(ctx, t, { x: 0.4, y: 0.45, z: 1.6 }, 'blur', 0.4, 0.45);
    const down = tl(t, C.brother - 0.2, C.brother + 0.5) * (1 - 0.6 * tl(t, word('k3', 'never') - 0.1, word('k3', 'never') + 0.5));
    char(ctx, t, 'K3', 580, 900 + 26 * down, 2150 * (1 + u * 0.06), { id: 'k3', anchor: [0.52, 0.42], rot: -0.03 * down, talk: true, light: WARM, rim: { ...CAFE_RIM, dx: -7 } });
    foreground(ctx, 'M9', -260 + 20 * down, 2350, 2500, { blur: 20, bright: 0.45 });
  });

  // ---------------------------------------------------------------- 7. "We said goodbye at the door. I smiled the whole way home."
  shot(C.goodbye, C.walkHome, 'night', (ctx, t, u) => {
    street(ctx, t, { x: 0.4, y: 0.45, z: 1.45 }, { variant: 'blur', lampsOn: 2 });
    // the café door light on him; a small nod, then he steps back into the street
    const nod = Math.sin(tl(t, word('n5b', 'goodbye') - 0.1, word('n5b', 'goodbye') + 0.45) * Math.PI), back = tl(t, C.goodbye + 0.6, C.walkHome);
    char(ctx, t, 'K4', 560 + 50 * back, 940 + 14 * nod, 2100 * (1 - 0.1 * back), { id: 'bye', anchor: [0.53, 0.42], rot: 0.02 * nod, light: { x: 0.05, y: 0.35, r: 0.8, color: 'rgba(255,190,120,0.45)' }, rim: { ...DUSK_RIM, dx: -7 } });
  }, 'dissolve');
  shot(C.walkHome, C.night, 'night', (ctx, t, u) => {
    // the camera tracks her walking home alone under the street lights, smiling
    street(ctx, t, lerpCam(u, { x: 0.3, y: 0.5, z: 1.15 }, { x: 0.7, y: 0.5, z: 1.15 }, (x) => x), { lampsOn: 2 });
    const step = Math.abs(Math.sin(t * 6.5));
    char(ctx, t, 'M8', 420 + 160 * u, 2000 - 12 * step, 1450, { rot: Math.sin(t * 6.5) * 0.012, breath: 0, light: { x: 0.8, y: 0.3, r: 0.7, color: 'rgba(255,205,150,0.3)' }, rim: { ...DUSK_RIM, dx: 5, dy: -3 } });
  });

  // ---------------------------------------------------------------- 8. That night: the clock runs up to 11:11, the rain starts
  const clockCut = C.clock1111 - 0.12, litCut = word('n6', 'my') - 0.08;
  shot(C.night, clockCut, 'night', (ctx, t, u) => {
    const k = PP.clamp((t - C.night) / (clockCut - C.night - 0.15)), m = Math.min(10, Math.floor(PP.lerp(2, 10.99, k)));
    bedroom(ctx, t, lerpCam(u, { x: 0.42, y: 0.52, z: 1.15 }, { x: 0.36, y: 0.55, z: 1.4 }), { clock: `11:${String(m).padStart(2, '0')}`, rainAmount: k });
    // she turns over in bed, restless
    const turn = tl(t, C.night + 0.3, C.night + 1.0);
    char(ctx, t, 'M2', 800 - 40 * turn, 2030, 1250, { rot: -0.03 * turn, tint: 'rgba(30,40,110,0.18)', rim: { color: 'rgba(255,200,140,0.9)', dx: -5, a: 0.6 } });
  }, 'dissolve');
  shot(clockCut, litCut, 'night', (ctx, t, u) => {
    const pulse = t > C.clock1111 ? Math.max(0, 1 - (t - C.clock1111) / 1.4) : 0;
    bedroom(ctx, t, lerpCam(u, { x: 0.31, y: 0.553, z: 4.2 }, { x: 0.31, y: 0.553, z: 4.6 }, E.out), { clock: t < C.clock1111 ? '11:10' : '11:11', pulse });
  });
  shot(litCut, line('k4').s - 0.55, 'night', (ctx, t, u) => {
    bedroom(ctx, t, { x: 0.55, y: 0.5, z: 1.25 }, { variant: 'blur' });
    // the phone lights up her face; she sits up toward it
    const glow = PP.clamp((t - word('n6', 'lit')) / 0.3), up = tl(t, word('n6', 'lit'), word('n6', 'lit') + 0.6, E.out);
    char(ctx, t, 'M2', 600, 2080 - 50 * up, 1900 * (1 + u * 0.06), { tint: 'rgba(30,40,110,0.08)', light: { x: 0.62, y: 0.3, r: 0.55, color: `rgba(200,225,255,${0.12 + 0.25 * glow})` }, rim: { color: 'rgba(255,200,140,0.9)', dx: -5, dy: -2, a: 0.7 } });
  });

  // ---------------------------------------------------------------- 9. "Don't let me get on the train." / "Why...?"
  const trainCut = C.train - 0.1;
  shot(line('k4').s - 0.55, trainCut, 'phone', (ctx, t, u) => {
    phoneShot(ctx, t, 'B5', [msg('k4')], { u, banner: C.buzz[0], seed: 53, rise: -40 * E.out(u) });
  });
  shot(trainCut, line('m3').s - 0.1, 'train', (ctx, t, u) => {
    const [hx, hy, hr] = PP.handheld(t, 6, 61);
    PP.with(ctx, () => { ctx.translate(hx, hy); ctx.rotate(hr); PP.drawBgDepth(ctx, 'B3', { ...lerpCam(u, { x: 0.5, y: 0.42, z: 1.05 }, { x: 0.5, y: 0.42, z: 1.3 }), z0: 1 }, { horizon: 0.375, k: 1.5 }); });
    const flick = PP.rand('tfl', Math.floor(t * 12)) < 0.25 ? 0.55 : 0.45;
    PP.with(ctx, () => { ctx.fillStyle = `rgba(0,8,14,${flick})`; ctx.fillRect(0, 0, W, H); });
  });
  // she whispers back to the phone as if he could hear her; her hand brings it closer
  shot(line('m3').s - 0.1, line('k5').s - 0.55, 'phone', (ctx, t, u) => {
    phoneShot(ctx, t, 'B5', [msg('k4')], { u, seed: 63, push: 0.12, rise: -60 * E.out(u), rot: -0.02 + 0.03 * E.inOut(u) });
  });

  // ---------------------------------------------------------------- 10. "...you're the one who doesn't come home."
  const youCut = word('k5', "you're") - 0.1;
  shot(line('k5').s - 0.55, youCut, 'danger', (ctx, t, u) => {
    phoneShot(ctx, t, 'B5', [msg('k5', { urgent: true })], { u, urgent: true, banner: C.buzz[1], seed: 59 });
  });
  shot(youCut, C.makeIt, 'night', (ctx, t, u) => {
    PP.drawBg(ctx, 'B1', { x: 0.5, y: 0.45, z: 1.5 }, { variant: 'blur' });
    // her breath catches; a small tremble
    const [hx, hy] = PP.handheld(t, 4, 67);
    char(ctx, t, 'M7', 540 + hx, 860 + hy, 3000 * (1 + u * 0.1), { anchor: [0.58, 0.41], blink: false, breath: Math.sin(t * 5.5) * 0.009, tint: 'rgba(20,30,90,0.1)', light: { x: 0.85, y: 0.8, r: 0.8, color: 'rgba(255,120,110,0.25)' }, rim: { color: 'rgba(255,120,110,0.9)', dx: 6, a: 0.7 } });
  });
  shot(C.makeIt, C.endCard, null, (ctx) => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); });

  // ---------------------------------------------------------------- 11. End card
  shot(C.endCard, C.total, null, (ctx, t) => {
    ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, W, H);
    const t0 = C.endCard, a = PP.clamp((t - t0 - 0.1) / 0.6);
    PP.spaced(ctx, '11:11', 540, 860, { font: '200 200px Inter', spacing: 14, glow: 'rgba(130,200,255,0.7)', blur: 36, alpha: a });
    PP.spaced(ctx, 'FIVE DAYS LEFT', 540, 1040, { font: '500 32px Inter', spacing: 12, color: 'rgba(255,120,110,0.95)', alpha: PP.clamp((t - t0 - 0.5) / 0.5) });
    PP.spaced(ctx, 'TO BE CONTINUED', 540, 1110, { font: '300 30px Inter', spacing: 10, color: 'rgba(225,232,255,0.8)', alpha: PP.clamp((t - t0 - 0.8) / 0.5) });
  });

  PP.SHOTS = K.S;
})(typeof window !== 'undefined' ? window : globalThis);
