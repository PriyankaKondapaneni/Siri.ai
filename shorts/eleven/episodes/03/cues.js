// 11:11, Episode 3: the cue sheet. Scene starts, sound effects, ambience beds and the score's sections, all pinned
// to the narration's words. Loaded by the page (PP.CUES) and by the audio tools.
// Nine minutes on platform four: a ticking clock she can't explain, then a warm café, then the news, then 11:11.
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
      run: W('n1', 'keep') - 0.1,
      irony: W('n1', 'and') - 0.1,
      board38: L('n2').e + 0.05,
      trainIn: L('k3').s - 0.3,
      tenSec: L('n3').s - 0.1,
      grab: L('m3').s - 0.1,
      please: W('m3', 'please') - 0.08,
      decide: L('m3').e + 0.05,
      doors: W('k4', 'but') - 0.08,
      deal: L('m4').s - 0.1,
      stayed: L('n4').s - 0.1,
      cafe: L('n5').s - 0.6,
      litAll: W('n5', 'lit'),
      news: L('n6').s - 0.1,
      night: L('n8').s - 0.45,
      clock1111: W('n8', '11:11'),
      hisPhone: W('n8', "wasn't") - 0.1,
      makeIt: W('k6', 'phone', 0, 'e') + 0.05,
      endCard: end + 0.02,
      total: end + 1.8,
      buzz: [],
      noteWords: {},
    };
    c.sfx = [
      // the hook: her plea over headlights, his face, the red alert
      [0.0, 'trainIn', -10, 0],
      [0.02, 'heartbeat', -9, 0],
      [0.45, 'whooshBy', -14, 0.4],
      [0.92, 'blip', -15, 0],
      [1.42, 'buzz', -7, 0],
      [c.hookEnd - 1.4, 'riser', -14, 0],
      [c.hookEnd - 0.03, 'boomSoft', -6, 0],
      [c.hookEnd + 0.05, 'clockFlip', -12, 0],
      [c.hookEnd + 0.1, 'tickTock', -16, 0],
      [c.run, 'clothShift', -16, -0.2],
      [c.board38, 'clockFlip', -11, 0],
      [c.board38 + 0.1, 'tickFast', -17, 0],
      [c.trainIn, 'trainIn', -11, 0.4],
      [c.tenSec, 'clockFlip', -10, 0],
      [c.tenSec + 0.1, 'riser', -14, 0.3],
      [c.grab, 'grab', -12, 0],
      [c.please - 0.05, 'heartbeat', -11, 0],
      [c.decide + 0.3, 'blip', -16, 0.3],
      [c.doors + 0.1, 'swipe', -11, 0],
      [c.doors + 0.5, 'whooshBy', -7, 0.5],
      [c.deal + 0.05, 'shimmer', -16, 0],
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
      [c.hookEnd, c.please, 'train', -27],
      [c.please, L('k4').s, 'train', -40],
      [L('k4').s, c.cafe, 'train', -28],
      [c.cafe, c.night, 'cafe', -28],
      [c.night, c.endCard, 'rain', -27],
    ];
    c.music = [
      { at: 0, kind: 'hook' },
      { at: c.hookEnd, kind: 'pulse' },
      { at: c.tenSec, kind: 'build' },
      { at: L('k4').s - 0.2, kind: 'romance' },
      { at: c.cafe, kind: 'cozy' },
      { at: c.litAll, kind: 'drone' },
      { at: L('k5').s - 0.1, kind: 'ache' },
      { at: c.night, kind: 'mystery' },
      { at: c.makeIt, kind: 'cut' },
      { at: c.endCard + 0.1, kind: 'sting' },
    ];
    // silence before the turn: everything drops away when she says "Please", and holds while he decides
    c.hush = [[c.please - 0.1, L('k4').s - 0.1, -24]];
    return c;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = build;
  else g.PP.CUES = build(g.TIMING);
})(typeof window !== 'undefined' ? window : globalThis);
