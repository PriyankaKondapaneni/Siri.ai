// Paper: procedural textures (grain, mottling, fibres), torn edges with their white fibre core, scissor-cut
// stickers with a white border and a soft shadow, washi tape and postage stamps.
(function (g) {
  const PP = g.PP;

  // ---------------------------------------------------------------- textures
  // A seamless tile: a square of mottled, grainy, fibrous paper, mirrored four ways so it repeats without seams.
  function paperTile(size, o) {
    const half = size / 2;
    const t = PP.canvas(half, half);
    const c = t.getContext('2d');
    const [r0, g0, b0] = PP.rgb(o.base);
    const img = c.createImageData(half, half);
    const d = img.data;
    const R = PP.rng(PP.hash('tile', o.seed));
    const ms = o.mottleScale || 90;
    for (let y = 0; y < half; y++) {
      for (let x = 0; x < half; x++) {
        const m = PP.noise2(x / ms, y / ms, o.seed) * 0.6 + PP.noise2(x / (ms / 3), y / (ms / 3), o.seed + 7) * 0.4;
        const gr = (R() - 0.5) * 2;
        const k = 1 + m * (o.mottle ?? 0.05) + gr * (o.grain ?? 0.035);
        const i = (y * half + x) * 4;
        d[i] = PP.clamp(r0 * k, 0, 255);
        d[i + 1] = PP.clamp(g0 * k, 0, 255);
        d[i + 2] = PP.clamp(b0 * k * (o.blueShift ?? 1), 0, 255);
        d[i + 3] = 255;
      }
    }
    c.putImageData(img, 0, 0);
    // fibres: short faint curved hairs, some lighter, some darker
    const nf = Math.round((half * half) / (o.fibreDensity || 900));
    for (let k = 0; k < nf; k++) {
      const x = R() * half, y = R() * half, a = R() * Math.PI * 2, l = 6 + R() * 22;
      c.strokeStyle = R() < 0.5 ? `rgba(255,255,255,${0.05 + R() * 0.08})` : `rgba(60,40,20,${0.03 + R() * 0.06})`;
      c.lineWidth = 0.6 + R() * 0.8;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
      c.stroke();
    }
    // specks
    for (let k = 0; k < nf / 6; k++) {
      c.fillStyle = `rgba(40,25,10,${0.05 + R() * 0.12})`;
      c.beginPath();
      c.arc(R() * half, R() * half, 0.4 + R() * 1.1, 0, Math.PI * 2);
      c.fill();
    }
    if (o.extra) o.extra(c, half, R);
    const out = PP.canvas(size, size);
    const oc = out.getContext('2d');
    oc.drawImage(t, 0, 0);
    PP.with(oc, () => { oc.translate(size, 0); oc.scale(-1, 1); oc.drawImage(t, 0, 0); });
    PP.with(oc, () => { oc.translate(0, size); oc.scale(1, -1); oc.drawImage(t, 0, 0); });
    PP.with(oc, () => { oc.translate(size, size); oc.scale(-1, -1); oc.drawImage(t, 0, 0); });
    return out;
  }

  // The paper stock: every surface in the film is cut from one of these.
  PP.PAPERS = {
    kraft: { base: '#c79a6b', mottle: 0.05, grain: 0.05, fibreDensity: 500, mottleScale: 60 },
    cream: { base: '#f3ead8', mottle: 0.04, grain: 0.03 },
    white: { base: '#fbf7ee', mottle: 0.025, grain: 0.025 },
    navy: { base: '#1f2a4a', mottle: 0.12, grain: 0.06, fibreDensity: 700 },
    night: { base: '#151d38', mottle: 0.14, grain: 0.07, fibreDensity: 700 },
    ink: { base: '#24202a', mottle: 0.1, grain: 0.06 },
    brick: { base: '#b5654a', mottle: 0.12, grain: 0.06, fibreDensity: 600 },
    brickDark: { base: '#7e4a3c', mottle: 0.12, grain: 0.06, fibreDensity: 600 },
    slate: { base: '#56607a', mottle: 0.1, grain: 0.05 },
    mustard: { base: '#dca23a', mottle: 0.07, grain: 0.05 },
    coral: { base: '#e8644f', mottle: 0.06, grain: 0.045 },
    rose: { base: '#e7a3a0', mottle: 0.06, grain: 0.04 },
    amber: { base: '#f6c35b', mottle: 0.06, grain: 0.04 },
    skin: { base: '#f2cdb0', mottle: 0.04, grain: 0.03 },
    skinOld: { base: '#d9a888', mottle: 0.08, grain: 0.04 },
    hair: { base: '#2c1e1b', mottle: 0.12, grain: 0.06 },
    teal: { base: '#2f7f7a', mottle: 0.08, grain: 0.05 },
    sage: { base: '#93a77f', mottle: 0.08, grain: 0.05 },
    peach: { base: '#f4b48c', mottle: 0.06, grain: 0.04 },
    dawnPink: { base: '#f1a1a6', mottle: 0.06, grain: 0.04 },
    dawnYellow: { base: '#f7dc8a', mottle: 0.05, grain: 0.04 },
    sky: { base: '#a9c7d8', mottle: 0.06, grain: 0.04 },
    newsprint: { base: '#e6e0cf', mottle: 0.05, grain: 0.04, extra: newsprintLines },
    notebook: { base: '#f7f3e8', mottle: 0.02, grain: 0.02, extra: notebookLines },
    graph: { base: '#eef0e8', mottle: 0.02, grain: 0.02, extra: graphLines },
    orange: { base: '#e48a3c', mottle: 0.08, grain: 0.05 },
    plum: { base: '#5b3a5e', mottle: 0.1, grain: 0.05 },
  };
  function newsprintLines(c, s, R) {
    c.fillStyle = 'rgba(40,36,30,0.16)';
    for (let y = 8; y < s; y += 9) {
      let x = 6;
      while (x < s - 6) { const w = 6 + R() * 28; c.fillRect(x, y, Math.min(w, s - 6 - x), 3); x += w + 4 + R() * 3; }
    }
  }
  function notebookLines(c, s) {
    c.strokeStyle = 'rgba(110,150,200,0.35)';
    c.lineWidth = 1.4;
    for (let y = 24; y < s; y += 34) { c.beginPath(); c.moveTo(0, y); c.lineTo(s, y); c.stroke(); }
  }
  function graphLines(c, s) {
    c.strokeStyle = 'rgba(90,140,120,0.18)';
    c.lineWidth = 1;
    for (let k = 0; k < s; k += 18) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k, s); c.moveTo(0, k); c.lineTo(s, k); c.stroke(); }
  }

  // A large sheet without tiling, for full-frame backgrounds: mottling at three scales, grain, fibres.
  PP.bigPaper = function (name, w, h, seed = 1) {
    return PP.cached(`big:${name}:${w}x${h}:${seed}`, () => {
      const o = PP.PAPERS[name];
      // the low-frequency mottle is built small and scaled up (fast), the grain and fibres at full size
      const sw = Math.ceil(w / 8), sh = Math.ceil(h / 8);
      const m = PP.canvas(sw, sh), mc = m.getContext('2d'), mi = mc.createImageData(sw, sh);
      const [r0, g0, b0] = PP.rgb(o.base);
      for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
        const v = PP.noise2(x / 40, y / 40, seed) * 0.5 + PP.noise2(x / 14, y / 14, seed + 3) * 0.35 + PP.noise2(x / 5, y / 5, seed + 9) * 0.15;
        const k = 1 + v * (o.mottle ?? 0.05) * 1.6, i = (y * sw + x) * 4;
        mi.data[i] = PP.clamp(r0 * k, 0, 255); mi.data[i + 1] = PP.clamp(g0 * k, 0, 255); mi.data[i + 2] = PP.clamp(b0 * k, 0, 255); mi.data[i + 3] = 255;
      }
      mc.putImageData(mi, 0, 0);
      const c = PP.canvas(w, h), ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(m, 0, 0, w, h);
      // grain and fibres from the tile, laid over at low strength
      ctx.globalAlpha = 0.5;
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = ctx.createPattern(PP.tex(name, 512), 'repeat');
      ctx.fillRect(0, 0, w, h);
      return c;
    });
  };

  PP.tex = function (name, size = 1024) {
    return PP.cached(`tex:${name}:${size}`, () => paperTile(size, { seed: PP.hash(name), ...PP.PAPERS[name] }));
  };
  PP.pattern = function (ctx, name, size = 1024) {
    return PP.cached(`pat:${name}:${size}`, () => ctx.createPattern(PP.tex(name, size), 'repeat'));
  };

  // ---------------------------------------------------------------- torn and cut edges
  // Resample a closed polygon, then push each point along its normal by fractal noise: a hand-torn edge.
  // Returns { pts, rim }: rim is a second, slightly larger and rougher edge, the white fibre core torn paper shows.
  PP.torn = function (poly, o = {}) {
    const rough = o.rough ?? 7, step = o.step ?? 5, seed = o.seed ?? 1, rimW = o.rim ?? 4;
    const pts = [], rim = [];
    let dist = 0;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const n = Math.max(1, Math.round(len / step));
      const nx = -(b[1] - a[1]) / (len || 1), ny = (b[0] - a[0]) / (len || 1);
      const edgeRough = o.edges ? o.edges[i] ?? rough : rough;
      for (let k = 0; k < n; k++) {
        const u = k / n;
        const x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u;
        const d = (PP.fbm1(dist / 38, seed, 4) * 1.3 + (PP.rand('tj', seed, dist | 0) - 0.5) * 0.45) * edgeRough;
        pts.push([x + nx * d, y + ny * d]);
        const rd = d + (edgeRough > 0.5 ? rimW * (0.35 + 1.1 * Math.abs(PP.noise1(dist / 9, seed + 3))) : 0);
        rim.push([x + nx * rd, y + ny * rd]);
        dist += len / n;
      }
    }
    return { pts, rim };
  };
  PP.rectPoly = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  PP.ellipsePoly = (cx, cy, rx, ry, n = 48) => Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * rx, cy + Math.sin((i / n) * Math.PI * 2) * ry]);
  PP.path = function (ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  };

  // A piece of torn paper: soft shadow, white fibre rim, textured face. fill: a PAPERS name or a CSS colour.
  PP.paperPiece = function (ctx, poly, fill, o = {}) {
    const { pts, rim } = PP.torn(poly, o);
    const sh = o.shadow ?? { blur: 18, dx: 5, dy: 9, a: 0.32 };
    PP.with(ctx, () => {
      if (sh) {
        ctx.shadowColor = `rgba(20,12,6,${sh.a})`;
        ctx.shadowBlur = sh.blur;
        ctx.shadowOffsetX = sh.dx;
        ctx.shadowOffsetY = sh.dy;
      }
      PP.path(ctx, o.rim === 0 ? pts : rim);
      ctx.fillStyle = o.rimColor || '#f6f1e6';
      ctx.fill();
    });
    PP.with(ctx, () => {
      PP.path(ctx, pts);
      if (PP.PAPERS[fill]) {
        ctx.fillStyle = PP.pattern(ctx, fill);
        if (o.texOffset) ctx.translate(o.texOffset[0], o.texOffset[1]);
      } else ctx.fillStyle = fill;
      ctx.fill();
    });
    if (o.tint) PP.with(ctx, () => { PP.path(ctx, pts); ctx.fillStyle = o.tint; ctx.fill(); });
    return pts;
  };

  // ---------------------------------------------------------------- stickers: scissor-cut figures
  // Draws `draw(ctx)` into a sprite, then gives it a hand-cut white border and a soft drop shadow.
  // Returns { canvas, ox, oy }: draw the canvas at (x - ox, y - oy) to put the figure's origin at (x, y).
  PP.sticker = function (key, w, h, ox, oy, draw, o = {}) {
    return PP.sprite(key, () => {
      const border = o.border ?? 9, pad = border + 40;
      const W = w + pad * 2, H = h + pad * 2;
      const art = PP.canvas(W, H);
      const ac = art.getContext('2d');
      ac.translate(pad + ox, pad + oy);
      draw(ac);
      // the white border: the silhouette dilated by a slightly irregular radius (cut by hand, not by machine)
      const sil = PP.canvas(W, H);
      const sc = sil.getContext('2d');
      sc.drawImage(art, 0, 0);
      sc.globalCompositeOperation = 'source-in';
      sc.fillStyle = o.borderColor || '#fbf8f0';
      sc.fillRect(0, 0, W, H);
      const out = PP.canvas(W, H);
      const oc = out.getContext('2d');
      const dil = PP.canvas(W, H);
      const dc = dil.getContext('2d');
      if (border > 0) {
        const n = 20;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          const r = border * (0.8 + 0.35 * PP.rand('bd', key, i));
          dc.drawImage(sil, Math.cos(a) * r, Math.sin(a) * r);
        }
        dc.drawImage(sil, 0, 0);
      }
      if (o.shadow !== false) {
        const sh = PP.canvas(W, H);
        const shc = sh.getContext('2d');
        shc.drawImage(border > 0 ? dil : art, 0, 0);
        shc.globalCompositeOperation = 'source-in';
        shc.fillStyle = 'rgba(25,14,6,1)';
        shc.fillRect(0, 0, W, H);
        oc.save();
        oc.globalAlpha = o.shadowAlpha ?? 0.34;
        oc.filter = `blur(${o.shadowBlur ?? 9}px)`;
        oc.drawImage(sh, o.shadowDx ?? 6, o.shadowDy ?? 10);
        oc.restore();
      }
      if (border > 0) oc.drawImage(dil, 0, 0);
      oc.drawImage(art, 0, 0);
      return { canvas: out, ox: pad + ox, oy: pad + oy };
    });
  };
  PP.drawSprite = function (ctx, s, x, y, rot = 0, sc = 1, alpha = 1) {
    PP.with(ctx, () => {
      ctx.globalAlpha *= alpha;
      ctx.translate(x, y);
      if (rot) ctx.rotate(rot);
      if (sc !== 1) ctx.scale(sc, sc);
      ctx.drawImage(s.canvas, -s.ox, -s.oy);
    });
  };

  // ---------------------------------------------------------------- washi tape
  PP.tape = function (ctx, x, y, w, h, rot, color = '#e9b8b0', o = {}) {
    PP.with(ctx, () => {
      ctx.translate(x, y);
      ctx.rotate(rot);
      const zig = (side) => {
        const pts = [];
        const n = Math.max(3, Math.round(h / 7));
        for (let i = 0; i <= n; i++) pts.push([side * (w / 2) + (i % 2 ? -side * 4 : 0) + (PP.rand('tz', o.seed, side, i) - 0.5) * 2, -h / 2 + (h * i) / n]);
        return side > 0 ? pts : pts.reverse();
      };
      const poly = [...zig(-1), ...zig(1)];
      ctx.shadowColor = 'rgba(20,10,0,0.18)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      PP.path(ctx, poly);
      ctx.fillStyle = PP.hex(color, o.alpha ?? 0.78);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.clip();
      if (o.stripes) {
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        for (let k = -w; k < w; k += 16) { ctx.beginPath(); ctx.moveTo(k, -h / 2); ctx.lineTo(k + 8, -h / 2); ctx.lineTo(k + 8 + h * 0.4, h / 2); ctx.lineTo(k + h * 0.4, h / 2); ctx.fill(); }
      }
      if (o.dots) {
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        for (let k = -w / 2 + 8; k < w / 2; k += 14) for (let j = -h / 2 + 7; j < h / 2; j += 12) { ctx.beginPath(); ctx.arc(k + ((j / 12) % 2) * 7, j, 2.2, 0, 7); ctx.fill(); }
      }
      // a sheen and the faint crinkles of tape
      const gr = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      gr.addColorStop(0, 'rgba(255,255,255,0.28)');
      gr.addColorStop(0.5, 'rgba(255,255,255,0.02)');
      gr.addColorStop(1, 'rgba(0,0,0,0.06)');
      ctx.fillStyle = gr;
      ctx.fillRect(-w / 2 - 6, -h / 2, w + 12, h);
    });
  };

  // ---------------------------------------------------------------- postage stamp
  // A perforated stamp; draw(ctx, w, h) fills its face.
  PP.stamp = function (ctx, x, y, w, h, rot, draw, o = {}) {
    PP.with(ctx, () => {
      ctx.translate(x, y);
      ctx.rotate(rot);
      const r = o.perf ?? 7;
      ctx.shadowColor = 'rgba(20,10,0,0.35)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 7;
      ctx.fillStyle = o.paper || '#f8f2e3';
      // perforations: the outline is a run of semicircular bites
      ctx.beginPath();
      const L = -w / 2, T = -h / 2;
      const edge = (x0, y0, x1, y1) => {
        const len = Math.hypot(x1 - x0, y1 - y0), n = Math.round(len / (r * 2.6));
        const ux = (x1 - x0) / len, uy = (y1 - y0) / len;
        for (let i = 0; i < n; i++) {
          const s = (i + 0.5) / n;
          const cx = x0 + (x1 - x0) * s, cy = y0 + (y1 - y0) * s;
          ctx.lineTo(cx - ux * r, cy - uy * r);
          ctx.arc(cx, cy, r, Math.atan2(uy, ux) + Math.PI, Math.atan2(uy, ux), true);
        }
        ctx.lineTo(x1, y1);
      };
      ctx.moveTo(L, T);
      edge(L, T, L + w, T);
      edge(L + w, T, L + w, T + h);
      edge(L + w, T + h, L, T + h);
      edge(L, T + h, L, T);
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.save();
      ctx.clip();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = PP.pattern(ctx, 'cream');
      ctx.fillRect(L, T, w, h);
      ctx.restore();
      const m = o.margin ?? 14;
      ctx.save();
      ctx.beginPath();
      ctx.rect(L + m, T + m, w - m * 2, h - m * 2);
      ctx.clip();
      ctx.translate(L + m, T + m);
      draw(ctx, w - m * 2, h - m * 2);
      ctx.restore();
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
