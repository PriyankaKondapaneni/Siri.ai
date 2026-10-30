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

  // ---------------------------------------------------------------- shared pieces for this episode
  const kf = PP.kf, OB = E.outBack, EL = E.outElastic;
  // the departure board: amber LEDs, the time flipping over (the digits squash shut and open on the new minute)
  function board(ctx, t, u, time, o = {}) {
    platform(ctx, t, { x: 0.5, y: 0.3, z: 1.6 + u * 0.12 }, { variant: 'blur' });
    PP.with(ctx, () => { ctx.fillStyle = 'rgba(4,6,10,0.55)'; ctx.fillRect(0, 0, W, H); });
    const bx = 90, by = 640, bw = 900, bh = 560, amber = o.red ? '255,90,74' : '255,180,60';
    const flip = o.flipAt != null ? PP.clamp((t - o.flipAt) / 0.2) : 1, shown = flip < 0.5 ? o.prev ?? time : time, sy = Math.max(0.04, Math.abs(1 - 2 * flip));
    PP.with(ctx, () => {
      ctx.translate(540, 920); ctx.scale(1 + u * 0.05, 1 + u * 0.05); ctx.translate(-540, -920);
      ctx.fillStyle = '#0b0d12'; ctx.strokeStyle = '#1d1a1d'; ctx.lineWidth = 10; PP.roundRect(ctx, bx, by, bw, bh, 26); ctx.fill(); ctx.stroke();
      ctx.font = '600 40px Inter'; ctx.fillStyle = `rgba(${amber},0.9)`; ctx.textBaseline = 'middle';
      ctx.textAlign = 'left'; ctx.fillText('PLATFORM 4', bx + 50, by + 70);
      const blink = o.status === 'BOARDING' ? (Math.floor(t * 4) % 2 ? 1 : 0.25) : 1;
      ctx.textAlign = 'right'; ctx.globalAlpha = blink; ctx.fillText(o.status || 'ON TIME', bx + bw - 50, by + 70); ctx.globalAlpha = 1;
      ctx.save(); ctx.translate(540, by + 290); ctx.scale(1, sy); ctx.font = '300 230px Inter'; ctx.textAlign = 'center'; ctx.shadowColor = `rgba(${amber},0.9)`; ctx.shadowBlur = 40; ctx.fillStyle = `rgb(${amber})`; ctx.fillText(shown, 0, 0); ctx.restore();
      ctx.font = '500 38px Inter'; ctx.textAlign = 'left'; ctx.fillStyle = `rgba(${amber},0.85)`; ctx.fillText('NEXT   6:40   LINE 4   CITY CENTRE', bx + 50, by + bh - 60);
    });
  }
  // the train doors: two panels sliding from the edges of the frame (open = 0 shut, 1 open)
  function doors(ctx, open, a = 0.85) {
    PP.with(ctx, () => {
      ctx.fillStyle = `rgba(40,52,62,${a})`; ctx.strokeStyle = '#1d1a1d'; ctx.lineWidth = 6;
      const half = 540 * (1 - open);
      ctx.fillRect(0, 250, half, 1250); ctx.strokeRect(0, 250, half, 1250);
      ctx.fillRect(W - half, 250, half, 1250); ctx.strokeRect(W - half, 250, half, 1250);
      ctx.fillStyle = 'rgba(200,225,255,0.35)'; ctx.fillRect(half - 200, 420, 140, 420); ctx.fillRect(W - half + 60, 420, 140, 420);
    });
  }
  // the train's light raking across a face: a bright band moving through the frame
  function sweep(ctx, k, a = 0.5) {
    PP.with(ctx, () => {
      ctx.globalCompositeOperation = 'screen';
      const x = PP.lerp(-500, 1580, k), gr = ctx.createLinearGradient(x - 260, 0, x + 260, 0);
      gr.addColorStop(0, 'rgba(255,240,210,0)'); gr.addColorStop(0.5, `rgba(255,240,210,${a})`); gr.addColorStop(1, 'rgba(255,240,210,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    });
  }
  // commuters crossing close to the lens, out of focus, for depth
  function passers(ctx, t, seed, n = 2) {
    for (let i = 0; i < n; i++) {
      const sp = 700 + PP.rand('pv', seed, i) * 500, ph = PP.rand('pp', seed, i) * 3, x = ((t + ph) * sp) % 2600 - 700;
      foreground(ctx, i % 2 ? 'S1' : 'K2', x, 2450, 2300, { blur: 22, bright: 0.38, flip: i % 2 === 0 });
    }
  }

  // ---------------------------------------------------------------- 0. Cold open: her plea, the light, his face, her hand, the alert
  const hk = [0, 0.72, 1.44, 2.16, 2.9, C.hookEnd];
  shot(hk[0], hk[1], 'train', (ctx, t, u) => {
    // extreme close on her eyes; the train's headlights rake across her face
    const [hx, hy, hr] = PP.handheld(t, 6, 91);
    PP.with(ctx, () => { ctx.translate(hx, hy); ctx.rotate(hr);
      platform(ctx, t, { x: 0.5, y: 0.45, z: 1.7 }, { variant: 'blur' });
      char(ctx, t, 'M6', 540, 780, 5200 * (1 + u * 0.05), { id: 'hk', blink: false, anchor: [0.55, 0.35], sway: { amp: 14, t, from: 0, to: 0.45, speed: 8 }, rim: { ...RIM, dx: 8 } });
    });
    sweep(ctx, u, 0.55);
  });
  shot(hk[1], hk[2], 'train', (ctx, t, u) => {
    // the tunnel: headlights growing, the camera rushing toward them
    const [sx, sy, sr] = PP.shake(t, hk[1], 14, 0.7);
    PP.with(ctx, () => { ctx.translate(sx, sy); ctx.rotate(sr); platform(ctx, t, lerpCam(u, { x: 0.78, y: 0.42, z: 1.8 }, { x: 0.86, y: 0.42, z: 2.6 }, E.in), { tunnel: 1 + 2 * u }); });
    streaks(ctx, t, u);
  });
  shot(hk[2], hk[3], 'train', (ctx, t, u) => {
    // he turns toward her voice, overshooting and settling
    platform(ctx, t, { x: 0.4, y: 0.42, z: 1.6 }, { variant: 'blur', tunnel: 2 });
    const turn = OB(PP.clamp(u * 1.6));
    char(ctx, t, 'K4', PP.lerp(700, 560, turn), 900, 3300 * (1 + u * 0.06), { id: 'hk', blink: false, anchor: [0.53, 0.42], rot: PP.lerp(-0.1, 0, turn), light: { x: 0.95, y: 0.4, r: 0.8, color: 'rgba(255,240,210,0.35)' }, rim: { ...RIM, dx: -8 } });
    sweep(ctx, 0.3 + u * 0.7, 0.35);
  });
  shot(hk[3], hk[4], 'train', (ctx, t, u) => {
    // her hand catches his
    platform(ctx, t, { x: 0.5, y: 0.5, z: 1.9 }, { variant: 'blur' });
    const grab = OB(PP.clamp(u * 2.2));
    char(ctx, t, 'H1', PP.lerp(-200, 540, grab), 980, 3000 * (1 + u * 0.05), { anchor: [0.6, 0.57], breath: 0, blink: false, rim: { color: 'rgba(255,215,170,0.95)', dx: -6, a: 0.7 } });
    streaks(ctx, t, 0.5);
  });
  shot(hk[4], hk[5], 'danger', (ctx, t, u) => {
    const [sx, sy] = PP.shake(t, hk[4], 10, 0.4);
    PP.with(ctx, () => { ctx.translate(sx, sy); phoneShot(ctx, t, 'B5', [], { u, seed: 63, banner: hk[4] - 0.3, bannerHold: 2, ...NEWS, focus: 1.6, focusY: -460, header: 'News' }); });
  });

  // ---------------------------------------------------------------- 1. Platform four, 6:31: nine minutes
  shot(C.hookEnd, C.run, 'train', (ctx, t, u) => {
    board(ctx, t, u, '6:31', { prev: '6:30', flipAt: C.hookEnd + 0.12 });
    PP.flash(ctx, t, C.hookEnd, 0.3);
    PP.spaced(ctx, '5 DAYS LEFT', 540, 300, { font: '500 40px Inter', spacing: 14, color: 'rgba(255,120,110,0.95)', glow: 'rgba(255,60,50,0.6)', blur: 20, alpha: PP.clamp((t - C.hookEnd) / 0.3) });
  });
  shot(C.run, C.irony, 'train', (ctx, t, u) => {
    // tracking with her as she hurries down the platform, commuters cutting across the lens
    platform(ctx, t, lerpCam(u, { x: 0.3, y: 0.46, z: 1.25 }, { x: 0.62, y: 0.46, z: 1.25 }, (x) => x));
    const step = Math.abs(Math.sin(t * 8.5));
    char(ctx, t, 'M8', PP.lerp(260, 640, u), 2040 - 18 * step, 1500, { rot: Math.sin(t * 8.5) * 0.018, breath: 0, sway: { amp: 9, t, from: 0, to: 0.5, speed: 6 }, rim: { ...RIM, dx: 5 } });
    passers(ctx, t, 1, 1);
  });
  shot(C.irony, line('k1').s - 0.1, 'train', (ctx, t, u) => {
    // and there he is: calm, reading, no idea
    platform(ctx, t, lerpCam(u, { x: 0.58, y: 0.48, z: 1.3 }, { x: 0.56, y: 0.48, z: 1.48 }), { variant: 'soft' });
    const page = tl(t, C.irony + 0.7, C.irony + 1.0);
    char(ctx, t, 'K12', 560, 2000, 1900, { id: 'rd', rot: 0.014 * Math.sin(page * Math.PI), breath: Math.sin(t * 1.5) * 0.006, rim: { ...RIM, dx: -6 } });
    PP.dust(ctx, t, [0, 300, W, 1200], 30, '220,235,255');
  });
  // "You again." he looks up: a small dip, then the lift, settling
  shot(line('k1').s - 0.1, line('m1').s - 0.1, 'train', (ctx, t, u) => {
    platform(ctx, t, { x: 0.38, y: 0.42, z: 1.5 }, { variant: 'blur' });
    const y = kf(t, [[line('k1').s - 0.1, 950], [line('k1').s + 0.05, 962, E.out], [line('k1').s + 0.45, 905, OB]]);
    char(ctx, t, 'K4', 600, y, 2150 * (1 + u * 0.04), { id: 'k1', anchor: [0.53, 0.42], talk: true, rim: { ...RIM, dx: -7 } });
    foreground(ctx, 'M8', -180 + Math.sin(t * 1.2) * 12, 2300, 2500, { blur: 20, bright: 0.45 });
  });
  // "I... take this train too. Sometimes." she grips her bag strap, eyes everywhere but him
  shot(line('m1').s - 0.1, line('k2').s - 0.1, 'train', (ctx, t, u) => {
    platform(ctx, t, { x: 0.62, y: 0.45, z: 1.5 }, { variant: 'blur' });
    const away = kf(t, [[line('m1').s, 0], [line('m1').s + 0.4, 1, OB], [word('m1', 'sometimes') - 0.1, 1], [word('m1', 'sometimes') + 0.3, 0.3, E.out]]);
    const grip = Math.abs(Math.sin(t * 5)) * 8 * (1 - away * 0.5);
    char(ctx, t, 'M8', 520 + 30 * away, 2040 - grip, 2250 * (1 + u * 0.04), { rot: 0.05 * away, sway: { amp: 4, t, from: 0, to: 0.45 }, rim: { ...RIM, dx: 6 } });
    foreground(ctx, 'K4', 1260, 2350, 2600, { blur: 22, bright: 0.4 });
  });
  // "Sometimes." one eyebrow; a tilt; then back down to his book
  shot(line('k2').s - 0.1, line('n2').s - 0.1, 'train', (ctx, t, u) => {
    platform(ctx, t, { x: 0.4, y: 0.42, z: 1.55 }, { variant: 'blur' });
    const tilt = OB(tl(t, line('k2').s - 0.05, line('k2').s + 0.4, (x) => x)), down = tl(t, line('k2').e, line('k2').e + 0.5);
    char(ctx, t, 'K4', 580 + 16 * tilt, 900 + 34 * down, 2200 * (1 + u * 0.04), { id: 'k2', anchor: [0.53, 0.42], rot: 0.05 * tilt * (1 - down * 0.6), talk: true, rim: { ...RIM, dx: -7 } });
  });
  // "I'd never taken this train in my life." the two of them on the bench; she steals a glance, then looks away fast
  shot(line('n2').s - 0.1, C.board38, 'train', (ctx, t, u) => {
    platform(ctx, t, lerpCam(u, { x: 0.52, y: 0.48, z: 1.18 }, { x: 0.5, y: 0.48, z: 1.24 }, (x) => x), { variant: 'soft' });
    char(ctx, t, 'K12', 740, 2030, 1500, { id: 'b2', breath: Math.sin(t * 1.5) * 0.006, rim: { ...RIM, dx: -6 } });
    const glance = kf(t, [[word('n2', 'never') - 0.2, 0], [word('n2', 'never') + 0.1, 1, OB], [word('n2', 'life') - 0.1, 1], [word('n2', 'life') + 0.15, 0, E.out]]);
    char(ctx, t, 'M8', 300, 2050, 1450, { rot: 0.06 * glance, breath: Math.sin(t * 2) * 0.007, rim: { ...RIM, dx: 5 } });
  });

  // ---------------------------------------------------------------- 2. 6:38. "Well. That's mine."
  shot(C.board38, line('k3').s - 0.1, 'train', (ctx, t, u) => {
    board(ctx, t, u, t < C.board38 + 0.5 ? '6:38' : '6:39', { prev: t < C.board38 + 0.5 ? '6:37' : '6:38', flipAt: t < C.board38 + 0.5 ? C.board38 + 0.05 : C.board38 + 0.5, status: 'ARRIVING' });
  });
  shot(line('k3').s - 0.1, C.tenSec, 'train', (ctx, t, u) => {
    // he stands: a dip, the rise, a turn toward the train as its light finds him
    platform(ctx, t, { x: 0.4, y: 0.42, z: 1.5 }, { variant: 'blur', tunnel: 0.6 + 1.6 * u });
    const s0 = line('k3').s - 0.1, y = kf(t, [[s0, 1010], [s0 + 0.18, 1030, E.out], [s0 + 0.65, 900, OB]]);
    const turn = tl(t, word('k3', "that's") - 0.15, word('k3', "that's") + 0.45);
    char(ctx, t, 'K4', 600 + 50 * turn, y, 2150, { id: 'k3', anchor: [0.53, 0.42], rot: -0.05 * turn, talk: true, sway: { amp: 3 + 6 * u, t, from: 0, to: 0.3 }, light: { x: 0.95, y: 0.4, r: 0.8, color: `rgba(255,240,210,${0.4 * u})` }, rim: { ...RIM, dx: -7 } });
  });

  // ---------------------------------------------------------------- 3. "Ten seconds. No plan. No way to explain."
  const planCut = word('n3', 'no') - 0.08, wayCut = word('n3', 'no', 1) - 0.08;
  shot(C.tenSec, planCut, 'danger', (ctx, t, u) => {
    board(ctx, t, u, '6:40', { prev: '6:39', flipAt: C.tenSec + 0.02, status: 'BOARDING', red: true });
  });
  shot(planCut, wayCut, 'train', (ctx, t, u) => {
    // the train arrives: the wind tears at her hair, the doors open behind him
    const [hx, hy, hr] = PP.handheld(t, 10, 95);
    PP.with(ctx, () => { ctx.translate(hx, hy); ctx.rotate(hr);
      platform(ctx, t, { x: 0.6, y: 0.45, z: 1.5 }, { variant: 'blur', tunnel: 2 });
      streaks(ctx, t, 0.6 * (1 - u));
      char(ctx, t, 'M8', 520, 2080, 2500, { blink: false, sway: { amp: 22, t, from: 0, to: 0.55, speed: 9 }, rim: { ...RIM, dx: 6 }, light: { x: 0.9, y: 0.4, r: 0.6, color: 'rgba(255,240,210,0.3)' } });
    });
  });
  shot(wayCut, C.grab, 'train', (ctx, t, u) => {
    // he walks away from her toward the open doors
    platform(ctx, t, { x: 0.45, y: 0.45, z: 1.3 }, { variant: 'soft' });
    doors(ctx, E.out(PP.clamp(u * 2)), 0.7);
    const walk = E.inOut(u), step = Math.abs(Math.sin(t * 7));
    char(ctx, t, 'K4', 560 + 60 * walk, 1200 - 14 * step, 1700 * (1 - 0.18 * walk), { anchor: [0.53, 0.42], rot: -0.06, rim: { ...RIM, dx: -6 }, light: { x: 0.5, y: 0.2, r: 0.9, color: 'rgba(200,225,255,0.3)' } });
  });

  // ---------------------------------------------------------------- 4. "Kabir. Please. Just this once... miss your train."
  shot(C.grab, C.please, 'train', (ctx, t, u) => {
    // her hand shoots out and catches his
    platform(ctx, t, { x: 0.5, y: 0.5, z: 1.9 }, { variant: 'blur' });
    const grab = OB(PP.clamp(u * 2));
    char(ctx, t, 'H1', PP.lerp(-260, 540, grab), 980, 2800, { anchor: [0.6, 0.57], breath: 0, blink: false, rot: 0.04 * (1 - grab), rim: { color: 'rgba(255,215,170,0.95)', dx: -6, a: 0.7 } });
    PP.flash(ctx, t, C.grab + 0.1, 0.15, '255,245,230', 0.25);
  });
  const missCut = word('m3', 'miss') - 0.08;
  shot(C.please, missCut, 'night', (ctx, t, u) => {
    // everything goes quiet; her face, very close, pleading
    platform(ctx, t, { x: 0.5, y: 0.45, z: 1.8 }, { variant: 'blur' });
    PP.with(ctx, () => { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, W, H); });
    char(ctx, t, 'M6', 540 + Math.sin(t * 19) * 2, 860, 3900 * (1 + u * 0.1), { id: 'pl', blink: false, anchor: [0.55, 0.35], breath: Math.sin(t * 3.5) * 0.01, sway: { amp: 5, t, from: 0, to: 0.45, speed: 3 }, rim: { ...RIM, dx: 8 } });
  });
  shot(missCut, line('k4').s - 0.1, 'night', (ctx, t, u) => {
    // he turns back to her and stops; the door chime; he's deciding
    platform(ctx, t, { x: 0.4, y: 0.42, z: 1.8 }, { variant: 'blur', tunnel: 1 });
    PP.with(ctx, () => { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, W, H); });
    const turn = OB(tl(t, missCut, missCut + 0.55, (x) => x));
    char(ctx, t, 'K4', PP.lerp(660, 560, turn), 880, 3300 * (1 + u * 0.08), { id: 'dc', blink: t > missCut + 0.9, anchor: [0.53, 0.42], rot: PP.lerp(-0.09, 0, turn), breath: Math.sin(t * 2.2) * 0.008, rim: { ...RIM, dx: -8 } });
  });
  // "...Okay." then "But you owe me a coffee." the doors close behind him, slow motion, the train leaving
  const butCut = C.doors;
  shot(line('k4').s - 0.1, butCut, 'train', (ctx, t, u) => {
    platform(ctx, t, { x: 0.4, y: 0.42, z: 1.8 }, { variant: 'blur', tunnel: 1 });
    char(ctx, t, 'K4', 560, 880 - 10 * E.out(u), 3300 * (1 + u * 0.03), { id: 'k4', anchor: [0.53, 0.42], talk: true, rim: { ...RIM, dx: -8 } });
  });
  shot(butCut, C.deal, 'train', (ctx, t, u) => {
    platform(ctx, t, lerpCam(u, { x: 0.5, y: 0.47, z: 1.25 }, { x: 0.5, y: 0.47, z: 1.32 }, (x) => x));
    doors(ctx, 1 - E.inOut(PP.clamp(u * 1.6)), 0.8);
    streaks(ctx, t * 0.35, PP.clamp((u - 0.45) * 2) * 0.55);
    char(ctx, t, 'K4', 690, 1250, 1500, { id: 'k4b', anchor: [0.53, 0.42], talk: true, rot: -0.03, rim: { ...RIM, dx: -6 }, light: { x: 0.2, y: 0.4, r: 0.8, color: 'rgba(255,230,200,0.25)' } });
    char(ctx, t, 'M8', 330, 2080, 1500, { rot: 0.03, sway: { amp: 6 * (1 - u), t, from: 0, to: 0.5, speed: 3 }, rim: { ...RIM, dx: 5 } });
    PP.dust(ctx, t * 0.4, [0, 200, W, 1500], 36, '255,240,215');
  });
  // "Deal." the laugh bubbles out of her; a blush
  shot(C.deal, C.stayed, 'train', (ctx, t, u) => {
    platform(ctx, t, { x: 0.6, y: 0.45, z: 1.6 }, { variant: 'blur' });
    const k = t - C.deal, bob = -Math.abs(Math.sin(k * 13)) * 12 * Math.exp(-k * 2.5), h = 2700;
    char(ctx, t, 'M8', 540, 2120 + bob, h, { rot: 0.03 * EL(PP.clamp(k / 0.9)), sway: { amp: 4, t, from: 0, to: 0.45 }, rim: { ...RIM, dx: 6 } });
    for (const [cu, cv] of [[0.42, 0.3], [0.6, 0.29]]) { const [bx, by] = onCut('M8', 540, 2120 + bob, h, [0.5, 1], cu, cv); PP.glowAt(ctx, bx, by, 70, '255,120,120', 0.28 * PP.clamp(k / 0.6)); }
  });
  // "He stayed. He didn't even ask why." their hands, the last light of the train sliding off them; then his face
  const askCut = word('n4', "didn't") - 0.1;
  shot(C.stayed, askCut, 'dark', (ctx, t, u) => {
    platform(ctx, t, { x: 0.5, y: 0.5, z: 1.8 }, { variant: 'blur' });
    char(ctx, t, 'H1', 540, 980, 2700 * (1 + u * 0.08), { anchor: [0.6, 0.57], breath: 0, blink: false, light: { x: 0.3, y: 0.3, r: 0.8, color: 'rgba(255,210,160,0.3)' }, rim: { color: 'rgba(255,215,170,0.95)', dx: -6, a: 0.7 } });
    sweep(ctx, 0.5 + u * 0.6, 0.3 * (1 - u));
  });
  shot(askCut, C.cafe, 'dark', (ctx, t, u) => {
    platform(ctx, t, { x: 0.4, y: 0.42, z: 1.6 }, { variant: 'blur' });
    char(ctx, t, 'K4', 570, 900 - 8 * E.out(u), 2400 * (1 + u * 0.06), { id: 'st', anchor: [0.53, 0.42], rot: 0.02 * E.out(u), rim: { ...RIM, dx: -7 }, light: { x: 0.1, y: 0.35, r: 0.7, color: 'rgba(255,210,170,0.25)' } });
    PP.dust(ctx, t, [0, 300, W, 1200], 26, '255,235,210');
  });

  // ---------------------------------------------------------------- 5. Forty minutes later: the café, warm and silly; then every phone at once
  shot(C.cafe, C.news, 'morning', (ctx, t, u) => {
    const bg = cafe(ctx, t, lerpCam(u, { x: 0.6, y: 0.52, z: 1.15 }, { x: 0.6, y: 0.53, z: 1.24 }), 'soft', 0.12);
    const k = PP.clamp((t - C.cafe) / (C.litAll - C.cafe - 0.3)), [cx, cy] = bg.map(0.8, 0.142), hrs = 6.75 + k * 0.67;
    K.clockHands(ctx, cx, cy, 0.085 * 1024 * bg.s * 0.82, Math.floor(hrs), (hrs % 1) * 60);
    const lit = PP.clamp((t - C.litAll) / 0.15), frozen = t > C.litAll + 0.1;
    // she slides his coffee across the table; he pretends to be offended, then laughs
    const slide = tl(t, C.cafe + 0.7, C.cafe + 1.5, OB);
    const laugh = frozen ? 0 : Math.abs(Math.sin(t * 12)) * -10 * tl(t, C.cafe + 1.6, C.cafe + 2.0);
    char(ctx, t, 'M1', 270, 2240, 1750, { rot: frozen ? 0 : 0.015 * Math.sin(t * 2), rim: { ...WARM_RIM, dx: -6 }, light: { x: 0.4, y: 0.75, r: 0.6, color: `rgba(170,210,255,${0.35 * lit})` } });
    char(ctx, t, 'K6', 850, 2240 + laugh, 1750, { id: 'cf', rot: frozen ? 0 : -0.02 * Math.sin(t * 2.5), rim: { ...WARM_RIM, dx: 6 }, light: { x: 0.5, y: 0.75, r: 0.6, color: `rgba(170,210,255,${0.35 * lit})` } });
    cup(ctx, PP.lerp(420, 700, slide), 1660, 0.9, 0.05 * Math.sin(slide * Math.PI));
    steam(ctx, t, PP.lerp(420, 700, slide), 1580, 0.8, 0.4);
    for (let j = 0; j < 9; j++) {
      const on = PP.clamp((t - C.litAll - j * 0.04) / 0.12);
      if (on <= 0) continue;
      const x = 60 + PP.rand('px', j) * 960, y = 900 + PP.rand('py', j) * 500, s = 0.5 + PP.rand('ps', j) * 0.5;
      PP.glowAt(ctx, x, y, 90 * s, '170,210,255', 0.7 * on);
      PP.with(ctx, () => { ctx.globalAlpha = on; ctx.fillStyle = '#dcebff'; PP.roundRect(ctx, x - 12 * s, y - 22 * s, 24 * s, 44 * s, 5 * s); ctx.fill(); });
    }
    if (lit > 0) PP.with(ctx, () => { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(150,170,210,${0.4 * lit})`; ctx.fillRect(0, 0, W, H); });
  }, 'dissolve');

  // ---------------------------------------------------------------- 6. "The 6:40 never made it to the next station."
  const neverCut = word('n6', 'never') - 0.1;
  shot(C.news, neverCut, 'danger', (ctx, t, u) => {
    phoneShot(ctx, t, 'B5', [], { u, seed: 71, banner: C.news + 0.05, bannerHold: 6, ...NEWS, header: 'News', push: 0.12 });
  });
  const nextCut = word('n6', 'next') - 0.1;
  // "...to the next station." he reads it again; his hands won't keep still
  shot(nextCut, line('k5').s - 0.1, 'cold', (ctx, t, u) => {
    cafe(ctx, t, { x: 0.5, y: 0.45, z: 1.6 }, 'blur', 0.35);
    const [hx, hy] = PP.handheld(t, 3, 99);
    char(ctx, t, 'K9', 540 + hx, 2060 + hy, 2000 * (1 + u * 0.06), { blink: false, breath: Math.sin(t * 3) * 0.008, light: { x: 0.5, y: 0.6, r: 0.6, color: 'rgba(255,90,80,0.3)' }, rim: { ...RIM, dx: -6 } });
  });
  shot(neverCut, nextCut, 'danger', (ctx, t, u) => {
    const [hx, hy, hr] = PP.handheld(t, 5, 97);
    PP.with(ctx, () => { ctx.translate(hx, hy); ctx.rotate(hr); PP.drawBgDepth(ctx, 'B3', { ...lerpCam(u, { x: 0.5, y: 0.42, z: 1.15 }, { x: 0.5, y: 0.42, z: 1.4 }), z0: 1 }, { horizon: 0.375, k: 1.5 }); });
    const pulse = 0.5 + 0.5 * Math.sin(t * 7);
    PP.with(ctx, () => { ctx.fillStyle = 'rgba(0,4,8,0.55)'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,40,30,${0.18 + 0.15 * pulse})`; ctx.fillRect(0, 0, W, H); });
  });

  // ---------------------------------------------------------------- 7. "You knew. Didn't you?" / "I couldn't tell him. Not yet."
  shot(line('k5').s - 0.1, line('n7').s - 0.1, 'cold', (ctx, t, u) => {
    cafe(ctx, t, { x: 0.4, y: 0.45, z: 1.6 }, 'blur', 0.3);
    const up = tl(t, line('k5').s - 0.1, line('k5').s + 0.8, E.out);
    char(ctx, t, 'K3', 600, 950 - 50 * up, 2150 * (1 + u * 0.08), { id: 'k5', anchor: [0.52, 0.42], rot: 0.035 * (1 - up), talk: true, blink: false, rim: { ...RIM, dx: -7 } });
    foreground(ctx, 'M1', -200, 2300, 2500, { blur: 20, bright: 0.45 });
  });
  shot(line('n7').s - 0.1, C.night, 'cold', (ctx, t, u) => {
    cafe(ctx, t, { x: 0.65, y: 0.45, z: 1.6 }, 'blur', 0.3);
    const away = tl(t, line('n7').s, line('n7').s + 0.9, OB);
    char(ctx, t, 'M6', 500 - 50 * away, 870 + 34 * away, 2300 * (1 + u * 0.05), { anchor: [0.55, 0.35], rot: -0.06 * away, breath: Math.sin(t * 2.4) * 0.008, rim: { ...RIM, dx: 7 } });
    foreground(ctx, 'K3', 1250, 2350, 2600, { blur: 22, bright: 0.4 });
  });

  // ---------------------------------------------------------------- 8. That night: his apartment, his phone
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

  // ---------------------------------------------------------------- 9. End card
  shot(C.endCard, C.total, null, (ctx, t) => {
    ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, W, H);
    const t0 = C.endCard, a = PP.clamp((t - t0 - 0.1) / 0.6);
    PP.spaced(ctx, '11:11', 540, 860, { font: '200 200px Inter', spacing: 14, glow: 'rgba(130,200,255,0.7)', blur: 36, alpha: a });
    PP.spaced(ctx, 'FOUR DAYS LEFT', 540, 1040, { font: '500 32px Inter', spacing: 12, color: 'rgba(255,120,110,0.95)', alpha: PP.clamp((t - t0 - 0.5) / 0.5) });
    PP.spaced(ctx, 'TO BE CONTINUED', 540, 1110, { font: '300 30px Inter', spacing: 10, color: 'rgba(225,232,255,0.8)', alpha: PP.clamp((t - t0 - 0.8) / 0.5) });
  });

  PP.SHOTS = K.S;
})(typeof window !== 'undefined' ? window : globalThis);
