// The cue sheet: every scene boundary, every action and every sound effect is pinned to a word of the narration,
// so picture and sound stay in sync with the voice by construction (and a new take only needs re-timing).
// Loaded by the page (window.PP.CUES) and by the audio tools in Node (module.exports).
(function (g) {
  function build(T) {
    const words = T.words;
    // start of the nth occurrence of a word (matched without punctuation) within a line
    const W = (line, word, nth = 0, edge = 's') => {
      const m = words.filter((w) => w.line === line && w.w.toLowerCase().replace(/[^a-z0-9'-]/g, '') === word);
      if (!m[nth]) throw new Error(`cue: no "${word}" #${nth} in line ${line}`);
      return m[nth][edge];
    };
    const L = (id) => T.lines.find((l) => l.id === id);
    const end = T.duration;

    const c = {
      // scene starts
      hook: 0,
      one: L('one').s - 0.13,
      mira: L('mira').s - 0.12,
      lamp: L('lamp').s - 0.15,
      fold: L('fold').s - 0.17,
      throwScene: W('fold', 'and') - 0.06,
      off: L('off').s - 0.1,
      morning: L('back').s - 0.12,
      drawing: L('drawing').s - 0.1,
      badly: W('drawing', 'badly') - 0.18,
      question: L('question').s - 0.08,
      hi: L('hi').s - 0.15,
      wind: L('wind').s - 0.12,
      someone: L('someone').s - 0.1,
      endCard: end + 0.05,
      total: end + 3.6,
    };
    // actions inside scenes
    Object.assign(c, {
      countFrom: W('hook', 'forty-seven') - 0.05,
      countTo: W('hook', 'planes') + 0.2,
      titleIn: W('hook', 'planes') + 0.15,
      gather: W('hook', 'his'),
      stampOne: W('one', 'one'),
      tilt: L('mira').s,
      nameTag: W('mira', 'twenty-two'),
      cityPull: W('mira', 'city'),
      whip: L('lamp').s - 0.15,
      clock: W('lamp', 'two'),
      nights: [W('lamp', 'every'), W('lamp', 'single'), W('lamp', 'night')],
      folds: [W('fold', 'folded'), W('fold', 'grocery'), W('fold', 'list'), W('fold', 'plane')],
      throwAt: W('fold', 'threw'),
      flyFrom: W('fold', 'threw') + 0.3,
      landAt: W('land', 'windowsill') + 0.18,
      leoLooks: W('land', 'windowsill') + 0.45,
      lampOff: W('off', 'off'),
      great: W('off', 'great') - 0.12,
      scared: W('off', 'scared'),
      tear: L('back').s - 0.12,
      backFly: W('back', 'it'),
      bonk: W('back', 'back', 0, 'e') + 0.15,
      drawFrom: W('drawing', 'he\'d'),
      drawTo: W('drawing', 'her', 1, 'e') + 0.25,
      lampDraw: W('question', 'tiny'),
      qDraw: W('question', 'question'),
      stampTwo: W('hi', 'two'),
      hiFolds: [W('hi', 'folded'), W('hi', 'plane'), W('hi', 'number')],
      hiWrite: W('hi', 'one') + 0.05,
      hiWord: W('hi', 'hi'),
      gust: W('wind', 'wind'),
      throwTwo: L('wind').s - 0.1,
      dropFrom: W('wind', 'dropped'),
      dropTo: W('wind', 'alley') + 0.35,
      handIn: W('someone', 'someone'),
      grip: W('someone', 'picked') + 0.1,
      lift: W('someone', 'up'),
      wasnt: W('someone', 'wasn\'t'),
      sting: W('someone', 'him'),
      catBlink: W('someone', 'him') + 0.5,
    });
    // the plane count in the cold open: 1..47 between countFrom and countTo
    c.count = (t) => (t < c.countFrom ? 0 : Math.min(47, 1 + Math.floor(46 * Math.pow((t - c.countFrom) / (c.countTo - c.countFrom), 0.8))));

    // sound effects: [time, clip, gain (dB), pan -1..1]
    c.sfx = [
      [0.0, 'flutterSwarm', -4, 0],
      ...Array.from({ length: 10 }, (_, i) => [0.15 + i * 0.32, 'whoosh', -12 - (i % 3) * 2, (i % 2 ? 0.6 : -0.6)]),
      ...Array.from({ length: 14 }, (_, i) => [c.titleIn + i * 0.045, 'paperPop', -14, (i / 13) * 1.2 - 0.6]),
      [c.gather, 'shimmer', -10, 0],
      [c.one - 0.05, 'whooshBig', -6, 0],
      [c.stampOne, 'stamp', -5, -0.5],
      [c.tilt, 'swoopUp', -12, 0],
      [c.nameTag, 'tagPop', -10, -0.3],
      [c.whip - 0.05, 'whip', -7, 0.4],
      [c.clock, 'pencil', -13, 0.3],
      ...c.nights.map((t, i) => [t, 'snapshot', -9, -0.3 + i * 0.3]),
      ...c.folds.map((t, i) => [t + 0.05, 'fold', -6 - (i % 2), (i % 2 ? 0.2 : -0.2)]),
      [c.throwAt, 'throwSwish', -6, 0],
      [c.flyFrom, 'glide', -8, -0.5],
      [c.landAt, 'tapPaper', -6, 0.5],
      [c.leoLooks, 'blink', -16, 0.5],
      [c.lampOff, 'lampClick', -4, 0.5],
      [c.great, 'deadpan', -14, 0],
      [c.scared + 0.1, 'sweat', -14, 0],
      [c.tear, 'tear', -5, 0],
      [c.tear + 0.2, 'birds', -14, 0],
      [c.backFly, 'glide', -8, 0.5],
      [c.bonk, 'bonk', -5, -0.1],
      [c.drawing, 'unfold', -8, 0],
      [c.drawFrom, 'pencilLong', -11, 0],
      [c.badly, 'deadpan', -12, 0],
      [c.question, 'unfold', -12, 0],
      [c.lampDraw, 'pencil', -12, 0],
      [c.qDraw, 'pencil', -11, 0.1],
      [c.hi, 'whoosh', -12, 0],
      ...c.hiFolds.map((t, i) => [t + 0.05, 'fold', -8, (i % 2 ? 0.2 : -0.2)]),
      [c.stampTwo, 'stamp', -6, -0.5],
      [c.hiWrite, 'marker', -9, 0],
      [c.throwTwo, 'throwSwish', -8, 0],
      [c.gust, 'gust', -4, 0.2],
      [c.gust + 0.4, 'flutter', -10, 0.4],
      [c.dropFrom, 'fall', -6, 0],
      [c.dropTo - 0.1, 'tapPaper', -8, 0],
      [c.handIn, 'rustle', -11, 0.4],
      [c.grip, 'crinkle', -9, 0.3],
      [c.sting, 'sting', -3, 0],
      [c.catBlink, 'catChirp', -16, -0.4],
      [c.endCard, 'tear', -6, 0],
      ...Array.from({ length: 6 }, (_, i) => [c.endCard + 0.3 + i * 0.07, 'paperPop', -13, (i / 5) * 1 - 0.5]),
    ];
    // ambience beds: [from, to, kind, gain dB]
    c.beds = [
      [0, c.morning, 'night', -30],
      [c.morning, c.hi, 'morning', -32],
      [c.hi, c.someone, 'night', -30],
      [c.gust, c.someone + 0.2, 'wind', -24],
      [c.someone, c.endCard, 'alley', -28],
    ];
    return c;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = build;
  else g.PP.CUES = build(g.TIMING);
})(typeof window !== 'undefined' ? window : globalThis);
