// The shot kit: the helpers every episode's shot list is built from (characters lit into the scene, the
// bedroom set, phone inserts, clocks, over-the-shoulder foregrounds). Episode scene files call PP.shotKit(C, T).
(function (g) {
  const PP = g.PP;
  PP.shotKit = function (C, T) {
    const E = PP.ease;
    const W = PP.W, H = PP.H;
    const ENV = g.ENVELOPE || { live: [] };
  const line = (id) => T.lines.find((l) => l.id === id);
    const word = (id, w, n = 0) => T.words.filter((x) => x.line === id && x.w.toLowerCase().replace(/[^a-z0-9:']/g, '') === w)[n].s;
    const msg = (id, extra = {}) => ({ s: line(id).s, e: line(id).e, text: line(id).text, words: C.noteWords[id], time: '11:11 PM', ...extra });
    const lerpCam = (u, a, b, e = E.inOut) => { const k = e(PP.clamp(u)); return { x: PP.lerp(a.x, b.x, k), y: PP.lerp(a.y, b.y, k), z: PP.lerp(a.z, b.z, k) }; };
    const linear = (x) => x;
    const F = (PP.FRAME = PP.FRAME || {});

    // a character, lit by the scene: breathing, blinking, a soft shadow and a rim of the key light; `talk` lip-syncs
    function char(ctx, t, name, x, y, h, o = {}) {
      // with the rig on, the drawing changes on twos (12 a second) like cel animation; the camera stays smooth
      const rigOn = PP.RIG && PP.rigImage && o.rig !== false && PP.FACES[name]?.eyes?.length >= 2;
      const tc = t;
      if (rigOn) t = PP.twos(t);
      let state = o.blink !== false && PP.blinking(t, name + (o.id || '')) && PP.FACES[name]?.eyes?.length ? 'b' : '';
      if (o.talk) {
        const env = ENV[o.talk === true ? 'live' : o.talk] || [], fr = Math.round(t * 30), v = Math.max(env[fr] || 0, env[fr - 1] || 0, rigOn ? env[fr + 1] || 0 : 0);
        state += v > 0.45 ? 'm2' : v > 0.12 ? 'm1' : '';
        if (rigOn && v > 0.12) state += PP.vowelAt(T, tc) || '';
      }
      if (rigOn) {
        const seed = name + (o.id || ''), extra = o.pose;
        // a speaker's head moves with the voice: small lifts on stressed syllables, settling between phrases
        const env = o.talk ? ENV[o.talk === true ? 'live' : o.talk] || [] : null;
        const speak = (tt) => { if (!env) return 0; let a = 0; for (let k = -5; k <= 0; k++) a += env[Math.round(tt * 30) + k] || 0; return a / 6; };
        const poseFn = (tt) => { const e = typeof extra === 'function' ? extra(tt) || {} : extra || {}, v = speak(tt); return env ? { ...e, pitch: (e.pitch || 0) - 0.28 * v, tilt: (e.tilt || 0) + 0.02 * v } : e; };
        o = { ...o, rig: { t, poseAt: (tt) => PP.rigPose(tt, seed, poseFn) } };
      }
      // a face expression for this moment: 'h' happy eyes, 's' soft smile, 'w' worried mouth, 't' teary shine
      // (a string, or a function of time); a moving mouth always wins over a quiet one
      // a debug aid for lip sync: every talking face wide open, so its mouth can be located in a frame
      if (PP.FORCE_MOUTH && o.talk) state = state.replace(/m\d[AEIO]?/, '').replace('b', '') + 'm2';
      const face = typeof o.face === 'function' ? o.face(t) : o.face || '';
      if (face.includes('h')) state = state.replace('b', '');
      if (PP.FACES[name]) state += /m\d/.test(state) ? face.replace(/[sw]/g, '') : face;
      const breath = rigOn ? 0 : o.breath ?? Math.sin(t * 1.5 + name.length) * 0.005;
      PP.drawCut(ctx, name, x, y, h, { sticker: false, shadow: { a: 0.3, dx: 18, dy: 26 }, ...o, state, breath });
    }
    const onCut = (name, x, y, h, [ax, ay], u, v) => { const im = PP.IMG[name], s = h / im.height; return [x + (u - ax) * im.width * s, y + (v - ay) * im.height * s, s]; };
    // a blurred foreground shoulder for over-the-shoulder framing
    function foreground(ctx, name, x, y, h, o = {}) {
      PP.with(ctx, () => { ctx.filter = `blur(${o.blur ?? 16}px) brightness(${o.bright ?? 0.55})`; PP.drawCut(ctx, name, x, y, h, { sticker: false, flip: o.flip, anchor: o.anchor }); });
    }
    function clockHands(ctx, x, y, r, hh, mm, color = '#2a2226') {
      const ha = ((hh % 12) + mm / 60) / 12 * Math.PI * 2, ma = (mm / 60) * Math.PI * 2;
      PP.with(ctx, () => {
        ctx.strokeStyle = color; ctx.lineCap = 'round';
        ctx.lineWidth = r * 0.085; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(ha) * r * 0.5, y - Math.cos(ha) * r * 0.5); ctx.stroke();
        ctx.lineWidth = r * 0.055; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(ma) * r * 0.78, y - Math.cos(ma) * r * 0.78); ctx.stroke();
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r * 0.07, 0, 7); ctx.fill();
      });
    }
    function digital(ctx, x, y, size, text, a = 0.95) {
      PP.with(ctx, () => { ctx.font = `500 ${Math.round(size)}px Inter`; ctx.fillStyle = `rgba(160,228,255,${a})`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(110,200,255,0.95)'; ctx.shadowBlur = size * 0.5; ctx.fillText(text, x, y); });
    }
    // the bedroom set: depth-layered room, rain on the window, the lamp, the bedside clock
    function bedroom(ctx, t, cam, o = {}) {
      const bg = PP.drawBgDepth(ctx, 'B1', { ...cam, z0: 1 }, { horizon: 0.35, k: 0.9, variant: o.variant });
      const [wx, wy] = bg.map(0.57, 0), [wx2, wy2] = bg.map(1, 0.4);
      if (o.rain !== false) PP.rain(ctx, t, [wx, wy, wx2 - wx, wy2 - wy], { n: Math.round(60 * (o.rainAmount ?? 1)) });
      const [lx, ly] = bg.map(0.19, 0.45);
      PP.glowAt(ctx, lx, ly, 360 * bg.s / 1.25, '255,196,120', 0.42 * (o.lamp ?? 1));
      const [cx, cy] = bg.map(0.31, 0.553);
      const pulse = o.pulse ?? 0;
      PP.glowAt(ctx, cx, cy, (90 + pulse * 140) * bg.s / 1.25, '120,200,255', 0.35 + pulse * 0.45);
      digital(ctx, cx, cy, 30 * bg.s, o.clock || '11:11');
      return bg;
    }
    // a phone insert: the screen close, its room soft and dark behind, the light of the screen on everything
    function phoneShot(ctx, t, bgName, msgs, o = {}) {
      const u = o.u ?? 0;
      PP.drawBg(ctx, bgName, { x: 0.5, y: 0.5, z: 1.15 + u * 0.06 }, { variant: 'dark' });
      PP.with(ctx, () => { ctx.fillStyle = 'rgba(4,6,14,0.45)'; ctx.fillRect(0, 0, W, H); });
      const [hx, hy, hr] = PP.handheld(t, 4, o.seed ?? 3);
      const sc = (o.scale ?? 1.02) * (1 + u * (o.push ?? 0.05));
      const fy = o.y ?? 850;
      PP.with(ctx, () => {
        if (o.focus) { ctx.translate(540, fy); ctx.scale(o.focus, o.focus); ctx.translate(-540, -fy - (o.focusY ?? 0)); }
        PP.phone(ctx, 540 + hx, fy + hy + (o.rise ?? 0), sc, { t, rot: (o.rot ?? -0.02) + hr, glow: 1, urgent: o.urgent, banner: o.banner, bannerTitle: o.bannerTitle, bannerText: o.bannerText, bannerHold: o.bannerHold, clock: o.clock, header: o.header, sub: o.sub, emptyText: o.emptyText, msgs });
      });
      F.phone = true;
    }


    const S = [];
    const shot = (s, e, look, fn, tr) => S.push([s, e, look, fn, tr]);
    return { E, W, H, line, word, msg, lerpCam, linear, F, char, onCut, foreground, clockHands, digital, bedroom, phoneShot, S, shot };
  };
})(typeof window !== 'undefined' ? window : globalThis);
