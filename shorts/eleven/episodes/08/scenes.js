// 11:11, Episode 8, "11:12": the shot list, cut on the words of the narration. He lives; a week of quiet; then a
// message in her own voice, ten years older.
(function (g) {
  const PP = g.PP;
  const C = PP.CUES, T = g.TIMING;
  const K = PP.shotKit(C, T);
  const { E, W, H, line, word, msg, lerpCam, char, bedroom, phoneShot, shot } = K;

  const bridge = (ctx, t, cam, o = {}) => {
    const bg = PP.drawBgDepth(ctx, 'B8', { ...cam, z0: 1 }, { horizon: 0.5, k: 1.3, variant: o.variant });
    for (const [lx, ly] of [[0.127, 0.27], [0.31, 0.4], [0.39, 0.47]]) { const [x, y] = bg.map(lx, ly); PP.glowAt(ctx, x, y, 150 * bg.s / 1.25, '255,200,130', 0.45); }
    PP.rain(ctx, t, [0, 0, W, H], { n: 70, drops: 0 });
    return bg;
  };
  const cafe = (ctx, t, cam, variant = 'soft') => PP.drawBg(ctx, 'B2', cam, { variant });
  const RAIN = { color: 'rgba(255,200,135,0.95)', a: 0.8 };
  const WARM = { color: 'rgba(255,220,170,0.95)', a: 0.75 };
  const BLUE = { color: 'rgba(160,200,255,0.9)', a: 0.6 };
  const ME = { header: 'Unknown' };

  // ---------------------------------------------------------------- 0. Cold open
  const hk = [0, 1.15, 2.3, 3.2, C.hookEnd];
  shot(hk[0], hk[1], 'phone', (ctx, t, u) => {
    phoneShot(ctx, t, 'B5', [msg('h0')], { u, seed: 121, focus: 1.6 + u * 0.15, focusY: 260, ...ME });
  });
  shot(hk[1], hk[2], 'night', (ctx, t, u) => {
    PP.drawBg(ctx, 'B9', { x: 0.4, y: 0.45, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'K3', 540, 900, 4300 * (1 + u * 0.06), { id: 'hk', blink: false, anchor: [0.52, 0.405], rim: { color: 'rgba(255,90,80,0.9)', a: 0.8, dx: -9 } });
  });
  shot(hk[2], hk[3], 'dark', (ctx, t, u) => {
    PP.drawBg(ctx, 'B8', { x: 0.5, y: 0.5, z: 1.8 }, { variant: 'blur' });
    char(ctx, t, 'A1', 540, 900, 3400 * (1 + u * 0.08), { id: 'hk', anchor: [0.5, 0.4], breath: 0, rim: { ...RAIN, dx: -5, a: 0.6 } });
  });
  shot(hk[3], hk[4], 'night', (ctx, t, u) => {
    PP.drawBg(ctx, 'B1', { x: 0.5, y: 0.45, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'M10', 540, 860, 3400 * (1 + u * 0.06), { id: 'hk', blink: false, anchor: [0.58, 0.36], rim: BLUE });
  });

  // ---------------------------------------------------------------- 1. 11:12. He's alive.
  shot(C.hookEnd, C.breathing, 'night', (ctx, t, u) => {
    bridge(ctx, t, { x: 0.5, y: 0.45, z: 1.8 }, { variant: 'blur' });
    K.F.noSubs = true;
    PP.spaced(ctx, '11:12', 540, 880, { font: '200 250px Inter', spacing: 12, color: '#fff6ea', glow: 'rgba(255,215,160,0.75)', blur: 40, alpha: PP.clamp((t - C.hookEnd) / 0.3) });
  });
  shot(C.breathing, line('k1').s - 0.1, 'night', (ctx, t, u) => {
    bridge(ctx, t, lerpCam(u, { x: 0.5, y: 0.6, z: 1.1 }, { x: 0.5, y: 0.6, z: 1.18 }));
    char(ctx, t, 'MK3', 540, 2000, 1900, { rim: { ...RAIN, dy: -6 }, light: { x: 0.6, y: 0.3, r: 0.8, color: 'rgba(255,210,160,0.25)' } });
  });
  shot(line('k1').s - 0.1, line('n2').s - 0.1, 'night', (ctx, t, u) => {
    bridge(ctx, t, { x: 0.5, y: 0.5, z: 1.6 }, { variant: 'blur' });
    char(ctx, t, 'MK3', 540, 900, 3300 * (1 + u * 0.05), { id: 'k', anchor: [0.73, 0.47], rim: { ...RAIN, dx: -6 } });
  });
  shot(line('n2').s - 0.1, C.passed, 'night', (ctx, t, u) => {
    bridge(ctx, t, { x: 0.5, y: 0.5, z: 1.6 }, { variant: 'blur' });
    char(ctx, t, 'MK3', 540, 880, 3200 * (1 + u * 0.06), { id: 'm', anchor: [0.42, 0.3], rim: { ...RAIN, dx: 6 } });
  });

  // ---------------------------------------------------------------- 2. 11:11 passes, and nothing comes
  shot(C.passed, C.nothing, 'night', (ctx, t, u) => {
    const pulse = t > C.clockPass ? Math.max(0, 1 - (t - C.clockPass) / 1.4) : 0;
    bedroom(ctx, t, lerpCam(u, { x: 0.31, y: 0.553, z: 3.4 }, { x: 0.31, y: 0.553, z: 3.8 }), { clock: t < C.clockPass ? '11:10' : t < C.clockPass + 1.7 ? '11:11' : '11:12', pulse });
  }, 'dissolve');
  shot(C.nothing, C.week, 'phone', (ctx, t, u) => {
    phoneShot(ctx, t, 'B5', [], { u, seed: 123, header: 'Unknown', sub: 'no new messages', emptyText: 'Nothing tonight' });
  });

  // ---------------------------------------------------------------- 3. A week of nothing
  shot(C.week, C.coffee, 'morning', (ctx, t, u) => {
    cafe(ctx, t, lerpCam(u, { x: 0.5, y: 0.55, z: 1.25 }, { x: 0.5, y: 0.55, z: 1.32 }));
    char(ctx, t, 'M9', 250, 2230, 1800, { rim: { ...WARM, dx: -6 } });
    char(ctx, t, 'K6', 860, 2230, 1800, { rim: { ...WARM, dx: 6 } });
  }, 'dissolve');
  shot(C.coffee, C.rain, 'morning', (ctx, t, u) => {
    cafe(ctx, t, { x: 0.35, y: 0.45, z: 1.5 }, 'blur');
    char(ctx, t, 'M1', 540, 2000, 1900 * (1 + u * 0.04), { rim: { ...WARM, dx: -6 } });
  });
  shot(C.rain, C.him, 'night', (ctx, t, u) => {
    PP.drawBg(ctx, 'B9', lerpCam(u, { x: 0.5, y: 0.6, z: 1.15 }, { x: 0.5, y: 0.6, z: 1.22 }));
    PP.rain(ctx, t, [0, 0, W, H], { n: 40, drops: 40 });
    char(ctx, t, 'MK2', 540, 2050, 1750, { rim: { ...WARM, dy: -6 } });
  });
  shot(C.him, C.eighth, 'morning', (ctx, t, u) => {
    cafe(ctx, t, { x: 0.65, y: 0.45, z: 1.5 }, 'blur');
    char(ctx, t, 'K6', 520, 900, 2600 * (1 + u * 0.05), { id: 'cu', anchor: [0.54, 0.4], rim: { ...WARM, dx: 7 } });
  });

  // ---------------------------------------------------------------- 4. The eighth night
  const clockCut = C.clock1111 - 0.12;
  shot(C.eighth, clockCut, 'night', (ctx, t, u) => {
    bedroom(ctx, t, lerpCam(u, { x: 0.45, y: 0.52, z: 1.1 }, { x: 0.4, y: 0.54, z: 1.25 }), { clock: '11:10' });
  }, 'dissolve');
  shot(clockCut, C.newMsg, 'night', (ctx, t, u) => {
    const pulse = t > C.clock1111 ? Math.max(0, 1 - (t - C.clock1111) / 1.4) : 0;
    bedroom(ctx, t, lerpCam(u, { x: 0.31, y: 0.553, z: 4.2 }, { x: 0.31, y: 0.553, z: 4.6 }, E.out), { clock: t < C.clock1111 ? '11:10' : '11:11', pulse });
  });
  shot(C.newMsg, C.knew, 'phone', (ctx, t, u) => {
    phoneShot(ctx, t, 'B5', [], { u, seed: 127, banner: C.buzz[0], bannerHold: 4, ...ME });
  });
  shot(C.knew, line('m1').s - 0.3, 'night', (ctx, t, u) => {
    bedroom(ctx, t, { x: 0.6, y: 0.45, z: 1.6 }, { variant: 'blur' });
    char(ctx, t, 'M7', 540, 1000, 2300 * (1 + u * 0.05), { id: 'kn', anchor: [0.58, 0.41], tint: 'rgba(20,30,90,0.08)', light: { x: 0.85, y: 0.8, r: 0.8, color: 'rgba(200,225,255,0.3)' }, rim: BLUE });
  });

  // ---------------------------------------------------------------- 5. Her own voice
  shot(line('m1').s - 0.3, C.own, 'phone', (ctx, t, u) => {
    phoneShot(ctx, t, 'B5', [msg('m1')], { u, seed: 131, push: 0.06, ...ME });
  });
  shot(C.own, line('m2').s - 0.3, 'night', (ctx, t, u) => {
    PP.drawBg(ctx, 'B1', { x: 0.5, y: 0.45, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'M7', 540, 860, 3000 * (1 + u * 0.08), { anchor: [0.58, 0.41], blink: false, tint: 'rgba(20,30,90,0.1)', light: { x: 0.85, y: 0.8, r: 0.8, color: 'rgba(200,225,255,0.3)' }, rim: BLUE });
  });
  shot(line('m2').s - 0.3, C.notHome, 'danger', (ctx, t, u) => {
    phoneShot(ctx, t, 'B5', [msg('m2', { urgent: true })], { u, urgent: true, seed: 137, ...ME });
  });
  shot(C.notHome, C.makeIt, 'danger', (ctx, t, u) => {
    PP.drawBg(ctx, 'B9', { x: 0.4, y: 0.45, z: 1.5 }, { variant: 'dark' });
    char(ctx, t, 'K3', 540, 900, 4000 * (1 + u * 0.1), { id: 'end', blink: false, anchor: [0.52, 0.405], rim: { color: 'rgba(255,90,80,0.95)', a: 0.85, dx: -9 } });
  });
  shot(C.makeIt, C.endCard, null, (ctx) => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); });

  // ---------------------------------------------------------------- 6. End card
  shot(C.endCard, C.total, null, (ctx, t) => {
    ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, W, H);
    const t0 = C.endCard, a = PP.clamp((t - t0 - 0.1) / 0.6);
    PP.spaced(ctx, '11:11', 540, 860, { font: '200 200px Inter', spacing: 14, glow: 'rgba(130,200,255,0.7)', blur: 36, alpha: a });
    PP.spaced(ctx, 'NEW MESSAGE', 540, 1040, { font: '500 32px Inter', spacing: 12, color: 'rgba(255,120,110,0.95)', alpha: PP.clamp((t - t0 - 0.5) / 0.5) });
    PP.spaced(ctx, 'TO BE CONTINUED', 540, 1110, { font: '300 30px Inter', spacing: 10, color: 'rgba(225,232,255,0.8)', alpha: PP.clamp((t - t0 - 0.8) / 0.5) });
  });

  PP.SHOTS = K.S;
})(typeof window !== 'undefined' ? window : globalThis);
