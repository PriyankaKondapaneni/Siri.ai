// 11:11, Episode 3: the cue sheet. Scene starts, sound effects, ambience beds and the score's sections, all pinned
// to the narration's words. Loaded by the page (PP.CUES) and by the audio tools.
// Slice of life: one morning, lived nearly in real time; the thriller comes back with the phones and at 11:11.
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
      // the night passing in her room; the alarm she switches off before it rings
      alarm: W('n1', 'i', 1) - 0.1,
      dawn: L('n2').s - 0.12,
      counter: W('n2', 'i') - 0.1,
      platform: L('n3').s - 0.12,
      reading: W('n3', 'he') - 0.08,
      trainIn: L('n4').s - 0.1,
      tripped: W('n5', 'tripped'),
      doors: L('n6').s - 0.1,
      trainOut: W('n6', 'train') - 0.1,
      cafe: L('n7').s - 0.4,
      buzzAll: W('n7', 'buzzed'),
      news: L('n8').s - 0.1,
      night: L('n10').s - 0.45,
      clock1111: W('n10', '11:11'),
      hisPhone: W('n10', "wasn't") - 0.1,
      makeIt: W('k6', 'phone', 0, 'e') + 0.05,
      endCard: end + 0.02,
      total: end + 1.8,
      buzz: [],
      noteWords: {},
    };
    c.sfx = [
      // the hook: the train out of the tunnel, the cups, every phone, his stare
      [0.0, 'trainIn', -9, 0],
      [0.05, 'heartbeat', -9, 0],
      [0.5, 'cupTip', -12, 0],
      [0.62, 'splash', -10, 0],
      [0.98, 'buzz', -7, -0.3],
      [1.02, 'buzz', -8, 0.3],
      [c.hookEnd - 1.4, 'riser', -14, 0],
      [c.hookEnd - 0.03, 'boomSoft', -6, 0],
      [c.hookEnd - 0.03, 'whooshBy', -12, 0],
      [c.hookEnd + 0.1, 'tickFast', -18, 0],
      [c.alarm + 0.15, 'blip', -12, 0.2],
      [c.alarm + 0.45, 'swipe', -16, 0.2],
      [c.dawn + 0.2, 'pinDrop', -24, -0.3],
      [c.counter + 0.1, 'cupTip', -22, 0.2],
      [c.counter + 1.2, 'cafeDoor', -17, -0.4],
      [c.reading + 0.6, 'clothShift', -20, 0.3],
      [c.trainIn, 'trainIn', -13, 0.4],
      [c.trainIn + 0.6, 'riser', -18, 0.4],
      [W('k3', "that's") - 0.05, 'clothShift', -18, 0],
      [c.tripped - 0.2, 'clothShift', -14, 0],
      [c.tripped - 0.1, 'cupTip', -10, 0],
      [c.tripped + 0.15, 'splash', -5, 0],
      [c.doors + 0.25, 'swipe', -11, 0],
      [c.trainOut, 'whooshBy', -6, 0.5],
      [c.cafe + 0.1, 'tickFast', -22, 0.3],
      [c.buzzAll - 0.05, 'buzz', -6, -0.4],
      [c.buzzAll + 0.05, 'buzz', -7, 0.4],
      [c.buzzAll + 0.15, 'buzz', -8, 0],
      [c.news, 'tinnitus', -26, 0],
      [W('k5', 'knew'), 'heartbeat', -12, 0],
      [c.night, 'rainStart', -16, 0],
      [c.clock1111 - 0.05, 'clockFlip', -10, 0.3],
      [c.hisPhone + 0.1, 'buzz', -6, 0.2],
      [c.hisPhone + 0.5, 'blip', -16, 0.2],
      [c.makeIt, 'boomSoft', -6, 0],
      [c.endCard + 0.1, 'endTicks', -8, 0],
    ];
    c.beds = [
      [0, c.hookEnd, 'train', -26],
      [c.hookEnd, c.dawn, 'room', -32],
      [c.dawn, c.counter, 'street', -30],
      [c.counter, c.platform, 'cafe', -30],
      [c.platform, c.cafe, 'train', -27],
      [c.cafe, c.night, 'cafe', -29],
      [c.night, c.endCard, 'rain', -27],
    ];
    c.music = [
      { at: 0, kind: 'hook' },
      { at: c.hookEnd, kind: 'mystery' },
      { at: c.dawn, kind: 'cozy' },
      { at: c.trainIn, kind: 'train' },
      { at: c.doors + 0.4, kind: 'romance' },
      { at: c.buzzAll, kind: 'build' },
      { at: L('k5').s - 0.1, kind: 'ache' },
      { at: c.night, kind: 'drone' },
      { at: c.makeIt, kind: 'cut' },
      { at: c.endCard + 0.1, kind: 'sting' },
    ];
    // the platform holds its breath when he says "That's me"
    c.hush = [[L('k3').s - 0.1, c.tripped - 0.25, -10]];
    return c;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = build;
  else g.PP.CUES = build(g.TIMING);
})(typeof window !== 'undefined' ? window : globalThis);
