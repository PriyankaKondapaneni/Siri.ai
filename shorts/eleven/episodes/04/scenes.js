// 11:11, Episode 4, "Her Voice": the shot list, cut on the words of the narration. A rooftop at night; he plays her
// the voice notes he has been getting, in her voice.
(function (g) {
  const PP = g.PP;
  const C = PP.CUES, T = g.TIMING;
  const K = PP.shotKit(C, T);
  const { E, W, H, line, word, msg, lerpCam, char, onCut, foreground, clockHands, phoneShot, shot } = K;

  // the rooftop: city lights twinkling, the string lights' warm glow
  const roof = (ctx, t, cam, o = {}) => {
    const bg = PP.drawBg(ctx, 'B7', cam, { variant: o.variant });
    for (let k = 0; k < 7; k++) { const [x, y] = bg.map(0.04 + k * 0.16, 0.66 + Math.sin(k * 1.7) * 0.02); PP.glowAt(ctx, x, y, 60 * bg.s / 1.25, '255,205,140', 0.35 + 0.15 * Math.sin(t * 2 + k)); }
    return bg;
  };
  const RIM = { color: 'rgba(255,205,150,0.95)', a: 0.75 };
  const BLUE = { color: 'rgba(160,200,255,0.9)', a: 0.6 };

  // ---------------------------------------------------------------- 0. Cold open
  const hk = [0, 0.6, 1.2, 1.9, C.hookEnd];
  shot(hk[0], hk[1], 'danger', (ctx, t, u) => {
    phoneShot(ctx, t, 'B7', [msg('h0', { urgent: true })], { u, urgent: true, seed: 81, focus: 1.6 + u * 0.15, focusY: 260 });
  });
  shot(hk[1], hk[2], 'night', (ctx, t, u) => {
    roof(ctx, t, { x: 0.5, y: 0.45, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'M10', 540, 860, 3400 * (1 + u * 0.06), { id: 'hk', blink: false, anchor: [0.58, 0.36], rim: BLUE });
  });
  shot(hk[2], hk[3], 'night', (ctx, t, u) => {
    roof(ctx, t, { x: 0.4, y: 0.4, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'K3', 540, 900, 4300 * (1 + u * 0.06), { id: 'hk', blink: false, anchor: [0.52, 0.405], rim: { ...RIM, dx: -9 } });
  });
  shot(hk[3], hk[4], 'night', (ctx, t, u) => {
    roof(ctx, t, lerpCam(u, { x: 0.6, y: 0.5, z: 1.1 }, { x: 0.6, y: 0.5, z: 1.2 }));
  });

  // ---------------------------------------------------------------- 1. "He played it for me. My voice."
  shot(C.hookEnd, C.myVoice, 'night', (ctx, t, u) => {
    roof(ctx, t, { x: 0.55, y: 0.5, z: 1.3 }, { variant: 'soft' });
    char(ctx, t, 'K9', 640, 2000, 1850 * (1 + u * 0.04), { rim: { ...RIM, dx: -6 }, light: { x: 0.1, y: 0.25, r: 0.4, color: 'rgba(170,210,255,0.35)' } });
  });
  shot(C.myVoice, C.neverSaid, 'night', (ctx, t, u) => {
    roof(ctx, t, { x: 0.45, y: 0.5, z: 1.4 }, { variant: 'blur' });
    char(ctx, t, 'M10', 520, 2000, 1850 * (1 + u * 0.05), { rim: { ...RIM, dx: 6 }, light: { x: 0.8, y: 0.35, r: 0.6, color: 'rgba(170,210,255,0.3)' } });
  });
  shot(C.neverSaid, line('m1').s - 0.3, 'night', (ctx, t, u) => {
    roof(ctx, t, { x: 0.45, y: 0.45, z: 1.6 }, { variant: 'blur' });
    char(ctx, t, 'M10', 540, 860, 3000 * (1 + u * 0.06), { id: 'cu', anchor: [0.58, 0.36], rim: { ...RIM, dx: 7 }, light: { x: 0.8, y: 0.35, r: 0.6, color: 'rgba(170,210,255,0.3)' } });
  });

  // ---------------------------------------------------------------- 2. Her voice, from his phone
  shot(line('m1').s - 0.3, line('k1').s - 0.1, 'phone', (ctx, t, u) => {
    phoneShot(ctx, t, 'B7', [msg('m1', { time: '3 nights ago' })], { u, seed: 83, push: 0.06 });
  });
  shot(line('k1').s - 0.1, line('n2').s - 0.1, 'night', (ctx, t, u) => {
    roof(ctx, t, { x: 0.4, y: 0.45, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'K9', 560, 900, 2300 * (1 + u * 0.04), { id: 'k1', anchor: [0.56, 0.36], talk: true, rim: { ...RIM, dx: -7 }, light: { x: 0.1, y: 0.3, r: 0.4, color: 'rgba(170,210,255,0.3)' } });
    foreground(ctx, 'M10', -230, 2350, 2500, { blur: 20, bright: 0.45 });
  });

  // ---------------------------------------------------------------- 3. Saving each other
  shot(line('n2').s - 0.1, C.sky, 'night', (ctx, t, u) => {
    roof(ctx, t, lerpCam(u, { x: 0.5, y: 0.6, z: 1.0 }, { x: 0.5, y: 0.6, z: 1.08 }));
    char(ctx, t, 'MK1', 540, 2080, 1700 * (1 + u * 0.03), { rim: { ...RIM, dx: 0, dy: -6 } });
  });
  shot(C.sky, line('k2').s - 0.1, 'night', (ctx, t, u) => {
    const bg = roof(ctx, t, lerpCam(u, { x: 0.68, y: 0.3, z: 1.45 }, { x: 0.66, y: 0.32, z: 1.55 }, (x) => x));
    const [mx, my] = bg.map(0.885, 0.04);
    PP.glowAt(ctx, mx, my, 260, '255,245,220', 0.4);
  });
  shot(line('k2').s - 0.1, line('n4').s - 0.1, 'night', (ctx, t, u) => {
    roof(ctx, t, { x: 0.38, y: 0.45, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'K4', 600, 900, 2150 * (1 + u * 0.04), { id: 'k2', anchor: [0.53, 0.42], talk: true, rim: { ...RIM, dx: -7 } });
    foreground(ctx, 'M10', -230, 2350, 2500, { blur: 20, bright: 0.45 });
  });
  shot(line('n4').s - 0.1, C.newest, 'night', (ctx, t, u) => {
    roof(ctx, t, { x: 0.6, y: 0.45, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'M9', 540, 900, 2600 * (1 + u * 0.06), { id: 'cu', anchor: [0.56, 0.39], rim: { ...RIM, dx: 7 }, light: { x: 0.9, y: 0.4, r: 0.8, color: 'rgba(255,200,140,0.25)' } });
  });

  // ---------------------------------------------------------------- 4. The newest one: the bridge
  shot(C.newest, line('m2').s - 0.3, 'night', (ctx, t, u) => {
    roof(ctx, t, { x: 0.55, y: 0.5, z: 1.4 }, { variant: 'blur' });
    char(ctx, t, 'K9', 600, 900, 2300 * (1 + u * 0.05), { id: 'nw', anchor: [0.56, 0.36], rim: { ...RIM, dx: -7 }, light: { x: 0.1, y: 0.3, r: 0.4, color: 'rgba(255,140,130,0.35)' } });
  });
  shot(line('m2').s - 0.3, C.bridge, 'danger', (ctx, t, u) => {
    phoneShot(ctx, t, 'B7', [msg('m2', { urgent: true })], { u, urgent: true, seed: 87 });
  });
  shot(C.bridge, C.friday, 'danger', (ctx, t, u) => {
    phoneShot(ctx, t, 'B7', [msg('m2', { urgent: true })], { u, urgent: true, seed: 87, focus: 1.55 + u * 0.1, focusY: 260 });
  });
  shot(C.friday, line('k3').s - 0.1, 'cold', (ctx, t, u) => {
    roof(ctx, t, { x: 0.6, y: 0.42, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'M6', 540, 860, 2600 * (1 + u * 0.06), { anchor: [0.55, 0.35], rim: BLUE });
    const a = PP.clamp((t - C.friday) / 0.3) * PP.clamp((line('k3').s - 0.2 - t) / 0.3);
    PP.spaced(ctx, 'FRIDAY', 540, 260, { font: '500 64px Inter', spacing: 24, color: 'rgba(255,130,120,0.95)', glow: 'rgba(255,60,50,0.5)', blur: 20, alpha: a });
  });

  // ---------------------------------------------------------------- 5. His promise; her fear
  shot(line('k3').s - 0.1, C.scared, 'night', (ctx, t, u) => {
    roof(ctx, t, { x: 0.38, y: 0.42, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'K3', 600, 900, 2150 * (1 + u * 0.05), { id: 'k3', anchor: [0.52, 0.42], talk: true, rim: { ...RIM, dx: -7 } });
    foreground(ctx, 'M6', -230, 2350, 2500, { blur: 20, bright: 0.45, flip: true });
  });
  shot(C.scared, C.sevenDays, 'night', (ctx, t, u) => {
    roof(ctx, t, lerpCam(u, { x: 0.5, y: 0.6, z: 1.12 }, { x: 0.5, y: 0.58, z: 1.0 }));
    char(ctx, t, 'MK1', 540, 2080, 1700 * (1 - u * 0.05), { id: 'sc', rim: { ...RIM, dx: 0, dy: -6 } });
  });
  shot(C.sevenDays, C.makeIt, 'night', (ctx, t, u) => {
    roof(ctx, t, { x: 0.5, y: 0.5, z: 1.7 }, { variant: 'blur' });
    const h = 2300 * (1 + u * 0.12);
    char(ctx, t, 'K5', 560, 960, h, { anchor: [0.5156, 0.5195], breath: 0, rim: { ...RIM, dx: -6 } });
    clockHands(ctx, 560, 960, 0.1406 * 1024 * (h / 1536), 11, 11);
    const [gx, gy] = onCut('K5', 560, 960, h, [0.5156, 0.5195], 0.44, 0.47);
    PP.flare(ctx, gx, gy, 0.3 + 0.2 * Math.sin(t * 2), '180,210,255');
  });
  shot(C.makeIt, C.endCard, null, (ctx) => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); });

  // ---------------------------------------------------------------- 6. End card
  shot(C.endCard, C.total, null, (ctx, t) => {
    ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, W, H);
    const t0 = C.endCard, a = PP.clamp((t - t0 - 0.1) / 0.6);
    PP.spaced(ctx, '11:11', 540, 860, { font: '200 200px Inter', spacing: 14, glow: 'rgba(130,200,255,0.7)', blur: 36, alpha: a });
    PP.spaced(ctx, 'THREE DAYS LEFT', 540, 1040, { font: '500 32px Inter', spacing: 12, color: 'rgba(255,120,110,0.95)', alpha: PP.clamp((t - t0 - 0.5) / 0.5) });
    PP.spaced(ctx, 'TO BE CONTINUED', 540, 1110, { font: '300 30px Inter', spacing: 10, color: 'rgba(225,232,255,0.8)', alpha: PP.clamp((t - t0 - 0.8) / 0.5) });
  });

  PP.SHOTS = K.S;
})(typeof window !== 'undefined' ? window : globalThis);
