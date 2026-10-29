// The compositor: picks the scene for each frame, runs the transitions (glitch, paper tear, slide), lays the
// captions on top (Mira's on cream paper with a yellow marker, Kabir's out loud in blue; his voice notes are
// captioned by the phone itself), and finishes the frame (vignette, grade, stop-motion flicker, paper grain).
(function (g) {
  const PP = g.PP;
  const C = PP.CUES, T = g.TIMING;
  const W = PP.W, H = PP.H;
  const canvas = document.getElementById('c');
  const out = canvas.getContext('2d');
  PP.totalFrames = Math.round(C.total * PP.FPS);
  // caption phrases per line, so a phrase never spans two speakers
  const chunks = T.lines.flatMap((l) => PP.captionChunks(T.words.filter((w) => w.line === l.id)).map((c) => ({ ...c, who: l.who, kind: l.kind })));
  chunks.forEach((c, i) => { const n = chunks[i + 1]; if (n) c.e = Math.min(c.e, n.s - 0.02); });

  const bufA = PP.canvas(W, H), bufB = PP.canvas(W, H), bufC = PP.canvas(W, H);
  const sceneAt = (t) => PP.SCENES.findIndex(([a, b]) => t >= a && t < b);
  function drawScene(ctx, i, t) {
    ctx.save();
    ctx.fillStyle = '#0d0c12';
    ctx.fillRect(0, 0, W, H);
    PP.SCENES[i][2](ctx, t);
    ctx.restore();
  }

  function tearEdge(y, seed) {
    const pts = [];
    for (let x = -20; x <= W + 20; x += 6) pts.push([x, y + PP.fbm1(x / 70, seed) * 46 + (PP.rand('te', seed, x) - 0.5) * 10]);
    return pts;
  }

  function grain(ctx, t) {
    const tiles = PP.cached('grain', () => Array.from({ length: 6 }, (_, k) => {
      const c = PP.canvas(540, 960), cx = c.getContext('2d'), img = cx.createImageData(540, 960), R = PP.rng(PP.hash('grain', k));
      for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (R() - 0.5) * 120; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      cx.putImageData(img, 0, 0);
      return c;
    }));
    PP.with(ctx, () => {
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.08;
      ctx.drawImage(tiles[PP.boil(t, 12) % tiles.length], 0, 0, W, H);
    });
  }

  function finish(ctx, t) {
    PP.with(ctx, () => {
      const gr = ctx.createRadialGradient(W / 2, H * 0.46, H * 0.28, W / 2, H * 0.5, H * 0.8);
      gr.addColorStop(0, 'rgba(0,0,0,0)');
      gr.addColorStop(1, 'rgba(8,6,18,0.5)');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H);
      // a cool-shadow / warm-highlight split, like a printed photo collage
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = 'rgba(255,206,170,0.14)';
      ctx.fillRect(0, 0, W, H);
      const f = (PP.rand('flick', PP.boil(t, 12)) - 0.5) * 0.03;
      ctx.globalCompositeOperation = f > 0 ? 'screen' : 'multiply';
      ctx.fillStyle = f > 0 ? `rgba(255,240,220,${f})` : `rgba(0,0,0,${-f})`;
      ctx.fillRect(0, 0, W, H);
    });
  }

  function captions(ctx, t) {
    if (t >= C.endCard) return;
    const ch = chunks.find((c) => t >= c.s - 0.04 && t < c.e);
    if (!ch) return;
    if (ch.kind === 'note' && PP.FRAME.phone) return; // the phone shows his words itself
    const y = PP.FRAME.phone ? 1640 : 1480;
    if (ch.who === 'kabir') PP.drawCaption(ctx, [ch], t, { y, marker: '#7fb8ff', size: 76 });
    else PP.drawCaption(ctx, [ch], t, { y, marker: '#f4c64e' });
  }

  PP.renderFrame = function (f) {
    const t = f / PP.FPS;
    PP.FRAME.phone = false;
    const i = Math.max(0, sceneAt(t));
    const start = PP.SCENES[i][0];
    const kind = i > 0 ? PP.TRANSITIONS[start] : null;
    const dur = kind === 'tear' ? 0.5 : kind === 'slide' ? 0.3 : kind === 'glitch' ? 0.4 : 0;
    const ctx = bufA.getContext('2d');
    const inT = dur && t < start + dur;
    if (inT && (kind === 'tear' || kind === 'slide')) {
      const k = PP.ease.inOut((t - start) / dur);
      drawScene(ctx, i - 1, t);
      const bc = bufB.getContext('2d');
      PP.FRAME.phone = false;
      drawScene(bc, i, t);
      if (kind === 'tear') {
        const y = H * (1 - k) + 60 * (1 - k);
        const edge = tearEdge(y, PP.hash('tear', start));
        PP.with(ctx, () => {
          ctx.beginPath();
          ctx.moveTo(-20, H + 20);
          edge.forEach(([x, yy]) => ctx.lineTo(x, yy));
          ctx.lineTo(W + 20, H + 20);
          ctx.closePath();
          ctx.save();
          ctx.shadowColor = 'rgba(10,6,4,0.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = -12;
          ctx.fillStyle = '#f4efe4'; ctx.fill();
          ctx.restore();
          ctx.clip();
          ctx.drawImage(bufB, 0, 12);
        });
      } else {
        // the new scene slides in from the right like a card dealt over the old one
        PP.with(ctx, () => {
          ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 50; ctx.shadowOffsetX = -20;
          ctx.drawImage(bufB, W * (1 - k), 0);
        });
      }
    } else drawScene(ctx, i, t);
    if (inT && kind === 'glitch') {
      const k = (t - start) / dur;
      const cc = bufC.getContext('2d');
      cc.drawImage(bufA, 0, 0);
      PP.glitch(ctx, bufC, t, Math.pow(1 - k, 1.5));
    }
    // a short glitch on the impact and on the last message, too
    for (const [t0, d] of [[C.impact, 0.25], [C.tearCut - 0.15, 0.15]]) {
      if (t >= t0 && t < t0 + d) { const cc = bufC.getContext('2d'); cc.drawImage(bufA, 0, 0); PP.glitch(ctx, bufC, t, 0.8 * (1 - (t - t0) / d)); }
    }
    finish(ctx, t);
    captions(ctx, t);
    grain(ctx, t);
    out.drawImage(bufA, 0, 0);
  };

  PP.ready = (async () => {
    const fams = ['"Patrick Hand"', 'Caveat', '"Permanent Marker"', '"Abril Fatface"', '"Bebas Neue"', '"Alfa Slab One"', '"Archivo Black"', '"Rubik Mono One"', '"Special Elite"', 'italic 900 40px "Playfair Black Italic"', '600 40px Fredoka', '"Gochi Hand"'];
    await Promise.all(fams.map((f) => document.fonts.load(f.includes('px') ? f : `40px ${f}`)));
    await PP.loadArt();
    // warm up: stickers and graded backgrounds, so frame timing is even
    for (const n of PP.CUTS) { PP.cutSticker(n); if (PP.FACES[n]?.eyes?.length) PP.cutSticker(n, { state: 'b' }); }
    for (const [b, v] of [['B1', 'dark'], ['B5', 'dark'], ['B3', 'blur'], ['B4', 'dark'], ['B4', 'grey']]) PP.bgVariant(b, v);
    return true;
  })();
})(typeof window !== 'undefined' ? window : globalThis);
