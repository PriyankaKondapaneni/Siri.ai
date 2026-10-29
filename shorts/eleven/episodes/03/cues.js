// 11:11, Episode 3: the cue sheet. Scene starts, sound effects, ambience beds and the score's sections, all pinned
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
      sleep: W('n1', 'so') - 0.1,
      platform: L('n2').s - 0.1,
      spill: W('n3', 'spilled') + 0.15,
      doors: L('n4').s - 0.1,
      trainOut: W('n4', 'train') - 0.1,
      hand: W('n4', 'i') - 0.1,
      buzzAll: W('n5', 'buzzed'),
      news: L('n6').s - 0.1,
      night: L('n8').s - 0.12,
      clock1111: W('n8', '11:11'),
      hisPhone: W('n8', 'wasn\'t') - 0.1,
      makeIt: W('k4', 'phone', 0, 'e') + 0.05,
      endCard: end + 0.02,
      total: end + 1.8,
      buzz: [],
      noteWords: {},
    };
    c.sfx = [
      [0.0, 'trainIn', -9, 0],
      [0.1, 'heartbeat', -9, 0],
      [c.hookEnd - 0.03, 'boomSoft', -7, 0],
      [c.sleep, 'tickFast', -13, 0],
      [c.platform, 'trainIn', -16, 0],
      [c.spill - 0.15, 'cupTip', -10, 0],
      [c.spill, 'splash', -5, 0],
      [c.doors + 0.3, 'swipe', -12, 0],
      [c.trainOut, 'whooshBy', -6, 0.5],
      [c.hand + 0.1, 'shimmer', -15, 0],
      [c.buzzAll - 0.05, 'buzz', -6, -0.4],
      [c.buzzAll + 0.05, 'buzz', -7, 0.4],
      [c.buzzAll + 0.15, 'buzz', -8, 0],
      [c.news, 'tinnitus', -26, 0],
      [W('k3', 'knew'), 'heartbeat', -12, 0],
      [c.night, 'rainStart', -16, 0],
      [c.clock1111 - 0.05, 'clockFlip', -10, 0.3],
      [c.hisPhone + 0.1, 'buzz', -6, 0.2],
      [c.makeIt, 'boomSoft', -6, 0],
      [c.endCard + 0.1, 'endTicks', -8, 0],
    ];
    c.beds = [
      [0, c.hookEnd, 'train', -26],
      [c.hookEnd, c.platform, 'room', -34],
      [c.platform, c.buzzAll, 'train', -26],
      [c.buzzAll, c.night, 'street', -28],
      [c.night, c.endCard, 'rain', -27],
    ];
    c.music = [
      { at: 0, kind: 'hook' },
      { at: c.hookEnd, kind: 'mystery' },
      { at: c.platform, kind: 'train' },
      { at: c.hand, kind: 'romance' },
      { at: c.buzzAll, kind: 'build' },
      { at: L('k3').s - 0.1, kind: 'ache' },
      { at: c.night, kind: 'drone' },
      { at: c.makeIt, kind: 'cut' },
      { at: c.endCard + 0.1, kind: 'sting' },
    ];
    return c;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = build;
  else g.PP.CUES = build(g.TIMING);
})(typeof window !== 'undefined' ? window : globalThis);
