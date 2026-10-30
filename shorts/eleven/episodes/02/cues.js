// 11:11, Episode 2: the cue sheet. Scene starts, sound effects, ambience beds and the score's sections, all pinned
// to the narration's words. Loaded by the page (PP.CUES) and by the audio tools.
// Slice of life: the day is warm (the cozy guitar), time flows between scenes (time-lapses, dissolves), and the
// thriller only comes back when the phone lights up at 11:11.
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
      // the day passing in her room, from "I spent the whole day watching the clock" to the street at dusk
      lapse: W('n1', 'i') - 0.1,
      street: L('n2').s - 0.2,
      thereHeWas: W('n2', 'there'),
      cafe: L('n4a').s - 0.45,
      reach: W('n4a', 'reached'),
      touch: W('n4a', 'cookie', 0, 'e') - 0.05,
      snap: W('k6', 'you') + 0.05,
      letGo: W('m2', 'holding') + 0.05,
      steal: L('m2').e + 0.3,
      closing: W('n4', 'until') - 0.1,
      watch: L('n5').s - 0.1,
      brother: W('k3', 'brother'),
      goodbye: L('n5b').s - 0.1,
      walkHome: W('n5b', 'i') - 0.08,
      night: W('n5b', 'way') - 0.05,
      clock1111: W('n6', '11:11'),
      train: W('k4', "don't"),
      makeIt: W('k5', 'home', 0, 'e') + 0.05,
      endCard: end + 0.02,
      total: end + 1.8,
      buzz: ['k4', 'k5'].map((id) => L(id).s - 0.48),
      noteWords: Object.fromEntries(['h0', 'k4', 'k5'].map((id) => [id, T.words.filter((w) => w.line === id)])),
    };
    c.sfx = [
      [0.0, 'buzz', -6, 0.1],
      [0.0, 'blip', -14, 0.1],
      [0.05, 'heartbeat', -9, 0],
      [0.42, 'shimmer', -17, -0.2],
      [0.86, 'trainIn', -12, 0],
      [1.3, 'heartbeat', -10, 0],
      [c.hookEnd - 1.4, 'riser', -14, 0],
      [c.hookEnd - 0.03, 'boomSoft', -6, 0],
      [c.hookEnd - 0.03, 'whooshBy', -12, 0],
      [c.lapse + 0.1, 'tickFast', -17, 0],
      [c.street + 0.3, 'clockFlip', -18, -0.3],
      [c.thereHeWas - 0.05, 'shimmer', -16, 0],
      [c.cafe + 0.05, 'cafeDoor', -16, -0.4],
      [c.reach, 'clothShift', -16, -0.3],
      [c.reach + 0.1, 'clothShift', -17, 0.3],
      [c.touch, 'heartbeat', -13, 0],
      [c.snap, 'crunch', -9, 0.1],
      [c.letGo, 'swipe', -18, 0.4],
      [c.steal, 'whooshBy', -20, 0.5],
      [c.steal + 0.55, 'crunch', -12, 0.5],
      [c.closing + 0.1, 'tickFast', -20, 0.3],
      [c.watch + 0.1, 'tickTock', -13, 0],
      [c.brother, 'heartbeat', -16, 0],
      [c.goodbye + 0.1, 'cafeDoor', -20, 0.3],
      [c.night, 'rainStart', -16, 0],
      [c.clock1111 - 0.05, 'clockFlip', -10, 0.3],
      ...c.buzz.map((t) => [t, 'buzz', -6, 0.15]),
      ...c.buzz.map((t) => [t + 0.4, 'blip', -16, 0.15]),
      [c.train - 0.1, 'trainIn', -15, 0],
      [L('m3').s, 'heartbeat', -12, 0],
      [c.makeIt, 'boomSoft', -6, 0],
      [c.endCard + 0.1, 'endTicks', -8, 0],
    ];
    c.beds = [
      [0, c.lapse, 'room', -30],
      [c.lapse, c.street, 'room', -32],
      [c.street, c.cafe, 'street', -26],
      [c.cafe, c.goodbye, 'cafe', -28],
      [c.goodbye, c.night, 'street', -28],
      [c.night, c.endCard, 'rain', -27],
    ];
    c.music = [
      { at: 0, kind: 'hook' },
      { at: c.hookEnd, kind: 'mystery' },
      { at: c.lapse, kind: 'cozy' },
      { at: c.reach - 0.3, kind: 'romance' },
      { at: c.watch, kind: 'ache' },
      { at: c.goodbye, kind: 'cozy2' },
      { at: c.night, kind: 'drone' },
      { at: L('k4').s - 0.5, kind: 'pulse' },
      { at: L('m3').s, kind: 'build' },
      { at: c.makeIt, kind: 'cut' },
      { at: c.endCard + 0.1, kind: 'sting' },
    ];
    // the music falls away when their fingers touch, and comes back with his "Half?"
    c.hush = [[c.touch - 0.15, L('k6').s - 0.05, -16]];
    return c;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = build;
  else g.PP.CUES = build(g.TIMING);
})(typeof window !== 'undefined' ? window : globalThis);
