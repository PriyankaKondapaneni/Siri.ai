// 11:11, Episode 6: the cue sheet. Scene starts, sound effects, ambience beds and the score's sections, all pinned
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
      sent: L('n2').s - 0.1,
      who: L('n4').s - 0.1,
      floor: L('n5').s - 0.1,
      t1110: W('n6', '11:10'),
      clock1111: W('n6', '11:11'),
      both: L('n7').s - 0.1,
      lit: W('n7', 'lit'),
      makeIt: W('k3', 'number', 0, 'e') + 0.05,
      endCard: end + 0.02,
      total: end + 1.8,
      buzz: [],
      noteWords: {},
    };
    c.sfx = [
      [0.0, 'heartbeat', -9, 0],
      [c.hookEnd - 0.03, 'boomSoft', -7, 0],
      [c.sent + 0.2, 'swipe', -14, 0],
      [L('n3').s, 'heartbeat', -13, 0],
      [c.who, 'riser', -20, 0],
      [c.t1110 - 0.05, 'tickTock', -12, 0],
      [c.clock1111 - 0.05, 'clockFlip', -10, 0.2],
      [c.lit - 0.05, 'buzz', -5, -0.4],
      [c.lit, 'buzz', -6, 0.4],
      [c.lit + 0.4, 'blip', -15, 0],
      [W('k3', "arjun's"), 'boomSoft', -9, 0],
      [c.makeIt, 'boomSoft', -6, 0],
      [c.endCard + 0.1, 'endTicks', -8, 0],
    ];
    c.beds = [
      [0, c.endCard, 'room', -30],
      [c.hookEnd, c.endCard, 'rain', -36],
    ];
    c.music = [
      { at: 0, kind: 'hook' },
      { at: c.hookEnd, kind: 'mystery' },
      { at: c.sent, kind: 'build' },
      { at: c.floor, kind: 'romance' },
      { at: c.t1110 - 0.2, kind: 'drone' },
      { at: c.lit, kind: 'action' },
      { at: c.makeIt, kind: 'cut' },
      { at: c.endCard + 0.1, kind: 'sting' },
    ];
    return c;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = build;
  else g.PP.CUES = build(g.TIMING);
})(typeof window !== 'undefined' ? window : globalThis);
