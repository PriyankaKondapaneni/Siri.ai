// 11:11, Episode 2 (about 75 s), "The Umbrella": the cue sheet. It opens on the last moment of Episode 1 (his 11:11
// voice note), follows the umbrella to his steps and his flat, and ends on a new 11:11 message arriving while he
// stands in front of her. Most shots are Wan clips laid over this cut; the code draws the two phone screens, the
// end card and the subtitles. The sound and score are built from these cues.
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
      eyes: L('h0').e + 0.15,                        // her face in the phone's glow
      bus: L('n2').s - 0.1,                          // he pulled her off the curb, caught his bus
      window: W('n2', 'caught') - 0.15,
      shelter: W('n2', 'left') - 0.2,
      receipt: L('n3').s - 0.15,
      receiptB: W('n3', 'same') - 0.1,
      think: L('n4').s - 0.15,
      lane: W('n4', "don't") - 0.1,
      laneB: L('n5').s - 0.1,                       // "So I walked every lane around it."
      building: W('n5', 'almost') - 0.15,
      steps: W('n5', 'there') - 0.15,               // "...there he was. Waiting, like he knew."
      handover: L('bm1').s - 0.35,
      kTalk: L('bk1').s - 0.15,
      brother: L('bk3').s - 0.1,
      strapName: W('bn1', 'strap') - 0.6,
      door: L('bk4').s - 0.15,
      photo: L('cn1').s - 0.3,
      kitchen: L('ck1').s - 0.2,
      mug: L('ck1').e + 0.2,
      mugB: W('cn2', 'in') - 0.1,
      buzz: L('en2').s - 0.95,                      // the new message
      him: W('en2', 'from') - 0.15,
      her: W('en3', 'he', 1) - 0.15,                 // "He hadn't touched his phone."
      endCard: end + 0.35,
      total: end + 2.15,
      noteWords: { h0: T.words.filter((w) => w.line === 'h0') },
    };
    c.sfx = [
      [0.0, 'buzz', -7, 0.1],
      [0.05, 'heartbeat', -10, 0],
      [c.eyes - 0.03, 'boomSoft', -9, 0],
      [c.bus - 0.3, 'riser', -17, 0],
      [c.bus, 'rainStart', -14, 0],
      [c.bus + 0.2, 'engine', -16, 0.3],
      [c.shelter + 0.2, 'clothShift', -20, -0.2],
      [c.receipt + 0.3, 'clothShift', -22, 0.1],
      [W('n3', '6:20') - 0.05, 'shimmer', -19, 0],
      [c.steps - 0.02, 'tickTock', -20, 0],
      [c.steps + 0.25, 'heartbeat', -16, 0],
      [c.handover + 0.15, 'clothShift', -19, 0.1],
      [c.kTalk + 0.3, 'grab', -21, 0],
      [c.strapName + 0.3, 'shimmer', -21, 0],
      [c.door + 0.4, 'cafeDoor', -20, 0.2],
      [c.photo + 0.2, 'cupTip', -24, -0.2],
      [W('cn2', 'message') - 0.1, 'shimmer', -17, 0],
      [c.buzz + 0.2, 'buzz', -6, 0.1],
      [c.buzz + 0.25, 'boomSoft', -9, 0],
      [c.him, 'heartbeat', -12, 0],
      [c.her, 'riser', -14, 0],
      [c.endCard - 0.35, 'boom', -8, 0],
      [c.endCard + 0.1, 'endTicks', -8, 0],
    ];
    c.beds = [
      [c.bus, c.lane, 'rain', -24],
      [c.lane, c.door + 1.2, 'rain', -27],
      [c.door + 1.2, c.endCard - 0.35, 'rain', -36],
    ];
    c.music = [
      { at: 0, kind: 'hook' },
      { at: c.eyes, kind: 'mystery' },
      { at: c.receipt, kind: 'cozy2' },
      { at: c.steps, kind: 'pulse' },
      { at: c.handover, kind: 'romance' },
      { at: c.brother, kind: 'ache' },
      { at: c.door, kind: 'cozy' },
      { at: L('cn2').s - 0.2, kind: 'drone' },
      { at: c.buzz, kind: 'build' },
      { at: c.endCard - 0.35, kind: 'cut' },
      { at: c.endCard + 0.1, kind: 'sting' },
    ];
    return c;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = build;
  else g.PP.CUES = build(g.TIMING);
})(typeof window !== 'undefined' ? window : globalThis);
