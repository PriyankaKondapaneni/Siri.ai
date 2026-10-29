// 11:11, Episode 3, "The 6:40 Train": the shot list, cut on the words of the narration.
(function (g) {
  const PP = g.PP;
  const C = PP.CUES, T = g.TIMING;
  const K = PP.shotKit(C, T);
  const { E, W, H, line, word, lerpCam, char, foreground, bedroom, phoneShot, shot } = K;

  // the metro platform: cool morning light, the tunnel mouth glowing when a train comes
  const platform = (ctx, t, cam, o = {}) => {
    const bg = PP.drawBgDepth(ctx, 'B6', { ...cam, z0: 1 }, { horizon: 0.42, k: 1.3, variant: o.variant });
    if (o.tunnel) { const [tx, ty] = bg.map(0.89, 0.42); PP.glowAt(ctx, tx, ty, 260 * o.tunnel, '255,240,210', 0.6 * o.tunnel); }
    return bg;
  };
  const RIM = { color: 'rgba(210,235,255,0.95)', a: 0.7 };
  const NEWS = { bannerTitle: 'BREAKING', bannerText: '6:40 Line 4 train stopped inside the tunnel. Emergency crews on site.' };

  // ---------------------------------------------------------------- 0. Cold open
  const hk = [0, 0.45, 0.95, 1.5, C.hookEnd];
  shot(hk[0], hk[1], 'train', (ctx, t, u) => {
    const [hx, hy, hr] = PP.handheld(t, 9, 61);
    PP.with(ctx, () => { ctx.translate(hx, hy); ctx.rotate(hr); platform(ctx, t, lerpCam(u, { x: 0.7, y: 0.42, z: 1.6 }, { x: 0.75, y: 0.42, z: 1.9 }, E.in), { tunnel: 0.6 + u }); });
    PP.with(ctx, () => { ctx.fillStyle = 'rgba(0,6,12,0.35)'; ctx.fillRect(0, 0, W, H); });
  });
  shot(hk[1], hk[2], 'train', (ctx, t, u) => {
    platform(ctx, t, { x: 0.4, y: 0.4, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'K3', 540, 900, 4300 * (1 + u * 0.06), { id: 'hk', blink: false, anchor: [0.52, 0.405], rim: { ...RIM, dx: -9 } });
  });
  shot(hk[2], hk[3], 'danger', (ctx, t, u) => {
    phoneShot(ctx, t, 'B5', [], { u, seed: 63, banner: hk[2] - 0.35, bannerHold: 2, ...NEWS, focus: 1.6, focusY: -460, header: 'News' });
  });
  shot(hk[3], hk[4], 'train', (ctx, t, u) => {
    platform(ctx, t, { x: 0.5, y: 0.45, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'M6', 540, 860, 3600 * (1 + u * 0.06), { id: 'hk', blink: false, anchor: [0.55, 0.35], rim: { ...RIM, dx: 7 } });
  });

  // ---------------------------------------------------------------- 1. A sleepless night
  shot(C.hookEnd, C.sleep, 'night', (ctx, t, u) => {
    bedroom(ctx, t, { x: 0.6, y: 0.45, z: 1.6 }, { variant: 'blur' });
    char(ctx, t, 'M2', 540, 880, 2500 * (1 + u * 0.05), { id: 'cu', anchor: [0.55, 0.38], tint: 'rgba(30,40,110,0.08)', light: { x: 0.6, y: 0.4, r: 0.5, color: 'rgba(200,225,255,0.25)' }, rim: { color: 'rgba(255,200,140,0.9)', dx: -6, a: 0.6 } });
  });
  // the clock racing through the night while the window turns to dawn
  shot(C.sleep, C.platform, 'night', (ctx, t, u) => {
    const mins = Math.round(PP.lerp(2 * 60 + 14, 5 * 60 + 58, E.inOut(u)));
    bedroom(ctx, t, lerpCam(u, { x: 0.31, y: 0.553, z: 3.6 }, { x: 0.31, y: 0.553, z: 3.9 }), { clock: `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}` });
    PP.with(ctx, () => { ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = `rgba(255,190,140,${0.45 * u})`; ctx.fillRect(0, 0, W, H); });
  });

  // ---------------------------------------------------------------- 2. Platform four, 6:30
  const fourCut = word('n2', 'platform') - 0.08, thereCut = word('n2', 'he') - 0.08;
  shot(C.platform, fourCut, 'train', (ctx, t, u) => {
    platform(ctx, t, { x: 0.6, y: 0.45, z: 1.7 + u * 0.1 }, { variant: 'blur' });
    PP.with(ctx, () => { ctx.fillStyle = 'rgba(4,8,14,0.3)'; ctx.fillRect(0, 0, W, H); });
    PP.spaced(ctx, '6:30', 540, 880, { font: '200 260px Inter', spacing: 12, color: '#eef6ff', glow: 'rgba(150,200,255,0.8)', blur: 40, alpha: PP.clamp((t - C.platform) / 0.2) });
  });
  shot(fourCut, thereCut, 'train', (ctx, t, u) => {
    platform(ctx, t, lerpCam(u, { x: 0.5, y: 0.45, z: 1.0 }, { x: 0.52, y: 0.46, z: 1.1 }));
  });
  shot(thereCut, line('k1').s - 0.1, 'train', (ctx, t, u) => {
    platform(ctx, t, { x: 0.55, y: 0.45, z: 1.4 }, { variant: 'soft' });
    char(ctx, t, 'K3', 620, 1050, 1900 * (1 + u * 0.05), { id: 'pl', anchor: [0.52, 0.42], rim: { ...RIM, dx: -7 } });
  });

  // ---------------------------------------------------------------- 3. "Mira? What are you doing here?" — the spill
  const spillCut = word('n3', 'so') - 0.1, soakedCut = C.spill + 0.75;
  shot(line('k1').s - 0.1, line('n3').s - 0.1, 'train', (ctx, t, u) => {
    platform(ctx, t, { x: 0.38, y: 0.42, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'K4', 600, 900, 2150 * (1 + u * 0.03), { id: 'k1', anchor: [0.53, 0.42], talk: true, rim: { ...RIM, dx: -7 } });
    foreground(ctx, 'M1', -200, 2300, 2500, { blur: 20, bright: 0.45 });
  });
  shot(line('n3').s - 0.1, spillCut, 'train', (ctx, t, u) => {
    platform(ctx, t, { x: 0.45, y: 0.45, z: 1.3 }, { variant: 'soft' });
    char(ctx, t, 'M1', 520, 2000, 1850 * (1 + u * 0.04), { rim: { ...RIM, dx: 6 } });
  });
  shot(spillCut, soakedCut, 'train', (ctx, t, u) => {
    const [sx, sy, sr] = PP.shake(t, C.spill, 18, 0.45);
    PP.with(ctx, () => {
      ctx.translate(sx, sy); ctx.rotate(sr);
      platform(ctx, t, { x: 0.45, y: 0.45, z: 1.3 }, { variant: 'soft' });
      const spilled = t >= C.spill - 0.04;
      char(ctx, t, spilled ? 'M3' : 'M1', 520, 2000, 1850, { id: 'sp', rim: { ...RIM, dx: 6 } });
      if (spilled) for (let k = 0; k < 14; k++) {
        const v = (t - C.spill) / 0.7;
        if (v > 1) break;
        const ang = -1.0 + PP.rand('dr3', k) * 1.4, sp = 500 + PP.rand('ds3', k) * 700;
        const x = 930 + Math.cos(ang) * sp * v, y = 1080 + Math.sin(ang) * sp * v + 700 * v * v;
        PP.with(ctx, () => { ctx.fillStyle = '#6b3f22'; ctx.strokeStyle = '#1d1a1d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, 8 + PP.rand('dz3', k) * 8, 10 + PP.rand('dz3', k) * 10, ang, 0, 7); ctx.fill(); ctx.stroke(); });
      }
    });
    PP.flash(ctx, t, C.spill, 0.2, '255,245,230', 0.3);
  });
  shot(soakedCut, line('k2').s - 0.1, 'train', (ctx, t, u) => {
    platform(ctx, t, { x: 0.55, y: 0.45, z: 1.3 }, { variant: 'soft' });
    char(ctx, t, 'K7', 560, 2000, 1850 * (1 + u * 0.04), { id: 'sk', rim: { ...RIM, dx: -6 } });
  });
  shot(line('k2').s - 0.1, C.doors, 'train', (ctx, t, u) => {
    platform(ctx, t, { x: 0.55, y: 0.42, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'K7', 560, 880, 2500 * (1 + u * 0.05), { id: 'k2', anchor: [0.52, 0.38], talk: true, rim: { ...RIM, dx: -7 } });
  });

  // ---------------------------------------------------------------- 4. The train leaves without him; her hand
  shot(C.doors, C.hand, 'train', (ctx, t, u) => {
    const [hx, hy] = PP.handheld(t, 5, 67);
    PP.with(ctx, () => { ctx.translate(hx, hy); platform(ctx, t, lerpCam(u, { x: 0.35, y: 0.5, z: 1.25 }, { x: 0.33, y: 0.5, z: 1.3 })); });
    // the departing train: streaks of light raking across the track side of the frame
    const go = PP.clamp((t - C.trainOut + 0.3) / 0.6) * (1 - PP.clamp((t - C.hand + 0.4) / 0.4));
    if (go > 0) PP.with(ctx, () => {
      ctx.globalCompositeOperation = 'screen';
      for (let k = 0; k < 26; k++) {
        const y = 520 + PP.rand('ty', k) * 980, len = 300 + PP.rand('tl', k) * 700, x = ((t * 2600 + PP.rand('tx', k) * 3000) % 3200) - 900;
        const gr = ctx.createLinearGradient(x, 0, x + len, 0);
        gr.addColorStop(0, 'rgba(255,245,220,0)'); gr.addColorStop(1, `rgba(255,245,220,${0.5 * go})`);
        ctx.fillStyle = gr; ctx.fillRect(x, y, len, 3 + PP.rand('tw', k) * 7);
      }
    });
  });
  shot(C.hand, line('n5').s - 0.1, 'dark', (ctx, t, u) => {
    platform(ctx, t, { x: 0.5, y: 0.5, z: 1.8 }, { variant: 'blur' });
    char(ctx, t, 'H1', 540, 980, 2700 * (1 + u * 0.06), { anchor: [0.6, 0.57], breath: 0, blink: false, light: { x: 0.3, y: 0.3, r: 0.8, color: 'rgba(255,210,160,0.3)' }, rim: { color: 'rgba(255,215,170,0.95)', dx: -6, a: 0.7 } });
  });

  // ---------------------------------------------------------------- 5. Every phone buzzes; the news
  shot(line('n5').s - 0.1, C.buzzAll - 0.1, 'cold', (ctx, t, u) => {
    PP.drawBgDepth(ctx, 'B4', { ...lerpCam(u, { x: 0.5, y: 0.5, z: 1.0 }, { x: 0.5, y: 0.52, z: 1.06 }), z0: 1 }, { horizon: 0.52, k: 1.4 });
    char(ctx, t, 'M8', 300, 2050, 1500, { rim: { ...RIM, dx: 5 } });
    char(ctx, t, 'K7', 790, 2050, 1550, { id: 'st', rim: { ...RIM, dx: -5 } });
  });
  shot(C.buzzAll - 0.1, C.news, 'cold', (ctx, t, u) => {
    PP.drawBgDepth(ctx, 'B4', { x: 0.5, y: 0.52, z: 1.06, z0: 1 }, { horizon: 0.52, k: 1.4 });
    // phone screens lighting up all over the street: far ones in the windows and doorways, then theirs
    for (let k = 0; k < 10; k++) {
      const on = PP.clamp((t - C.buzzAll - k * 0.04) / 0.12);
      if (on <= 0) continue;
      const x = 40 + PP.rand('px', k) * 1000, y = 260 + PP.rand('py', k) * 360, s = 0.4 + PP.rand('ps', k) * 0.4;
      PP.glowAt(ctx, x, y, 80 * s, '170,210,255', 0.7 * on);
      PP.with(ctx, () => { ctx.globalAlpha = on; ctx.fillStyle = '#dcebff'; PP.roundRect(ctx, x - 12 * s, y - 22 * s, 24 * s, 44 * s, 5 * s); ctx.fill(); });
    }
    const lit = PP.clamp((t - C.buzzAll) / 0.15);
    char(ctx, t, 'M8', 300, 2050, 1500, { id: 'b', rim: { ...RIM, dx: 5 }, light: { x: 0.4, y: 0.75, r: 0.6, color: `rgba(170,210,255,${0.35 * lit})` } });
    char(ctx, t, 'K7', 790, 2050, 1550, { id: 'stb', rim: { ...RIM, dx: -5 }, light: { x: 0.5, y: 0.75, r: 0.6, color: `rgba(170,210,255,${0.35 * lit})` } });
    for (const [x, y] of [[330, 1900], [800, 1920]]) PP.glowAt(ctx, x, y, 320, '170,210,255', 0.6 * lit);
  });
  const neverCut = word('n6', 'never') - 0.1;
  shot(C.news, neverCut, 'danger', (ctx, t, u) => {
    phoneShot(ctx, t, 'B5', [], { u, seed: 71, banner: C.news + 0.05, bannerHold: 6, ...NEWS, header: 'News' });
  });
  shot(neverCut, line('k3').s - 0.1, 'danger', (ctx, t, u) => {
    PP.drawBgDepth(ctx, 'B3', { ...lerpCam(u, { x: 0.5, y: 0.42, z: 1.15 }, { x: 0.5, y: 0.42, z: 1.35 }), z0: 1 }, { horizon: 0.375, k: 1.5 });
    const pulse = 0.5 + 0.5 * Math.sin(t * 7);
    PP.with(ctx, () => { ctx.fillStyle = 'rgba(0,4,8,0.55)'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,40,30,${0.18 + 0.15 * pulse})`; ctx.fillRect(0, 0, W, H); });
  });

  // ---------------------------------------------------------------- 6. "You knew. Didn't you?"
  shot(line('k3').s - 0.1, line('n7').s - 0.1, 'cold', (ctx, t, u) => {
    PP.drawBg(ctx, 'B4', { x: 0.38, y: 0.42, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'K3', 600, 900, 2150 * (1 + u * 0.05), { id: 'k3', anchor: [0.52, 0.42], talk: true, rim: { ...RIM, dx: -7 } });
    foreground(ctx, 'M8', -200, 2300, 2500, { blur: 20, bright: 0.45 });
  });
  shot(line('n7').s - 0.1, C.night, 'cold', (ctx, t, u) => {
    PP.drawBg(ctx, 'B4', { x: 0.6, y: 0.42, z: 1.5 }, { variant: 'blur' });
    char(ctx, t, 'M6', 500, 870, 2250 * (1 + u * 0.05), { anchor: [0.55, 0.35], rim: { ...RIM, dx: 7 } });
    foreground(ctx, 'K3', 1250, 2350, 2600, { blur: 22, bright: 0.4 });
  });

  // ---------------------------------------------------------------- 7. That night: his phone
  const clockCut = C.clock1111 - 0.12;
  shot(C.night, clockCut, 'night', (ctx, t, u) => {
    bedroom(ctx, t, lerpCam(u, { x: 0.45, y: 0.52, z: 1.1 }, { x: 0.4, y: 0.54, z: 1.25 }), { clock: '11:10' });
  }, 'dissolve');
  shot(clockCut, C.hisPhone, 'night', (ctx, t, u) => {
    const pulse = t > C.clock1111 ? Math.max(0, 1 - (t - C.clock1111) / 1.4) : 0;
    bedroom(ctx, t, lerpCam(u, { x: 0.31, y: 0.553, z: 4.2 }, { x: 0.31, y: 0.553, z: 4.6 }, E.out), { clock: t < C.clock1111 ? '11:10' : '11:11', pulse });
  });
  shot(C.hisPhone, line('k4').s - 0.1, 'phone', (ctx, t, u) => {
    PP.drawBg(ctx, 'B5', { x: 0.5, y: 0.5, z: 1.4 }, { variant: 'dark' });
    char(ctx, t, 'K8', 540, 2050, 1900 * (1 + u * 0.05), { light: { x: 0.35, y: 0.55, r: 0.6, color: 'rgba(170,215,255,0.45)' }, rim: { color: 'rgba(150,200,255,0.9)', dx: 6, a: 0.6 } });
  });
  shot(line('k4').s - 0.1, C.makeIt, 'phone', (ctx, t, u) => {
    PP.drawBg(ctx, 'B5', { x: 0.5, y: 0.5, z: 1.5 }, { variant: 'dark' });
    char(ctx, t, 'K8', 560, 880, 2600 * (1 + u * 0.08), { id: 'k4', anchor: [0.52, 0.45], talk: true, light: { x: 0.35, y: 0.55, r: 0.6, color: 'rgba(170,215,255,0.5)' }, rim: { color: 'rgba(150,200,255,0.9)', dx: 6, a: 0.6 } });
  });
  shot(C.makeIt, C.endCard, null, (ctx) => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); });

  // ---------------------------------------------------------------- 8. End card
  shot(C.endCard, C.total, null, (ctx, t) => {
    ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, W, H);
    const t0 = C.endCard, a = PP.clamp((t - t0 - 0.1) / 0.6);
    PP.spaced(ctx, '11:11', 540, 860, { font: '200 200px Inter', spacing: 14, glow: 'rgba(130,200,255,0.7)', blur: 36, alpha: a });
    PP.spaced(ctx, 'FOUR DAYS LEFT', 540, 1040, { font: '500 32px Inter', spacing: 12, color: 'rgba(255,120,110,0.95)', alpha: PP.clamp((t - t0 - 0.5) / 0.5) });
    PP.spaced(ctx, 'TO BE CONTINUED', 540, 1110, { font: '300 30px Inter', spacing: 10, color: 'rgba(225,232,255,0.8)', alpha: PP.clamp((t - t0 - 0.8) / 0.5) });
  });

  PP.SHOTS = K.S;
})(typeof window !== 'undefined' ? window : globalThis);
