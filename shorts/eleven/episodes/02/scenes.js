// 11:11, Episode 2, "Don't Let Me Get On The Train": the shot list, cut on the words of the narration.
(function (g) {
  const PP = g.PP;
  const C = PP.CUES, T = g.TIMING;
  const K = PP.shotKit(C, T);
  const { E, W, H, line, word, msg, lerpCam, char, onCut, foreground, clockHands, bedroom, phoneShot, shot } = K;

  // an old message, already played: his last words from Episode 1
  const lastNight = (() => { const text = "In seven days... I don't make it."; return { s: -20, e: -16, text, words: text.split(' ').map(() => ({ s: -20 })), time: '11:11 PM', urgent: true }; })();
  const street = (ctx, t, cam, o = {}) => {
    const bg = PP.drawBgDepth(ctx, 'B4', { ...cam, z0: 1 }, { horizon: 0.52, k: 1.4, variant: o.variant });
    const [rx, ry] = bg.map(0.594, 0.146);
    PP.glowAt(ctx, rx, ry, 110 * bg.s / 1.25, '255,60,40', 0.5);
    return bg;
  };
  const cafe = (ctx, t, cam, variant = 'soft') => {
    const bg = PP.drawBg(ctx, 'B2', cam, { variant });
    PP.with(ctx, () => { ctx.fillStyle = 'rgba(30,14,6,0.32)'; ctx.fillRect(0, 0, W, H); });
    const [lx, ly] = bg.map(0.62, 0.3);
    PP.glowAt(ctx, lx, ly, 520, '255,190,120', 0.35);
    return bg;
  };
  // the last cookie: both their hands on it, his watch painted back to a blank dial stopped at 11:11
  const cookie = (ctx, t, cam, glow = 0) => {
    const bg = PP.drawBg(ctx, 'C1', cam);
    const [wx, wy] = bg.map(0.89, 0.574), r = 0.039 * 1024 * bg.s;
    PP.with(ctx, () => { ctx.fillStyle = 'rgb(251,236,218)'; ctx.beginPath(); ctx.arc(wx, wy, r * 0.7, 0, 7); ctx.fill(); });
    clockHands(ctx, wx, wy, r * 0.8, 11, 11);
    PP.with(ctx, () => { ctx.fillStyle = 'rgba(30,14,6,0.2)'; ctx.fillRect(0, 0, W, H); });
    const [fx, fy] = bg.map(0.5, 0.515);
    if (glow > 0) PP.glowAt(ctx, fx, fy, 260 * bg.s, '255,205,150', 0.45 * glow);
    return bg;
  };
  const DUSK_RIM = { color: 'rgba(255,185,120,1)', a: 0.85 };
  const CAFE_RIM = { color: 'rgba(255,205,150,0.95)', a: 0.75 };

  // ---------------------------------------------------------------- 0. Cold open: love and danger in four quick shots
  // the voice starts on the first frame; the phone punches out of a shake, then their fingertips, the train, her shock
  const hk = [0, 0.42, 0.86, 1.3, C.hookEnd];
  shot(hk[0], hk[1], 'danger', (ctx, t, u) => {
    const [sx, sy, sr] = PP.shake(t, 0, 16, 0.4);
    PP.with(ctx, () => {
      ctx.translate(sx, sy); ctx.rotate(sr);
      phoneShot(ctx, t, 'B5', [msg('h0', { urgent: true })], { u, urgent: true, seed: 41, focus: 2.0 - E.out(u) * 0.3, focusY: 260 });
    });
  });
  shot(hk[1], hk[2], 'dark', (ctx, t, u) => {
    cookie(ctx, t, lerpCam(u, { x: 0.5, y: 0.515, z: 2.0 }, { x: 0.5, y: 0.515, z: 2.25 }, E.out), 0.8);
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
    char(ctx, t, 'M10', 540, 860, 3400 * (1 + E.in(u) * 0.12), { id: 'hk', blink: false, anchor: [0.58, 0.36], tint: 'rgba(20,30,90,0.08)', rim: { color: 'rgba(150,200,255,0.9)', dx: 7, a: 0.7 } });
  });

  // ---------------------------------------------------------------- 1. "Six days left."
  const toldCut = word('n1', 'he') - 0.1, soCut = word('n1', 'so') - 0.1;
  shot(C.hookEnd, toldCut, 'phone', (ctx, t, u) => {
    phoneShot(ctx, t, 'B5', [lastNight], { u, urgent: true, seed: 47, push: 0.06 });
    PP.flash(ctx, t, C.hookEnd, 0.3);
    const a = PP.clamp((t - C.hookEnd - 0.05) / 0.3);
    PP.spaced(ctx, '6 DAYS LEFT', 540, 200, { font: '500 40px Inter', spacing: 14, color: 'rgba(255,120,110,0.95)', glow: 'rgba(255,60,50,0.6)', blur: 20, alpha: a });
  });
  shot(toldCut, soCut, 'night', (ctx, t, u) => {
    bedroom(ctx, t, { x: 0.6, y: 0.45, z: 1.6 }, { variant: 'blur' });
    char(ctx, t, 'M2', 540, 880, 2500 * (1 + u * 0.05), { id: 'cu', anchor: [0.55, 0.38], tint: 'rgba(30,40,110,0.08)', light: { x: 0.6, y: 0.4, r: 0.5, color: 'rgba(200,225,255,0.22)' }, rim: { color: 'rgba(255,200,140,0.9)', dx: -6, a: 0.6 } });
  });
  shot(soCut, line('n2').s - 0.1, 'dusk', (ctx, t, u) => {
    street(ctx, t, lerpCam(u, { x: 0.52, y: 0.5, z: 1.0 }, { x: 0.52, y: 0.52, z: 1.08 }));
    const walk = E.out(PP.clamp(u * 1.4));
    char(ctx, t, 'M8', -150 + walk * 480, 2000, 1300, { rim: { ...DUSK_RIM, dx: 5, dy: -3 }, breath: Math.sin(t * 9) * 0.006 * (1 - walk) });
  });

  // ---------------------------------------------------------------- 2. "Same corner. 6:40. And there he was."
  const timeCut = word('n2', '6:40') - 0.12, thereCut = C.thereHeWas - 0.15;
  shot(line('n2').s - 0.1, timeCut, 'dusk', (ctx, t, u) => {
    street(ctx, t, { x: 0.45, y: 0.52, z: 1.3 }, { variant: 'soft' });
    char(ctx, t, 'M8', 470, 2000, 1900 * (1 + u * 0.04), { rim: { ...DUSK_RIM, dx: 6, dy: -3 }, light: { x: 0.9, y: 0.3, r: 0.8, color: 'rgba(255,200,150,0.2)' } });
  });
  shot(timeCut, thereCut, 'dusk', (ctx, t, u) => {
    street(ctx, t, { x: 0.594, y: 0.3, z: 1.9 + u * 0.15 }, { variant: 'blur' });
    PP.with(ctx, () => { ctx.fillStyle = 'rgba(10,6,4,0.3)'; ctx.fillRect(0, 0, W, H); });
    PP.spaced(ctx, '6:40', 540, 880, { font: '200 260px Inter', spacing: 12, color: '#fff3e6', glow: 'rgba(255,170,110,0.8)', blur: 40, alpha: PP.clamp((t - timeCut) / 0.2) });
  });
  shot(thereCut, line('k1').s - 0.1, 'dusk', (ctx, t, u) => {
    street(ctx, t, { x: 0.38, y: 0.42, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'K4', 560, 900, 2200 * (1 + u * 0.06), { anchor: [0.53, 0.42], light: { x: 0.1, y: 0.35, r: 0.7, color: 'rgba(255,190,120,0.3)' }, rim: { ...DUSK_RIM, dx: -7 } });
    PP.flare(ctx, 160, 420, 0.4 * (1 - u));
  });

  // ---------------------------------------------------------------- 3. On the street: he remembers the car, not her
  const butCut = word('n3', 'but') - 0.1;
  shot(line('k1').s - 0.1, line('n3').s - 0.1, 'dusk', (ctx, t, u) => {
    street(ctx, t, { x: 0.38, y: 0.42, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'K4', 600, 900, 2150 * (1 + u * 0.03), { id: 'k1', anchor: [0.53, 0.42], talk: true, light: { x: 0.1, y: 0.35, r: 0.7, color: 'rgba(255,190,120,0.3)' }, rim: { ...DUSK_RIM, dx: -7 } });
    foreground(ctx, 'M8', -200, 2300, 2500, { blur: 20, bright: 0.45 });
  });
  shot(line('n3').s - 0.1, butCut, 'dusk', (ctx, t, u) => {
    street(ctx, t, { x: 0.6, y: 0.42, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'M6', 500, 870, 2250 * (1 + u * 0.05), { anchor: [0.55, 0.35], light: { x: 0.85, y: 0.3, r: 0.7, color: 'rgba(255,200,150,0.3)' }, rim: { ...DUSK_RIM, dx: 7 } });
    foreground(ctx, 'K4', 1250, 2350, 2600, { blur: 22, bright: 0.4 });
  });
  shot(butCut, line('k2').s - 0.1, 'dusk', (ctx, t, u) => {
    street(ctx, t, { x: 0.6, y: 0.42, z: 1.6 }, { variant: 'blur' });
    char(ctx, t, 'M6', 540, 820, 3300 * (1 + u * 0.05), { id: 'b', anchor: [0.55, 0.35], light: { x: 0.85, y: 0.3, r: 0.7, color: 'rgba(255,200,150,0.25)' }, rim: { ...DUSK_RIM, dx: 8 } });
  });
  shot(line('k2').s - 0.1, C.cafe, 'dusk', (ctx, t, u) => {
    street(ctx, t, lerpCam(u, { x: 0.4, y: 0.45, z: 1.25 }, { x: 0.42, y: 0.45, z: 1.3 }), { variant: 'soft' });
    char(ctx, t, 'K4', 560, 1050, 1800 * (1 + u * 0.04), { id: 'k2', anchor: [0.53, 0.42], talk: true, light: { x: 0.1, y: 0.35, r: 0.7, color: 'rgba(255,190,120,0.3)' }, rim: { ...DUSK_RIM, dx: -7 } });
  });

  // ---------------------------------------------------------------- 4. The café: the last cookie, then talking until closing
  const touchCut = word('n4a', 'our') - 0.08, stoleCut = word('n4b', 'then') - 0.08, foreverCut = word('n4', 'like') - 0.05;
  shot(C.cafe, touchCut, 'dark', (ctx, t, u) => {
    cafe(ctx, t, lerpCam(u, { x: 0.5, y: 0.55, z: 1.2 }, { x: 0.5, y: 0.55, z: 1.28 }));
    char(ctx, t, 'M9', 250, 2230, 1800, { rim: { ...CAFE_RIM, dx: -6 }, light: { x: 0.9, y: 0.4, r: 0.8, color: 'rgba(255,200,140,0.25)' } });
    char(ctx, t, 'K6', 860, 2230, 1800, { rim: { ...CAFE_RIM, dx: 6 }, light: { x: 0.1, y: 0.4, r: 0.8, color: 'rgba(255,200,140,0.25)' } });
  }, 'dissolve');
  // "Our fingers touched... and neither of us let go." The music falls away; a slow push to their fingertips
  shot(touchCut, line('k6').s - 0.1, 'dark', (ctx, t, u) => {
    cookie(ctx, t, lerpCam(u, { x: 0.6, y: 0.53, z: 1.05 }, { x: 0.5, y: 0.515, z: 1.6 }, E.inOut), PP.clamp((t - C.touched) / 0.8));
  });
  // "Half? ...You can have the bigger one."
  shot(line('k6').s - 0.1, line('n4b').s - 0.1, 'dark', (ctx, t, u) => {
    cafe(ctx, t, { x: 0.4, y: 0.45, z: 1.6 }, 'blur');
    char(ctx, t, 'K4', 580, 900, 2150 * (1 + u * 0.05), { id: 'k6', anchor: [0.53, 0.42], talk: true, light: { x: 0.1, y: 0.35, r: 0.7, color: 'rgba(255,190,120,0.3)' }, rim: { ...CAFE_RIM, dx: -7 } });
    foreground(ctx, 'M9', -260, 2350, 2500, { blur: 20, bright: 0.45 });
  });
  // "He gave me the bigger half." / "Then stole a bite of it."
  shot(line('n4b').s - 0.1, stoleCut, 'dark', (ctx, t, u) => {
    cafe(ctx, t, { x: 0.3, y: 0.45, z: 1.5 }, 'blur');
    char(ctx, t, 'M9', 520, 960, 2300 * (1 + u * 0.05), { id: 'n4b', anchor: [0.56, 0.39], rim: { ...CAFE_RIM, dx: -7 }, light: { x: 0.9, y: 0.4, r: 0.8, color: 'rgba(255,200,140,0.28)' } });
  });
  shot(stoleCut, C.closing, 'dark', (ctx, t, u) => {
    cafe(ctx, t, { x: 0.65, y: 0.45, z: 1.5 }, 'blur');
    const bob = Math.sin((t - stoleCut) * 9) * 6 * (1 - u);
    char(ctx, t, 'K6', 520, 900 + bob, 2700 * (1 + u * 0.05), { id: 'cu', anchor: [0.54, 0.4], rim: { ...CAFE_RIM, dx: 7 }, light: { x: 0.1, y: 0.4, r: 0.8, color: 'rgba(255,200,140,0.25)' } });
  });
  // "We talked until they closed the café. He laughed..." time passes: the room dims around them
  shot(C.closing, foreverCut, 'dark', (ctx, t, u) => {
    cafe(ctx, t, lerpCam(u, { x: 0.5, y: 0.55, z: 1.18 }, { x: 0.5, y: 0.55, z: 1.3 }));
    PP.with(ctx, () => { ctx.fillStyle = `rgba(12,6,3,${0.12 + u * 0.12})`; ctx.fillRect(0, 0, W, H); });
    char(ctx, t, 'M9', 250, 2230, 1800, { rim: { ...CAFE_RIM, dx: -6 }, light: { x: 0.9, y: 0.4, r: 0.8, color: 'rgba(255,200,140,0.25)' } });
    char(ctx, t, 'K6', 860, 2230, 1800, { rim: { ...CAFE_RIM, dx: 6 }, light: { x: 0.1, y: 0.4, r: 0.8, color: 'rgba(255,200,140,0.25)' } });
  }, 'dissolve');
  shot(foreverCut, C.watch, 'dark', (ctx, t, u) => {
    cafe(ctx, t, { x: 0.35, y: 0.45, z: 1.5 }, 'blur');
    char(ctx, t, 'M9', 560, 900, 2600 * (1 + u * 0.06), { id: 'cu', anchor: [0.56, 0.39], rim: { ...CAFE_RIM, dx: -7 }, light: { x: 0.9, y: 0.4, r: 0.8, color: 'rgba(255,200,140,0.25)' } });
  });

  // ---------------------------------------------------------------- 5. The watch; his brother
  shot(C.watch, line('k3').s - 0.1, 'dark', (ctx, t, u) => {
    cafe(ctx, t, { x: 0.5, y: 0.5, z: 1.7 }, 'blur');
    const h = 2300 * (1 + u * 0.1);
    char(ctx, t, 'K5', 560, 960, h, { anchor: [0.5156, 0.5195], breath: 0, light: { x: 0.52, y: 0.5, r: 0.3, color: 'rgba(255,225,190,0.3)' }, rim: { ...CAFE_RIM, dx: -6 } });
    clockHands(ctx, 560, 960, 0.1406 * 1024 * (h / 1536), 11, 11);
    const [gx, gy] = onCut('K5', 560, 960, h, [0.5156, 0.5195], 0.44, 0.47);
    PP.flare(ctx, gx, gy, 0.35 + 0.25 * Math.sin(t * 2));
  });
  shot(line('k3').s - 0.1, C.night, 'dark', (ctx, t, u) => {
    cafe(ctx, t, { x: 0.4, y: 0.45, z: 1.6 }, 'blur');
    char(ctx, t, 'K3', 580, 900, 2150 * (1 + u * 0.06), { id: 'k3', anchor: [0.52, 0.42], talk: true, light: { x: 0.1, y: 0.35, r: 0.7, color: 'rgba(255,190,120,0.3)' }, rim: { ...CAFE_RIM, dx: -7 } });
    foreground(ctx, 'M9', -260, 2350, 2500, { blur: 20, bright: 0.45 });
  });

  // ---------------------------------------------------------------- 6. That night, 11:11
  const clockCut = C.clock1111 - 0.12, litCut = word('n6', 'my') - 0.08;
  shot(C.night, clockCut, 'night', (ctx, t, u) => {
    bedroom(ctx, t, lerpCam(u, { x: 0.45, y: 0.52, z: 1.1 }, { x: 0.4, y: 0.54, z: 1.25 }), { clock: '11:10' });
  }, 'dissolve');
  shot(clockCut, litCut, 'night', (ctx, t, u) => {
    const pulse = t > C.clock1111 ? Math.max(0, 1 - (t - C.clock1111) / 1.4) : 0;
    bedroom(ctx, t, lerpCam(u, { x: 0.31, y: 0.553, z: 4.2 }, { x: 0.31, y: 0.553, z: 4.6 }, E.out), { clock: t < C.clock1111 ? '11:10' : '11:11', pulse });
  });
  shot(litCut, line('k4').s - 0.55, 'night', (ctx, t, u) => {
    bedroom(ctx, t, { x: 0.55, y: 0.5, z: 1.25 }, { variant: 'blur' });
    const glow = PP.clamp((t - word('n6', 'lit')) / 0.3);
    char(ctx, t, 'M2', 600, 2080, 1900 * (1 + u * 0.06), { tint: 'rgba(30,40,110,0.08)', light: { x: 0.62, y: 0.3, r: 0.55, color: `rgba(200,225,255,${0.12 + 0.25 * glow})` }, rim: { color: 'rgba(255,200,140,0.9)', dx: -5, dy: -2, a: 0.7 } });
  });

  // ---------------------------------------------------------------- 7. "Don't let me get on the train."
  const trainCut = C.train - 0.1;
  shot(line('k4').s - 0.55, trainCut, 'phone', (ctx, t, u) => {
    phoneShot(ctx, t, 'B5', [msg('k4')], { u, banner: C.buzz[0], seed: 53 });
  });
  shot(trainCut, line('n7').s - 0.1, 'train', (ctx, t, u) => {
    PP.drawBgDepth(ctx, 'B3', { ...lerpCam(u, { x: 0.5, y: 0.42, z: 1.05 }, { x: 0.5, y: 0.42, z: 1.3 }), z0: 1 }, { horizon: 0.375, k: 1.5 });
    PP.with(ctx, () => { ctx.fillStyle = 'rgba(0,8,14,0.45)'; ctx.fillRect(0, 0, W, H); });
  });
  shot(line('n7').s - 0.1, line('k5').s - 0.55, 'night', (ctx, t, u) => {
    bedroom(ctx, t, { x: 0.6, y: 0.45, z: 1.6 }, { variant: 'blur' });
    char(ctx, t, 'M2', 540, 880, 2500 * (1 + u * 0.06), { id: 'n7', anchor: [0.55, 0.38], tint: 'rgba(30,40,110,0.08)', light: { x: 0.6, y: 0.4, r: 0.5, color: 'rgba(200,225,255,0.3)' }, rim: { color: 'rgba(255,200,140,0.9)', dx: -6, a: 0.6 } });
  });

  // ---------------------------------------------------------------- 8. "...you're the one who doesn't come home."
  const youCut = word('k5', "you're") - 0.1;
  shot(line('k5').s - 0.55, youCut, 'danger', (ctx, t, u) => {
    phoneShot(ctx, t, 'B5', [msg('k5', { urgent: true })], { u, urgent: true, banner: C.buzz[1], seed: 59 });
  });
  shot(youCut, C.makeIt, 'night', (ctx, t, u) => {
    PP.drawBg(ctx, 'B1', { x: 0.5, y: 0.45, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'M7', 540, 860, 3000 * (1 + u * 0.1), { anchor: [0.58, 0.41], blink: false, tint: 'rgba(20,30,90,0.1)', light: { x: 0.85, y: 0.8, r: 0.8, color: 'rgba(255,120,110,0.25)' }, rim: { color: 'rgba(255,120,110,0.9)', dx: 6, a: 0.7 } });
  });
  shot(C.makeIt, C.endCard, null, (ctx) => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); });

  // ---------------------------------------------------------------- 9. End card
  shot(C.endCard, C.total, null, (ctx, t) => {
    ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, W, H);
    const t0 = C.endCard, a = PP.clamp((t - t0 - 0.1) / 0.6);
    PP.spaced(ctx, '11:11', 540, 860, { font: '200 200px Inter', spacing: 14, glow: 'rgba(130,200,255,0.7)', blur: 36, alpha: a });
    PP.spaced(ctx, 'FIVE DAYS LEFT', 540, 1040, { font: '500 32px Inter', spacing: 12, color: 'rgba(255,120,110,0.95)', alpha: PP.clamp((t - t0 - 0.5) / 0.5) });
    PP.spaced(ctx, 'TO BE CONTINUED', 540, 1110, { font: '300 30px Inter', spacing: 10, color: 'rgba(225,232,255,0.8)', alpha: PP.clamp((t - t0 - 0.8) / 0.5) });
  });

  PP.SHOTS = K.S;
})(typeof window !== 'undefined' ? window : globalThis);
