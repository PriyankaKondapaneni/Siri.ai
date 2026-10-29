// Art: the illustrated cast and backgrounds as collage pieces. Characters are cut-out stickers (a hand-cut white
// paper border, a soft shadow); backgrounds are drawn through a camera, optionally softened (depth of field) or
// graded. Images load before the page reports ready.
(function (g) {
  const PP = g.PP;
  const CUTS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'K1', 'K2', 'K3', 'K4', 'K5', 'S1'];
  const BGS = ['B1', 'B2', 'B3', 'B4', 'B5'];
  PP.IMG = {};
  PP.loadArt = () => Promise.all([
    ...CUTS.map((n) => load(n, `assets/art/cut/${n}.png`)),
    ...BGS.map((n) => load(n, `assets/art/gen/${n}.png`)),
  ]);
  function load(name, src) {
    return new Promise((res, rej) => { const im = new Image(); im.onload = () => { PP.IMG[name] = im; res(); }; im.onerror = () => rej(new Error('missing ' + src)); im.src = src; });
  }

  /** A character cut-out as a sticker: white border (radius in source px) and a soft shadow, cached once. */
  PP.cutSticker = function (name, o = {}) {
    return PP.cached(`cut:${name}:${o.border ?? 9}`, () => {
      const im = PP.IMG[name];
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
    const src = st ? st.canvas : im, pad = st ? st.pad : 0;
    let img = src;
    if (o.tint || o.light) {
      // lighting on the cut-out only: tint and a key light, applied source-atop on a scratch copy
      const key = `lit:${name}:${JSON.stringify(o.tint)}:${JSON.stringify(o.light)}:${!!st}`;
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
      ctx.drawImage(img, -pad - ax * im.width, -pad - ay * im.height);
    });
  };

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
      const cx = PP.clamp(cam.x ?? 0.5, 0, 1) * im.width, cy = PP.clamp(cam.y ?? 0.5, 0, 1) * im.height;
      ctx.drawImage(im, -cx, -cy);
    });
    return { s: cover, map: (ix, iy) => [PP.W / 2 + (ix * im.width - (cam.x ?? 0.5) * im.width) * cover, PP.H / 2 + (iy * im.height - (cam.y ?? 0.5) * im.height) * cover] };
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
