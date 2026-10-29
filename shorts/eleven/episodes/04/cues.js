// 11:11, Episode 4: the cue sheet. Scene starts, sound effects, ambience beds and the score's sections, all pinned
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
      myVoice: W('n1', 'my') - 0.1,
      neverSaid: W('n1', 'words') - 0.1,
      sky: L('n3').s - 0.1,
      newest: L('n5').s - 0.1,
      bridge: W('m2', "don't") - 0.1,
      friday: L('n6').s - 0.1,
      scared: L('n7').s - 0.1,
      sevenDays: W('n7', 'because') - 0.1,
      makeIt: W('n7', 'it', 0, 'e') + 0.05,
      endCard: end + 0.02,
      total: end + 1.8,
      buzz: ['m1', 'm2'].map((id) => L(id).s - 0.48),
      noteWords: Object.fromEntries(['h0', 'm1', 'm2'].map((id) => [id, T.words.filter((w) => w.line === id)])),
    };
    c.sfx = [
      [0.0, 'buzz', -7, 0.1],
      [0.05, 'heartbeat', -9, 0],
      [c.hookEnd - 0.03, 'boomSoft', -7, 0],
      ...c.buzz.map((t) => [t + 0.25, 'blip', -16, 0.15]),
      [c.myVoice, 'shimmer', -15, 0],
      [c.bridge, 'heartbeat', -11, 0],
      [c.friday, 'tickFast', -15, 0],
      [c.sevenDays + 0.1, 'tickTock', -11, 0],
      [c.makeIt, 'boomSoft', -6, 0],
      [c.endCard + 0.1, 'endTicks', -8, 0],
    ];
    c.beds = [
      [0, c.endCard, 'street', -36],
      [c.hookEnd, c.endCard, 'room', -32],
    ];
    c.music = [
      { at: 0, kind: 'hook' },
      { at: c.hookEnd, kind: 'mystery' },
      { at: L('n2').s - 0.2, kind: 'romance' },
      { at: c.newest, kind: 'pulse' },
      { at: c.friday, kind: 'build' },
      { at: c.scared, kind: 'ache' },
      { at: c.makeIt, kind: 'cut' },
      { at: c.endCard + 0.1, kind: 'sting' },
    ];
    return c;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = build;
  else g.PP.CUES = build(g.TIMING);
})(typeof window !== 'undefined' ? window : globalThis);
