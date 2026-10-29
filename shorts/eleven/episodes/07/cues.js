// 11:11, Episode 7: the cue sheet. Scene starts, sound effects, ambience beds and the score's sections, all pinned
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
      rain: L('n3').s - 0.1,
      buzzAt: W('n3', 'his') - 0.1,
      number: W('n3', "arjun's") - 0.1,
      chooseHer: W('k2', 'choose') - 0.1,
      t1110: L('n5').s - 0.1,
      bridge: W('n5', 'the') - 0.1,
      lights: W('n5', 'headlights') - 0.1,
      pushed: L('n6').s - 0.1,
      firstTime: W('n6', 'just') - 0.1,
      impact: W('n6', 'time', 0, 'e') + 0.1,
      t1111: L('n7').s - 0.1,
      ticking: W('n8', 'ticking'),
      endCard: end + 0.35,
      total: end + 2.6,
      buzz: [L('k2').s - 0.48],
      noteWords: Object.fromEntries(['k2'].map((id) => [id, T.words.filter((w) => w.line === id)])),
    };
    c.makeIt = c.endCard;
    c.sfx = [
      [0.0, 'rainStart', -12, 0],
      [0.1, 'engine', -10, -0.4],
      [0.3, 'heartbeat', -9, 0],
      [c.hookEnd - 0.03, 'boomSoft', -7, 0],
      [c.rain, 'rainStart', -12, 0],
      [c.buzzAt, 'buzz', -6, 0.15],
      [c.number, 'boomSoft', -12, 0],
      [c.buzz[0] + 0.3, 'blip', -16, 0.15],
      [c.chooseHer, 'heartbeat', -11, 0],
      [c.t1110, 'tickTock', -12, 0],
      [c.lights - 0.4, 'engine', -6, -0.5],
      [c.lights, 'horn', -8, -0.3],
      [c.pushed - 0.1, 'screech', -6, 0],
      [c.pushed + 0.1, 'grab', -7, 0],
      [c.pushed + 0.2, 'whooshBy', -4, 0.5],
      [c.impact, 'boom', -4, 0],
      [c.impact + 0.05, 'tinnitus', -22, 0],
      [c.ticking - 0.05, 'tickTock', -9, 0],
      [c.endCard + 0.1, 'endTicks', -8, 0],
    ];
    c.beds = [
      [0, c.hookEnd, 'street', -26],
      [c.hookEnd, c.rain, 'cafe', -28],
      [c.rain, c.impact, 'rain', -22],
      [c.impact + 0.8, c.endCard, 'rain', -30],
    ];
    c.music = [
      { at: 0, kind: 'hook' },
      { at: c.hookEnd, kind: 'romance' },
      { at: c.rain, kind: 'pulse' },
      { at: c.chooseHer, kind: 'heartbreak' },
      { at: c.t1110, kind: 'action' },
      { at: c.impact, kind: 'silence' },
      { at: c.ticking - 0.3, kind: 'ache' },
      { at: c.endCard, kind: 'cut' },
      { at: c.endCard + 0.1, kind: 'sting' },
    ];
    return c;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = build;
  else g.PP.CUES = build(g.TIMING);
})(typeof window !== 'undefined' ? window : globalThis);
