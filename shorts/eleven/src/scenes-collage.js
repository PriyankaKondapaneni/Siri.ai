// 11:11, Episode 1, "The Voice From My Phone": the scenes. Each is a pure function of time against the cue sheet.
(function (g) {
  const PP = g.PP;
  const C = PP.CUES, T = g.TIMING;
  const E = PP.ease;
  const W = PP.W, H = PP.H;
  const line = (id) => T.lines.find((l) => l.id === id);
  const msg = (id, extra = {}) => ({ s: line(id).s, e: line(id).e, text: line(id).text, words: C.noteWords[id], time: '11:11 PM', ...extra });
  const cam = (t, keys) => { const [x, y, z] = PP.kf(t, keys.map(([tt, v, e]) => [tt, [v.x, v.y, v.z], e])); return { x, y, z }; };
  const st = (t) => PP.step(t, 12); // stop-motion time for cut-out moves
  // a cut-out that breathes very slightly (scale) and sits with a hand-placed wobble
  const breathe = (t, id, amp = 0.006) => 1 + Math.sin(st(t) * 1.6 + id.length) * amp;
  const flags = (PP.FRAME = PP.FRAME || {});

  // the 11:11 title, cut from mixed papers, slammed in on her word and then tucked up top
  function title(ctx, t, t0, hold) {
    const k = PP.clamp((t - hold) / 0.6);
    const y = PP.lerp(560, 250, E.inOut(k)), s = PP.lerp(1, 0.46, E.inOut(k));
    PP.with(ctx, () => {
      ctx.translate(540, y); ctx.scale(s, s); ctx.translate(-540, -y);
      PP.ransom(ctx, '11:11', 540, y, 250, t, t0, { seed: 11, stagger: 0.05 });
    });
    if (t > t0 + 0.4) PP.with(ctx, () => { ctx.globalAlpha = PP.clamp((t - t0 - 0.4) / 0.3) * (1 - k * 0.3); ctx.font = `${Math.round(34 * s + 10)}px "Special Elite"`; ctx.fillStyle = '#f4efe4'; ctx.textAlign = 'center'; ctx.fillText('MESSAGES FROM TOMORROW', 540, y + 222 * s); });
  }

  // a typewritten time slammed onto the frame like a stamp
  function stampText(ctx, text, x, y, size, t, t0, color = '#d8332c', rot = -0.06) {
    const k = PP.clamp((t - t0) / 0.18);
    if (k <= 0) return;
    PP.with(ctx, () => {
      ctx.translate(x, y); ctx.rotate(rot); const sc = 1 + (1 - E.out(k)) * 1.2; ctx.scale(sc, sc); ctx.globalAlpha = k;
      ctx.font = `${size}px "Bebas Neue"`; const w = ctx.measureText(text).width;
      PP.paperPiece(ctx, PP.rectPoly(-w / 2 - 30, -size * 0.62, w + 60, size * 1.05), 'cream', { seed: PP.hash(text), rough: 3, rim: 0, shadow: { blur: 20, dx: 6, dy: 12, a: 0.5 } });
      ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.strokeRect(-w / 2 - 16, -size * 0.52, w + 32, size * 0.85);
      ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, size * 0.0);
    });
  }

  // a hand-drawn ink circle with an arrow and a label, drawing itself on (annotations on the collage)
  function annotate(ctx, x, y, r, label, t, t0, lx, ly) {
    const p = PP.clamp((t - t0) / 0.6);
    if (p <= 0) return;
    PP.ink(ctx, PP.circlePts(x, y, r, r * 0.92, 46, -1.2, Math.PI * 2.15), { w: 6, color: '#e8463c', seed: 70, boil: PP.boil(t), progress: p, dry: false });
    if (p > 0.7) {
      PP.ink(ctx, PP.curve([[lx, ly + 30], [(lx + x) / 2 + 40, (ly + y) / 2], [x + r * 0.7, y - r * 0.7]], 8), { w: 5, color: '#e8463c', seed: 71, boil: PP.boil(t), progress: PP.clamp((p - 0.7) / 0.3), dry: false });
      PP.handwrite(ctx, [label], lx, ly, { font: '120px "Permanent Marker"', color: '#e8463c', progress: PP.clamp((t - t0 - 0.45) / 0.35), align: 'center' });
    }
  }

  const S = {};
  const ENV = g.ENVELOPE || { live: [] };
  // a character: hand-placed jitter, breathing, blinks; `talk` opens the mouth with Kabir's live voice
  function char(ctx, t, name, x, y, h, o = {}) {
    const [jx, jy] = PP.jit(t, name + (o.id || ''), o.jit ?? 0.7);
    let state = PP.blinking(t, name + (o.id || '')) && PP.FACES[name]?.eyes?.length ? 'b' : '';
    if (o.talk) { const fr = Math.round(t * 30), v = Math.max(ENV.live[fr] || 0, ENV.live[fr - 1] || 0); state += v > 0.45 ? 'm2' : v > 0.12 ? 'm1' : ''; }
    const breath = o.breath ?? Math.sin(st(t) * 1.7 + name.length) * 0.007;
    PP.drawCut(ctx, name, x + jx, y + jy, h, { ...o, state, breath });
  }
  // where an image point of a drawn cut-out lands on screen
  const onCut = (name, x, y, h, [ax, ay], u, v) => { const im = PP.IMG[name], s = h / im.height; return [x + (u - ax) * im.width * s, y + (v - ay) * im.height * s, s]; };
  function clockHands(ctx, x, y, r, hh, mm, color = '#2a2226') {
    const ha = ((hh % 12) + mm / 60) / 12 * Math.PI * 2, ma = (mm / 60) * Math.PI * 2;
    PP.with(ctx, () => {
      ctx.strokeStyle = color; ctx.lineCap = 'round';
      ctx.lineWidth = r * 0.085; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(ha) * r * 0.5, y - Math.cos(ha) * r * 0.5); ctx.stroke();
      ctx.lineWidth = r * 0.055; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(ma) * r * 0.78, y - Math.cos(ma) * r * 0.78); ctx.stroke();
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r * 0.07, 0, 7); ctx.fill();
    });
  }
  function digital(ctx, x, y, size, text, a = 0.9) {
    PP.with(ctx, () => { ctx.font = `${Math.round(size)}px "Bebas Neue"`; ctx.fillStyle = `rgba(150,225,255,${a})`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(120,200,255,0.9)'; ctx.shadowBlur = 16; ctx.fillText(text, x, y); });
  }
  function bedroom(ctx, t, c, o = {}) {
    const bg = PP.drawBgDepth(ctx, 'B1', { ...c, z0: 1 }, { horizon: 0.35, k: 0.9, variant: o.variant });
    const [wx, wy] = bg.map(0.57, 0), [wx2, wy2] = bg.map(1, 0.4);
    PP.rain(ctx, t, [wx, wy, wx2 - wx, wy2 - wy], { n: 60 });
    const [lx, ly] = bg.map(0.19, 0.45);
    PP.glowAt(ctx, lx, ly, 320, '255,196,120', 0.4 + 0.04 * Math.sin(t * 9));
    return bg;
  }

  // ---- 1. Bedroom, 11:11: "Every night at 11:11... a stranger sends me a voice message. And everything he says comes true."
  S.bedroom = (ctx, t) => {
    const bg = bedroom(ctx, t, cam(t, [[0, { x: 0.47, y: 0.55, z: 1.0 }], [C.note1, { x: 0.44, y: 0.56, z: 1.14 }, E.inOut]]));
    const [cx, cy] = bg.map(0.31, 0.553);
    const pulse = t > C.clock1111 ? Math.max(0, 1 - (t - C.clock1111) / 1.2) : 0;
    PP.glowAt(ctx, cx, cy, 90 + pulse * 140, '120,200,255', 0.35 + pulse * 0.5);
    digital(ctx, cx, cy, 30 * bg.s, t < C.clock1111 ? '11:10' : '11:11');
    char(ctx, t, 'M2', 730, 1990, 1700, { tint: 'rgba(30,40,110,0.16)', light: { x: 0.62, y: 0.3, r: 0.55, color: 'rgba(160,210,255,0.35)' } });
    title(ctx, t, C.clock1111 - 0.05, C.clock1111 + 2.6);
  };

  // ---- 2. The first voice note, on her phone; "I deleted it."
  S.note1 = (ctx, t) => {
    const z = 1.05 + (t - C.note1) * 0.012;
    PP.drawBg(ctx, 'B5', { x: 0.5, y: 0.52, z }, { variant: 'dark' });
    flags.phone = true;
    const buzz = C.buzz[0];
    const shake = t > buzz && t < buzz + 0.5 ? Math.sin((t - buzz) * 90) * 0.012 : 0;
    const rise = E.outBack(PP.clamp((t - C.note1) / 0.45), 1.2);
    PP.phone(ctx, 540, 900 + (1 - rise) * 900, 1.22, { t, rot: -0.03 + shake, glow: 1, banner: buzz, msgs: [msg('k1', { deleted: C.delete + 0.2 })] });
  };

  // ---- 3. The café at 8:02, the spill
  S.cafe = (ctx, t) => {
    const a = C.cafeCut;
    const c = cam(t, [[a, { x: 0.8, y: 0.15, z: 3.0 }], [a + 0.55, { x: 0.79, y: 0.155, z: 2.7 }, E.out], [a + 0.95, { x: 0.5, y: 0.5, z: 1.05 }, E.inOut], [C.train, { x: 0.5, y: 0.5, z: 1.1 }]]);
    const [sx, sy, sr] = PP.shake(t, C.spill, 22, 0.5);
    PP.with(ctx, () => {
      ctx.translate(sx, sy); ctx.rotate(sr);
      const bg = PP.drawBg(ctx, 'B2', c, {});
      const [kx, ky] = bg.map(0.8, 0.142);
      clockHands(ctx, kx, ky, 0.085 * 1024 * bg.s, 8, 2);
      const [wx, wy] = bg.map(0.0, 0.1);
      PP.dust(ctx, t, [wx, wy, 0.3 * 1024 * bg.s, 0.5 * 1536 * bg.s], 50);
      if (t > a + 0.75) {
        const spilled = t >= C.spill - 0.04;
        const slide = E.out(PP.clamp((t - a - 0.75) / 0.3));
        char(ctx, t, spilled ? 'M3' : 'M1', 540 + (1 - slide) * 800, 2000, 1780, { tint: 'rgba(255,200,140,0.06)' });
        if (spilled) {
          for (let k = 0; k < 14; k++) {
            const u = (t - C.spill) / 0.7;
            if (u > 1) break;
            const ang = -1.3 + PP.rand('dr', k) * 1.5, sp = 400 + PP.rand('ds', k) * 600;
            const x = 950 + Math.cos(ang) * sp * u, y = 1080 + Math.sin(ang) * sp * u + 900 * u * u;
            PP.with(ctx, () => { ctx.fillStyle = '#6b3f22'; ctx.strokeStyle = '#1d1a1d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, 8 + PP.rand('dz', k) * 8, 10 + PP.rand('dz', k) * 10, ang, 0, 7); ctx.fill(); ctx.stroke(); });
          }
        }
      }
    });
    PP.flash(ctx, t, C.spill, 0.25, '255,245,230', 0.35);
  };

  // ---- 4. The train: "The guy on the train will ask your name. Lie." / "He asked. I lied."
  S.train = (ctx, t) => {
    const flicker = PP.rand('fl', PP.boil(t, 8)) < 0.06 ? 0.8 : 1;
    const closeOnHer = t > C.lied - 0.05;
    const c = cam(t, [[C.train, { x: 0.5, y: 0.45, z: 1.0 }], [C.note3, { x: 0.5, y: 0.47, z: 1.18 }, E.inOut]]);
    const [sx, sy] = t > C.shaking ? PP.shake(t, C.shaking, 9, 0.9) : [0, 0];
    PP.with(ctx, () => {
      ctx.translate(sx, sy);
      PP.drawBgDepth(ctx, 'B3', { ...c, z0: 1 }, { horizon: 0.375, k: 1.4, variant: closeOnHer ? 'blur' : undefined });
      const coldTint = `rgba(20,50,60,${0.1 + (1 - flicker) * 0.5})`;
      if (!closeOnHer) {
        char(ctx, t, 'M4', 360, 2120, 1560, { tint: coldTint });
        if (t > C.trainGuy) {
          const inn = E.out(PP.clamp((t - C.trainGuy) / 0.4));
          const lean = E.inOut(PP.clamp((t - C.asked + 0.1) / 0.4));
          char(ctx, t, 'S1', 850 + (1 - inn) * 500 - lean * 70, 2100, 1450 * (1 + lean * 0.06), { tint: `rgba(10,30,40,${0.16 + (1 - flicker) * 0.4})`, alpha: inn });
        }
      } else {
        char(ctx, t, 'M4', 540, 880, 2700, { id: 'c', anchor: [0.55, 0.34], tint: coldTint, jit: t > C.shaking ? 3 : 0.7 });
      }
      PP.with(ctx, () => { ctx.fillStyle = `rgba(0,0,0,${(1 - flicker) * 0.4})`; ctx.fillRect(0, 0, W, H); });
    });
    if (t < line('k2').e + 0.4) {
      flags.phone = true;
      const k = E.outBack(PP.clamp((t - C.train) / 0.35), 1.4), out = PP.clamp((t - line('k2').e - 0.1) / 0.3);
      PP.phone(ctx, 540, 390 - out * 900, 0.45 * k, { t, rot: -0.05, glow: 0.6, banner: C.buzz[1], msgs: [msg('k2')] });
    }
    if (t > C.shaking) PP.with(ctx, () => { const p = 0.5 + 0.5 * Math.sin(t * 9); const gr = ctx.createRadialGradient(540, 960, 400, 540, 960, 1200); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(120,0,0,${0.25 * p})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); });
  };

  // ---- 5. The urgent message: "Mira. Tomorrow, 6:40, Fifth Street. Stay on the curb. Promise me."
  S.note3 = (ctx, t) => {
    PP.drawBg(ctx, 'B4', { x: 0.5, y: 0.55, z: 1.1 + (t - C.note3) * 0.02 }, { variant: 'dark' });
    PP.with(ctx, () => { ctx.fillStyle = `rgba(140,0,0,${0.18 + 0.1 * Math.sin(t * 6)})`; ctx.fillRect(0, 0, W, H); });
    flags.phone = true;
    PP.phone(ctx, 540, 960, 1.15, { t, rot: 0.02, glow: 1, urgent: true, banner: C.buzz[2], msgs: [msg('k3', { urgent: true })] });
    stampText(ctx, '6:40', 540, 330, 190, t, C.noteWords.k3.find((w) => w.w.startsWith('6:40')).s);
    if (t > C.pin) {
      const p = E.outBack(PP.clamp((t - C.pin) / 0.3), 2);
      PP.with(ctx, () => { ctx.translate(840, 470); ctx.scale(p, p); ctx.fillStyle = '#e8463c'; ctx.beginPath(); ctx.arc(0, -40, 46, Math.PI, 0); ctx.lineTo(0, 50); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fbf3e1'; ctx.beginPath(); ctx.arc(0, -40, 18, 0, 7); ctx.fill(); ctx.font = '44px "Bebas Neue"'; ctx.textAlign = 'center'; ctx.fillStyle = '#fbf3e1'; ctx.fillText('5TH ST', 0, 100); });
    }
  };

  // ---- 6. Fifth Street: "6:40. A car ran the red light... and someone pulled me back."
  S.street = (ctx, t) => {
    const c = cam(t, [[C.street, { x: 0.52, y: 0.55, z: 1.0 }], [C.pulled, { x: 0.53, y: 0.56, z: 1.12 }, E.in], [C.eyes, { x: 0.53, y: 0.56, z: 1.16 }]]);
    const [sx, sy, sr] = PP.shake(t, C.impact, 26, 0.7);
    PP.with(ctx, () => {
      ctx.translate(sx, sy); ctx.rotate(sr);
      const bg = PP.drawBgDepth(ctx, 'B4', { ...c, z0: 1 }, { horizon: 0.52, k: 1.5 });
      const [rx, ry] = bg.map(0.594, 0.146);
      PP.glowAt(ctx, rx, ry, 150, '255,60,40', 0.55 + 0.25 * Math.sin(t * 7));
      const [vx, vy] = bg.map(0.594, 0.52);
      PP.headlights(ctx, t, C.car - 0.2, C.impact + 0.05, vx, vy);
      const pull = E.out(PP.clamp((t - C.pulled) / 0.3));
      const wind = 6 + 10 * PP.clamp((t - C.car + 0.3) / 0.8);
      char(ctx, t, 'M5', 360 + pull * 90, 2000, 1750, { rot: pull * 0.06, sway: { amp: wind, t: st(t), from: 0, to: 0.45, speed: 7 }, light: { x: 0.1, y: 0.4, r: 0.8, color: `rgba(255,225,180,${0.15 + 0.4 * PP.clamp((t - C.car) / 1.2)})` } });
      if (t > C.pulled) {
        const inn = E.out(PP.clamp((t - C.pulled) / 0.22));
        char(ctx, t, 'K2', 1600 - inn * 520, 2060, 1650, { light: { x: 0.2, y: 0.3, r: 0.8, color: 'rgba(255,200,140,0.25)' } });
      }
    });
    PP.speedLines(ctx, t, 600, 1000, PP.clamp((t - C.pulled) / 0.2) * (1 - PP.clamp((t - C.impact - 0.2) / 0.4)));
    PP.flash(ctx, t, C.impact, 0.45, '255,255,255', 0.95);
  };

  // ---- 7-8. "Dark eyes. A watch stopped at 11:11."
  S.eyes = (ctx, t) => {
    PP.drawBg(ctx, 'B4', { x: 0.45, y: 0.5, z: 1.4 }, { variant: 'dark' });
    const k = (t - C.eyes) / (C.watch - C.eyes);
    char(ctx, t, 'K3', 540, 860, 2300 * (1 + k * 0.05), { anchor: [0.52, 0.42], light: { x: 0.15, y: 0.35, r: 0.7, color: 'rgba(255,190,120,0.3)' } });
  };
  S.watch = (ctx, t) => {
    PP.drawBg(ctx, 'B4', { x: 0.6, y: 0.5, z: 1.6 }, { variant: 'dark' });
    const k = (t - C.watch) / (C.okay - C.watch), h = 2300 * (1 + k * 0.08);
    char(ctx, t, 'K5', 560, 980, h, { anchor: [0.5156, 0.5195], breath: 0, light: { x: 0.52, y: 0.52, r: 0.3, color: 'rgba(255,225,190,0.25)' } });
    const R = 0.1406 * 1024 * (h / 1536);
    clockHands(ctx, 560, 980, R, 11, 11);
    annotate(ctx, 560, 980, R * 1.3, '11:11', t, C.watchFace - 0.35, 300, 420);
  };

  // ---- 9-12. "Hey. You okay?" / "It was his voice." / "Sorry... have we met?" / "He had no idea who I was."
  S.okay = (ctx, t) => {
    PP.drawBg(ctx, 'B4', { x: 0.4, y: 0.55, z: 1.5 }, { variant: 'dark' });
    const k = (t - C.okay) / (C.stunned - C.okay);
    char(ctx, t, 'K3', 560 - k * 20, 900, 2150, { id: 'o', anchor: [0.52, 0.42], talk: true, light: { x: 0.15, y: 0.35, r: 0.7, color: 'rgba(255,190,120,0.35)' } });
  };
  S.stunned = (ctx, t) => {
    PP.drawBg(ctx, 'B4', { x: 0.55, y: 0.55, z: 1.5 }, { variant: 'dark' });
    const k = (t - C.stunned) / (C.met - C.stunned);
    char(ctx, t, 'M6', 540, 880 - k * 20, 2200 * (1 + k * 0.05), { anchor: [0.55, 0.35], light: { x: 0.8, y: 0.3, r: 0.7, color: 'rgba(255,200,150,0.25)' } });
    if (t > C.voiceRealise) {
      const p = PP.clamp((t - C.voiceRealise) / 1.2);
      for (let r = 0; r < 3; r++) PP.ink(ctx, PP.circlePts(540, 800, 400 + r * 70 + p * 60, 400 + r * 70 + p * 60, 50, -2.6, 1.0), { w: 5, color: `rgba(170,210,255,${0.6 * (1 - p)})`, seed: 80 + r, boil: PP.boil(t), dry: false });
    }
  };
  S.met = (ctx, t) => {
    PP.drawBg(ctx, 'B4', { x: 0.4, y: 0.55, z: 1.5 }, { variant: 'dark' });
    const k = (t - C.met) / (C.noIdea - C.met);
    char(ctx, t, 'K4', 540, 900, 2150 * (1 + k * 0.04), { anchor: [0.53, 0.42], talk: true, light: { x: 0.2, y: 0.35, r: 0.7, color: 'rgba(255,190,120,0.3)' } });
  };
  S.noIdea = (ctx, t) => {
    const k = E.inOut(PP.clamp((t - C.noIdea) / (C.night - C.noIdea)));
    PP.drawBg(ctx, 'B4', { x: 0.5, y: 0.6, z: 1.3 - k * 0.15 }, { variant: 'grey' });
    char(ctx, t, 'M6', 540, 880 + k * 60, 2200 * (1 - k * 0.15), { id: 'n', anchor: [0.55, 0.35], tint: `rgba(40,44,60,${0.15 + k * 0.25})` });
    PP.with(ctx, () => { ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgba(128,128,128,${k * 0.7})`; ctx.fillRect(0, 0, W, H); });
  };

  // ---- 13. That night: the last message; the tear; "In seven days... I don't make it."
  S.night = (ctx, t) => {
    if (t < C.last) {
      const bg = bedroom(ctx, t, cam(t, [[C.night, { x: 0.33, y: 0.53, z: 1.5 }], [C.last, { x: 0.31, y: 0.54, z: 1.75 }, E.inOut]]));
      const [cx, cy] = bg.map(0.31, 0.553);
      PP.glowAt(ctx, cx, cy, 200, '120,200,255', 0.55 + 0.2 * Math.sin(t * 3));
      digital(ctx, cx, cy, 30 * bg.s, '11:11', 0.95);
    } else if (t < C.tearCut) {
      PP.drawBg(ctx, 'B5', { x: 0.5, y: 0.52, z: 1.1 }, { variant: 'dark' });
      flags.phone = true;
      PP.phone(ctx, 540, 940, 1.2, { t, glow: 1, banner: C.buzz[3], msgs: [msg('k6')] });
    } else if (t < C.seven) {
      PP.drawBg(ctx, 'B1', { x: 0.5, y: 0.5, z: 1.4 }, { variant: 'dark' });
      const k = (t - C.tearCut) / (C.seven - C.tearCut), h = 2250 * (1 + k * 0.05), A = [0.58, 0.42];
      char(ctx, t, 'M7', 540, 880, h, { anchor: A, tint: 'rgba(20,30,90,0.18)', light: { x: 0.85, y: 0.8, r: 0.8, color: 'rgba(150,200,255,0.4)' } });
      // a second tear, rolling down from her other eye
      const [ex, ey, sc] = onCut('M7', 540, 880, h, A, 0.678, 0.44);
      const u = PP.clamp((t - C.tearCut - 0.5) / 1.6);
      if (u > 0 && u < 1) PP.with(ctx, () => {
        const y = ey + E.inOut(u) * 210 * sc;
        ctx.globalAlpha = Math.min(1, (1 - u) * 4);
        ctx.fillStyle = '#bfe4ff'; ctx.strokeStyle = '#1d1a1d'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(ex, y - 26); ctx.quadraticCurveTo(ex + 16, y, ex, y + 14); ctx.quadraticCurveTo(ex - 16, y, ex, y - 26); ctx.fill(); ctx.stroke();
      });
    } else {
      PP.with(ctx, () => { ctx.fillStyle = '#07080d'; ctx.fillRect(0, 0, W, H); });
      PP.drawBg(ctx, 'B5', { x: 0.5, y: 0.5, z: 1.6 }, { variant: 'dark', alpha: 0.5 });
      flags.phone = true;
      PP.phone(ctx, 540, 1000, 1.05, { t, glow: 0.8, urgent: true, banner: C.buzz[4], msgs: [msg('k7', { urgent: true })] });
      stampText(ctx, '7 DAYS', 540, 330, 210, t, C.sevenDays, '#e8463c', 0.05);
    }
  };

  // ---- 14. End card
  S.endCard = (ctx, t) => {
    PP.with(ctx, () => { ctx.fillStyle = '#0b0c12'; ctx.fillRect(0, 0, W, H); });
    ctx.drawImage(PP.bigPaper('night', W, H, 41), 0, 0);
    PP.with(ctx, () => { ctx.fillStyle = 'rgba(5,6,12,0.55)'; ctx.fillRect(0, 0, W, H); });
    const t0 = C.endCard;
    PP.ransom(ctx, '11:11', 540, 760, 230, t, t0 + 0.05, { seed: 11, stagger: 0.07 });
    stampText(ctx, '6 DAYS LEFT', 540, 1060, 120, t, t0 + 0.45, '#e8463c', -0.04);
    PP.with(ctx, () => { ctx.globalAlpha = PP.clamp((t - t0 - 0.7) / 0.3); ctx.font = '46px "Special Elite"'; ctx.fillStyle = '#f4efe4'; ctx.textAlign = 'center'; ctx.fillText('PART 2 — FOLLOW', 540, 1260); });
  };

  PP.SCENES = [
    [C.bedroom, C.note1, S.bedroom],
    [C.note1, C.cafeCut, S.note1],
    [C.cafeCut, C.train, S.cafe],
    [C.train, C.note3, S.train],
    [C.note3, C.street, S.note3],
    [C.street, C.eyes, S.street],
    [C.eyes, C.watch, S.eyes],
    [C.watch, C.okay, S.watch],
    [C.okay, C.stunned, S.okay],
    [C.stunned, C.met, S.stunned],
    [C.met, C.noIdea, S.met],
    [C.noIdea, C.night, S.noIdea],
    [C.night, C.endCard, S.night],
    [C.endCard, C.total, S.endCard],
  ];
  // transitions into a scene; the rest are cuts on the beat
  PP.TRANSITIONS = { [C.note1]: 'glitch', [C.note3]: 'glitch', [C.night]: 'tear', [C.train]: 'slide', [C.endCard]: 'cut' };
})(typeof window !== 'undefined' ? window : globalThis);
