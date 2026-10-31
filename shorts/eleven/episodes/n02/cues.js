// 11:11, new Episode 2, "The Umbrella": the cue sheet. Most shots are Wan clips laid over this cut; the code draws
// only the hook's phone, the end card and the subtitles. The sound and score are built from these cues.
(function (g) {
  function build(T) {
    const L = (id) => T.lines.find((l) => l.id === id);
    const W = (line, word, nth = 0, edge = 's') => {
      const m = T.words.filter((w) => w.line === line && w.w.toLowerCase().replace(/[^a-z0-9:']/g, '') === word);
      if (!m[nth]) throw new Error(`cue: no "${word}" #${nth} in ${line}`);
      return m[nth][edge];
    };
    const end = T.duration;
    const c = {
      hookEnd: L('n1').s - 0.25,
      bus: L('n1').s + 2.5,
      shelter: L('n2').s - 0.1,
      receipt: L('n3').s - 0.15,
      think: W('n3', '6:20') - 0.35,
      lane: L('n4').s - 0.15,
      steps: W('n4', "don't") - 0.1,
      endCard: end + 0.15,
      total: end + 1.95,
      noteWords: { h0: T.words.filter((w) => w.line === 'h0') },
    };
    c.sfx = [
      [0.0, 'buzz', -7, 0.1],
      [0.05, 'heartbeat', -9, 0],
      [c.hookEnd - 1.4, 'riser', -15, 0],
      [c.hookEnd - 0.03, 'boomSoft', -7, 0],
      [c.hookEnd - 0.03, 'whooshBy', -13, 0],
      [c.hookEnd, 'rainStart', -14, 0],
      [c.bus - 0.2, 'engine', -16, 0.3],
      [c.shelter + 0.2, 'clothShift', -20, -0.2],
      [c.receipt + 0.3, 'clothShift', -22, 0.1],
      [W('n3', '6:20') - 0.05, 'shimmer', -19, 0],
      [c.steps + 0.25, 'heartbeat', -16, 0],
      [c.endCard + 0.1, 'endTicks', -8, 0],
    ];
    c.beds = [
      [c.hookEnd, c.lane, 'rain', -24],
      [c.hookEnd, c.lane, 'street', -30],
      [c.lane, c.endCard, 'rain', -28],
    ];
    c.music = [
      { at: 0, kind: 'hook' },
      { at: c.hookEnd, kind: 'mystery' },
      { at: c.receipt, kind: 'cozy2' },
      { at: c.steps, kind: 'romance' },
      { at: c.endCard - 0.15, kind: 'cut' },
      { at: c.endCard + 0.1, kind: 'sting' },
    ];
    return c;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = build;
  else g.PP.CUES = build(g.TIMING);
})(typeof window !== 'undefined' ? window : globalThis);
