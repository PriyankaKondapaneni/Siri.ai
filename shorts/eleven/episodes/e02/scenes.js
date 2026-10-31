// 11:11, Episode 2 (one minute), "The Umbrella": the code cut. Wan clips replace the story shots
// (kaggle/epe02/jobs.json); here they are dark placeholders, so the cut carries only the end card and the subtitles.
// Shots 3-9 keep the numbers of the old Part 2 cut, so its Wan clips (kaggle/epn02) drop straight in.
(function (g) {
  const PP = g.PP;
  const C = PP.CUES, T = g.TIMING;
  const K = PP.shotKit(C, T);
  const { W, H, shot } = K;
  const dark = (ctx) => { ctx.fillStyle = '#0b0c12'; ctx.fillRect(0, 0, W, H); };
  shot(0, C.hookB, 'night', dark);                     // 0  flash: the photograph turned to the wall
  shot(C.hookB, C.hookC, 'night', dark);               // 1  flash: Kabir in his kitchen, not quite looking
  shot(C.hookC, C.hookEnd, 'night', dark);             // 2  flash: Mira with the mug, frozen
  shot(C.hookEnd, C.bus, 'dusk', dark);                // 3  the street as the rain arrives
  shot(C.bus, C.shelter, 'dusk', dark);                // 4  the bus pulling away, him in the window
  shot(C.shelter, C.receipt, 'dusk', dark);            // 5  the empty shelter, the umbrella on the bench
  shot(C.receipt, C.think, 'dusk', dark);              // 6  the receipt in the strap (a: hands, b: receipt)
  shot(C.think, C.lane, 'dusk', dark);                 // 7  Mira working it out
  shot(C.lane, C.steps, 'night', dark, 'dissolve');    // 8  the lane, the bakery, his building
  shot(C.steps, C.handover, 'night', dark);            // 9  Kabir on the steps, looking up
  shot(C.handover, C.kTalk, 'night', dark);            // 10 over her shoulder: she holds the umbrella out
  shot(C.kTalk, C.kTake, 'night', dark);               // 11 Kabir: "You followed a bus in the rain."
  shot(C.kTake, C.kIsnt, 'night', dark);               // 12 he takes the umbrella ("It looked expensive.")
  shot(C.kIsnt, C.wide, 'night', dark);                // 13 Kabir: "It isn't."
  shot(C.wide, C.brother, 'night', dark);              // 14 the two of them on the steps, wide
  shot(C.brother, C.strapName, 'night', dark);         // 15 Kabir, the umbrella in his hands: "It was my brother's."
  shot(C.strapName, C.miraLook, 'night', dark);        // 16 the name stitched inside the strap
  shot(C.miraLook, C.door, 'night', dark);             // 17 Mira looks at him
  shot(C.door, C.flat, 'night', dark);                 // 18 Kabir at the open door (a: tea, b: "I know.")
  shot(C.flat, C.photo, 'night', dark, 'dissolve');    // 19 his flat: two mugs on the rack
  shot(C.photo, C.kitchen, 'night', dark);             // 20 a photograph turned to face the wall
  shot(C.kitchen, C.mug, 'night', dark);               // 21 Kabir: "Blue suits you."
  shot(C.mug, C.endCard - 0.15, 'night', dark);        // 22 Mira, the mug in her hands, realising (a/b)
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
