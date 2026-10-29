// 11:11, Episode 5, "The Brother": the shot list, cut on the words of the narration. The old bridge in the rain; the
// photo of Arjun; the memory she had forgotten.
(function (g) {
  const PP = g.PP;
  const C = PP.CUES, T = g.TIMING;
  const K = PP.shotKit(C, T);
  const { E, W, H, line, word, msg, lerpCam, char, onCut, foreground, clockHands, bedroom, phoneShot, shot } = K;

  // the old bridge at night: lamps glowing, rain falling across the whole frame
  const bridge = (ctx, t, cam, o = {}) => {
    const bg = PP.drawBgDepth(ctx, 'B8', { ...cam, z0: 1 }, { horizon: 0.5, k: 1.3, variant: o.variant });
    for (const [lx, ly] of [[0.127, 0.27], [0.31, 0.4], [0.39, 0.47]]) { const [x, y] = bg.map(lx, ly); PP.glowAt(ctx, x, y, 150 * bg.s / 1.25, '255,200,130', 0.45); }
    PP.rain(ctx, t, [0, 0, W, H], { n: 80, drops: 0 });
    return bg;
  };
  const RIM = { color: 'rgba(255,200,135,0.95)', a: 0.8 };
  const watch = (ctx, t, u, bgFn) => {
    bgFn();
    const h = 2300 * (1 + u * 0.1);
    char(ctx, t, 'K5', 560, 960, h, { anchor: [0.5156, 0.5195], breath: 0, rim: { ...RIM, dx: -6 } });
    clockHands(ctx, 560, 960, 0.1406 * 1024 * (h / 1536), 11, 11);
    const [gx, gy] = onCut('K5', 560, 960, h, [0.5156, 0.5195], 0.44, 0.47);
    PP.flare(ctx, gx, gy, 0.3 + 0.2 * Math.sin(t * 2));
  };
  // a memory: the flashback picture, faded, grainy, slowly pushing in
  const memory = (ctx, t, u, cam) => {
    PP.with(ctx, () => { ctx.filter = 'sepia(0.55) saturate(0.6) contrast(0.95) brightness(0.92)'; PP.drawBg(ctx, 'F1', cam); });
    PP.rain(ctx, t, [0, 0, W, H], { n: 60, drops: 0 });
    PP.with(ctx, () => { const gr = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.62); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(20,14,8,0.7)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); });
  };

  // ---------------------------------------------------------------- 0. Cold open
  const hk = [0, 1.0, word('h0', 'at') - 0.1, 3.4, C.hookEnd];
  shot(hk[0], hk[1], 'night', (ctx, t, u) => { bridge(ctx, t, lerpCam(u, { x: 0.5, y: 0.5, z: 1.05 }, { x: 0.5, y: 0.5, z: 1.15 })); });
  shot(hk[1], hk[2], 'night', (ctx, t, u) => {
    bridge(ctx, t, { x: 0.45, y: 0.45, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'K10', 540, 860, 3200 * (1 + u * 0.06), { id: 'hk', anchor: [0.5, 0.38], rim: { ...RIM, dx: -8 } });
  });
  shot(hk[2], hk[3], 'night', (ctx, t, u) => { watch(ctx, t, u, () => bridge(ctx, t, { x: 0.5, y: 0.5, z: 1.7 }, { variant: 'blur' })); });
  shot(hk[3], hk[4], null, (ctx, t, u) => { memory(ctx, t, u, { x: 0.5, y: 0.55, z: 1.15 + u * 0.08 }); });

  // ---------------------------------------------------------------- 1. "Why did his watch stop?"
  shot(C.hookEnd, C.asked, 'night', (ctx, t, u) => {
    bridge(ctx, t, { x: 0.6, y: 0.42, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'M6', 540, 860, 2600 * (1 + u * 0.05), { anchor: [0.55, 0.35], rim: { ...RIM, dx: 7 } });
  });
  shot(C.asked, line('k1').s - 0.1, 'night', (ctx, t, u) => {
    bridge(ctx, t, lerpCam(u, { x: 0.5, y: 0.6, z: 1.1 }, { x: 0.5, y: 0.6, z: 1.16 }));
    char(ctx, t, 'MK1', 540, 2080, 1700, { rim: { ...RIM, dy: -6 } });
  });

  // ---------------------------------------------------------------- 2. Arjun
  shot(line('k1').s - 0.1, line('k2').s - 0.1, 'night', (ctx, t, u) => {
    bridge(ctx, t, { x: 0.38, y: 0.42, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'K3', 600, 900, 2150 * (1 + u * 0.05), { id: 'k1', anchor: [0.52, 0.42], talk: true, rim: { ...RIM, dx: -7 } });
    foreground(ctx, 'M6', -230, 2350, 2500, { blur: 20, bright: 0.45, flip: true });
  });
  shot(line('k2').s - 0.1, C.at1111, 'night', (ctx, t, u) => { bridge(ctx, t, lerpCam(u, { x: 0.5, y: 0.5, z: 1.0 }, { x: 0.5, y: 0.5, z: 1.12 })); });
  shot(C.at1111, line('n2').s - 0.1, 'night', (ctx, t, u) => { watch(ctx, t, u, () => bridge(ctx, t, { x: 0.5, y: 0.5, z: 1.7 }, { variant: 'blur' })); });
  shot(line('n2').s - 0.1, line('k3').s - 0.1, 'cold', (ctx, t, u) => {
    bridge(ctx, t, { x: 0.6, y: 0.42, z: 1.6 }, { variant: 'blur' });
    char(ctx, t, 'M6', 540, 820, 3200 * (1 + u * 0.06), { id: 'sm', anchor: [0.55, 0.35], rim: { color: 'rgba(160,200,255,0.9)', a: 0.6, dx: 7 } });
  });
  shot(line('k3').s - 0.1, line('n3').s - 0.1, 'night', (ctx, t, u) => {
    bridge(ctx, t, { x: 0.45, y: 0.45, z: 1.4 }, { variant: 'blur' });
    char(ctx, t, 'K10', 560, 900, 2400 * (1 + u * 0.05), { id: 'k3', anchor: [0.5, 0.38], talk: true, rim: { ...RIM, dx: -7 } });
  });
  shot(line('n3').s - 0.1, C.photo, 'dark', (ctx, t, u) => {
    bridge(ctx, t, { x: 0.5, y: 0.5, z: 1.8 }, { variant: 'blur' });
    char(ctx, t, 'H1', 540, 980, 2700 * (1 + u * 0.06), { anchor: [0.6, 0.57], breath: 0, blink: false, light: { x: 0.3, y: 0.3, r: 0.8, color: 'rgba(255,210,160,0.3)' }, rim: { ...RIM, dx: -6, a: 0.7 } });
  });

  // ---------------------------------------------------------------- 3. The photo; the memory
  shot(C.photo, C.memory, 'dark', (ctx, t, u) => {
    bridge(ctx, t, { x: 0.5, y: 0.5, z: 1.8 }, { variant: 'blur' });
    char(ctx, t, 'A1', 540, 960, 1900 * (1 + u * 0.08), { anchor: [0.5, 0.5], breath: 0, rot: -0.04 + u * 0.02, rim: { ...RIM, dx: -5, a: 0.6 } });
  });
  shot(C.memory, C.him, null, (ctx, t, u) => {
    const v = PP.clamp((t - C.memory) / (C.him - C.memory));
    memory(ctx, t, u, lerpCam(v, { x: 0.5, y: 0.5, z: 1.05 }, { x: 0.44, y: 0.68, z: 1.7 }));
    // the ambulance arriving: red and blue washing over the memory
    const a = PP.clamp((t - C.ambulance) / 0.4);
    if (a > 0) PP.with(ctx, () => { ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = Math.floor(t * 4) % 2 ? `rgba(255,40,40,${0.22 * a})` : `rgba(40,90,255,${0.22 * a})`; ctx.fillRect(0, 0, W, H); });
  });
  shot(C.him, C.arjun, 'dark', (ctx, t, u) => {
    bridge(ctx, t, { x: 0.5, y: 0.5, z: 1.8 }, { variant: 'blur' });
    char(ctx, t, 'A1', 540, 900, 3400 * (1 + u * 0.08), { id: 'cu', anchor: [0.5, 0.4], breath: 0, rim: { ...RIM, dx: -5, a: 0.6 } });
  });
  shot(C.arjun, C.night, 'cold', (ctx, t, u) => {
    bridge(ctx, t, { x: 0.45, y: 0.45, z: 1.6 }, { variant: 'blur' });
    char(ctx, t, 'M10', 540, 860, 3200 * (1 + u * 0.06), { anchor: [0.58, 0.36], rim: { color: 'rgba(160,200,255,0.9)', a: 0.6, dx: 7 } });
  });

  // ---------------------------------------------------------------- 4. That night, 11:11
  const clockCut = C.clock1111 - 0.12;
  shot(C.night, clockCut, 'night', (ctx, t, u) => {
    bedroom(ctx, t, lerpCam(u, { x: 0.45, y: 0.52, z: 1.1 }, { x: 0.4, y: 0.54, z: 1.25 }), { clock: '11:10' });
  }, 'dissolve');
  shot(clockCut, line('k4').s - 0.5, 'night', (ctx, t, u) => {
    const pulse = t > C.clock1111 ? Math.max(0, 1 - (t - C.clock1111) / 1.4) : 0;
    bedroom(ctx, t, lerpCam(u, { x: 0.31, y: 0.553, z: 4.2 }, { x: 0.31, y: 0.553, z: 4.6 }, E.out), { clock: t < C.clock1111 ? '11:10' : '11:11', pulse });
  });
  shot(line('k4').s - 0.5, C.why, 'phone', (ctx, t, u) => {
    phoneShot(ctx, t, 'B5', [msg('k4')], { u, banner: C.buzz[0], seed: 97 });
  });
  shot(C.why, C.makeIt, 'danger', (ctx, t, u) => {
    phoneShot(ctx, t, 'B5', [msg('k4', { urgent: true })], { u, urgent: true, seed: 97, focus: 1.55 + u * 0.1, focusY: 260 });
  });
  shot(C.makeIt, C.endCard, null, (ctx) => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); });

  // ---------------------------------------------------------------- 5. End card
  shot(C.endCard, C.total, null, (ctx, t) => {
    ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, W, H);
    const t0 = C.endCard, a = PP.clamp((t - t0 - 0.1) / 0.6);
    PP.spaced(ctx, '11:11', 540, 860, { font: '200 200px Inter', spacing: 14, glow: 'rgba(130,200,255,0.7)', blur: 36, alpha: a });
    PP.spaced(ctx, 'TWO DAYS LEFT', 540, 1040, { font: '500 32px Inter', spacing: 12, color: 'rgba(255,120,110,0.95)', alpha: PP.clamp((t - t0 - 0.5) / 0.5) });
    PP.spaced(ctx, 'TO BE CONTINUED', 540, 1110, { font: '300 30px Inter', spacing: 10, color: 'rgba(225,232,255,0.8)', alpha: PP.clamp((t - t0 - 0.8) / 0.5) });
  });

  PP.SHOTS = K.S;
})(typeof window !== 'undefined' ? window : globalThis);
