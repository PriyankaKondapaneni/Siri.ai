// 11:11, new Episode 2, "The Umbrella": the code cut. Wan clips replace the story shots (kaggle/epn02/jobs.json);
// here they are dark placeholders, so the cut carries only the hook's phone, the end card and the subtitles.
(function (g) {
  const PP = g.PP;
  const C = PP.CUES, T = g.TIMING;
  const K = PP.shotKit(C, T);
  const { W, H, msg, phoneShot, shot } = K;
  const dark = (ctx) => { ctx.fillStyle = '#0b0c12'; ctx.fillRect(0, 0, W, H); };
  shot(0, 1.1, 'danger', (ctx, t, u) => {
    const [sx, sy, sr] = PP.shake(t, 0, 14, 0.4);
    PP.with(ctx, () => { ctx.translate(sx, sy); ctx.rotate(sr); phoneShot(ctx, t, 'B5', [msg('h0', { urgent: true })], { u, urgent: true, seed: 41, focus: 1.9 - u * 0.2, focusY: 260 }); });
  });
  shot(1.1, 2.3, 'night', dark);                       // Wan: Kabir behind a rain-streaked bus window
  shot(2.3, C.hookEnd, 'night', dark);                 // Wan: Mira's eyes, the phone's red light
  shot(C.hookEnd, C.bus, 'dusk', dark);                // Wan: the street as the rain arrives
  shot(C.bus, C.shelter, 'dusk', dark);                // Wan: the number 14 pulling away, him in the window
  shot(C.shelter, C.receipt, 'dusk', dark);            // Wan: the empty shelter, the umbrella on the bench
  shot(C.receipt, C.think, 'dusk', dark);              // Wan: the receipt in the strap
  shot(C.think, C.lane, 'dusk', dark);                 // Wan: Mira working it out, umbrella in hand
  shot(C.lane, C.steps, 'night', dark, 'dissolve');    // Wan: Ash Lane at night
  shot(C.steps, C.endCard - 0.15, 'night', dark);      // Wan: Kabir on the steps, looking up
  shot(C.endCard - 0.15, C.endCard, null, (ctx) => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); });
  shot(C.endCard, C.total, null, (ctx, t) => {
    ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, W, H);
    const t0 = C.endCard, a = PP.clamp((t - t0 - 0.1) / 0.6);
    PP.spaced(ctx, '11:11', 540, 860, { font: '200 200px Inter', spacing: 14, glow: 'rgba(130,200,255,0.7)', blur: 36, alpha: a });
    PP.spaced(ctx, 'SIX DAYS LEFT', 540, 1040, { font: '500 32px Inter', spacing: 12, color: 'rgba(255,120,110,0.95)', alpha: PP.clamp((t - t0 - 0.5) / 0.5) });
    PP.spaced(ctx, 'TO BE CONTINUED', 540, 1110, { font: '300 30px Inter', spacing: 10, color: 'rgba(225,232,255,0.8)', alpha: PP.clamp((t - t0 - 0.8) / 0.5) });
  });
  PP.SHOTS = K.S;
})(typeof window !== 'undefined' ? window : globalThis);
