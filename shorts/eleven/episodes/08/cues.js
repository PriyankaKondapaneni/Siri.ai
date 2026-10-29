// 11:11, Episode 8: the cue sheet. Scene starts, sound effects, ambience beds and the score's sections, all pinned
// to the narration's words. Loaded by the page (PP.CUES) and by the audio tools.
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
      hookEnd: L('n1').s - 0.14,
      breathing: W('n1', 'he') - 0.1,
      passed: L('n3').s - 0.1,
      clockPass: W('n3', '11:11'),
      nothing: W('n3', 'and') - 0.1,
      week: L('n4').s - 0.1,
      coffee: W('n4', 'coffee') - 0.1,
      rain: W('n4', 'rain') - 0.1,
      him: W('n4', 'him') - 0.1,
      eighth: L('n5').s - 0.1,
      clock1111: W('n6', '11:11'),
      newMsg: W('n6', 'a') - 0.1,
      knew: W('n6', 'in') - 0.1,
      own: L('n7').s - 0.1,
      notHome: W('m2', 'he') - 0.1,
      makeIt: W('m2', 'home', 0, 'e') + 0.05,
      endCard: end + 0.02,
      total: end + 1.9,
      buzz: [W('n6', 'a') - 0.2],
      noteWords: Object.fromEntries(['h0', 'm1', 'm2'].map((id) => [id, T.words.filter((w) => w.line === id)])),
    };
    c.sfx = [
      [0.0, 'buzz', -7, 0.1],
      [0.05, 'heartbeat', -10, 0],
      [c.hookEnd - 0.03, 'boomSoft', -7, 0],
      [c.hookEnd, 'rainStart', -14, 0],
      [c.breathing, 'shimmer', -15, 0],
      [c.clockPass - 0.05, 'clockFlip', -11, 0.3],
      [c.eighth, 'rainStart', -18, 0],
      [c.clock1111 - 0.05, 'clockFlip', -10, 0.3],
      [c.buzz[0], 'buzz', -6, 0.15],
      [c.buzz[0] + 0.4, 'blip', -16, 0.15],
      [c.own, 'heartbeat', -12, 0],
      [c.notHome, 'boomSoft', -10, 0],
      [c.makeIt, 'boomSoft', -6, 0],
      [c.endCard + 0.1, 'endTicks', -8, 0],
    ];
    c.beds = [
      [0, c.hookEnd, 'room', -32],
      [c.hookEnd, c.passed, 'rain', -24],
      [c.passed, c.week, 'room', -32],
      [c.week, c.eighth, 'cafe', -30],
      [c.eighth, c.endCard, 'rain', -30],
    ];
    c.music = [
      { at: 0, kind: 'hook' },
      { at: c.hookEnd, kind: 'romance' },
      { at: c.passed, kind: 'ache' },
      { at: c.week, kind: 'pulse' },
      { at: c.eighth, kind: 'drone' },
      { at: L('m1').s - 0.3, kind: 'mystery' },
      { at: L('m2').s - 0.3, kind: 'build' },
      { at: c.makeIt, kind: 'cut' },
      { at: c.endCard + 0.1, kind: 'sting' },
    ];
    return c;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = build;
  else g.PP.CUES = build(g.TIMING);
})(typeof window !== 'undefined' ? window : globalThis);
