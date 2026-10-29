// 11:11, Episode 7, "Day Seven": the shot list, cut on the words of the narration. A last perfect day, the voice note
// from his future, the bridge in the rain at 11:11, and the watch that starts ticking.
(function (g) {
  const PP = g.PP;
  const C = PP.CUES, T = g.TIMING;
  const K = PP.shotKit(C, T);
  const { E, W, H, line, word, msg, lerpCam, char, onCut, foreground, phoneShot, shot } = K;

  const bridge = (ctx, t, cam, o = {}) => {
    const bg = PP.drawBgDepth(ctx, 'B8', { ...cam, z0: 1 }, { horizon: 0.5, k: 1.3, variant: o.variant });
    for (const [lx, ly] of [[0.127, 0.27], [0.31, 0.4], [0.39, 0.47]]) { const [x, y] = bg.map(lx, ly); PP.glowAt(ctx, x, y, 150 * bg.s / 1.25, '255,200,130', 0.45); }
    PP.rain(ctx, t, [0, 0, W, H], { n: o.heavy ? 140 : 80, drops: 0 });
    return bg;
  };
  const cafe = (ctx, t, cam, variant = 'soft') => {
    const bg = PP.drawBg(ctx, 'B2', cam, { variant });
    const [wx, wy] = bg.map(0.0, 0.1);
    PP.dust(ctx, t, [wx, wy, 0.3 * 1024 * bg.s, 0.5 * 1536 * bg.s], 30);
    return bg;
  };
  const WARM = { color: 'rgba(255,220,170,0.95)', a: 0.75 };
  const RAIN = { color: 'rgba(255,200,135,0.95)', a: 0.8 };
  const ARJUN = { bannerTitle: 'Unknown', bannerText: 'Voice message · +1 212-555-1111', bannerHold: 9 };
  // his watch; `tick` 0..1 brings the second hand to life, `minute` moves the minute hand on to 11:12
  const watch = (ctx, t, u, tick = 0, minute = 11) => {
    const h = 2300 * (1 + u * 0.08);
    char(ctx, t, 'K5', 560, 960, h, { anchor: [0.5156, 0.5195], breath: 0, rim: { ...RAIN, dx: -6 } });
    const R = 0.1406 * 1024 * (h / 1536);
    K.clockHands(ctx, 560, 960, R, 11, minute);
    if (tick > 0) {
      const sa = (Math.floor((t - C.ticking) * 1) / 60) * Math.PI * 2;
      PP.with(ctx, () => { ctx.globalAlpha = tick; ctx.strokeStyle = '#c2332b'; ctx.lineWidth = R * 0.025; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(560 - Math.sin(sa) * R * 0.15, 960 + Math.cos(sa) * R * 0.15); ctx.lineTo(560 + Math.sin(sa) * R * 0.85, 960 - Math.cos(sa) * R * 0.85); ctx.stroke(); });
    }
    PP.rain(ctx, t, [0, 0, W, H], { n: 50, drops: 30 });
  };

  // ---------------------------------------------------------------- 0. Cold open
  const hk = [0, 0.8, 1.5, 2.3, C.hookEnd];
  shot(hk[0], hk[1], 'night', (ctx, t, u) => {
    const bg = bridge(ctx, t, lerpCam(u, { x: 0.5, y: 0.5, z: 1.1 }, { x: 0.5, y: 0.5, z: 1.25 }, E.in), { heavy: true });
    const [vx, vy] = bg.map(0.47, 0.5);
    PP.headlights(ctx, t, hk[0] - 0.4, hk[1] + 0.2, vx, vy);
  });
  shot(hk[1], hk[2], 'night', (ctx, t, u) => {
    bridge(ctx, t, { x: 0.4, y: 0.4, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'K3', 540, 900, 4300 * (1 + u * 0.06), { id: 'hk', blink: false, anchor: [0.52, 0.405], rim: { ...RAIN, dx: -9 } });
  });
  shot(hk[2], hk[3], 'night', (ctx, t, u) => {
    bridge(ctx, t, { x: 0.5, y: 0.5, z: 1.8 }, { variant: 'blur' });
    char(ctx, t, 'H1', 540, 980, 3000 * (1 + u * 0.06), { anchor: [0.6, 0.57], breath: 0, blink: false, rim: { ...RAIN, dx: -6, a: 0.7 } });
  });
  shot(hk[3], hk[4], 'night', (ctx, t, u) => {
    bridge(ctx, t, { x: 0.5, y: 0.45, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'M11', 540, 820, 3000 * (1 + u * 0.06), { id: 'hk', blink: false, anchor: [0.5, 0.36], rim: { ...RAIN, dx: 7 } });
  });

  // ---------------------------------------------------------------- 1. Day seven: a perfect day
  const coffeeCut = word('n2', 'the') - 0.1, laughCut = word('n2', 'his') - 0.1, noTomorrowCut = word('n2', 'like') - 0.1;
  shot(C.hookEnd, line('n2').s - 0.1, 'morning', (ctx, t, u) => {
    cafe(ctx, t, lerpCam(u, { x: 0.5, y: 0.55, z: 1.2 }, { x: 0.5, y: 0.55, z: 1.28 }));
    const a = PP.clamp((t - C.hookEnd - 0.1) / 0.4) * PP.clamp((line('n2').s - 0.3 - t) / 0.3);
    char(ctx, t, 'M9', 250, 2230, 1800, { rim: { ...WARM, dx: -6 } });
    char(ctx, t, 'K6', 860, 2230, 1800, { rim: { ...WARM, dx: 6 } });
    PP.spaced(ctx, 'DAY SEVEN', 540, 260, { font: '600 60px Inter', spacing: 22, color: '#fff8f0', glow: 'rgba(40,20,10,0.9)', blur: 26, alpha: a });
  }, 'dissolve');
  shot(line('n2').s - 0.1, coffeeCut, 'morning', (ctx, t, u) => {
    cafe(ctx, t, { x: 0.35, y: 0.45, z: 1.5 }, 'blur');
    char(ctx, t, 'M1', 540, 2000, 1900 * (1 + u * 0.04), { rim: { ...WARM, dx: -6 } });
  });
  shot(coffeeCut, laughCut, 'morning', (ctx, t, u) => {
    cafe(ctx, t, lerpCam(u, { x: 0.5, y: 0.55, z: 1.25 }, { x: 0.5, y: 0.55, z: 1.32 }));
    char(ctx, t, 'M9', 250, 2230, 1800, { id: 'b', rim: { ...WARM, dx: -6 } });
    char(ctx, t, 'K6', 860, 2230, 1800, { id: 'b', rim: { ...WARM, dx: 6 } });
  });
  shot(laughCut, noTomorrowCut, 'morning', (ctx, t, u) => {
    cafe(ctx, t, { x: 0.65, y: 0.45, z: 1.5 }, 'blur');
    char(ctx, t, 'K6', 520, 900, 2600 * (1 + u * 0.05), { id: 'cu', anchor: [0.54, 0.4], rim: { ...WARM, dx: 7 } });
  });
  shot(noTomorrowCut, C.rain, 'morning', (ctx, t, u) => {
    cafe(ctx, t, { x: 0.5, y: 0.5, z: 1.8 }, 'blur');
    char(ctx, t, 'H1', 540, 980, 2700 * (1 + u * 0.06), { anchor: [0.6, 0.57], breath: 0, blink: false, light: { x: 0.3, y: 0.3, r: 0.8, color: 'rgba(255,215,160,0.35)' }, rim: { ...WARM, dx: -6 } });
  });

  // ---------------------------------------------------------------- 2. The rain; the voice note from his future
  shot(C.rain, C.buzzAt, 'cold', (ctx, t, u) => {
    bridge(ctx, t, lerpCam(u, { x: 0.5, y: 0.45, z: 1.0 }, { x: 0.5, y: 0.47, z: 1.08 }), { heavy: true });
  }, 'dissolve');
  shot(C.buzzAt, C.number, 'phone', (ctx, t, u) => {
    PP.drawBg(ctx, 'B8', { x: 0.5, y: 0.5, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'K8', 540, 2050, 1900 * (1 + u * 0.05), { light: { x: 0.35, y: 0.55, r: 0.6, color: 'rgba(170,215,255,0.45)' }, rim: { color: 'rgba(150,200,255,0.9)', dx: 6, a: 0.6 } });
    PP.rain(ctx, t, [0, 0, W, H], { n: 70, drops: 0 });
  });
  shot(C.number, line('k1').s - 0.1, 'danger', (ctx, t, u) => {
    phoneShot(ctx, t, 'B8', [], { u, seed: 111, banner: C.number - 0.2, ...ARJUN, focus: 1.6, focusY: -460 });
    PP.spaced(ctx, '+1 212-555-1111', 540, 1500, { font: '300 54px Inter', spacing: 8, color: '#ffe9e6', glow: 'rgba(255,80,70,0.7)', blur: 24, alpha: PP.clamp((t - C.number - 0.2) / 0.3) });
  });
  shot(line('k1').s - 0.1, line('k2').s - 0.5, 'phone', (ctx, t, u) => {
    PP.drawBg(ctx, 'B8', { x: 0.5, y: 0.5, z: 1.6 }, { variant: 'blur' });
    char(ctx, t, 'K8', 560, 880, 2600 * (1 + u * 0.08), { id: 'k1', anchor: [0.52, 0.45], talk: true, light: { x: 0.35, y: 0.55, r: 0.6, color: 'rgba(170,215,255,0.5)' }, rim: { color: 'rgba(150,200,255,0.9)', dx: 6, a: 0.6 } });
    PP.rain(ctx, t, [0, 0, W, H], { n: 60, drops: 0 });
  });
  shot(line('k2').s - 0.5, C.chooseHer, 'phone', (ctx, t, u) => {
    phoneShot(ctx, t, 'B8', [msg('k2', { time: 'from Kabir' })], { u, seed: 113, push: 0.06 });
  });
  shot(C.chooseHer, line('n4').s - 0.1, 'danger', (ctx, t, u) => {
    phoneShot(ctx, t, 'B8', [msg('k2', { urgent: true, time: 'from Kabir' })], { u, urgent: true, seed: 113, focus: 1.55 + u * 0.1, focusY: 260 });
  });
  shot(line('n4').s - 0.1, line('k3').s - 0.1, 'night', (ctx, t, u) => {
    bridge(ctx, t, { x: 0.4, y: 0.4, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'K3', 540, 860, 2600 * (1 + u * 0.08), { id: 'ch', blink: false, anchor: [0.52, 0.42], rim: { ...RAIN, dx: -8 } });
  });
  shot(line('k3').s - 0.1, C.t1110, 'night', (ctx, t, u) => {
    bridge(ctx, t, { x: 0.38, y: 0.42, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'K3', 600, 900, 2150 * (1 + u * 0.04), { id: 'k3', anchor: [0.52, 0.42], talk: true, rim: { ...RAIN, dx: -7 } });
    foreground(ctx, 'M8', -200, 2300, 2500, { blur: 20, bright: 0.45 });
  });

  // ---------------------------------------------------------------- 3. 11:10, the bridge, the headlights
  shot(C.t1110, C.bridge, 'night', (ctx, t, u) => {
    bridge(ctx, t, { x: 0.5, y: 0.45, z: 1.8 }, { variant: 'blur' });
    K.F.noSubs = true;
    PP.spaced(ctx, '11:10', 540, 880, { font: '200 250px Inter', spacing: 12, color: '#eef6ff', glow: 'rgba(130,200,255,0.7)', blur: 40 });
  });
  shot(C.bridge, C.lights, 'night', (ctx, t, u) => {
    bridge(ctx, t, lerpCam(u, { x: 0.5, y: 0.5, z: 1.0 }, { x: 0.5, y: 0.5, z: 1.1 }), { heavy: true });
    char(ctx, t, 'MK1', 560, 2080, 1350, { id: 'br', rim: { ...RAIN, dy: -6 } });
  });
  shot(C.lights, C.pushed, 'night', (ctx, t, u) => {
    const [hx, hy, hr] = PP.handheld(t, 8, 117);
    PP.with(ctx, () => {
      ctx.translate(hx, hy); ctx.rotate(hr);
      const bg = bridge(ctx, t, lerpCam(u, { x: 0.47, y: 0.5, z: 1.1 }, { x: 0.47, y: 0.5, z: 1.25 }, E.in), { heavy: true });
      const [vx, vy] = bg.map(0.47, 0.5);
      PP.headlights(ctx, t, C.lights - 0.2, C.impact + 0.05, vx, vy);
      char(ctx, t, 'M5', 470, 2000, 1800, { sway: { amp: 14, t, from: 0, to: 0.45, speed: 6 }, light: { x: 0.1, y: 0.4, r: 0.9, color: `rgba(255,235,200,${0.25 + 0.4 * u})` }, rim: { color: 'rgba(255,240,210,1)', dx: -7, a: 0.9 } });
    });
  });
  shot(C.pushed, C.firstTime, 'night', (ctx, t, u) => {
    const [sx, sy, sr] = PP.shake(t, C.pushed + 0.1, 24, 0.6);
    PP.with(ctx, () => {
      ctx.translate(sx, sy); ctx.rotate(sr);
      const bg = bridge(ctx, t, { x: 0.47, y: 0.5, z: 1.3 }, { heavy: true });
      const [vx, vy] = bg.map(0.47, 0.5);
      PP.headlights(ctx, t, C.lights - 0.2, C.impact + 0.05, vx, vy);
      const lunge = E.out(PP.clamp((t - C.pushed) / 0.25));
      char(ctx, t, 'K11', 760 - lunge * 160, 2000, 1900, { id: 'p', light: { x: 0.2, y: 0.4, r: 0.9, color: 'rgba(255,240,210,0.5)' }, rim: { color: 'rgba(255,245,220,1)', dx: -8, a: 0.95 } });
    });
    PP.speedLines(ctx, t, 540, 1000, 0.8);
  });
  shot(C.firstTime, C.impact, 'night', (ctx, t, u) => {
    const bg = bridge(ctx, t, { x: 0.5, y: 0.45, z: 1.4 }, { variant: 'blur' });
    const [vx, vy] = bg.map(0.47, 0.5);
    PP.headlights(ctx, t, C.lights - 0.2, C.impact + 0.05, vx, vy);
    char(ctx, t, 'M11', 540, 2000, 2000 * (1 + u * 0.05), { light: { x: 0.9, y: 0.3, r: 0.9, color: 'rgba(255,240,210,0.5)' }, rim: { color: 'rgba(255,245,220,1)', dx: 8, a: 0.9 } });
  });
  shot(C.impact, C.t1111, 'night', (ctx, t, u) => {
    bridge(ctx, t, { x: 0.5, y: 0.5, z: 1.3 }, { variant: 'blur' });
    PP.with(ctx, () => { ctx.fillStyle = `rgba(255,250,240,${0.95 * (1 - E.out(u))})`; ctx.fillRect(0, 0, W, H); });
  });

  // ---------------------------------------------------------------- 4. 11:11. Silence. The watch.
  shot(C.t1111, C.endCard, 'night', (ctx, t, u) => {
    PP.drawBg(ctx, 'B8', { x: 0.5, y: 0.6, z: 1.8 }, { variant: 'dark' });
    const tick = PP.clamp((t - C.ticking + 0.05) / 0.1);
    watch(ctx, t, u, tick, 11);
  });

  // ---------------------------------------------------------------- 5. End card: 11:12
  shot(C.endCard, C.total, null, (ctx, t) => {
    ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, W, H);
    const t0 = C.endCard, a = PP.clamp((t - t0 - 0.1) / 0.6);
    PP.spaced(ctx, '11:12', 540, 880, { font: '200 220px Inter', spacing: 14, glow: 'rgba(255,215,160,0.7)', blur: 40, color: '#fff6ea', alpha: a });
    PP.spaced(ctx, 'TO BE CONTINUED', 540, 1080, { font: '300 30px Inter', spacing: 10, color: 'rgba(225,232,255,0.8)', alpha: PP.clamp((t - t0 - 0.8) / 0.5) });
  });

  PP.SHOTS = K.S;
})(typeof window !== 'undefined' ? window : globalThis);
