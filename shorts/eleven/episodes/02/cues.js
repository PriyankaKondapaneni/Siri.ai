// 11:11, Episode 2: the cue sheet. Scene starts, sound effects, ambience beds and the score's sections, all pinned
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
      cafe: L('n4').s - 0.1,
      watch: L('n5').s - 0.1,
      night: L('n6').s - 0.12,
      clock1111: W('n6', '11:11'),
      thereHeWas: W('n2', 'there'),
      brother: W('k3', 'brother'),
      train: W('k4', "don't"),
      makeIt: W('k5', 'home', 0, 'e') + 0.05,
      endCard: end + 0.02,
      total: end + 1.8,
      buzz: ['k4', 'k5'].map((id) => L(id).s - 0.48),
      noteWords: Object.fromEntries(['h0', 'k4', 'k5'].map((id) => [id, T.words.filter((w) => w.line === id)])),
    };
    c.sfx = [
      [0.0, 'buzz', -7, 0.1],
      [0.05, 'heartbeat', -9, 0],
      [0.5, 'trainIn', -13, 0],
      [c.hookEnd - 0.03, 'boomSoft', -7, 0],
      [c.thereHeWas - 0.05, 'shimmer', -15, 0],
      [c.cafe + 0.1, 'cafeDoor', -18, -0.4],
      [c.watch + 0.1, 'tickTock', -12, 0],
      [c.brother, 'heartbeat', -15, 0],
      [c.night, 'rainStart', -16, 0],
      [c.clock1111 - 0.05, 'clockFlip', -10, 0.3],
      ...c.buzz.map((t) => [t, 'buzz', -6, 0.15]),
      ...c.buzz.map((t) => [t + 0.4, 'blip', -16, 0.15]),
      [c.train - 0.1, 'trainIn', -15, 0],
      [W('n7', 'train'), 'heartbeat', -12, 0],
      [c.makeIt, 'boomSoft', -6, 0],
      [c.endCard + 0.1, 'endTicks', -8, 0],
    ];
    c.beds = [
      [0, c.hookEnd, 'train', -28],
      [c.hookEnd, c.cafe, 'street', -26],
      [c.cafe, c.night, 'cafe', -28],
      [c.night, c.endCard, 'rain', -27],
    ];
    c.music = [
      { at: 0, kind: 'hook' },
      { at: c.hookEnd, kind: 'mystery' },
      { at: L('k1').s - 0.3, kind: 'romance' },
      { at: c.watch, kind: 'ache' },
      { at: c.night, kind: 'drone' },
      { at: L('k4').s - 0.5, kind: 'pulse' },
      { at: L('n7').s, kind: 'build' },
      { at: c.makeIt, kind: 'cut' },
      { at: c.endCard + 0.1, kind: 'sting' },
    ];
    return c;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = build;
  else g.PP.CUES = build(g.TIMING);
})(typeof window !== 'undefined' ? window : globalThis);
