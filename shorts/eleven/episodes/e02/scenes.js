// 11:11, Episode 2, "The Umbrella": the code cut. Wan clips replace the story shots (kaggle/epe02/jobs.json maps
// each shot to its clip); here they are dark placeholders. The code draws the two phone screens (his 11:11 note
// from Episode 1, and the new message at the end), the end card and the subtitles.
(function (g) {
  const PP = g.PP;
  const C = PP.CUES, T = g.TIMING;
  const K = PP.shotKit(C, T);
  const { W, H, msg, phoneShot, shot } = K;
  const dark = (ctx) => { ctx.fillStyle = '#0b0c12'; ctx.fillRect(0, 0, W, H); };
  shot(0, C.eyes, 'night', (ctx, t, u) => {                        // 0  Episode 1's last message, still playing
    phoneShot(ctx, t, 'B5', [msg('h0', { urgent: true })], { u, urgent: true, seed: 41, focus: 1.75 - u * 0.15, focusY: 240 });
  });
  shot(C.eyes, C.bus, 'night', dark);                              // 1  her face in the red glow ("Six days.")
  shot(C.bus, C.shelter, 'dusk', dark);                            // 2  a: the bus pulling away, b: him at the window
  shot(C.shelter, C.receipt, 'dusk', dark);                        // 3  the umbrella on the shelter bench
  shot(C.receipt, C.think, 'dusk', dark);                          // 4  a: the strap, b: the receipt
  shot(C.think, C.lane, 'dusk', dark);                             // 5  Mira working it out
  shot(C.lane, C.steps, 'night', dark, 'dissolve');                // 6  a, b: walking the lanes, c: his building
  shot(C.steps, C.handover, 'night', dark);                        // 7  him on the steps, waiting
  shot(C.handover, C.kTalk, 'night', dark);                        // 8  over her shoulder: the umbrella held out
  shot(C.kTalk, C.brother, 'night', dark);                         // 9  "You followed a bus in the rain. For an umbrella."
  shot(C.brother, C.strapName, 'night', dark);                     // 10 "It was my brother's."
  shot(C.strapName, C.door, 'night', dark);                        // 11 ARJUN, stitched inside the strap
  shot(C.door, C.photo, 'night', dark);                            // 12 "You're soaked. I'll make tea."
  shot(C.photo, C.kitchen, 'night', dark, 'dissolve');             // 13 a photograph turned to the wall
  shot(C.kitchen, C.mug, 'night', dark);                           // 14 "Blue suits you."
  shot(C.mug, C.buzz, 'night', dark);                              // 15 a: Mira with the mug, b: her eyes
  shot(C.buzz, C.him, 'night', (ctx, t, u) => {                    // 16 a new message, 11:11, unplayed
    const m = { s: 999, e: 1006, show: C.buzz + 0.7, text: '', words: [], time: '11:11 PM', urgent: true, idle: true };
    const [sx, sy, sr] = PP.shake(t, C.buzz + 0.2, 10, 0.35);
    PP.with(ctx, () => { ctx.translate(sx, sy); ctx.rotate(sr); phoneShot(ctx, t, 'B5', [m], { u, urgent: true, seed: 7, focus: 1.6 + u * 0.12, focusY: 200, banner: C.buzz + 0.2, bannerHold: 1.4 }); });
  });
  shot(C.him, C.endCard - 0.35, 'night', dark);                    // 17 a: him, right there, b: her face
  shot(C.endCard - 0.35, C.endCard, null, (ctx) => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); });
  shot(C.endCard, C.total, null, (ctx, t) => {
    ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, W, H);
    const t0 = C.endCard, a = PP.clamp((t - t0 - 0.1) / 0.6);
    PP.spaced(ctx, '11:11', 540, 860, { font: '200 200px Inter', spacing: 14, glow: 'rgba(130,200,255,0.7)', blur: 36, alpha: a });
    PP.spaced(ctx, 'SIX DAYS LEFT', 540, 1040, { font: '500 32px Inter', spacing: 12, color: 'rgba(255,120,110,0.95)', alpha: PP.clamp((t - t0 - 0.5) / 0.5) });
    PP.spaced(ctx, 'TO BE CONTINUED', 540, 1110, { font: '300 30px Inter', spacing: 10, color: 'rgba(225,232,255,0.8)', alpha: PP.clamp((t - t0 - 0.8) / 0.5) });
  });
  PP.SHOTS = K.S;
})(typeof window !== 'undefined' ? window : globalThis);
