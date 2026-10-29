// 11:11, Episode 5: the cue sheet. Scene starts, sound effects, ambience beds and the score's sections, all pinned
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
      asked: W('n1', 'so') - 0.1,
      at1111: W('k2', 'at') - 0.1,
      photo: L('n4').s - 0.1,
      memory: L('n5').s - 0.1,
      ambulance: W('n5', 'ambulance'),
      him: L('n6').s - 0.1,
      arjun: W('n6', 'arjun') - 0.08,
      night: L('n7').s - 0.12,
      clock1111: W('n7', '11:11'),
      why: W('k4', "that's") - 0.1,
      makeIt: W('k4', 'you', 2, 'e') + 0.05,
      endCard: end + 0.02,
      total: end + 1.8,
      buzz: [L('k4').s - 0.48],
      noteWords: Object.fromEntries(['k4'].map((id) => [id, T.words.filter((w) => w.line === id)])),
    };
    c.sfx = [
      [0.0, 'rainStart', -12, 0],
      [0.05, 'heartbeat', -10, 0],
      [W('h0', 'at') - 0.05, 'tickTock', -12, 0],
      [c.hookEnd - 0.03, 'boomSoft', -7, 0],
      [c.at1111, 'tickTock', -13, 0],
      [L('n3').s, 'shimmer', -16, 0],
      [c.memory, 'tinnitus', -28, 0],
      [c.ambulance - 0.2, 'riser', -18, 0],
      [c.arjun, 'boomSoft', -10, 0],
      [c.night, 'rainStart', -16, 0],
      [c.clock1111 - 0.05, 'clockFlip', -10, 0.3],
      [c.buzz[0], 'buzz', -6, 0.15],
      [c.buzz[0] + 0.4, 'blip', -16, 0.15],
      [c.makeIt, 'boomSoft', -6, 0],
      [c.endCard + 0.1, 'endTicks', -8, 0],
    ];
    c.beds = [
      [0, c.night, 'rain', -24],
      [c.night, c.endCard, 'rain', -28],
    ];
    c.music = [
      { at: 0, kind: 'hook' },
      { at: c.hookEnd, kind: 'mystery' },
      { at: L('k3').s - 0.1, kind: 'romance' },
      { at: c.memory, kind: 'heartbreak' },
      { at: c.night, kind: 'drone' },
      { at: L('k4').s - 0.5, kind: 'pulse' },
      { at: c.makeIt, kind: 'cut' },
      { at: c.endCard + 0.1, kind: 'sting' },
    ];
    return c;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = build;
  else g.PP.CUES = build(g.TIMING);
})(typeof window !== 'undefined' ? window : globalThis);
