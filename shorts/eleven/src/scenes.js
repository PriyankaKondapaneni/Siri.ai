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
      PP.handwrite(ctx, [label], lx, ly, { font: '78px "Permanent Marker"', color: '#e8463c', progress: PP.clamp((t - t0 - 0.45) / 0.35), align: 'center' });
    }
  }

  const S = {};

  // ---- 1. Bedroom, 11:11: "Every night at 11:11... a stranger sends me a voice message. And everything he says comes true."
  S.bedroom = (ctx, t) => {
    const c = cam(t, [[0, { x: 0.42, y: 0.52, z: 1.02 }], [C.note1, { x: 0.47, y: 0.54, z: 1.14 }, E.inOut]]);
    const bg = PP.drawBg(ctx, 'B1', c, { variant: 'night' });
    const [wx, wy] = bg.map(0.62, 0), [wx2, wy2] = bg.map(1, 0.48);
    PP.rain(ctx, t, [wx, wy, wx2 - wx, wy2 - wy], { n: 70 });
    const [lx, ly] = bg.map(0.146, 0.36);
    PP.glowAt(ctx, lx, ly, 260, '255,190,120', 0.45 + 0.05 * Math.sin(t * 9));
    // the bedside clock: it glows on the stroke of 11:11
    const [cx, cy] = bg.map(0.262, 0.523);
    const pulse = t > C.clock1111 ? Math.max(0, 1 - (t - C.clock1111) / 1.2) : 0;
    PP.glowAt(ctx, cx, cy, 110 + pulse * 120, '120,200,255', 0.45 + pulse * 0.5);
    PP.with(ctx, () => { ctx.font = `${Math.round(54 * bg.s * 1.6)}px "Bebas Neue"`; ctx.fillStyle = `rgba(150,220,255,${0.85})`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(120,200,255,0.9)'; ctx.shadowBlur = 18; ctx.fillText('11:11', cx, cy); });
    // Mira in bed, lit by her phone
    const [jx, jy] = PP.jit(t, 'm2', 0.7);
    PP.drawCut(ctx, 'M2', 740 + jx, 1990 + jy, 1520 * breathe(t, 'm2'), { tint: 'rgba(14,20,60,0.32)', light: { x: 0.84, y: 0.55, r: 0.75, color: 'rgba(150,200,255,0.45)' } });
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
    const c = cam(t, [[a, { x: 0.81, y: 0.135, z: 3.0 }], [a + 0.55, { x: 0.8, y: 0.14, z: 2.7 }, E.out], [a + 0.95, { x: 0.55, y: 0.5, z: 1.08 }, E.inOut], [C.train, { x: 0.53, y: 0.5, z: 1.12 }]]);
    const [sx, sy, sr] = PP.shake(t, C.spill, 22, 0.5);
    PP.with(ctx, () => {
      ctx.translate(sx, sy); ctx.rotate(sr);
      const bg = PP.drawBg(ctx, 'B2', c, {});
      const [wx, wy] = bg.map(0.05, 0.25);
      PP.dust(ctx, t, [wx, wy, 500, 900], 50);
      const out = t > a + 0.75;
      if (out) {
        const spilled = t >= C.spill - 0.04;
        const slide = E.out(PP.clamp((t - a - 0.75) / 0.3));
        const [jx, jy] = PP.jit(t, 'm3', 0.7);
        PP.drawCut(ctx, spilled ? 'M3' : 'M1', 560 + (1 - slide) * 700 + jx, 2000 + jy, (spilled ? 1560 : 1600) * breathe(t, 'cafe'), { tint: 'rgba(255,200,140,0.08)' });
        if (spilled) {
          // a few extra drops flying off the cup
          for (let k = 0; k < 14; k++) {
            const u = (t - C.spill) / 0.7;
            if (u > 1) break;
            const ang = -1.2 + PP.rand('dr', k) * 1.6, sp = 500 + PP.rand('ds', k) * 700;
            const x = 820 + Math.cos(ang) * sp * u, y = 1240 + Math.sin(ang) * sp * u + 900 * u * u;
            PP.with(ctx, () => { ctx.fillStyle = 'rgba(92,52,24,0.9)'; ctx.beginPath(); ctx.ellipse(x, y, 7 + PP.rand('dz', k) * 8, 9 + PP.rand('dz', k) * 10, ang, 0, 7); ctx.fill(); });
          }
        }
      }
    });
    PP.flash(ctx, t, C.spill, 0.25, '255,245,230', 0.35);
  };

  // ---- 4. The train: "The guy on the train will ask your name. Lie." / "He asked. I lied."
  S.train = (ctx, t) => {
    const flicker = PP.rand('fl', PP.boil(t, 8)) < 0.06 ? 0.75 : 1;
    const closeOnHer = t > C.lied - 0.05;
    const c = closeOnHer ? cam(t, [[C.lied - 0.05, { x: 0.5, y: 0.5, z: 1.2 }], [C.note3, { x: 0.5, y: 0.5, z: 1.26 }]]) : cam(t, [[C.train, { x: 0.5, y: 0.45, z: 1.05 }], [C.lied, { x: 0.5, y: 0.47, z: 1.16 }, E.inOut]]);
    const [sx, sy] = t > C.shaking ? PP.shake(t, C.shaking, 9, 0.9) : [0, 0];
    PP.with(ctx, () => {
      ctx.translate(sx, sy);
      PP.drawBg(ctx, 'B3', c, { variant: closeOnHer ? 'blur' : 'soft' });
      const coldTint = `rgba(20,40,40,${0.2 + (1 - flicker) * 0.5})`;
      if (!closeOnHer) {
        // Mira on the left; the man takes the seat across, then leans in
        const [jx, jy] = PP.jit(t, 'm4', 0.7);
        PP.drawCut(ctx, 'M4', 330 + jx, 2010 + jy, 1420 * breathe(t, 'm4'), { tint: coldTint });
        if (t > C.trainGuy) {
          const inn = E.out(PP.clamp((t - C.trainGuy) / 0.4));
          const lean = E.inOut(PP.clamp((t - C.asked + 0.1) / 0.4));
          const [kx, ky] = PP.jit(t, 's1', 0.6);
          PP.drawCut(ctx, 'S1', 860 + (1 - inn) * 500 - lean * 70 + kx, 2000 + ky, 1380 * (1 + lean * 0.06), { tint: `rgba(10,30,30,${0.3 + (1 - flicker) * 0.4})`, alpha: inn, flip: false });
        }
      } else {
        const [jx, jy] = PP.jit(t, 'm4c', t > C.shaking ? 3 : 0.7);
        PP.drawCut(ctx, 'M4', 560 + jx, 2600 + jy, 2900, { tint: coldTint });
      }
      PP.with(ctx, () => { ctx.fillStyle = `rgba(0,0,0,${(1 - flicker) * 0.4})`; ctx.fillRect(0, 0, W, H); });
    });
    // his warning, on a small phone floating in the corner
    if (t < line('k2').e + 0.4) {
      flags.phone = true;
      const k = E.outBack(PP.clamp((t - C.train) / 0.35), 1.4), out = PP.clamp((t - line('k2').e - 0.1) / 0.3);
      PP.phone(ctx, 790, 470 - out * 900, 0.5 * k, { t, rot: -0.08, glow: 0.6, banner: C.buzz[1], msgs: [msg('k2')] });
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
    const c = cam(t, [[C.street, { x: 0.5, y: 0.6, z: 1.06 }], [C.pulled, { x: 0.5, y: 0.62, z: 1.16 }, E.in], [C.eyes, { x: 0.5, y: 0.62, z: 1.2 }]]);
    const [sx, sy, sr] = PP.shake(t, C.impact, 26, 0.7);
    PP.with(ctx, () => {
      ctx.translate(sx, sy); ctx.rotate(sr);
      const bg = PP.drawBg(ctx, 'B4', c, {});
      const [rx, ry] = bg.map(0.461, 0.163);
      PP.glowAt(ctx, rx, ry, 170, '255,60,40', 0.6 + 0.25 * Math.sin(t * 7));
      const [vx, vy] = bg.map(0.62, 0.53);
      PP.headlights(ctx, t, C.car - 0.2, C.impact + 0.05, vx, vy);
      const pulled = t > C.pulled;
      const pull = E.out(PP.clamp((t - C.pulled) / 0.3));
      const [jx, jy] = PP.jit(t, 'm5', 0.8);
      PP.drawCut(ctx, 'M5', 700 - pull * 110 + jx, 2000 + jy, 1500, { rot: -pull * 0.08, light: { x: 0.9, y: 0.4, r: 0.8, color: `rgba(255,220,170,${0.2 + 0.4 * PP.clamp((t - C.car) / 1.2)})` } });
      if (pulled) {
        const inn = E.out(PP.clamp((t - C.pulled) / 0.22));
        PP.drawCut(ctx, 'K2', -150 + inn * 470, 2020, 1600, { flip: true, light: { x: 0.2, y: 0.3, r: 0.8, color: 'rgba(255,200,140,0.3)' } });
      }
    });
    PP.speedLines(ctx, t, 600, 1000, PP.clamp((t - C.pulled) / 0.2) * (1 - PP.clamp((t - C.impact - 0.2) / 0.4)));
    PP.flash(ctx, t, C.impact, 0.45, '255,255,255', 0.95);
  };

  // ---- 7-8. "Dark eyes. A watch stopped at 11:11."
  S.eyes = (ctx, t) => {
    PP.drawBg(ctx, 'B4', { x: 0.45, y: 0.5, z: 1.4 }, { variant: 'dark' });
    const k = (t - C.eyes) / (C.watch - C.eyes);
    PP.drawCut(ctx, 'K3', 520, 2050 + k * 20, 2050 * (1.0 + k * 0.04), { sticker: true, light: { x: 0.15, y: 0.35, r: 0.7, color: 'rgba(255,190,120,0.35)' } });
  };
  S.watch = (ctx, t) => {
    PP.drawBg(ctx, 'B4', { x: 0.6, y: 0.5, z: 1.6 }, { variant: 'dark' });
    const k = (t - C.watch) / (C.okay - C.watch);
    PP.drawCut(ctx, 'K5', 560, 1060, 2300 * (1 + k * 0.08), { anchor: [0.77, 0.605], light: { x: 0.77, y: 0.6, r: 0.3, color: 'rgba(255,220,180,0.3)' } });
    annotate(ctx, 560, 1060, 270 * (1 + k * 0.08), '11:11', t, C.watchFace - 0.35, 330, 560);
  };

  // ---- 9-12. "Hey. You okay?" / "It was his voice." / "Sorry... have we met?" / "He had no idea who I was."
  S.okay = (ctx, t) => {
    PP.drawBg(ctx, 'B4', { x: 0.4, y: 0.55, z: 1.5 }, { variant: 'dark' });
    const k = (t - C.okay) / (C.stunned - C.okay);
    PP.drawCut(ctx, 'K3', 600 - k * 20, 2250, 2400, { light: { x: 0.15, y: 0.35, r: 0.7, color: 'rgba(255,190,120,0.4)' } });
  };
  S.stunned = (ctx, t) => {
    PP.drawBg(ctx, 'B4', { x: 0.55, y: 0.55, z: 1.5 }, { variant: 'dark' });
    const k = (t - C.stunned) / (C.met - C.stunned);
    PP.drawCut(ctx, 'M6', 540, 2080 - k * 30, 2050 * (1 + k * 0.05), { light: { x: 0.8, y: 0.3, r: 0.7, color: 'rgba(255,200,150,0.3)' } });
    if (t > C.voiceRealise) {
      // the voice from the phone, as paper sound waves around her
      const p = PP.clamp((t - C.voiceRealise) / 1.2);
      for (let r = 0; r < 3; r++) PP.ink(ctx, PP.circlePts(540, 760, 380 + r * 70 + p * 60, 380 + r * 70 + p * 60, 50, -2.6, 1.0), { w: 4, color: `rgba(170,210,255,${0.6 * (1 - p)})`, seed: 80 + r, boil: PP.boil(t), dry: false });
    }
  };
  S.met = (ctx, t) => {
    PP.drawBg(ctx, 'B4', { x: 0.4, y: 0.55, z: 1.5 }, { variant: 'dark' });
    const k = (t - C.met) / (C.noIdea - C.met);
    PP.drawCut(ctx, 'K4', 520, 2080, 2050 * (1 + k * 0.04), { light: { x: 0.2, y: 0.35, r: 0.7, color: 'rgba(255,190,120,0.3)' } });
  };
  S.noIdea = (ctx, t) => {
    const k = E.inOut(PP.clamp((t - C.noIdea) / (C.night - C.noIdea)));
    PP.drawBg(ctx, 'B4', { x: 0.5, y: 0.6, z: 1.3 - k * 0.15 }, { variant: 'grey' });
    PP.drawCut(ctx, 'M6', 540, 2080 - k * 140, 2050 * (1 - k * 0.12), { tint: `rgba(40,44,60,${0.25 + k * 0.25})` });
    PP.with(ctx, () => { ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgba(128,128,128,${k * 0.7})`; ctx.fillRect(0, 0, W, H); });
  };

  // ---- 13. That night: the last message; the tear; "In seven days... I don't make it."
  S.night = (ctx, t) => {
    if (t < C.last) {
      const c = cam(t, [[C.night, { x: 0.3, y: 0.52, z: 1.5 }], [C.last, { x: 0.28, y: 0.53, z: 1.7 }, E.inOut]]);
      const bg = PP.drawBg(ctx, 'B1', c, { variant: 'night' });
      const [wx, wy] = bg.map(0.62, 0), [wx2, wy2] = bg.map(1, 0.48);
      PP.rain(ctx, t, [wx, wy, wx2 - wx, wy2 - wy], { n: 70 });
      const [cx, cy] = bg.map(0.262, 0.523);
      PP.glowAt(ctx, cx, cy, 240, '120,200,255', 0.6 + 0.2 * Math.sin(t * 3));
      PP.with(ctx, () => { ctx.font = `${Math.round(54 * bg.s * 1.6)}px "Bebas Neue"`; ctx.fillStyle = 'rgba(150,220,255,0.9)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(120,200,255,0.9)'; ctx.shadowBlur = 18; ctx.fillText('11:11', cx, cy); });
    } else if (t < C.tearCut) {
      PP.drawBg(ctx, 'B5', { x: 0.5, y: 0.52, z: 1.1 }, { variant: 'dark' });
      flags.phone = true;
      PP.phone(ctx, 540, 940, 1.2, { t, glow: 1, banner: C.buzz[3], msgs: [msg('k6')] });
    } else if (t < C.seven) {
      PP.drawBg(ctx, 'B1', { x: 0.5, y: 0.5, z: 1.4 }, { variant: 'dark' });
      const k = (t - C.tearCut) / (C.seven - C.tearCut);
      PP.drawCut(ctx, 'M7', 520, 2150, 2150 * (1 + k * 0.05), { tint: 'rgba(10,16,50,0.25)', light: { x: 0.9, y: 0.9, r: 0.8, color: 'rgba(150,200,255,0.45)' } });
    } else {
      // the countdown: his last words on a dark screen, then the stamp
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
