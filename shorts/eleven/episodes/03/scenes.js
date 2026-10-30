// 11:11, Episode 3, "The 6:40 Train": the shot list, cut on the words of the narration.
// Slice of life: one morning, lived nearly in real time. Someone moves in every shot, and time flows (the night
// running out in her room, dawn on the street, the hour in the café) instead of jumping.
(function (g) {
  const PP = g.PP;
  const C = PP.CUES, T = g.TIMING;
  const K = PP.shotKit(C, T);
  const { E, W, H, line, word, lerpCam, char, onCut, foreground, digital, bedroom, phoneShot, shot } = K;
  const tl = (t, a, b, e = E.inOut) => e(PP.clamp((t - a) / (b - a)));

  // the metro platform: cool morning light, the tunnel mouth glowing when a train comes
  const platform = (ctx, t, cam, o = {}) => {
    const bg = PP.drawBgDepth(ctx, 'B6', { ...cam, z0: 1 }, { horizon: 0.42, k: 1.3, variant: o.variant });
    if (o.tunnel) { const [tx, ty] = bg.map(0.89, 0.42); PP.glowAt(ctx, tx, ty, 260 * o.tunnel, '255,240,210', 0.6 * o.tunnel); }
    return bg;
  };
  const cafe = (ctx, t, cam, variant = 'soft', dark = 0.2) => {
    const bg = PP.drawBg(ctx, 'B2', cam, { variant });
    PP.with(ctx, () => { ctx.fillStyle = `rgba(20,14,10,${dark})`; ctx.fillRect(0, 0, W, H); });
    return bg;
  };
  // steam curling up from a cup: three soft wavy strokes, drifting
  const steam = (ctx, t, x, y, s = 1, a = 0.5) => PP.with(ctx, () => {
    ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 5 * s; ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      for (let i = 0; i <= 12; i++) { const v = i / 12, ph = t * 2.2 + k * 2.1; ctx.lineTo(x + (k - 1) * 22 * s + Math.sin(v * 5 + ph) * 12 * s, y - v * 150 * s); }
      ctx.globalAlpha = 0.7 - k * 0.15; ctx.stroke();
    }
  });
  // the departing train: streaks of light raking across the frame
  const streaks = (ctx, t, go) => go > 0 && PP.with(ctx, () => {
    ctx.globalCompositeOperation = 'screen';
    for (let k = 0; k < 26; k++) {
      const y = 520 + PP.rand('ty', k) * 980, len = 300 + PP.rand('tl', k) * 700, x = ((t * 2600 + PP.rand('tx', k) * 3000) % 3200) - 900;
      const gr = ctx.createLinearGradient(x, 0, x + len, 0);
      gr.addColorStop(0, 'rgba(255,245,220,0)'); gr.addColorStop(1, `rgba(255,245,220,${0.5 * go})`);
      ctx.fillStyle = gr; ctx.fillRect(x, y, len, 3 + PP.rand('tw', k) * 7);
    }
  });
  // coffee flying: drops on arcs, in slow motion when slow < 1
  const drops = (ctx, t, t0, x0, y0, slow = 1, n = 16) => {
    const v = ((t - t0) * slow) / 0.7;
    if (v < 0 || v > 1.2) return;
    for (let k = 0; k < n; k++) {
      const ang = -1.2 + PP.rand('dr', k) * 1.8, sp = 450 + PP.rand('ds', k) * 700;
      const x = x0 + Math.cos(ang) * sp * v, y = y0 + Math.sin(ang) * sp * v + 800 * v * v;
      PP.with(ctx, () => { ctx.fillStyle = '#6b3f22'; ctx.strokeStyle = '#1d1a1d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, 8 + PP.rand('dz', k) * 9, 10 + PP.rand('dz', k) * 11, ang, 0, 7); ctx.fill(); ctx.stroke(); });
    }
  };
  // a paper cup drawn in the series' flat ink style, tumbling
  const cup = (ctx, x, y, s, rot) => PP.with(ctx, () => {
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.lineWidth = 5; ctx.strokeStyle = '#1d1a1d'; ctx.lineJoin = 'round';
    ctx.fillStyle = '#c9a27c'; ctx.beginPath(); ctx.moveTo(-42, -60); ctx.lineTo(42, -60); ctx.lineTo(32, 70); ctx.lineTo(-32, 70); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f4efe6'; ctx.beginPath(); ctx.rect(-48, -80, 96, 22); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8a6646'; ctx.beginPath(); ctx.rect(-38, -10, 76, 34); ctx.fill(); ctx.stroke();
  });
  const RIM = { color: 'rgba(210,235,255,0.95)', a: 0.7 };
  const WARM_RIM = { color: 'rgba(255,205,150,0.95)', a: 0.7 };
  const NEWS = { bannerTitle: 'BREAKING', bannerText: '6:40 Line 4 train stopped inside the tunnel. Emergency crews on site.' };

  // ---------------------------------------------------------------- 0. Cold open: what happens, not how
  // "The 6:40 never made it..." headlights out of the tunnel; two cups tumbling in slow motion; every phone red; his stare
  const hk = [0, 0.45, 0.95, 1.5, C.hookEnd];
  shot(hk[0], hk[1], 'train', (ctx, t, u) => {
    const [hx, hy, hr] = PP.handheld(t, 10, 61);
    PP.with(ctx, () => { ctx.translate(hx, hy); ctx.rotate(hr); platform(ctx, t, lerpCam(u, { x: 0.7, y: 0.42, z: 1.6 }, { x: 0.78, y: 0.42, z: 2.1 }, E.in), { tunnel: 0.8 + u * 1.4 }); });
    streaks(ctx, t, u);
  });
  shot(hk[1], hk[2], 'train', (ctx, t, u) => {
    platform(ctx, t, { x: 0.45, y: 0.45, z: 1.6 }, { variant: 'blur' });
    // slow motion: the cups turn over in the air, the coffee hanging
    cup(ctx, 380 + u * 60, 900 - u * 40, 2.2, -0.4 + u * 0.5);
    cup(ctx, 720 - u * 30, 1050 - u * 70, 2.0, 0.6 - u * 0.4);
    drops(ctx, t, hk[1] - 0.25, 560, 980, 0.35);
  });
  shot(hk[2], hk[3], 'danger', (ctx, t, u) => {
    phoneShot(ctx, t, 'B5', [], { u, seed: 63, banner: hk[2] - 0.35, bannerHold: 2, ...NEWS, focus: 1.6, focusY: -460, header: 'News' });
  });
  shot(hk[3], hk[4], 'cold', (ctx, t, u) => {
    PP.drawBg(ctx, 'B2', { x: 0.4, y: 0.45, z: 1.6 }, { variant: 'blur' });
    // he looks up, slowly, at her
    char(ctx, t, 'K3', 540, 900 - 24 * E.out(u), 4300 * (1 + u * 0.06), { id: 'hk', blink: false, anchor: [0.52, 0.405], rim: { ...RIM, dx: -9 } });
  });

  // ---------------------------------------------------------------- 1. "I didn't sleep. I set an alarm anyway."
  // the night runs out: the clock from 2:14 to 5:29, the window going from black to blue; she turns over, sits up,
  // lies back down, and stares at the ceiling
  const POSE = [[640, 2040, 0], [700, 2030, 0.03], [620, 1990, -0.02], [680, 2045, 0.015], [650, 2000, -0.025]];
  shot(C.hookEnd, C.alarm, 'night', (ctx, t, u) => {
    const k = PP.clamp((t - C.hookEnd) / (C.alarm - C.hookEnd - 0.1)), mins = Math.round(PP.lerp(2 * 60 + 14, 5 * 60 + 29, k));
    const bg = bedroom(ctx, t, lerpCam(u, { x: 0.42, y: 0.52, z: 1.15 }, { x: 0.38, y: 0.54, z: 1.3 }), { rain: false, clock: `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}` });
    const [w0x, w0y] = bg.map(0.57, 0), [w1x, w1y] = bg.map(1, 0.4);
    PP.with(ctx, () => { ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(80,110,190,${0.45 * k})`; ctx.fillRect(w0x, w0y, w1x - w0x, w1y - w0y); });
    const p = POSE[Math.min(POSE.length - 1, Math.floor(k * POSE.length))];
    char(ctx, t, 'M2', p[0], p[1], 1300, { rot: p[2], tint: 'rgba(30,40,110,0.16)', rim: { color: 'rgba(255,200,140,0.9)', dx: -5, a: 0.6 } });
    PP.spaced(ctx, '5 DAYS LEFT', 540, 200, { font: '500 40px Inter', spacing: 14, color: 'rgba(255,120,110,0.95)', glow: 'rgba(255,60,50,0.6)', blur: 20, alpha: PP.clamp((t - C.hookEnd) / 0.3) * (1 - PP.clamp((t - C.hookEnd - 1.6) / 0.4)) });
    PP.flash(ctx, t, C.hookEnd, 0.3);
  });
  // the bedside clock hits 5:30 and starts flashing; her hand comes out from under the covers and switches it off
  shot(C.alarm, C.dawn, 'night', (ctx, t, u) => {
    const ring = t > C.alarm + 0.15, off = C.alarm + 1.05, on = ring && t < off;
    const bg = bedroom(ctx, t, lerpCam(u, { x: 0.31, y: 0.553, z: 3.3 }, { x: 0.31, y: 0.56, z: 3.5 }), { rain: false, clock: ring ? '5:30' : '5:29', pulse: on ? 0.5 + 0.5 * Math.sin(t * 18) : 0 });
    PP.with(ctx, () => { ctx.fillStyle = 'rgba(30,40,110,0.18)'; ctx.fillRect(0, 0, W, H); });
    const [cx, cy] = bg.map(0.31, 0.553);
    const reach = tl(t, C.alarm + 0.3, off, E.out), back = tl(t, off + 0.25, off + 0.8, E.in);
    PP.drawCut(ctx, 'HM', cx - 1100 + 1040 * reach - 700 * back, cy + 40 + 30 * back, 760, { sticker: false, anchor: [0.703, 0.503], rot: 0.08, breath: 0, shadow: { a: 0.3, dx: 18, dy: 26 }, tint: 'rgba(30,40,110,0.25)' });
  });

  // ---------------------------------------------------------------- 2. "5:40. I bought two coffees..."
  // dawn comes up over the empty street, blue to pink; she walks through it toward the café
  const becauseCut = word('n2', 'because') - 0.1;
  shot(C.dawn, becauseCut, null, (ctx, t, u) => {
    const k = PP.clamp((t - C.dawn) / (becauseCut - C.dawn));
    if (t < C.dawn + 0.9) K.F.noSubs = true;
    PP.drawBgDepth(ctx, 'B4', { ...lerpCam(u, { x: 0.45, y: 0.5, z: 1.05 }, { x: 0.55, y: 0.48, z: 1.12 }), z0: 1 }, { horizon: 0.52, k: 1.4 });
    PP.with(ctx, () => {
      ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgb(${Math.round(PP.lerp(90, 255, k))},${Math.round(PP.lerp(110, 210, k))},${Math.round(PP.lerp(170, 210, k))})`; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,170,170,${0.18 * k})`; ctx.fillRect(0, 0, W, 900);
    });
    char(ctx, t, 'M8', 120 + 640 * u, 2030 - Math.abs(Math.sin(t * 6.5)) * 12, 1350, { rot: Math.sin(t * 6.5) * 0.01, breath: 0, rim: { color: `rgba(255,${Math.round(PP.lerp(200, 170, k))},${Math.round(PP.lerp(220, 150, k))},0.9)`, dx: 5, a: 0.6 } });
    PP.spaced(ctx, '5:40', 540, 760, { font: '200 240px Inter', spacing: 12, color: '#fff1ea', glow: 'rgba(255,170,160,0.7)', blur: 40, alpha: PP.clamp((t - C.dawn) / 0.25) * (1 - PP.clamp((t - C.dawn - 0.8) / 0.3)) });
  }, 'dissolve');
  // at the counter: two cups; a tilt of her head, a small shrug on "...how he takes his"; then she turns for the door
  shot(becauseCut, C.platform, 'morning', (ctx, t, u) => {
    cafe(ctx, t, lerpCam(u, { x: 0.45, y: 0.5, z: 1.45 }, { x: 0.5, y: 0.5, z: 1.5 }), 'blur', 0.1);
    const tilt = Math.sin(tl(t, word('n2', 'know') - 0.2, word('n2', 'know') + 0.6) * Math.PI), shrug = Math.sin(tl(t, word('n2', 'takes') - 0.1, word('n2', 'takes') + 0.35) * Math.PI);
    const turn = tl(t, C.platform - 0.7, C.platform - 0.05, E.in), h = 2100, x = 540 - 420 * turn, y = 1960 - 22 * shrug;
    char(ctx, t, 'M12', x, y, h, { rot: 0.04 * tilt - 0.03 * turn, rim: { ...WARM_RIM, dx: -6 }, light: { x: 0.8, y: 0.3, r: 0.7, color: 'rgba(255,215,170,0.25)' } });
    for (const [cu, cv] of [[0.19, 0.36], [0.5, 0.36]]) { const [sx, sy, sc] = onCut('M12', x, y, h, [0.5, 1], cu, cv); steam(ctx, t, sx, sy, sc * 1.4, 0.45); }
  });

  // ---------------------------------------------------------------- 3. Platform four: he's already there
  shot(C.platform, C.reading, 'train', (ctx, t, u) => {
    // she comes down onto the platform, the departure board ticking over
    platform(ctx, t, lerpCam(u, { x: 0.45, y: 0.45, z: 1.0 }, { x: 0.5, y: 0.46, z: 1.1 }));
    const walk = E.out(PP.clamp(u * 1.1));
    char(ctx, t, 'M12', -100 + walk * 420, 2060 - Math.abs(Math.sin(t * 7)) * 14 * (1 - walk), 1350, { rim: { ...RIM, dx: 5 } });
  });
  shot(C.reading, line('k1').s - 0.1, 'train', (ctx, t, u) => {
    // he reads on the bench, turns a page; the tunnel breathes behind him
    platform(ctx, t, lerpCam(u, { x: 0.58, y: 0.48, z: 1.35 }, { x: 0.56, y: 0.48, z: 1.45 }), { variant: 'soft' });
    const page = tl(t, C.reading + 0.6, C.reading + 0.9);
    char(ctx, t, 'K12', 560, 2000, 1900 * (1 + u * 0.03), { id: 'rd', rot: 0.012 * Math.sin(page * Math.PI), breath: Math.sin(t * 1.5) * 0.006, rim: { ...RIM, dx: -6 } });
  });

  // ---------------------------------------------------------------- 4. The conversation
  // "Mira? ...Do you live around here?" he looks up from the book, surprised, then the smile comes
  shot(line('k1').s - 0.1, line('m1').s - 0.1, 'train', (ctx, t, u) => {
    platform(ctx, t, { x: 0.38, y: 0.42, z: 1.5 }, { variant: 'blur' });
    const up = tl(t, line('k1').s - 0.1, line('k1').s + 0.4, E.out);
    char(ctx, t, 'K4', 600, 930 - 30 * up, 2150 * (1 + u * 0.03), { id: 'k1', anchor: [0.53, 0.42], rot: 0.03 * (1 - up), talk: true, rim: { ...RIM, dx: -7 } });
    foreground(ctx, 'M12', -170, 2300, 2500, { blur: 20, bright: 0.45 });
  });
  // "No. Yes. Sort of. I brought you coffee." she holds the cups out, too fast, shifting her weight
  shot(line('m1').s - 0.1, line('k2').s - 0.1, 'train', (ctx, t, u) => {
    platform(ctx, t, { x: 0.6, y: 0.45, z: 1.45 }, { variant: 'blur' });
    const out = tl(t, word('m1', 'brought') - 0.1, word('m1', 'brought') + 0.4, E.out), shuffle = Math.sin(t * 9) * 8 * (1 - out);
    char(ctx, t, 'M12', 520 + shuffle, 2000 - 30 * out, 2050 * (1 + 0.04 * out), { rot: Math.sin(t * 7) * 0.012 * (1 - out), rim: { ...RIM, dx: 6 } });
    foreground(ctx, 'K4', 1260, 2350, 2600, { blur: 22, bright: 0.4 });
  });
  // "You don't even know how I take it." an amused tilt; he takes one
  shot(line('k2').s - 0.1, line('m2').s - 0.1, 'train', (ctx, t, u) => {
    platform(ctx, t, { x: 0.4, y: 0.42, z: 1.55 }, { variant: 'blur' });
    const tilt = tl(t, line('k2').s + 0.2, line('k2').s + 0.8);
    char(ctx, t, 'K4', 580 + 20 * tilt, 900, 2200 * (1 + u * 0.04), { id: 'k2', anchor: [0.53, 0.42], rot: 0.045 * tilt, talk: true, rim: { ...RIM, dx: -7 } });
  });
  // "That's why there's two." she lifts the cups a little, pleased with herself
  shot(line('m2').s - 0.1, C.trainIn, 'train', (ctx, t, u) => {
    platform(ctx, t, { x: 0.6, y: 0.45, z: 1.6 }, { variant: 'blur' });
    const lift = Math.sin(tl(t, word('m2', 'two') - 0.2, word('m2', 'two') + 0.5) * Math.PI), h = 2700;
    char(ctx, t, 'M12', 540, 2150 - 26 * lift, h, { rot: 0.02 * lift, rim: { ...RIM, dx: 6 } });
    const [sx, sy, s] = onCut('M12', 540, 2150 - 26 * lift, h, [0.5, 1], 0.5, 0.36); steam(ctx, t, sx, sy, s * 1.4, 0.35);
  });

  // ---------------------------------------------------------------- 5. "Then the 6:40 pulled in. Right on time."
  shot(C.trainIn, line('k3').s - 0.1, 'train', (ctx, t, u) => {
    // the headlights grow in the tunnel; the wind of the train lifts her hair; the camera can't keep still
    const [hx, hy, hr] = PP.handheld(t, 4 + 6 * u, 71);
    PP.with(ctx, () => { ctx.translate(hx, hy); ctx.rotate(hr); platform(ctx, t, lerpCam(u, { x: 0.62, y: 0.45, z: 1.25 }, { x: 0.66, y: 0.45, z: 1.35 }), { tunnel: 0.3 + 1.5 * u }); });
    char(ctx, t, 'M12', 380, 2050, 1700, { sway: { amp: 6 + 14 * u, t, from: 0, to: 0.5, speed: 7 }, rim: { ...RIM, dx: 6 }, light: { x: 0.9, y: 0.4, r: 0.6, color: `rgba(255,240,210,${0.3 * u})` } });
    streaks(ctx, t, PP.clamp((u - 0.55) * 2) * 0.6);
  });
  // "That's me. Thanks for the coffee." he stands, picks up his bag, turns to the doors
  shot(line('k3').s - 0.1, line('n5').s - 0.1, 'train', (ctx, t, u) => {
    platform(ctx, t, { x: 0.4, y: 0.42, z: 1.5 }, { variant: 'blur', tunnel: 1.2 });
    const stand = tl(t, line('k3').s - 0.1, line('k3').s + 0.5, E.out), turn = tl(t, word('k3', 'thanks') - 0.1, word('k3', 'thanks') + 0.6);
    char(ctx, t, 'K4', 600 + 40 * turn, 990 - 90 * stand, 2150, { id: 'k3', anchor: [0.53, 0.42], rot: -0.04 * turn, talk: true, rim: { ...RIM, dx: -7 } });
  });

  // ---------------------------------------------------------------- 6. "I didn't have a plan. So I tripped."
  const tripCut = word('n5', 'so') - 0.08, soakedCut = C.tripped + 0.9;
  shot(line('n5').s - 0.1, tripCut, 'train', (ctx, t, u) => {
    // panic: the cups trembling in her hands, the camera pushing in on her face
    platform(ctx, t, { x: 0.6, y: 0.45, z: 1.7 }, { variant: 'blur' });
    char(ctx, t, 'M12', 540 + Math.sin(t * 23) * 4, 2350, 3100 * (1 + u * 0.08), { blink: false, rim: { ...RIM, dx: 6 } });
  });
  shot(tripCut, soakedCut, 'train', (ctx, t, u) => {
    // her foot catches; time slows as both cups go over; the coffee lands across his shirt
    const slow = t < C.tripped + 0.05 ? 1 : 0.4, [sx, sy, sr] = PP.shake(t, C.tripped + 0.15, 16, 0.45);
    PP.with(ctx, () => {
      ctx.translate(sx, sy); ctx.rotate(sr);
      platform(ctx, t, { x: 0.45, y: 0.45, z: 1.3 }, { variant: 'soft' });
      const fall = tl(t, tripCut, C.tripped, E.in);
      char(ctx, t, t < C.tripped ? 'M12' : 'M3', 470 + 60 * fall, 2000 + 30 * fall, 1850, { id: 'sp', rot: 0.08 * fall, rim: { ...RIM, dx: 6 } });
      if (t < C.tripped + 0.4) { const v = tl(t, C.tripped - 0.25, C.tripped + 0.4, (x) => x); cup(ctx, 640 + 300 * v, 1100 - 280 * v + 400 * v * v, 1.6, v * 3 * slow); cup(ctx, 520 + 380 * v, 1150 - 200 * v + 380 * v * v, 1.5, -v * 2.4 * slow); }
      drops(ctx, t, C.tripped, 760, 1080, slow);
    });
    PP.flash(ctx, t, C.tripped + 0.15, 0.2, '255,245,230', 0.3);
  });
  // "Okay. That's twice now." dripping, stunned; then he starts to laugh. "Are you doing this on purpose?"
  const purposeCut = word('k4', 'are') - 0.08;
  shot(soakedCut, purposeCut, 'train', (ctx, t, u) => {
    platform(ctx, t, { x: 0.55, y: 0.42, z: 1.5 }, { variant: 'blur' });
    const laugh = tl(t, word('k4', "that's") - 0.1, word('k4', "that's") + 0.6), bob = Math.abs(Math.sin(t * 13)) * -10 * laugh;
    char(ctx, t, 'K7', 560, 880 + bob, 2500 * (1 + u * 0.05), { id: 'k4', anchor: [0.52, 0.38], rot: Math.sin(t * 2.6) * 0.03 * (1 - laugh), talk: true, rim: { ...RIM, dx: -7 } });
    // coffee dripping off his chin and shirt
    for (let k = 0; k < 6; k++) { const ph = ((t * 0.9 + PP.rand('drip', k)) % 1), x = 420 + PP.rand('dx', k) * 300, y = 1400 + ph * 520; PP.with(ctx, () => { ctx.globalAlpha = 1 - ph; ctx.fillStyle = '#6b3f22'; ctx.beginPath(); ctx.ellipse(x, y, 7, 11, 0, 0, 7); ctx.fill(); }); }
  });
  shot(purposeCut, C.doors, 'train', (ctx, t, u) => {
    // her, both hands over her mouth, mortified, trying not to laugh too
    platform(ctx, t, { x: 0.6, y: 0.45, z: 1.6 }, { variant: 'blur' });
    char(ctx, t, 'M10', 540, 860 + Math.abs(Math.sin(t * 11)) * -6, 3200 * (1 + u * 0.05), { anchor: [0.58, 0.36], rim: { ...RIM, dx: 7 } });
  });

  // ---------------------------------------------------------------- 7. "The doors closed. The train left without him."
  shot(C.doors, C.trainOut, 'train', (ctx, t, u) => {
    // the doors slide shut behind him; he's still dripping, she still has hold of his sleeve
    platform(ctx, t, lerpCam(u, { x: 0.35, y: 0.5, z: 1.25 }, { x: 0.33, y: 0.5, z: 1.3 }));
    const shut = tl(t, C.doors + 0.1, C.doors + 0.55, E.in);
    PP.with(ctx, () => { ctx.fillStyle = 'rgba(40,52,62,0.85)'; ctx.strokeStyle = '#1d1a1d'; ctx.lineWidth = 6; for (const s of [-1, 1]) { const x = 540 + s * (540 - 440 * shut); ctx.fillRect(s < 0 ? 0 : x, 250, s < 0 ? x : W - x, 1250); ctx.strokeRect(s < 0 ? 0 : x, 250, s < 0 ? x : W - x, 1250); } });
    char(ctx, t, 'K7', 640, 2050, 1750, { id: 'dr', rim: { ...RIM, dx: -5 } });
    char(ctx, t, 'M8', 300, 2060, 1650, { rim: { ...RIM, dx: 5 } });
  });
  shot(C.trainOut, C.cafe, 'dark', (ctx, t, u) => {
    // the train goes, its light sweeping over their hands: her fist still holding on
    platform(ctx, t, { x: 0.5, y: 0.5, z: 1.8 }, { variant: 'blur' });
    const squeeze = 1 + 0.02 * Math.sin(tl(t, C.trainOut + 0.3, C.trainOut + 0.9) * Math.PI);
    char(ctx, t, 'H1', 540, 980, 2700 * squeeze * (1 + u * 0.06), { anchor: [0.6, 0.57], breath: 0, blink: false, light: { x: 0.3, y: 0.3, r: 0.8, color: 'rgba(255,210,160,0.3)' }, rim: { color: 'rgba(255,215,170,0.95)', dx: -6, a: 0.7 } });
    streaks(ctx, t, PP.clamp((t - C.trainOut) / 0.3) * (1 - PP.clamp((t - C.trainOut - 1.4) / 0.6)));
  });

  // ---------------------------------------------------------------- 8. "An hour later, every phone in the café buzzed at once."
  // the hour passes in the café: the wall clock spins, his shirt dries under a pile of napkins, they talk, she laughs
  shot(C.cafe, C.news, 'morning', (ctx, t, u) => {
    const k = PP.clamp((t - C.cafe) / (C.buzzAll - C.cafe - 0.3)), bg = cafe(ctx, t, lerpCam(u, { x: 0.6, y: 0.52, z: 1.15 }, { x: 0.6, y: 0.53, z: 1.22 }), 'soft', 0.12);
    const [cx, cy] = bg.map(0.8, 0.142), hrs = 6.75 + k * 1.0;
    K.clockHands(ctx, cx, cy, 0.085 * 1024 * bg.s * 0.82, Math.floor(hrs), (hrs % 1) * 60);
    const hop = Math.floor(k * 5), lean = [0, 18, 8, 26, 14][Math.min(4, hop)];
    char(ctx, t, 'M1', 270 + lean, 2240, 1750, { rot: -0.01 * lean / 10, rim: { ...WARM_RIM, dx: -6 } });
    char(ctx, t, 'K7', 850 - lean, 2240, 1750, { id: 'cf', rot: 0.01 * lean / 10, rim: { ...WARM_RIM, dx: 6 } });
    // then every phone in the room lights up at once
    for (let j = 0; j < 9; j++) {
      const on = PP.clamp((t - C.buzzAll - j * 0.04) / 0.12);
      if (on <= 0) continue;
      const x = 60 + PP.rand('px', j) * 960, y = 900 + PP.rand('py', j) * 500, s = 0.5 + PP.rand('ps', j) * 0.5;
      PP.glowAt(ctx, x, y, 90 * s, '170,210,255', 0.7 * on);
      PP.with(ctx, () => { ctx.globalAlpha = on; ctx.fillStyle = '#dcebff'; PP.roundRect(ctx, x - 12 * s, y - 22 * s, 24 * s, 44 * s, 5 * s); ctx.fill(); });
    }
  }, 'dissolve');

  // ---------------------------------------------------------------- 9. "The 6:40 never made it to the next station."
  const neverCut = word('n8', 'never') - 0.1;
  shot(C.news, neverCut, 'danger', (ctx, t, u) => {
    phoneShot(ctx, t, 'B5', [], { u, seed: 71, banner: C.news + 0.05, bannerHold: 6, ...NEWS, header: 'News', push: 0.1 });
  });
  shot(neverCut, line('k5').s - 0.1, 'danger', (ctx, t, u) => {
    PP.drawBgDepth(ctx, 'B3', { ...lerpCam(u, { x: 0.5, y: 0.42, z: 1.15 }, { x: 0.5, y: 0.42, z: 1.35 }), z0: 1 }, { horizon: 0.375, k: 1.5 });
    const pulse = 0.5 + 0.5 * Math.sin(t * 7);
    PP.with(ctx, () => { ctx.fillStyle = 'rgba(0,4,8,0.55)'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,40,30,${0.18 + 0.15 * pulse})`; ctx.fillRect(0, 0, W, H); });
  });

  // ---------------------------------------------------------------- 10. "You knew. Didn't you?" / "I couldn't tell him. Not yet."
  shot(line('k5').s - 0.1, line('n9').s - 0.1, 'cold', (ctx, t, u) => {
    cafe(ctx, t, { x: 0.4, y: 0.45, z: 1.6 }, 'blur', 0.3);
    // his eyes come up from the phone to her, slowly
    const up = tl(t, line('k5').s - 0.1, line('k5').s + 0.8, E.out);
    char(ctx, t, 'K3', 600, 940 - 40 * up, 2150 * (1 + u * 0.07), { id: 'k5', anchor: [0.52, 0.42], rot: 0.03 * (1 - up), talk: true, blink: false, rim: { ...RIM, dx: -7 } });
    foreground(ctx, 'M1', -200, 2300, 2500, { blur: 20, bright: 0.45 });
  });
  shot(line('n9').s - 0.1, C.night, 'cold', (ctx, t, u) => {
    // she looks away, down at her cup
    cafe(ctx, t, { x: 0.65, y: 0.45, z: 1.6 }, 'blur', 0.3);
    const away = tl(t, line('n9').s, line('n9').s + 1.0);
    char(ctx, t, 'M6', 500 - 40 * away, 870 + 30 * away, 2300 * (1 + u * 0.05), { anchor: [0.55, 0.35], rot: -0.05 * away, rim: { ...RIM, dx: 7 } });
    foreground(ctx, 'K3', 1250, 2350, 2600, { blur: 22, bright: 0.4 });
  });

  // ---------------------------------------------------------------- 11. That night: his apartment, his phone
  const clockCut = C.clock1111 - 0.12;
  shot(C.night, clockCut, 'night', (ctx, t, u) => {
    // the day dissolves into his flat at night, rain on the glass, the clock on the shelf running up to 11:10
    const bg = PP.drawBg(ctx, 'B9', lerpCam(u, { x: 0.5, y: 0.5, z: 1.1 }, { x: 0.45, y: 0.5, z: 1.22 }));
    PP.with(ctx, () => { ctx.fillStyle = 'rgba(8,12,34,0.45)'; ctx.fillRect(0, 0, W, H); });
    const [lx, ly] = bg.map(0.757, 0.27); PP.glowAt(ctx, lx, ly, 420, '255,196,120', 0.5);
    PP.rain(ctx, t, [0, 0, W, 900], { n: 50 });
    const m = Math.min(10, Math.floor(PP.lerp(4, 10.99, PP.clamp((t - C.night) / (clockCut - C.night - 0.1)))));
    digital(ctx, 300, 1180, 52, `11:${String(m).padStart(2, '0')}`);
    char(ctx, t, 'K8', 700, 2080, 1500, { breath: Math.sin(t * 1.4) * 0.006, light: { x: 0.35, y: 0.55, r: 0.6, color: 'rgba(170,215,255,0.25)' }, rim: { color: 'rgba(150,200,255,0.9)', dx: 6, a: 0.6 } });
  }, 'dissolve');
  shot(clockCut, C.hisPhone, 'night', (ctx, t, u) => {
    PP.drawBg(ctx, 'B9', { x: 0.3, y: 0.6, z: 3.2 + u * 0.3 }, { variant: 'blur' });
    PP.with(ctx, () => { ctx.fillStyle = 'rgba(8,12,34,0.55)'; ctx.fillRect(0, 0, W, H); });
    const pulse = t > C.clock1111 ? Math.max(0, 1 - (t - C.clock1111) / 1.4) : 0;
    PP.glowAt(ctx, 540, 900, 200 + pulse * 260, '120,200,255', 0.35 + pulse * 0.45);
    digital(ctx, 540, 900, 230, t < C.clock1111 ? '11:10' : '11:11');
  });
  shot(C.hisPhone, C.hisPhone + 1.15, 'phone', (ctx, t, u) => {
    // his phone lights up on the table; he picks it up; it's her voice
    PP.drawBg(ctx, 'B5', { x: 0.5, y: 0.5, z: 1.4 }, { variant: 'dark' });
    const pick = tl(t, C.hisPhone + 0.3, C.hisPhone + 1.0, E.out);
    char(ctx, t, 'K8', 540, 2050 - 60 * pick, 1900 * (1 + u * 0.05), { light: { x: 0.35, y: 0.55, r: 0.6, color: `rgba(170,215,255,${0.2 + 0.3 * pick})` }, rim: { color: 'rgba(150,200,255,0.9)', dx: 6, a: 0.6 } });
  });
  // his screen: a voice note from an unknown number, at 11:11, and the voice is hers
  const herNote = (() => { const text = "Kabir, it's me. Mira. You don't know me yet..."; return { s: C.hisPhone + 1.2, e: C.hisPhone + 4, text, words: text.split(' ').map((w, i) => ({ s: C.hisPhone + 1.2 + i * 0.28 })), time: '11:11 PM' }; })();
  shot(C.hisPhone + 1.15, line('k6').s - 0.1, 'phone', (ctx, t, u) => {
    phoneShot(ctx, t, 'B9', [herNote], { u, seed: 89, push: 0.1, clock: '11:11' });
  });
  shot(line('k6').s - 0.1, C.makeIt, 'phone', (ctx, t, u) => {
    PP.drawBg(ctx, 'B5', { x: 0.5, y: 0.5, z: 1.5 }, { variant: 'dark' });
    const [hx, hy] = PP.handheld(t, 3, 83);
    char(ctx, t, 'K8', 560 + hx, 880 + hy, 2600 * (1 + u * 0.08), { id: 'k6', anchor: [0.52, 0.45], talk: true, blink: false, light: { x: 0.35, y: 0.55, r: 0.6, color: 'rgba(170,215,255,0.5)' }, rim: { color: 'rgba(150,200,255,0.9)', dx: 6, a: 0.6 } });
  });
  shot(C.makeIt, C.endCard, null, (ctx) => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); });

  // ---------------------------------------------------------------- 12. End card
  shot(C.endCard, C.total, null, (ctx, t) => {
    ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, W, H);
    const t0 = C.endCard, a = PP.clamp((t - t0 - 0.1) / 0.6);
    PP.spaced(ctx, '11:11', 540, 860, { font: '200 200px Inter', spacing: 14, glow: 'rgba(130,200,255,0.7)', blur: 36, alpha: a });
    PP.spaced(ctx, 'FOUR DAYS LEFT', 540, 1040, { font: '500 32px Inter', spacing: 12, color: 'rgba(255,120,110,0.95)', alpha: PP.clamp((t - t0 - 0.5) / 0.5) });
    PP.spaced(ctx, 'TO BE CONTINUED', 540, 1110, { font: '300 30px Inter', spacing: 10, color: 'rgba(225,232,255,0.8)', alpha: PP.clamp((t - t0 - 0.8) / 0.5) });
  });

  PP.SHOTS = K.S;
})(typeof window !== 'undefined' ? window : globalThis);
