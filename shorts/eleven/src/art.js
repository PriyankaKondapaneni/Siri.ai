// Art: the illustrated cast and backgrounds as collage pieces. Characters are cut-out stickers (a hand-cut white
// paper border, a soft shadow); backgrounds are drawn through a camera, optionally softened (depth of field) or
// graded. Images load before the page reports ready.
(function (g) {
  const PP = g.PP;
  const CUTS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8', 'K9', 'K10', 'M10', 'MK1', 'MK2', 'MK3', 'K11', 'M11', 'H1', 'A1', 'F1', 'S1', 'CK', 'HM', 'HK', 'M12', 'K12', 'M13', 'MK4', 'H2', 'M14'];
  const BGS = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'C1', 'T1', 'TR1', 'TD1', 'TD2'];
  const DIR = 'assets/art/v2';
  PP.CUTS = CUTS;
  PP.IMG = {};
  PP.FACES = {};
  PP.loadArt = () => Promise.all([
    ...CUTS.map((n) => load(n, `${DIR}/cut/${n}.png`)),
    ...BGS.map((n) => load(n, `${DIR}/gen/${n}.png`)),
    fetch(`${DIR}/faces.json`).then((r) => r.json()).then((j) => { PP.FACES = j; }),
  ]);
  function load(name, src) {
    return new Promise((res, rej) => { const im = new Image(); im.onload = () => { PP.IMG[name] = im; res(); }; im.onerror = () => rej(new Error('missing ' + src)); im.src = src; });
  }

  /** A character cut-out as a sticker: white border (radius in source px) and a soft shadow, cached once. */
  // ---- faces: blinks and mouths painted over the art in its own flat style (skin patch, then an ink line)
  const LINE = '#1d1a1d';
  function faceImage(name, state) {
    return PP.cached(`face:${name}:${state}`, () => {
      const im = PP.IMG[name], f = PP.FACES[name], W = im.width, H = im.height;
      const c = PP.canvas(W, H), cc = c.getContext('2d');
      cc.drawImage(im, 0, 0);
      const skin = `rgb(${f.skin.join(',')})`;
      cc.lineCap = 'round'; cc.lineJoin = 'round';
      if (state.includes('b')) {
        const mid = f.eyes.reduce((a, e) => a + e[0], 0) / f.eyes.length;
        for (const [ex, ey, ew, eh] of f.eyes) {
          const x = ex * W, y = ey * H, w = ew * W, h = eh * H;
          cc.fillStyle = skin;
          cc.beginPath(); cc.ellipse(x, y - h * 0.08, w * 0.98, h * 0.92, 0, 0, Math.PI * 2); cc.fill();
          // the closed lid: a soft downward curve, thicker in the middle, with a lash flick at the outer corner
          cc.strokeStyle = LINE; cc.lineWidth = W * 0.0075;
          cc.beginPath(); cc.moveTo(x - w * 0.78, y + h * 0.02); cc.quadraticCurveTo(x, y + h * 0.5, x + w * 0.78, y + h * 0.02); cc.stroke();
          if (name[0] === 'M') {
            const out = ex < mid ? -1 : 1;
            cc.lineWidth = W * 0.005;
            cc.beginPath(); cc.moveTo(x + out * w * 0.72, y + h * 0.08); cc.lineTo(x + out * w * 0.98, y - h * 0.12); cc.stroke();
          }
        }
      }
      const m = state.match(/m(\d)/);
      if (m && f.mouth) {
        const [mx, my, mw, mh] = f.mouth, x = mx * W, y = my * H, w = mw * W, h = Math.max(mh * H, w * 0.3);
        cc.fillStyle = skin;
        cc.beginPath(); cc.ellipse(x, y, w * 0.72, h * 1.1, 0, 0, Math.PI * 2); cc.fill();
        const open = m[1] === '1' ? 0.35 : 0.7;
        const rw = w * (0.32 + open * 0.12), rh = w * 0.1 + open * w * 0.32;
        cc.fillStyle = '#7c2a33'; cc.strokeStyle = LINE; cc.lineWidth = W * 0.005;
        cc.beginPath(); cc.ellipse(x, y + rh * 0.2, rw, rh, 0, 0, Math.PI * 2); cc.fill();
        cc.save(); cc.clip(); cc.fillStyle = '#e27b82'; cc.beginPath(); cc.ellipse(x, y + rh * 1.05, rw * 0.8, rh * 0.6, 0, 0, Math.PI * 2); cc.fill(); cc.restore();
        cc.beginPath(); cc.ellipse(x, y + rh * 0.2, rw, rh, 0, 0, Math.PI * 2); cc.stroke();
      }
      return c;
    });
  }
  function silhouette(name, color) {
    return PP.cached(`sil:${name}:${color}`, () => {
      const im = PP.IMG[name], c = PP.canvas(im.width, im.height), cc = c.getContext('2d');
      cc.drawImage(im, 0, 0); cc.globalCompositeOperation = 'source-in'; cc.fillStyle = color; cc.fillRect(0, 0, c.width, c.height);
      return c;
    });
  }
  function shadowOf(name) {
    return PP.cached(`shd:${name}`, () => {
      const im = PP.IMG[name], c = PP.canvas(im.width + 120, im.height + 120), cc = c.getContext('2d');
      cc.filter = 'blur(26px) brightness(0)'; cc.drawImage(im, 60, 60);
      return c;
    });
  }
  // a natural blink pattern: every 2.4-4.6 s, closed for ~0.1 s, sometimes a double blink
  PP.blinking = function (t, id) {
    let t0 = PP.rand('bl0', id) * 2;
    for (let k = 0; t0 < t + 1; k++) {
      if (t >= t0 && t < t0 + 0.1) return true;
      if (PP.rand('bld', id, k) < 0.2 && t >= t0 + 0.22 && t < t0 + 0.31) return true;
      t0 += 2.4 + PP.rand('bli', id, k) * 2.2;
    }
    return false;
  };

  PP.cutSticker = function (name, o = {}) {
    const state = o.state || '';
    return PP.cached(`cut:${name}:${o.border ?? 9}:${state}`, () => {
      const im = state ? faceImage(name, state) : PP.IMG[name];
      const pad = 40, W = im.width + pad * 2, H = im.height + pad * 2;
      const sil = PP.canvas(W, H), sc = sil.getContext('2d');
      sc.drawImage(im, pad, pad);
      // a hard silhouette (alpha > 0.5) so the border doesn't follow every wisp of hair
      const id = sc.getImageData(0, 0, W, H), d = id.data;
      for (let i = 0; i < d.length; i += 4) { const a = d[i + 3] > 110 ? 255 : 0; d[i] = 251; d[i + 1] = 248; d[i + 2] = 240; d[i + 3] = a; }
      sc.putImageData(id, 0, 0);
      const out = PP.canvas(W, H), oc = out.getContext('2d');
      const border = o.border ?? 9, dil = PP.canvas(W, H), dc = dil.getContext('2d');
      for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2, r = border * (0.75 + 0.4 * PP.rand('cb', name, k)); dc.drawImage(sil, Math.cos(a) * r, Math.sin(a) * r); }
      // shadow
      PP.with(oc, () => { oc.globalAlpha = 0.45; oc.filter = 'blur(14px) brightness(0)'; oc.drawImage(dil, 10, 16); });
      oc.drawImage(dil, 0, 0);
      oc.drawImage(im, pad, pad);
      return { canvas: out, pad, w: im.width, h: im.height };
    });
  };

  /**
   * Draw a cut-out. (x, y) is where the anchor point lands; h is its height on screen.
   * o: anchor [ax, ay] (0..1 of the image; default bottom centre), rot, alpha, flip, sticker (false for no border),
   *    tint: a CSS colour laid over it with source-atop (lighting), light: { x, y, r, color } a key light in image units
   */
  PP.drawCut = function (ctx, name, x, y, h, o = {}) {
    const st = o.sticker === false ? null : PP.cutSticker(name, o);
    const im = PP.IMG[name];
    const s = h / im.height;
    const [ax, ay] = o.anchor || [0.5, 1];
    const src = st ? st.canvas : o.state ? faceImage(name, o.state) : im, pad = st ? st.pad : 0;
    let img = src;
    if (o.tint || o.light) {
      // lighting on the cut-out only: tint and a key light, applied source-atop on a scratch copy
      const key = `lit:${name}:${o.state || ''}:${JSON.stringify(o.tint)}:${JSON.stringify(o.light)}:${!!st}`;
      img = PP.sprite(key, () => {
        const c = PP.canvas(src.width, src.height), cc = c.getContext('2d');
        cc.drawImage(src, 0, 0);
        cc.globalCompositeOperation = 'source-atop';
        if (o.tint) { cc.fillStyle = o.tint; cc.fillRect(0, 0, c.width, c.height); }
        if (o.light) {
          const L = o.light, lx = pad + L.x * im.width, ly = pad + L.y * im.height, r = L.r * im.width;
          const gr = cc.createRadialGradient(lx, ly, 0, lx, ly, r);
          gr.addColorStop(0, L.color); gr.addColorStop(1, 'rgba(0,0,0,0)');
          cc.globalCompositeOperation = 'source-atop';
          cc.fillStyle = gr; cc.fillRect(0, 0, c.width, c.height);
        }
        return { canvas: c };
      }).canvas;
    }
    PP.with(ctx, () => {
      ctx.globalAlpha *= o.alpha ?? 1;
      ctx.translate(x, y);
      if (o.rot) ctx.rotate(o.rot);
      ctx.scale(s * (o.flip ? -1 : 1), s);
      // breathing: a tiny vertical stretch from the bottom, so the shoulders and head rise and settle
      if (o.breath) { ctx.translate(0, (1 - ay) * im.height); ctx.scale(1, 1 + o.breath); ctx.translate(0, -(1 - ay) * im.height); }
      const ox = -pad - ax * im.width, oy = -pad - ay * im.height;
      // integration without a sticker border: a soft cast shadow and a rim of the scene's light along one edge
      if (o.shadow) { const sh = shadowOf(name); PP.with(ctx, () => { ctx.globalAlpha *= o.shadow.a ?? 0.35; ctx.drawImage(sh, ox - 60 + (o.shadow.dx ?? 20) / s, oy - 60 + (o.shadow.dy ?? 30) / s); }); }
      if (o.rim) { const sl = silhouette(name, o.rim.color); PP.with(ctx, () => { ctx.globalAlpha *= o.rim.a ?? 0.8; ctx.drawImage(sl, ox + (o.rim.dx ?? 0) / s, oy + (o.rim.dy ?? 0) / s); }); }
      if (o.sway) {
        // hair and cloth in the wind: vertical strips displaced by a travelling wave, weighted away from the face
        const { amp, t, from = 0, to = 0.4, speed = 5 } = o.sway, sw = 6, W2 = img.width;
        for (let x = 0; x < W2; x += sw) {
          const u = (x - pad) / im.width;
          const wgt = PP.clamp((u - to) / (from - to));
          const dy = wgt > 0 ? amp * wgt * Math.sin(t * speed - u * 9) : 0;
          const dx = wgt > 0 ? amp * 0.6 * wgt * Math.sin(t * speed * 0.7 - u * 6 + 1) : 0;
          ctx.drawImage(img, x, 0, sw + 1, img.height, ox + x + dx, oy + dy, sw + 1, img.height);
        }
      } else ctx.drawImage(img, ox, oy);
    });
  };

  // keep a camera centre where the image still covers the frame (no empty edges)
  const coverClamp = (c, frame, size) => { const h = frame / 2 / size; return h >= 0.5 ? 0.5 : PP.clamp(c, h, 1 - h); };

  // a softened copy of a background (depth of field), and graded copies (night, cold, warm, desaturated)
  PP.bgVariant = (name, v) => PP.cached(`bgv:${name}:${v}`, () => {
    const im = PP.IMG[name], c = PP.canvas(im.width, im.height), cc = c.getContext('2d');
    const F = { soft: 'blur(6px)', blur: 'blur(14px) brightness(0.8)', night: 'brightness(0.62) saturate(0.85) hue-rotate(-8deg)', cold: 'saturate(0.55) brightness(0.8) hue-rotate(12deg)', dark: 'blur(10px) brightness(0.45) saturate(0.7)', grey: 'grayscale(0.85) brightness(0.75) contrast(1.1)' };
    cc.filter = F[v] || 'none';
    cc.drawImage(im, 0, 0);
    return c;
  });

  /**
   * Draw a background to cover the frame through a camera: cam { x, y, z } with x, y the image point (0..1) at the
   * centre of the frame and z the zoom over a cover fit. o: variant, alpha.
   */
  PP.drawBg = function (ctx, name, cam, o = {}) {
    const im = o.variant ? PP.bgVariant(name, o.variant) : PP.IMG[name];
    const cover = Math.max(PP.W / im.width, PP.H / im.height) * (cam.z ?? 1);
    PP.with(ctx, () => {
      ctx.globalAlpha *= o.alpha ?? 1;
      ctx.translate(PP.W / 2, PP.H / 2);
      if (cam.rot) ctx.rotate(cam.rot);
      ctx.scale(cover, cover);
      const cx = coverClamp(cam.x ?? 0.5, PP.W, im.width * cover) * im.width, cy = coverClamp(cam.y ?? 0.5, PP.H, im.height * cover) * im.height;
      ctx.drawImage(im, -cx, -cy);
    });
    const mx = coverClamp(cam.x ?? 0.5, PP.W, im.width * cover), my = coverClamp(cam.y ?? 0.5, PP.H, im.height * cover);
    return { s: cover, map: (ix, iy) => [PP.W / 2 + (ix - mx) * im.width * cover, PP.H / 2 + (iy - my) * im.height * cover] };
  };

  /**
   * A background with depth: drawn in horizontal bands, where bands far from the horizon (the near ground) zoom and
   * pan more than the horizon as the camera moves, a cheap 2.5D parallax. cam { x, y, z, z0, px }: z0 the zoom at which
   * all bands agree, px an extra sideways drift in screen px for the nearest band. o: horizon (0..1), k, variant.
   */
  PP.drawBgDepth = function (ctx, name, cam, o = {}) {
    const im = o.variant ? PP.bgVariant(name, o.variant) : PP.IMG[name];
    const base = Math.max(PP.W / im.width, PP.H / im.height);
    const hz = o.horizon ?? 0.5, k = o.k ?? 1.2, z0 = cam.z0 ?? 1, N = 48;
    const depth = (v) => Math.abs(v - hz) / Math.max(hz, 1 - hz);
    const S = (v) => base * (cam.z + k * depth(v) * (cam.z - z0));
    const s0 = base * cam.z;
    const cx = coverClamp(cam.x ?? 0.5, PP.W, im.width * s0), cy = coverClamp(cam.y ?? 0.5, PP.H, im.height * s0);
    const Y = (v) => PP.H / 2 + (v - cy) * im.height * S(v);
    PP.with(ctx, () => {
      ctx.globalAlpha *= o.alpha ?? 1;
      for (let i = 0; i < N; i++) {
        const v0 = i / N, v1 = (i + 1) / N, vm = (v0 + v1) / 2, sm = S(vm);
        const y0 = Y(v0), y1 = Y(v1);
        const x = PP.W / 2 - cx * im.width * sm + (cam.px || 0) * depth(vm);
        ctx.drawImage(im, 0, v0 * im.height, im.width, im.height / N + 1, x, y0, im.width * sm, y1 - y0 + 1.5);
      }
    });
    const s = base * cam.z;
    return { s, map: (ix, iy) => [PP.W / 2 + (ix - cx) * im.width * S(iy) + (cam.px || 0) * depth(iy), Y(iy)] };
  };

  // a torn-paper panel holding an image region (for collage insets): the image clipped to a torn rectangle
  PP.panel = function (ctx, name, rect, cam, o = {}) {
    const { pts, rim } = PP.torn(PP.rectPoly(rect[0], rect[1], rect[2], rect[3]), { rough: o.rough ?? 6, seed: o.seed ?? 1, rim: 4 });
    PP.with(ctx, () => {
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12;
      PP.path(ctx, rim); ctx.fillStyle = '#f4efe4'; ctx.fill();
    });
    PP.with(ctx, () => {
      PP.path(ctx, pts); ctx.clip();
      const im = o.variant ? PP.bgVariant(name, o.variant) : PP.IMG[name];
      const s = Math.max(rect[2] / im.width, rect[3] / im.height) * (cam.z ?? 1);
      ctx.translate(rect[0] + rect[2] / 2, rect[1] + rect[3] / 2);
      ctx.scale(s, s);
      ctx.drawImage(im, -(cam.x ?? 0.5) * im.width, -(cam.y ?? 0.5) * im.height);
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
