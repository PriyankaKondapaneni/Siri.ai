// 11:11, Episode 6, "Not Me": the shot list, cut on the words of the narration. His apartment at night; nobody sent
// the messages; both phones light up from his dead brother's number.
(function (g) {
  const PP = g.PP;
  const C = PP.CUES, T = g.TIMING;
  const K = PP.shotKit(C, T);
  const { E, W, H, line, word, lerpCam, char, foreground, shot } = K;

  // his living room: the floor lamp, the city through the window
  const room = (ctx, t, cam, o = {}) => {
    const bg = PP.drawBg(ctx, 'B9', cam, { variant: o.variant });
    PP.with(ctx, () => { ctx.fillStyle = 'rgba(8,10,24,0.25)'; ctx.fillRect(0, 0, W, H); });
    const [lx, ly] = bg.map(0.757, 0.27);
    PP.glowAt(ctx, lx, ly, 380 * bg.s / 1.25, '255,196,120', 0.5);
    return bg;
  };
  const RIM = { color: 'rgba(255,200,135,0.95)', a: 0.75 };
  const BLUE = { color: 'rgba(160,200,255,0.9)', a: 0.6 };
  const empty = { header: 'Sent', sub: 'voice messages', emptyText: 'No sent messages' };
  const ARJUN = { bannerTitle: 'Unknown', bannerText: 'Voice message · +1 212-555-1111', bannerHold: 9 };
  // one phone, drawn straight onto the frame (for the two-phone shot)
  const handset = (ctx, t, x, y, s, rot, o) => PP.phone(ctx, x, y, s, { t, rot, glow: 1, msgs: [], ...o });

  // ---------------------------------------------------------------- 0. Cold open
  const hk = [0, 1.1, 2.3, C.hookEnd];
  shot(hk[0], hk[1], 'phone', (ctx, t, u) => {
    room(ctx, t, { x: 0.5, y: 0.5, z: 1.6 }, { variant: 'dark' });
    PP.with(ctx, () => { ctx.translate(540, 850); ctx.scale(1.4, 1.4); ctx.translate(-540, -850); handset(ctx, t, 540, 850, 1.02, -0.02, empty); });
    K.F.phone = true;
  });
  shot(hk[1], hk[2], 'night', (ctx, t, u) => {
    room(ctx, t, { x: 0.4, y: 0.45, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'K9', 540, 860, 3300 * (1 + u * 0.06), { id: 'hk', blink: false, anchor: [0.56, 0.33], rim: { ...RIM, dx: -8 } });
  });
  shot(hk[2], hk[3], 'danger', (ctx, t, u) => {
    room(ctx, t, { x: 0.5, y: 0.5, z: 1.6 }, { variant: 'dark' });
    handset(ctx, t, 285, 1010, 0.82, -0.06, { ...ARJUN, banner: hk[2] - 0.6 });
    handset(ctx, t, 795, 1050, 0.82, 0.05, { ...ARJUN, banner: hk[2] - 0.55 });
  });

  // ---------------------------------------------------------------- 1. "I've never recorded a single message."
  shot(C.hookEnd, line('k1').s - 0.1, 'night', (ctx, t, u) => {
    room(ctx, t, lerpCam(u, { x: 0.5, y: 0.62, z: 1.05 }, { x: 0.5, y: 0.62, z: 1.12 }));
    char(ctx, t, 'MK1', 540, 2060, 1650, { rim: { ...RIM, dy: -6 } });
  });
  shot(line('k1').s - 0.1, C.sent, 'night', (ctx, t, u) => {
    room(ctx, t, { x: 0.38, y: 0.45, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'K9', 580, 900, 2300 * (1 + u * 0.04), { id: 'k1', anchor: [0.56, 0.36], talk: true, rim: { ...RIM, dx: -7 } });
    foreground(ctx, 'M6', -230, 2350, 2500, { blur: 20, bright: 0.45, flip: true });
  });
  shot(C.sent, line('k2').s - 0.1, 'phone', (ctx, t, u) => {
    room(ctx, t, { x: 0.5, y: 0.5, z: 1.6 }, { variant: 'dark' });
    const k = PP.clamp((t - word('n2', 'nothing', 1)) / 0.5);
    PP.with(ctx, () => { const z = 1.1 + 0.25 * E.inOut(k); ctx.translate(540, 900); ctx.scale(z, z); ctx.translate(-540, -900); handset(ctx, t, 540, 900, 1.02, -0.02 + 0.02 * k, empty); });
    K.F.phone = true;
  });

  // ---------------------------------------------------------------- 2. Not her either
  shot(line('k2').s - 0.1, line('n3').s - 0.1, 'night', (ctx, t, u) => {
    room(ctx, t, { x: 0.38, y: 0.45, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'K3', 600, 900, 2150 * (1 + u * 0.05), { id: 'k2', anchor: [0.52, 0.42], talk: true, rim: { ...RIM, dx: -7 } });
    foreground(ctx, 'M6', -230, 2350, 2500, { blur: 20, bright: 0.45, flip: true });
  });
  shot(line('n3').s - 0.1, C.who, 'night', (ctx, t, u) => {
    room(ctx, t, { x: 0.62, y: 0.42, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'M6', 540, 860, 2600 * (1 + u * 0.06), { anchor: [0.55, 0.35], rim: BLUE });
  });
  shot(C.who, C.floor, 'night', (ctx, t, u) => {
    room(ctx, t, lerpCam(u, { x: 0.6, y: 0.2, z: 1.8 }, { x: 0.6, y: 0.22, z: 2.05 }, (x) => x));
  });

  // ---------------------------------------------------------------- 3. Waiting together
  shot(C.floor, C.t1110 - 0.1, 'dark', (ctx, t, u) => {
    room(ctx, t, lerpCam(u, { x: 0.5, y: 0.6, z: 1.15 }, { x: 0.5, y: 0.6, z: 1.25 }));
    char(ctx, t, 'MK2', 540, 2050, 1750, { rim: { ...RIM, dy: -6 }, light: { x: 0.9, y: 0.3, r: 0.8, color: 'rgba(255,200,140,0.25)' } });
  });
  shot(C.t1110 - 0.1, C.both, 'night', (ctx, t, u) => {
    room(ctx, t, { x: 0.5, y: 0.5, z: 1.7 }, { variant: 'dark' });
    const late = t >= C.clock1111;
    const pulse = late ? Math.max(0, 1 - (t - C.clock1111) / 1.2) : 0;
    K.F.noSubs = true;
    PP.spaced(ctx, late ? '11:11' : '11:10', 540, 880, { font: '200 250px Inter', spacing: 12, color: '#eef6ff', glow: `rgba(130,200,255,${0.6 + 0.4 * pulse})`, blur: 40 + 40 * pulse });
  });

  // ---------------------------------------------------------------- 4. Both phones. Arjun's number.
  shot(C.both, line('k3').s - 0.1, 'danger', (ctx, t, u) => {
    const [hx, hy, hr] = PP.handheld(t, 5, 101);
    room(ctx, t, { x: 0.5, y: 0.5, z: 1.6 }, { variant: 'dark' });
    PP.with(ctx, () => {
      ctx.translate(hx, hy); ctx.rotate(hr);
      const z = 1 + u * 0.12; ctx.translate(540, 900); ctx.scale(z, z); ctx.translate(-540, -900);
      handset(ctx, t, 285, 1010, 0.82, -0.06, { ...ARJUN, banner: C.lit - 0.05 });
      handset(ctx, t, 795, 1050, 0.82, 0.05, { ...ARJUN, banner: C.lit });
    });
    PP.spaced(ctx, '+1 212-555-1111', 540, 300, { font: '300 58px Inter', spacing: 8, color: '#ffe9e6', glow: 'rgba(255,80,70,0.7)', blur: 26, alpha: PP.clamp((t - C.lit - 0.3) / 0.4) });
  });
  shot(line('k3').s - 0.1, C.makeIt, 'phone', (ctx, t, u) => {
    room(ctx, t, { x: 0.5, y: 0.5, z: 1.5 }, { variant: 'dark' });
    char(ctx, t, 'K8', 560, 880, 2600 * (1 + u * 0.08), { id: 'k3', anchor: [0.52, 0.45], talk: true, light: { x: 0.35, y: 0.55, r: 0.6, color: 'rgba(170,215,255,0.5)' }, rim: BLUE });
  });
  shot(C.makeIt, C.endCard, null, (ctx) => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); });

  // ---------------------------------------------------------------- 5. End card
  shot(C.endCard, C.total, null, (ctx, t) => {
    ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, W, H);
    const t0 = C.endCard, a = PP.clamp((t - t0 - 0.1) / 0.6);
    PP.spaced(ctx, '11:11', 540, 860, { font: '200 200px Inter', spacing: 14, glow: 'rgba(130,200,255,0.7)', blur: 36, alpha: a });
    PP.spaced(ctx, 'ONE DAY LEFT', 540, 1040, { font: '500 32px Inter', spacing: 12, color: 'rgba(255,120,110,0.95)', alpha: PP.clamp((t - t0 - 0.5) / 0.5) });
    PP.spaced(ctx, 'TO BE CONTINUED', 540, 1110, { font: '300 30px Inter', spacing: 10, color: 'rgba(225,232,255,0.8)', alpha: PP.clamp((t - t0 - 0.8) / 0.5) });
  });

  PP.SHOTS = K.S;
})(typeof window !== 'undefined' ? window : globalThis);
