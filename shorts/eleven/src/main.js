// The compositor: picks the shot for each frame, grades it, runs the transitions (fade in, dissolves; everything
// else is a hard cut on the word), then finishes the frame like film: bloom, vignette, fine grain, subtitles.
(function (g) {
  const PP = g.PP;
  const C = PP.CUES, T = g.TIMING;
  const W = PP.W, H = PP.H;
  const canvas = document.getElementById('c');
  const out = canvas.getContext('2d');
  PP.totalFrames = Math.round(C.total * PP.FPS);
  const subs = PP.subtitleChunks(T);
  const DISSOLVE = 0.35, FADE_IN = 0.3;

  const bufA = PP.canvas(W, H), bufB = PP.canvas(W, H);
  const shotAt = (t) => { const i = PP.SHOTS.findIndex(([a, b]) => t >= a && t < b); return i < 0 ? PP.SHOTS.length - 1 : i; };
  function drawShot(ctx, i, t) {
    const [a, b, look, fn] = PP.SHOTS[i];
    ctx.save();
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    fn(ctx, t, PP.clamp((t - a) / (b - a)));
    ctx.restore();
    PP.grade(ctx, look);
  }

  function grain(ctx, t) {
    const tiles = PP.cached('grain', () => Array.from({ length: 8 }, (_, k) => {
      const c = PP.canvas(540, 960), cx = c.getContext('2d'), img = cx.createImageData(540, 960), R = PP.rng(PP.hash('grain', k));
      for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (R() - 0.5) * 110; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      cx.putImageData(img, 0, 0);
      return c;
    }));
    PP.with(ctx, () => { ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.07; ctx.drawImage(tiles[Math.floor(t * 24) % tiles.length], 0, 0, W, H); });
  }
  function vignette(ctx) {
    const v = PP.cached('vignette', () => {
      const c = PP.canvas(W, H), cx = c.getContext('2d');
      const gr = cx.createRadialGradient(W / 2, H * 0.47, H * 0.25, W / 2, H * 0.5, H * 0.75);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)');
      cx.fillStyle = gr; cx.fillRect(0, 0, W, H);
      return c;
    });
    ctx.drawImage(v, 0, 0);
  }

  PP.renderFrame = function (f) {
    const t = f / PP.FPS;
    PP.FRAME.phone = false;
    const i = shotAt(t);
    const [start, , , , tr] = PP.SHOTS[i];
    const ctx = bufA.getContext('2d');
    drawShot(ctx, i, t);
    const phone = PP.FRAME.phone;
    if (tr === 'dissolve' && i > 0 && t < start + DISSOLVE) {
      // the previous shot, still running, fading out over the new one
      const bc = bufB.getContext('2d');
      drawShot(bc, i - 1, t);
      PP.with(ctx, () => { ctx.globalAlpha = 1 - PP.ease.inOut((t - start) / DISSOLVE); ctx.drawImage(bufB, 0, 0); });
    }
    PP.FRAME.phone = phone;
    PP.bloom(ctx, bufA, 0.2);
    vignette(ctx);
    if (tr === 'fadeIn' && t < start + FADE_IN) PP.with(ctx, () => { ctx.fillStyle = `rgba(0,0,0,${1 - PP.ease.inOut((t - start) / FADE_IN)})`; ctx.fillRect(0, 0, W, H); });
    if (t < C.endCard) {
      const ch = subs.find((c) => t >= c.s && t < c.e);
      if (ch && !(ch.kind === 'note' && PP.FRAME.phone)) PP.subtitle(ctx, ch, t, PP.FRAME.phone ? 1640 : 1500);
    }
    grain(ctx, t);
    out.drawImage(bufA, 0, 0);
  };

  PP.ready = (async () => {
    await Promise.all(['200 40px Inter', '300 40px Inter', '500 40px Inter', '600 40px Inter', 'italic 500 40px Inter'].map((f) => document.fonts.load(f)));
    await PP.loadArt();
    for (const [b, v] of [['B1', 'dark'], ['B1', 'blur'], ['B1', 'soft'], ['B2', 'soft'], ['B3', 'blur'], ['B4', 'blur'], ['B4', 'soft'], ['B5', 'dark']]) PP.bgVariant(b, v);
    return true;
  })();
})(typeof window !== 'undefined' ? window : globalThis);
