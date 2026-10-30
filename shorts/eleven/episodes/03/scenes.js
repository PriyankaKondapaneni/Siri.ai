// 11:11, Episode 3, "The 6:40 Train": the shot list, cut on the words of the narration.
// Slice of life: one morning, lived nearly in real time. Someone moves in every shot, and time flows (the night
// running out in her room, dawn on the street, the hour in the café) instead of jumping.
(function (g) {
  const PP = g.PP;
  const C = PP.CUES, T = g.TIMING;
  const K = PP.shotKit(C, T);
  const { E, W, H, line, word, msg, lerpCam, char, onCut, foreground, digital, bedroom, phoneShot, shot } = K;
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
  function doors(ctx, open, a = 0.92) {
    PP.with(ctx, () => {
      const gap = 560 * open, half = 540 - gap / 2, top = 180, bot = 1640;
      ctx.lineWidth = 7; ctx.strokeStyle = '#1d1a1d';
      // the carriage wall, its windows lit from inside
      ctx.fillStyle = `rgba(52,66,78,${a})`; ctx.fillRect(0, top, half, bot - top); ctx.fillRect(W - half, top, half, bot - top);
      ctx.strokeRect(-10, top, half + 10, bot - top); ctx.strokeRect(W - half, top, half + 10, bot - top);
      ctx.fillStyle = 'rgba(225,238,255,0.55)';
      for (const [x0, w] of [[half - 230, 170], [W - half + 60, 170]]) { ctx.fillRect(x0, 380, w, 520); ctx.strokeRect(x0, 380, w, 520); }
      // the rubber edges of the door leaves and a strip of red light above the gap while the chime sounds
      ctx.fillStyle = '#16181c'; ctx.fillRect(half - 16, top, 16, bot - top); ctx.fillRect(W - half, top, 16, bot - top);
      if (open > 0.05 && open < 0.98) PP.glowAt(ctx, 540, top + 30, 140, '255,70,60', 0.6);
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

  // ---------------------------------------------------------------- 0. Cold open, built like Episode 2's
  // the buzz and his voice on the first frame: "Don't let me get on the train." the red voice note punching out of a
  // shake; the board slamming to 6:40; headlights rushing out of the tunnel; her hand flying to her ear; the doors
  const hk = [0, 0.42, 0.86, 1.3, 1.65, C.hookEnd];
  shot(hk[0], hk[1], 'danger', (ctx, t, u) => {
    const [sx, sy, sr] = PP.shake(t, 0, 16, 0.4);
    PP.with(ctx, () => { ctx.translate(sx, sy); ctx.rotate(sr); phoneShot(ctx, t, 'B5', [msg('h0', { urgent: true })], { u, urgent: true, seed: 41, focus: 2.0 - E.out(u) * 0.3, focusY: 260 }); });
  });
  shot(hk[1], hk[2], 'danger', (ctx, t, u) => {
    const [sx, sy] = PP.shake(t, hk[1] + 0.03, 12, 0.3);
    PP.with(ctx, () => { ctx.translate(sx, sy); board(ctx, t, 0.3 + u, '6:40', { prev: '6:39', flipAt: hk[1] + 0.02, status: 'BOARDING', red: true }); });
  });
  shot(hk[2], hk[3], 'train', (ctx, t, u) => {
    const [sx, sy, sr] = PP.shake(t, hk[2], 14, 0.45);
    PP.with(ctx, () => { ctx.translate(sx, sy); ctx.rotate(sr); platform(ctx, t, lerpCam(u, { x: 0.8, y: 0.42, z: 1.9 }, { x: 0.88, y: 0.42, z: 2.7 }, E.in), { tunnel: 1.2 + 2 * u }); });
    streaks(ctx, t, u);
  });
  shot(hk[3], hk[4], 'train', (ctx, t, u) => {
    platform(ctx, t, { x: 0.55, y: 0.45, z: 1.7 }, { variant: 'blur', tunnel: 1.5 });
    const up = OB(PP.clamp(u * 2.4));
    char(ctx, t, 'M13', 540, 2300 + 140 * (1 - up), 3000, { id: 'hk', blink: false, rot: 0.03 * (1 - up), sway: { amp: 10, t, from: 0, to: 0.5, speed: 7 }, rim: { ...RIM, dx: 7 } });
    sweep(ctx, u, 0.35);
  });
  shot(hk[4], hk[5], 'train', (ctx, t, u) => {
    platform(ctx, t, { x: 0.45, y: 0.45, z: 1.35 }, { variant: 'blur', tunnel: 1 });
    doors(ctx, 1 - E.in(PP.clamp(u * 1.6)), 0.9);
    streaks(ctx, t, PP.clamp(u * 2) * 0.6);
  });

  // ---------------------------------------------------------------- 1. Platform four, 6:31: nine minutes
  shot(C.hookEnd, C.run, 'train', (ctx, t, u) => {
    board(ctx, t, u, '6:31', { prev: '6:30', flipAt: C.hookEnd + 0.12 });
    PP.flash(ctx, t, C.hookEnd, 0.3);
    PP.spaced(ctx, '5 DAYS LEFT', 540, 300, { font: '500 40px Inter', spacing: 14, color: 'rgba(255,120,110,0.95)', glow: 'rgba(255,60,50,0.6)', blur: 20, alpha: PP.clamp((t - C.hookEnd) / 0.3) });
  });
  shot(C.run, C.irony, 'train', (ctx, t, u) => {
    // tracking with her as she hurries down the platform, scanning for him
    platform(ctx, t, lerpCam(u, { x: 0.3, y: 0.46, z: 1.25 }, { x: 0.62, y: 0.46, z: 1.25 }, (x) => x));
    const step = Math.abs(Math.sin(t * 8.5)), look = Math.sin(t * 2.2) * 0.03;
    char(ctx, t, 'M8', PP.lerp(260, 640, u), 2040 - 18 * step, 1500, { rot: Math.sin(t * 8.5) * 0.018 + look, breath: 0, sway: { amp: 9, t, from: 0, to: 0.5, speed: 6 }, rim: { ...RIM, dx: 5 } });
  });
  shot(C.irony, line('k1').s - 0.1, 'train', (ctx, t, u) => {
    // "...and he had no idea." calm, reading, turning a page
    platform(ctx, t, lerpCam(u, { x: 0.58, y: 0.48, z: 1.3 }, { x: 0.56, y: 0.48, z: 1.5 }), { variant: 'soft' });
    const page = tl(t, C.irony + 0.9, C.irony + 1.2);
    char(ctx, t, 'K12', 560, 2000, 1900, { id: 'rd', rot: 0.014 * Math.sin(page * Math.PI), breath: Math.sin(t * 1.5) * 0.006, rim: { ...RIM, dx: -6 } });
    PP.dust(ctx, t, [0, 300, W, 1200], 30, '220,235,255');
  });
  // "You again." a dip, the lift, settling
  shot(line('k1').s - 0.1, line('t3').s - 0.1, 'train', (ctx, t, u) => {
    platform(ctx, t, { x: 0.38, y: 0.42, z: 1.5 }, { variant: 'blur' });
    const y = kf(t, [[line('k1').s - 0.1, 950], [line('k1').s + 0.05, 962, E.out], [line('k1').s + 0.45, 905, OB]]);
    char(ctx, t, 'K4', 600, y, 2150 * (1 + u * 0.04), { id: 'k1', anchor: [0.53, 0.42], talk: true, rim: { ...RIM, dx: -7 } });
    foreground(ctx, 'M8', -180 + Math.sin(t * 1.2) * 12, 2300, 2500, { blur: 20, bright: 0.45 });
  });
  // "I'd never taken this train in my life." she sits at the far end of his bench; steals a glance; looks away fast
  shot(line('t3').s - 0.1, C.board38, 'train', (ctx, t, u) => {
    platform(ctx, t, lerpCam(u, { x: 0.52, y: 0.48, z: 1.18 }, { x: 0.5, y: 0.48, z: 1.24 }, (x) => x), { variant: 'soft' });
    char(ctx, t, 'K12', 740, 2030, 1500, { id: 'b2', breath: Math.sin(t * 1.5) * 0.006, rim: { ...RIM, dx: -6 } });
    const sit = tl(t, line('t3').s - 0.1, line('t3').s + 0.5, OB);
    const glance = kf(t, [[word('t3', 'never') - 0.2, 0], [word('t3', 'never') + 0.1, 1, OB], [word('t3', 'life') - 0.1, 1], [word('t3', 'life') + 0.15, 0, E.out]]);
    char(ctx, t, 'M8', 300, 2110 - 60 * sit, 1450, { rot: 0.06 * glance, breath: Math.sin(t * 2) * 0.007, rim: { ...RIM, dx: 5 } });
  });

  // ---------------------------------------------------------------- 2. 6:38. "Well. That's mine."
  shot(C.board38, line('k3').s - 0.1, 'train', (ctx, t, u) => {
    const second = t > C.board38 + 0.45;
    board(ctx, t, u, second ? '6:39' : '6:38', { prev: second ? '6:38' : '6:37', flipAt: second ? C.board38 + 0.45 : C.board38 + 0.05, status: 'ARRIVING' });
  });
  shot(line('k3').s - 0.1, C.tenSec, 'train', (ctx, t, u) => {
    // he stands, tucks the book into his coat, turns toward the train as its light finds him
    platform(ctx, t, { x: 0.4, y: 0.42, z: 1.5 }, { variant: 'blur', tunnel: 0.6 + 1.6 * u });
    const s0 = line('k3').s - 0.1, y = kf(t, [[s0, 1010], [s0 + 0.18, 1030, E.out], [s0 + 0.65, 900, OB]]);
    const turn = tl(t, word('k3', "that's") - 0.15, word('k3', "that's") + 0.45);
    char(ctx, t, 'K4', 600 + 50 * turn, y, 2150, { id: 'k3', anchor: [0.53, 0.42], rot: -0.05 * turn, talk: true, sway: { amp: 3 + 6 * u, t, from: 0, to: 0.3 }, light: { x: 0.95, y: 0.4, r: 0.8, color: `rgba(255,240,210,${0.4 * u})` }, rim: { ...RIM, dx: -7 } });
  });

  // ---------------------------------------------------------------- 3. "Ten seconds. No plan." then the idea
  const planCut = word('t4', 'no') - 0.08;
  shot(C.tenSec, planCut, 'danger', (ctx, t, u) => {
    board(ctx, t, u, '6:40', { prev: '6:39', flipAt: C.tenSec + 0.02, status: 'BOARDING', red: true });
  });
  shot(planCut, C.earring, 'train', (ctx, t, u) => {
    // close on her: wind from the train in her hair, eyes darting; then it lands on her, the idea
    const [hx, hy, hr] = PP.handheld(t, 7, 95);
    PP.with(ctx, () => { ctx.translate(hx, hy); ctx.rotate(hr);
      platform(ctx, t, { x: 0.6, y: 0.45, z: 1.6 }, { variant: 'blur', tunnel: 2 });
      streaks(ctx, t, 0.45);
      const dart = t < C.idea ? Math.sign(Math.sin(t * 9)) * 0.025 : 0;
      char(ctx, t, 'M6', 540, 860, 3500 * (1 + u * 0.08), { id: 'dt', blink: false, anchor: [0.55, 0.35], rot: dart, sway: { amp: 20, t, from: 0, to: 0.5, speed: 9 }, rim: { ...RIM, dx: 7 }, light: { x: 0.9, y: 0.4, r: 0.6, color: 'rgba(255,240,210,0.3)' } });
    });
    if (t > C.idea) PP.glowAt(ctx, 330, 700, 160, '255,230,170', 0.35 * Math.sin(PP.clamp((t - C.idea) / 0.4) * Math.PI));
  });

  // ---------------------------------------------------------------- 4. "Oh no... my earring!"
  shot(C.earring, C.kneel, 'train', (ctx, t, u) => {
    // her hand flies to her ear; she drops down toward the floor
    platform(ctx, t, { x: 0.55, y: 0.45, z: 1.5 }, { variant: 'blur', tunnel: 1.6 });
    const up = OB(tl(t, C.earring, C.earring + 0.35, (x) => x)), drop = E.in(tl(t, C.kneel - 0.45, C.kneel, (x) => x));
    char(ctx, t, 'M13', 540, 2150 + 120 * (1 - up) + 500 * drop, 2500, { rot: 0.03 * (1 - up) - 0.04 * drop, sway: { amp: 8, t, from: 0, to: 0.5, speed: 7 }, rim: { ...RIM, dx: 7 } });
  });
  // "Don't move. What does it look like?" he turns straight back, already crouching down to her
  shot(C.kneel, C.search, 'train', (ctx, t, u) => {
    platform(ctx, t, { x: 0.4, y: 0.42, z: 1.6 }, { variant: 'blur', tunnel: 1.8 });
    const turn = OB(tl(t, C.kneel, C.kneel + 0.45, (x) => x)), down = tl(t, C.kneel + 0.2, C.kneel + 0.9, OB);
    char(ctx, t, 'K4', PP.lerp(700, 570, turn), 880 + 120 * down, 2300, { id: 'k8', anchor: [0.53, 0.42], rot: PP.lerp(-0.1, 0.02, turn), talk: true, light: { x: 0.95, y: 0.4, r: 0.8, color: 'rgba(255,240,210,0.3)' }, rim: { ...RIM, dx: -7 } });
  });
  // the torch beam sweeping the floor under the bench
  function torch(ctx, x, y, ang, a = 1) {
    PP.with(ctx, () => {
      ctx.globalCompositeOperation = 'screen';
      const len = 900, gr = ctx.createRadialGradient(x, y, 10, x, y, len);
      gr.addColorStop(0, `rgba(255,250,235,${0.8 * a})`); gr.addColorStop(0.55, `rgba(255,248,230,${0.35 * a})`); gr.addColorStop(1, 'rgba(255,250,235,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, len, ang - 0.32, ang + 0.32); ctx.closePath(); ctx.fill();
      PP.glowAt(ctx, x + Math.cos(ang) * 420, y + Math.sin(ang) * 420, 200, '255,250,235', 0.6 * a);
    });
  }
  // the kneeling two-shot: searching together, his torch sweeping, her secret glance at him
  const kneelShot = (ctx, t, u, o = {}) => {
    platform(ctx, t, lerpCam(u, { x: 0.5, y: 0.55, z: o.z0 ?? 1.3 }, { x: 0.5, y: 0.56, z: o.z1 ?? 1.38 }), { variant: 'soft', tunnel: o.tunnel ?? 0 });
    PP.with(ctx, () => { ctx.fillStyle = 'rgba(6,10,18,0.32)'; ctx.fillRect(0, 0, W, H); });
    if (o.streaks) streaks(ctx, t, o.streaks);
    const h = 1800, x = 540, y = 1960, sw = Math.sin(t * 1.7) * 0.3;
    char(ctx, t, 'MK4', x, y, h, { breath: Math.sin(t * 2) * 0.006, rot: Math.sin(t * 0.9) * 0.006, rim: { ...RIM, dx: 6 }, light: { x: 0.55, y: 0.8, r: 0.5, color: 'rgba(255,250,235,0.25)' } });
    const [px, py] = onCut('MK4', x, y, h, [0.5, 1], 0.6, 0.83);
    torch(ctx, px, py + 20, Math.PI * 0.82 + sw, 1);
  };
  shot(C.search, C.hold, 'train', (ctx, t, u) => kneelShot(ctx, t, u, { tunnel: 1.2 + u }));

  // ---------------------------------------------------------------- 5. "Don't look up. Don't look up." the train comes and goes behind them
  shot(C.hold, C.doors, 'night', (ctx, t, u) => {
    // her face, very close, breath held; the train's light rakes across her
    platform(ctx, t, { x: 0.5, y: 0.5, z: 1.8 }, { variant: 'blur', tunnel: 2 });
    PP.with(ctx, () => { ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(0, 0, W, H); });
    const side = kf(t, [[C.hold, 0], [C.hold + 0.4, 1, OB], [C.doors - 0.3, 1], [C.doors - 0.05, 0.4, E.out]]);
    char(ctx, t, 'M6', 540 - 26 * side, 880, 3800 * (1 + u * 0.08), { id: 'hd', blink: false, anchor: [0.55, 0.35], rot: 0.03 * side, breath: 0, sway: { amp: 6, t, from: 0, to: 0.45, speed: 4 }, rim: { ...RIM, dx: 8 } });
    sweep(ctx, u, 0.35);
  });
  shot(C.doors, C.trainOut, 'train', (ctx, t, u) => {
    // over their heads: the doors open, chime, and close on an empty space
    platform(ctx, t, { x: 0.45, y: 0.42, z: 1.35 }, { variant: 'blur', tunnel: 1 });
    const open = kf(t, [[C.doors, 0.2], [C.doors + 0.25, 1, E.out], [C.trainOut - 0.55, 1], [C.trainOut - 0.05, 0, E.in]]);
    doors(ctx, open, 0.9);
  });
  shot(C.trainOut, C.sorry, 'train', (ctx, t, u) => kneelShot(ctx, t, u, { z0: 1.18, z1: 1.3, streaks: PP.clamp(1 - u * 0.9) * 0.6 }));

  // ---------------------------------------------------------------- 6. "I can't find it." / "Maybe it was never here."
  shot(C.sorry, C.neverHere, 'train', (ctx, t, u) => {
    // he sits back on his heels, sorry, the torch dropping
    platform(ctx, t, { x: 0.4, y: 0.42, z: 1.6 }, { variant: 'blur' });
    const back = tl(t, C.sorry, C.sorry + 0.6, OB);
    char(ctx, t, 'K4', 570, 1000 - 40 * back, 2300 * (1 + u * 0.04), { id: 'k9', anchor: [0.53, 0.42], rot: -0.02 * back, talk: true, light: { x: 0.5, y: 0.9, r: 0.6, color: 'rgba(255,250,235,0.3)' }, rim: { ...RIM, dx: -7 } });
    foreground(ctx, 'M8', -200, 2400, 2500, { blur: 20, bright: 0.45 });
  });
  shot(C.neverHere, C.tracks, 'train', (ctx, t, u) => {
    // she, gently, with a secret in it; a small smile and a blush she can't help
    platform(ctx, t, { x: 0.62, y: 0.45, z: 1.6 }, { variant: 'blur' });
    const h = 2500, tilt = tl(t, word('m7', 'maybe') - 0.2, word('m7', 'maybe') + 0.5);
    char(ctx, t, 'M9', 540, 960 + 10 * tilt, h * (1 + u * 0.05), { id: 'nh', anchor: [0.56, 0.39], rot: 0.03 * tilt, rim: { ...RIM, dx: 7 }, light: { x: 0.8, y: 0.35, r: 0.7, color: 'rgba(255,215,170,0.2)' } });
    for (const [cu, cv] of [[0.46, 0.46], [0.66, 0.44]]) { const [bx, by] = onCut('M9', 540, 960 + 10 * tilt, h * (1 + u * 0.05), [0.56, 0.39], cu, cv); PP.glowAt(ctx, bx, by, 70, '255,120,120', 0.25 * tilt); }
    foreground(ctx, 'K4', 1260, 2400, 2600, { blur: 22, bright: 0.4 });
  });
  // "...And there goes my train." he looks over his shoulder at the empty track, then back, laughing at himself
  shot(C.tracks, C.pocket, 'train', (ctx, t, u) => {
    platform(ctx, t, { x: 0.45, y: 0.42, z: 1.55 }, { variant: 'blur' });
    const look = kf(t, [[C.tracks, 0], [C.tracks + 0.4, 1, OB], [word('k10', 'goes') - 0.1, 1], [word('k10', 'goes') + 0.35, 0, E.out]]);
    const laugh = Math.abs(Math.sin(t * 12)) * -9 * tl(t, word('k10', 'train'), word('k10', 'train') + 0.3);
    char(ctx, t, 'K4', 570 + 70 * look, 930 + laugh, 2250, { id: 'k10', anchor: [0.53, 0.42], rot: -0.08 * look, talk: true, rim: { ...RIM, dx: -7 } });
  });
  // "The earring was in my pocket the whole time." her hand comes out of her pocket and opens: the little gold flower
  shot(C.pocket, C.cafe, 'dark', (ctx, t, u) => {
    platform(ctx, t, { x: 0.5, y: 0.6, z: 1.9 }, { variant: 'blur' });
    const rise = OB(tl(t, C.pocket, C.pocket + 0.6, (x) => x)), h = 2900 * (1 + u * 0.08);
    char(ctx, t, 'H2', 560, 2400 + 400 * (1 - rise), h, { anchor: [0.5, 1], breath: 0, blink: false, rot: -0.03 * (1 - rise), light: { x: 0.6, y: 0.5, r: 0.6, color: 'rgba(255,225,180,0.3)' }, rim: { color: 'rgba(255,215,170,0.95)', dx: -6, a: 0.7 } });
    const [ex, ey] = onCut('H2', 560, 2400 + 400 * (1 - rise), h, [0.5, 1], 0.43, 0.55), glint = PP.clamp((t - C.pocket - 0.75) / 0.3) * (1 - PP.clamp((t - C.pocket - 1.4) / 0.6));
    PP.glowAt(ctx, ex, ey, 120, '255,230,150', 0.6 * glint);
    PP.flare(ctx, ex, ey, 0.6 * glint, '255,235,170');
  });

  // ---------------------------------------------------------------- 7. Forty minutes later: the café, warm and silly; then every phone at once
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

  // ---------------------------------------------------------------- 8. "The 6:40 never made it to the next station."
  const neverCut = word('t7', 'never') - 0.1;
  shot(C.news, neverCut, 'danger', (ctx, t, u) => {
    phoneShot(ctx, t, 'B5', [], { u, seed: 71, banner: C.news + 0.05, bannerHold: 6, ...NEWS, header: 'News', push: 0.12 });
  });
  const nextCut = word('t7', 'next') - 0.1;
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

  // ---------------------------------------------------------------- 9. "You knew. Didn't you?" / "I couldn't tell him. Not yet."
  shot(line('k5').s - 0.1, line('t8').s - 0.1, 'cold', (ctx, t, u) => {
    cafe(ctx, t, { x: 0.4, y: 0.45, z: 1.6 }, 'blur', 0.3);
    const up = tl(t, line('k5').s - 0.1, line('k5').s + 0.8, E.out);
    char(ctx, t, 'K3', 600, 950 - 50 * up, 2150 * (1 + u * 0.08), { id: 'k5', anchor: [0.52, 0.42], rot: 0.035 * (1 - up), talk: true, blink: false, rim: { ...RIM, dx: -7 } });
    foreground(ctx, 'M1', -200, 2300, 2500, { blur: 20, bright: 0.45 });
  });
  shot(line('t8').s - 0.1, C.night, 'cold', (ctx, t, u) => {
    cafe(ctx, t, { x: 0.65, y: 0.45, z: 1.6 }, 'blur', 0.3);
    const away = tl(t, line('t8').s, line('t8').s + 0.9, OB);
    char(ctx, t, 'M6', 500 - 50 * away, 870 + 34 * away, 2300 * (1 + u * 0.05), { anchor: [0.55, 0.35], rot: -0.06 * away, breath: Math.sin(t * 2.4) * 0.008, rim: { ...RIM, dx: 7 } });
    foreground(ctx, 'K3', 1250, 2350, 2600, { blur: 22, bright: 0.4 });
  });

  // ---------------------------------------------------------------- 10. That night: his apartment, his phone
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

  // ---------------------------------------------------------------- 11. End card
  shot(C.endCard, C.total, null, (ctx, t) => {
    ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, W, H);
    const t0 = C.endCard, a = PP.clamp((t - t0 - 0.1) / 0.6);
    PP.spaced(ctx, '11:11', 540, 860, { font: '200 200px Inter', spacing: 14, glow: 'rgba(130,200,255,0.7)', blur: 36, alpha: a });
    PP.spaced(ctx, 'FOUR DAYS LEFT', 540, 1040, { font: '500 32px Inter', spacing: 12, color: 'rgba(255,120,110,0.95)', alpha: PP.clamp((t - t0 - 0.5) / 0.5) });
    PP.spaced(ctx, 'TO BE CONTINUED', 540, 1110, { font: '300 30px Inter', spacing: 10, color: 'rgba(225,232,255,0.8)', alpha: PP.clamp((t - t0 - 0.8) / 0.5) });
  });

  PP.SHOTS = K.S;
})(typeof window !== 'undefined' ? window : globalThis);
