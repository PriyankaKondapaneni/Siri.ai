// 11:11, Episode 1: the cue sheet. Scenes, sound effects, ambiences and the score's sections are all pinned to the
// narration's words, so picture, sound and voice stay in sync. Loaded by the page (PP.CUES) and by the audio tools.
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
      // scenes
      bedroom: 0,
      note1: L('k1').s - 0.55,
      cafe: L('n3').s - 0.05,
      train: L('k2').s - 0.55,
      note3: L('k3').s - 0.55,
      street: L('n5').s - 0.08,
      eyes: L('n6').s - 0.05,
      watch: W('n6', 'watch') - 0.1,
      okay: L('k4').s - 0.08,
      stunned: L('n7').s - 0.06,
      met: L('k5').s - 0.08,
      noIdea: L('n8').s - 0.05,
      night: L('n9').s - 0.1,
      last: L('k6').s - 0.55,
      seven: L('k7').s - 0.1,
      endCard: end + 0.02,
      total: end + 1.72,
    };
    Object.assign(c, {
      clock1111: W('n1', '11:11'),
      buzz: ['k1', 'k2', 'k3', 'k6', 'k7'].map((id) => L(id).s - 0.48),
      notes: ['k1', 'k2', 'k3', 'k6', 'k7'].map((id) => [L(id).s, L(id).e]),
      delete: W('n3', 'deleted'),
      cafeClock: W('n3', '8:02'),
      spill: W('n3', 'spilled') + 0.1,
      lie: W('k2', 'lie'),
      asked: W('n4', 'asked'),
      lied: W('n4', 'lied'),
      shaking: W('n4', 'shaking'),
      pin: W('k3', 'fifth'),
      promise: W('k3', 'promise'),
      car: W('n5', 'car'),
      redLight: W('n5', 'red'),
      pulled: W('n5', 'pulled'),
      impact: W('n5', 'back', 0, 'e'),
      darkEyes: W('n6', 'dark'),
      watchFace: W('n6', '11:11'),
      hey: W('k4', 'hey'),
      voiceRealise: W('n7', 'voice'),
      phoneWord: W('n7', 'phone'),
      sorry: W('k5', 'sorry'),
      tear: W('k6', 'sorry'),
      dontFall: W('k6', "don't"),
      sevenDays: W('k7', 'seven'),
      makeIt: W('k7', 'it', 0, 'e'),
      cafeCut: W('n3', 'at') - 0.08,
      trainGuy: W('k2', 'train'),
      tearCut: W('k6', 'sorry') - 0.12,
      noteWords: Object.fromEntries(['k1', 'k2', 'k3', 'k6', 'k7'].map((id) => [id, T.words.filter((w) => w.line === id)])),
    });
    // sound effects: [time, clip, gain dB, pan]
    c.sfx = [
      [0.0, 'rainStart', -14, 0],
      [c.clock1111 - 0.05, 'clockFlip', -10, 0.3],
      ...c.buzz.map((t) => [t, 'buzz', -6, 0.15]),
      ...c.buzz.map((t) => [t + 0.4, 'blip', -16, 0.15]),
      [c.delete + 0.2, 'swipe', -10, 0],
      [c.delete + 0.45, 'trash', -12, 0],
      [c.cafe + 0.1, 'cafeDoor', -18, -0.4],
      [c.spill - 0.15, 'cupTip', -10, 0],
      [c.spill, 'splash', -5, 0],
      [c.train, 'trainIn', -10, 0],
      [c.asked - 0.1, 'clothShift', -16, 0.4],
      [c.lied + 0.2, 'heartbeat', -10, 0],
      [c.note3, 'tickFast', -12, 0],
      [c.pin, 'pinDrop', -12, 0.2],
      [c.street - 0.4, 'riser', -8, 0],
      [c.car - 0.5, 'engine', -6, -0.6],
      [c.car, 'horn', -8, -0.3],
      [c.redLight, 'screech', -6, 0],
      [c.pulled, 'grab', -7, -0.2],
      [c.pulled + 0.05, 'whooshBy', -4, 0.6],
      [c.impact, 'boom', -4, 0],
      [c.impact + 0.05, 'tinnitus', -24, 0],
      [c.darkEyes, 'heartbeat', -11, 0],
      [c.watchFace, 'tickTock', -12, 0],
      [c.voiceRealise, 'shimmer', -14, 0],
      [c.night, 'rainStart', -16, 0],
      [c.tear, 'heartbeat', -13, 0],
      [c.makeIt + 0.05, 'boomSoft', -6, 0],
      [c.endCard + 0.1, 'endTicks', -8, 0],
    ];
    // ambiences: [from, to, kind, gain dB]
    c.beds = [
      [0, c.cafe, 'rain', -27],
      [c.cafe, c.train, 'cafe', -28],
      [c.train, c.note3 + 0.3, 'train', -22],
      [c.note3, c.street, 'room', -34],
      [c.street, c.impact, 'street', -24],
      [c.impact + 0.6, c.night, 'street', -32],
      [c.night, c.endCard, 'rain', -27],
    ];
    // the score's sections (the composer reads these)
    c.music = [
      { at: 0, kind: 'mystery' },
      { at: c.note1, kind: 'pulse' },
      { at: c.train, kind: 'train' },
      { at: c.note3, kind: 'build' },
      { at: c.street, kind: 'action' },
      { at: c.impact, kind: 'silence' },
      { at: c.eyes, kind: 'romance' },
      { at: c.noIdea, kind: 'ache' },
      { at: c.night, kind: 'drone' },
      { at: c.last, kind: 'heartbreak' },
      { at: c.makeIt, kind: 'cut' },
      { at: c.endCard + 0.1, kind: 'sting' },
    ];
    return c;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = build;
  else g.PP.CUES = build(g.TIMING);
})(typeof window !== 'undefined' ? window : globalThis);
