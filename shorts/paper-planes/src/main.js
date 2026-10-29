// The compositor: picks the scene for each frame, runs the transitions, lays the captions and the plane stamp on
// top, and finishes the frame (vignette, warm grade, stop-motion exposure flicker, paper grain).
(function (g) {
  const PP = g.PP;
  const C = PP.CUES;
  const W = PP.W, H = PP.H;
  const canvas = document.getElementById('c');
  const out = canvas.getContext('2d');
  PP.totalFrames = Math.round(C.total * PP.FPS);
  const chunks = PP.captionChunks(g.TIMING.words);

  const bufA = PP.canvas(W, H), bufB = PP.canvas(W, H);
  const sceneAt = (t) => PP.SCENES.findIndex(([a, b]) => t >= a && t < b);
  function drawScene(ctx, i, t) {
    ctx.save();
    ctx.fillStyle = '#1b1620';
    ctx.fillRect(0, 0, W, H);
    PP.SCENES[i][2](ctx, t);
    ctx.restore();
  }

  // a torn edge across the frame at height y (screen px), for the paper-tear wipe
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
      ctx.globalAlpha = 0.09;
      ctx.drawImage(tiles[PP.boil(t, 12) % tiles.length], 0, 0, W, H);
    });
  }

  function finish(ctx, t) {
    // vignette and a warm, slightly lifted grade, like a photographed collage
    PP.with(ctx, () => {
      const gr = ctx.createRadialGradient(W / 2, H * 0.46, H * 0.3, W / 2, H * 0.5, H * 0.78);
      gr.addColorStop(0, 'rgba(0,0,0,0)');
      gr.addColorStop(1, 'rgba(18,10,20,0.42)');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = 'rgba(255,214,170,0.22)';
      ctx.fillRect(0, 0, W, H);
      // stop-motion exposure flicker: every step a hair brighter or darker
      const f = (PP.rand('flick', PP.boil(t, 12)) - 0.5) * 0.035;
      ctx.globalCompositeOperation = f > 0 ? 'screen' : 'multiply';
      ctx.fillStyle = f > 0 ? `rgba(255,240,220,${f})` : `rgba(0,0,0,${-f})`;
      ctx.fillRect(0, 0, W, H);
    });
  }

  function overlays(ctx, t) {
    // the plane stamp: counts in the cold open, then shows the plane we're on
    if (t >= C.countFrom && t < C.endCard) {
      let n, since;
      if (t < C.one) { n = Math.max(1, C.count(t)); since = -2; }
      else if (t < C.stampOne) { n = 47; since = -2; }
      else if (t < C.stampTwo) { n = 1; since = C.stampOne; }
      else { n = 2; since = C.stampTwo; }
      const pulse = t < C.one ? 1 + 0.04 * Math.sin(t * 40) * (t < C.countTo ? 1 : 0) : 1;
      PP.with(ctx, () => { ctx.translate(150, 300); ctx.scale(pulse * 0.8, pulse * 0.8); PP.planeStamp(ctx, 0, 0, n, t, since); });
    }
    if (t < C.endCard) PP.drawCaption(ctx, chunks, t, { y: 1460 });
  }

  PP.renderFrame = function (f) {
    const t = f / PP.FPS;
    const i = Math.max(0, sceneAt(t));
    const start = PP.SCENES[i][0];
    const kind = PP.TRANSITIONS[start];
    const dur = kind === 'tear' ? 0.5 : kind === 'slide' ? 0.32 : 0;
    const ctx = bufA.getContext('2d');
    if (dur && t < start + dur && i > 0) {
      const k = PP.ease.inOut((t - start) / dur);
      drawScene(ctx, i - 1, t);
      const bc = bufB.getContext('2d');
      drawScene(bc, i, t);
      if (kind === 'tear') {
        // the old scene is torn away upward, the new one underneath; the tear has a white fibre edge and a shadow
        const y = H * (1 - k) + 60 * (1 - k);
        const edge = tearEdge(y, PP.hash('tear', start));
        PP.with(ctx, () => {
          ctx.beginPath();
          ctx.moveTo(-20, H + 20);
          edge.forEach(([x, yy]) => ctx.lineTo(x, yy));
          ctx.lineTo(W + 20, H + 20);
          ctx.closePath();
          ctx.save();
          ctx.shadowColor = 'rgba(10,6,4,0.5)';
          ctx.shadowBlur = 30;
          ctx.shadowOffsetY = -12;
          ctx.fillStyle = '#f4efe4';
          ctx.fill();
          ctx.restore();
          ctx.clip();
          ctx.drawImage(bufB, 0, 12);
        });
      } else {
        PP.with(ctx, () => {
          ctx.shadowColor = 'rgba(10,6,4,0.55)';
          ctx.shadowBlur = 40;
          ctx.shadowOffsetY = -14;
          ctx.drawImage(bufB, 0, H * (1 - k));
        });
      }
    } else drawScene(ctx, i, t);
    finish(ctx, t);
    overlays(ctx, t);
    grain(ctx, t);
    out.drawImage(bufA, 0, 0);
  };

  // ready when the fonts are in and the big boards are built (so the first frames aren't slow or unstyled)
  PP.ready = (async () => {
    const fams = ['"Patrick Hand"', 'Caveat', '"Permanent Marker"', '"Abril Fatface"', '"Bebas Neue"', '"Alfa Slab One"', '"Archivo Black"', '"Rubik Mono One"', '"Special Elite"', 'italic 900 40px "Playfair Black Italic"', '600 40px Fredoka', '"Gochi Hand"'];
    await Promise.all(fams.map((f) => document.fonts.load(f.includes('px') ? f : `40px ${f}`)));
    for (const m of ['night', 'dawn']) for (const b of [0, 1]) PP.world(m, b);
    return true;
  })();
})(typeof window !== 'undefined' ? window : globalThis);
