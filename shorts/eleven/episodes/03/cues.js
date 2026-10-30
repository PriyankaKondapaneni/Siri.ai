// 11:11, Episode 3: the cue sheet. Scene starts, sound effects, ambience beds and the score's sections, all pinned
// to the narration's words. Loaded by the page (PP.CUES) and by the audio tools.
// Nine minutes on platform four: she can't tell him why, so she loses an earring that was never lost.
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
      hookEnd: L('t1').s - 0.14,
      run: W('t1', 'nine') - 0.1,
      irony: L('t2').s - 0.1,
      board38: L('t3').e + 0.05,
      tenSec: L('t4').s - 0.1,
      idea: L('t4').e - 0.35,
      earring: L('m5').s - 0.1,
      kneel: L('k8').s - 0.1,
      search: L('m6').s - 0.1,
      hold: L('t10').s - 0.1,
      doors: W('t10', "don't", 1) - 0.1,
      trainOut: L('t10').e + 0.1,
      sorry: L('k9').s - 0.1,
      neverHere: L('m7').s - 0.1,
      tracks: L('k10').s - 0.1,
      pocket: L('t11').s - 0.1,
      cafe: L('t6').s - 0.6,
      litAll: W('t6', 'lit'),
      news: L('t7').s - 0.1,
      night: L('t9').s - 0.45,
      clock1111: W('t9', '11:11'),
      hisPhone: W('t9', "wasn't") - 0.1,
      makeIt: W('k6', 'phone', 0, 'e') + 0.05,
      endCard: end + 0.02,
      total: end + 1.8,
      buzz: [0.0],
      noteWords: { h0: T.words.filter((w) => w.line === 'h0') },
    };
    c.sfx = [
      // the hook, built like Episode 2's: the buzz and his voice on the first frame, then four hits
      [0.0, 'buzz', -6, 0.1],
      [0.0, 'blip', -14, 0.1],
      [0.05, 'heartbeat', -9, 0],
      [0.44, 'clockFlip', -8, 0],
      [0.86, 'trainIn', -11, 0],
      [1.3, 'clothShift', -12, -0.2],
      [1.65, 'swipe', -9, 0],
      [c.hookEnd - 1.4, 'riser', -14, 0],
      [c.hookEnd - 0.03, 'boomSoft', -6, 0],
      [c.hookEnd - 0.03, 'whooshBy', -12, 0],
      [c.hookEnd + 0.08, 'clockFlip', -12, 0],
      [c.hookEnd + 0.15, 'tickTock', -17, 0],
      [c.run, 'clothShift', -16, -0.2],
      [c.board38, 'clockFlip', -11, 0],
      [c.board38 + 0.1, 'tickFast', -18, 0],
      [L('k3').s - 0.3, 'trainIn', -12, 0.4],
      [c.tenSec, 'clockFlip', -10, 0],
      [c.tenSec + 0.1, 'riser', -15, 0.3],
      [c.idea, 'shimmer', -15, 0],
      [c.earring + 0.05, 'grab', -14, 0],
      [c.kneel + 0.3, 'clothShift', -13, 0],
      [c.search + 0.2, 'blip', -18, 0.3],
      [c.hold, 'heartbeat', -11, 0],
      [c.hold + 0.6, 'trainIn', -12, 0.5],
      [c.doors + 0.05, 'blip', -13, 0.3],
      [c.doors + 0.35, 'swipe', -10, 0.2],
      [c.trainOut, 'whooshBy', -6, 0.5],
      [c.pocket + 0.5, 'pinDrop', -18, 0],
      [c.cafe + 0.15, 'cafeDoor', -17, -0.4],
      [c.litAll - 0.05, 'buzz', -6, -0.4],
      [c.litAll + 0.05, 'buzz', -7, 0.4],
      [c.litAll + 0.15, 'buzz', -8, 0],
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
      [c.hookEnd, c.hold, 'train', -27],
      [c.hold, c.trainOut + 0.6, 'train', -38],
      [c.trainOut + 0.6, c.cafe, 'train', -29],
      [c.cafe, c.night, 'cafe', -28],
      [c.night, c.endCard, 'rain', -27],
    ];
    c.music = [
      { at: 0, kind: 'hook' },
      { at: c.hookEnd, kind: 'pulse' },
      { at: c.tenSec, kind: 'build' },
      { at: c.sorry - 0.2, kind: 'romance' },
      { at: c.cafe, kind: 'cozy' },
      { at: c.litAll, kind: 'drone' },
      { at: L('k5').s - 0.1, kind: 'ache' },
      { at: c.night, kind: 'mystery' },
      { at: c.makeIt, kind: 'cut' },
      { at: c.endCard + 0.1, kind: 'sting' },
    ];
    // silence while she holds her breath and the train comes and goes behind them
    c.hush = [[c.hold - 0.1, c.sorry - 0.25, -20]];
    return c;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = build;
  else g.PP.CUES = build(g.TIMING);
})(typeof window !== 'undefined' ? window : globalThis);
