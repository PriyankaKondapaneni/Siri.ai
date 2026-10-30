// The rig: characters as soft puppets, the way TV anime and Live2D models move a single drawing. Each cut-out is
// warped through a mesh: the head tilts on the neck and turns on a sphere (the face slides across the skull, the
// back hair the other way), the hair follows the head a beat late and overshoots, long hair swings, the body leans
// and breathes. Poses are held on twos (12 drawings a second) like cel animation; the camera stays smooth.
// Load after art.js and shots.js; switch on with PP.RIG = true.
(function (g) {
  const PP = g.PP;
  const ON_TWOS = 12;
  PP.twos = (t) => Math.floor(t * ON_TWOS + 1e-6) / ON_TWOS;

  // ---------------------------------------------------------------- geometry of a character's head
  const GEO = {};
  function geo(name) {
    if (GEO[name]) return GEO[name];
    const f = PP.FACES[name], im = PP.IMG[name];
    if (!f || !f.eyes || f.eyes.length < 2 || !im) return (GEO[name] = null);
    const W = im.width, H = im.height;
    const [[x1, y1], [x2, y2]] = f.eyes.map(([x, y]) => [x * W, y * H]);
    const ecx = (x1 + x2) / 2, ecy = (y1 + y2) / 2, d = Math.hypot(x2 - x1, y2 - y1);
    return (GEO[name] = {
      W, H, d, ecx, ecy,
      fcx: ecx, fcy: ecy + 0.3 * d, // face centre
      rx: 1.35 * d, ry: 1.5 * d, // the head as a sphere (skull plus hair volume)
      nx: ecx, ny: ecy + 1.15 * d, // the neck pivot
      longHair: name[0] === 'M',
    });
  }

  // ---------------------------------------------------------------- poses
  // pose: { tilt (rad), yaw (-1..1), pitch (-1..1), lean (rad), bob (px), breath (0..1 scale of the breath) }
  const P0 = { tilt: 0, yaw: 0, pitch: 0, lean: 0, bob: 0, breath: 1 };
  // idle life: never a statue. A slow drift of the head and a breath, different per character instance
  function idle(t, seed) {
    const r = (k) => PP.rand('idle', seed, k);
    return {
      tilt: 0.018 * Math.sin(t * (0.55 + r(1) * 0.3) + r(2) * 6) + 0.008 * Math.sin(t * 1.7 + r(3) * 6),
      yaw: 0.07 * Math.sin(t * (0.35 + r(4) * 0.25) + r(5) * 6),
      pitch: 0.05 * Math.sin(t * (0.45 + r(6) * 0.2) + r(7) * 6),
      lean: 0.006 * Math.sin(t * 0.4 + r(8) * 6),
      bob: 0, breath: 1,
    };
  }
  PP.rigPose = function (t, seed, extra) {
    const a = idle(t, seed), b = typeof extra === 'function' ? extra(t) || {} : extra || {};
    const o = { ...P0 };
    const gain = PP.RIG_GAIN || 1;
    for (const k of Object.keys(P0)) o[k] = k === 'breath' ? (b.breath ?? 1) : ((a[k] || 0) + (b[k] || 0)) * gain;
    return o;
  };

  // ---------------------------------------------------------------- the deformation
  const smooth = (x) => { x = PP.clamp(x); return x * x * (3 - 2 * x); };
  // where a point of the head goes under a pose (head only, before the body)
  function headMove(G, p, x, y) {
    const ux = (x - G.fcx) / G.rx, uy = (y - G.fcy) / G.ry, r2 = ux * ux + uy * uy;
    // front-ness on the sphere: the face (1) slides the most, the outline (0) stays, hair behind (-) slides back
    const z = r2 < 1 ? Math.sqrt(1 - r2) : -0.35 * smooth(r2 - 1);
    let dx = p.yaw * 0.32 * G.rx * (z - 0.22);
    let dy = p.pitch * 0.22 * G.ry * (z - 0.22) + p.bob;
    // a slight squash of the far side of the face when turning, so the turn reads in perspective
    dx += -p.yaw * 0.05 * (x - G.fcx) * (z > 0 ? z : 0) * Math.sign(x - G.fcx) * Math.sign(p.yaw || 1);
    // tilt about the neck
    const px = x + dx - G.nx, py = y + dy - G.ny, c = Math.cos(p.tilt), s = Math.sin(p.tilt);
    return [G.nx + px * c - py * s - x, G.ny + px * s + py * c - y];
  }
  function headWeight(G, x, y) {
    const v = y <= G.ny ? 1 : 1 - smooth((y - G.ny) / (0.5 * G.d));
    const h = 1 - smooth((Math.abs(x - G.ecx) - 1.8 * G.d) / (0.7 * G.d));
    return v * h;
  }
  // 0 on the face, rising to 1 in the hair around it
  function hairness(G, x, y) {
    const ux = (x - G.fcx) / (1.05 * G.d), uy = (y - G.fcy) / (1.25 * G.d);
    return smooth((Math.sqrt(ux * ux + uy * uy) - 0.95) / 0.6);
  }
  function hangWeight(G, x, y) {
    if (!G.longHair || y < G.ny - 0.3 * G.d) return 0;
    const side = smooth((Math.abs(x - G.ecx) - 0.9 * G.d) / (0.5 * G.d));
    const down = 1 - smooth((y - G.ny) / (4.2 * G.d));
    return side * down;
  }
  // the displacement of image point (x, y), given the pose now and two earlier poses (for follow-through)
  function displace(G, x, y, p, pLag, pLag2, t) {
    let dx = 0, dy = 0;
    // body: lean about the feet (bottom centre), breath lifts the shoulders and head a little
    const bx = G.W / 2, by = G.H, k = (by - y) / G.H;
    const c = Math.cos(p.lean), s = Math.sin(p.lean);
    dx += bx + (x - bx) * c - (y - by) * s - x;
    dy += by + (x - bx) * s + (y - by) * c - y;
    const br = Math.sin(t * 2 * Math.PI / 3.6) * 0.5 + 0.5;
    dy -= p.breath * br * 0.006 * G.H * smooth(k * 1.6) * (y < G.ny + 2.5 * G.d ? 1 : 0.6);
    // head, with hair arriving late and overshooting
    const wH = headWeight(G, x, y);
    if (wH > 0) {
      const [hx, hy] = headMove(G, p, x, y), hn = hairness(G, x, y);
      if (hn > 0) {
        const [lx, ly] = headMove(G, pLag, x, y), [qx, qy] = headMove(G, pLag2, x, y);
        const lagx = lx + 0.35 * (lx - qx), lagy = ly + 0.35 * (ly - qy);
        dx += wH * (hx + hn * 0.75 * (lagx - hx)); dy += wH * (hy + hn * 0.75 * (lagy - hy));
      } else { dx += wH * hx; dy += wH * hy; }
    }
    // long hair hanging past the shoulders: carried by the head late, with a slow sway of its own
    const wg = hangWeight(G, x, y);
    if (wg > 0) {
      const yy = Math.min(y, G.ny - 0.1 * G.d);
      const [lx, ly] = headMove(G, pLag2, x, yy), [hx2] = headMove(G, pLag, x, yy);
      const depth = PP.clamp((y - G.ny) / (3 * G.d));
      dx += wg * (lx + 0.4 * (lx - hx2) * depth + Math.sin(t * 1.9 - depth * 2.4) * 0.012 * G.d * (1 + depth * 3));
      dy += wg * ly * 0.6;
    }
    return [dx, dy];
  }

  // which mesh cells hold any of the drawing, so empty cells are skipped
  const COLS = 18, ROWS = 27;
  function occupancy(name, im) {
    return PP.cached(`occ:${name}`, () => {
      const c = PP.canvas(COLS * 8, ROWS * 8), cc = c.getContext('2d');
      cc.drawImage(im, 0, 0, c.width, c.height);
      const d = cc.getImageData(0, 0, c.width, c.height).data, occ = new Uint8Array(COLS * ROWS);
      for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
        let any = 0;
        for (let yy = j * 8 - 1; yy < j * 8 + 9 && !any; yy++) for (let xx = i * 8 - 1; xx < i * 8 + 9; xx++) {
          if (xx < 0 || yy < 0 || xx >= c.width || yy >= c.height) continue;
          if (d[(yy * c.width + xx) * 4 + 3] > 4) { any = 1; break; }
        }
        occ[j * COLS + i] = any;
      }
      return occ;
    });
  }

  const MARGIN = 170;
  // draw src (same size as the cut-out) warped into a canvas with a margin
  function warp(name, src, p, pLag, pLag2, t) {
    const G = geo(name), W = G.W, H = G.H, M = MARGIN;
    const out = PP.canvas(W + 2 * M, H + 2 * M), oc = out.getContext('2d');
    const occ = occupancy(name, src);
    const V = new Float32Array((COLS + 1) * (ROWS + 1) * 2);
    for (let j = 0; j <= ROWS; j++) for (let i = 0; i <= COLS; i++) {
      const x = (i / COLS) * W, y = (j / ROWS) * H, [dx, dy] = displace(G, x, y, p, pLag, pLag2, t), k = (j * (COLS + 1) + i) * 2;
      V[k] = x + dx; V[k + 1] = y + dy;
    }
    const at = (i, j) => { const k = (j * (COLS + 1) + i) * 2; return [V[k] + M, V[k + 1] + M]; };
    const still = (i, j) => { const k = (j * (COLS + 1) + i) * 2; return Math.abs(V[k] - (i / COLS) * W) < 0.25 && Math.abs(V[k + 1] - (j / ROWS) * H) < 0.25; };
    // cells that don't move are drawn in one go through a clip of their union
    oc.save(); oc.beginPath();
    let anyStill = false;
    const moving = [];
    for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
      if (!occ[j * COLS + i]) continue;
      if (still(i, j) && still(i + 1, j) && still(i, j + 1) && still(i + 1, j + 1)) {
        oc.rect(M + (i / COLS) * W - 0.5, M + (j / ROWS) * H - 0.5, W / COLS + 1, H / ROWS + 1); anyStill = true;
      } else moving.push([i, j]);
    }
    if (anyStill) { oc.clip(); oc.drawImage(src, M, M); }
    oc.restore();
    // moving cells: two triangles each, an affine map per triangle, clipped with a hair of overlap against seams
    const tri = (s0, s1, s2, d0, d1, d2) => {
      const [x0, y0] = s0, [x1, y1] = s1, [x2, y2] = s2, [u0, v0] = d0, [u1, v1] = d1, [u2, v2] = d2;
      const den = x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1);
      if (Math.abs(den) < 1e-6) return;
      const a = (u0 * (y1 - y2) + u1 * (y2 - y0) + u2 * (y0 - y1)) / den;
      const b = (v0 * (y1 - y2) + v1 * (y2 - y0) + v2 * (y0 - y1)) / den;
      const c = (u0 * (x2 - x1) + u1 * (x0 - x2) + u2 * (x1 - x0)) / den;
      const d = (v0 * (x2 - x1) + v1 * (x0 - x2) + v2 * (x1 - x0)) / den;
      const e = (u0 * (x1 * y2 - x2 * y1) + u1 * (x2 * y0 - x0 * y2) + u2 * (x0 * y1 - x1 * y0)) / den;
      const f = (v0 * (x1 * y2 - x2 * y1) + v1 * (x2 * y0 - x0 * y2) + v2 * (x0 * y1 - x1 * y0)) / den;
      const cx = (u0 + u1 + u2) / 3, cy = (v0 + v1 + v2) / 3, grow = (u, v) => { const l = Math.hypot(u - cx, v - cy) || 1; return [u + (u - cx) / l * 1.3, v + (v - cy) / l * 1.3]; };
      const g0 = grow(u0, v0), g1 = grow(u1, v1), g2 = grow(u2, v2);
      oc.save();
      oc.beginPath(); oc.moveTo(g0[0], g0[1]); oc.lineTo(g1[0], g1[1]); oc.lineTo(g2[0], g2[1]); oc.closePath(); oc.clip();
      oc.setTransform(a, b, c, d, e, f);
      oc.drawImage(src, 0, 0);
      oc.restore();
    };
    for (const [i, j] of moving) {
      const s00 = [(i / COLS) * W, (j / ROWS) * H], s10 = [((i + 1) / COLS) * W, (j / ROWS) * H], s01 = [(i / COLS) * W, ((j + 1) / ROWS) * H], s11 = [((i + 1) / COLS) * W, ((j + 1) / ROWS) * H];
      tri(s00, s10, s11, at(i, j), at(i + 1, j), at(i + 1, j + 1));
      tri(s00, s11, s01, at(i, j), at(i + 1, j + 1), at(i, j + 1));
    }
    // seal the seams: where two triangles' anti-aliased edges meet inside the drawing, the coverage falls just short
    // of opaque and the rim light behind shows through as a hairline. Drawing the result over itself closes it.
    if (moving.length) { const cp = PP.canvas(out.width, out.height); cp.getContext('2d').drawImage(out, 0, 0); oc.drawImage(cp, 0, 0); }
    return out;
  }

  const r3 = (p) => [p.tilt, p.yaw, p.pitch, p.lean, p.bob, p.breath].map((v) => Math.round(v * 400) / 400).join(',');
  /**
   * The warped drawing for this frame: { canvas, pad, sil(color), shadow } or null when the character has no face data.
   * poseAt(t) gives the full pose at any time; t should already be on twos.
   */
  PP.rigImage = function (name, src, state, poseAt, t) {
    const G = geo(name);
    if (!G) return null;
    const p = poseAt(t), pl = poseAt(t - 0.09), pl2 = poseAt(t - 0.2);
    const key = `rig:${name}:${state}:${r3(p)}|${r3(pl)}|${r3(pl2)}:${Math.round(t * 12)}`;
    // its own small cache: warped frames are big (a canvas plus its light, rim and shadow), and on twos each one
    // is reused for only a frame or two, so keeping a handful is enough
    const hit = RIGC.get(key);
    if (hit) return hit;
    if (RIGC.size >= 10) RIGC.delete(RIGC.keys().next().value);
    const made = (() => {
      const canvas = warp(name, src, p, pl, pl2, t);
      const sils = {};
      return {
        canvas, pad: MARGIN,
        sil: (color) => sils[color] || (sils[color] = (() => { const c = PP.canvas(canvas.width, canvas.height), cc = c.getContext('2d'); cc.drawImage(canvas, 0, 0); cc.globalCompositeOperation = 'source-in'; cc.fillStyle = color; cc.fillRect(0, 0, c.width, c.height); return c; })()),
        shadow: () => sils.__shadow || (sils.__shadow = (() => { const c = PP.canvas(canvas.width, canvas.height), cc = c.getContext('2d'); cc.filter = 'blur(26px) brightness(0)'; cc.drawImage(canvas, 0, 0); return c; })()),
      };
    })();
    RIGC.set(key, made);
    return made;
  };
  const RIGC = new Map();

  // ---------------------------------------------------------------- light: god rays from a low sun, breathing slowly
  PP.rays = function (ctx, t, x, y, o = {}) {
    const n = o.n ?? 7, len = o.len ?? 2600, base = o.angle ?? 2.3, spread = o.spread ?? 0.9, rgb = o.rgb ?? '255,200,140', a = o.a ?? 0.12;
    PP.with(ctx, () => {
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < n; i++) {
        const ang = base + (i / (n - 1) - 0.5) * spread + 0.02 * Math.sin(t * 0.3 + i * 1.7);
        const w = (0.025 + 0.05 * PP.rand('ray', i)) * (1 + 0.15 * Math.sin(t * 0.8 + i));
        const k = a * (0.5 + 0.5 * PP.rand('rya', i)) * (0.75 + 0.25 * Math.sin(t * 0.6 + i * 2.3));
        const gr = ctx.createLinearGradient(x, y, x + Math.cos(ang) * len, y + Math.sin(ang) * len);
        gr.addColorStop(0, `rgba(${rgb},${k})`); gr.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(ang - w) * len, y + Math.sin(ang - w) * len); ctx.lineTo(x + Math.cos(ang + w) * len, y + Math.sin(ang + w) * len);
        ctx.closePath(); ctx.fill();
      }
    });
  };

  // ---------------------------------------------------------------- mouths: the shape of the vowel being spoken
  PP.vowelAt = function (T, t) {
    const w = T.words.find((x) => t >= x.s && t < x.e);
    if (!w) return '';
    const letters = w.w.toLowerCase().replace(/[^a-z]/g, ''), vs = letters.match(/[aeiouy]/g);
    if (!vs) return 'E';
    const v = vs[Math.min(vs.length - 1, Math.floor(((t - w.s) / Math.max(0.05, w.e - w.s)) * vs.length))];
    return { a: 'A', e: 'E', i: 'I', o: 'O', u: 'O', y: 'I' }[v];
  };
})(typeof window !== 'undefined' ? window : globalThis);
