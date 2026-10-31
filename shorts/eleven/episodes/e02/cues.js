// 11:11, Episode 2 (one minute), "The Umbrella": the cue sheet. Old Part 2 (the receipt), Part 3 (the umbrella on
// his steps) and the start of Part 4 (his flat, "Blue suits you"). Most shots are Wan clips laid over this cut; the
// code draws only the end card and the subtitles. The sound and score are built from these cues.
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
      // the cold open: three flashes from the end of the episode, under "From a night he hasn't lived yet."
      hookB: 0.75,
      hookC: 1.5,
      hookEnd: L('n1').s - 0.25,
      bus: L('n1').s + 2.5,
      shelter: L('n2').s - 0.1,
      receipt: L('n3').s - 0.15,
      think: W('n3', '6:20') - 0.35,
      lane: L('n4').s - 0.15,
      steps: W('n4', "don't") - 0.1,
      // on his steps
      handover: L('bm1').s - 0.35,
      kTalk: L('bk1').s - 0.15,
      kTake: L('bm2').s - 0.15,
      kIsnt: L('bk2').s - 0.1,
      wide: L('bm3').s - 0.15,
      brother: L('bk3').s - 0.1,
      strapName: L('bn1').s - 0.1,
      miraLook: W('bn1', 'not') - 0.15,
      door: L('bk4').s - 0.15,
      doorB: L('bm4').s - 0.15,
      // his flat
      flat: L('cn1').s - 0.35,
      photo: W('cn1', 'photograph') - 0.3,
      kitchen: L('ck1').s - 0.2,
      mug: L('ck1').e + 0.2,
      endCard: end + 0.15,
      total: end + 1.95,
    };
    c.mugB = (c.mug + c.endCard - 0.15) / 2;
    c.sfx = [
      [0.0, 'heartbeat', -10, 0],
      [c.hookB - 0.03, 'whooshBy', -18, -0.3],
      [c.hookC - 0.03, 'whooshBy', -18, 0.3],
      [c.hookEnd - 1.2, 'riser', -15, 0],
      [c.hookEnd - 0.03, 'boomSoft', -7, 0],
      [c.hookEnd, 'rainStart', -14, 0],
      [c.bus - 0.2, 'engine', -16, 0.3],
      [c.shelter + 0.2, 'clothShift', -20, -0.2],
      [c.receipt + 0.3, 'clothShift', -22, 0.1],
      [W('n3', '6:20') - 0.05, 'shimmer', -19, 0],
      [c.steps + 0.25, 'heartbeat', -17, 0],
      [c.handover + 0.15, 'clothShift', -19, 0.1],
      [c.kTake + 0.2, 'grab', -21, 0],
      [c.strapName + 0.3, 'shimmer', -21, 0],
      [c.door + 0.4, 'cafeDoor', -20, 0.2],
      [c.flat + 0.2, 'cupTip', -24, -0.2],
      [W('cn2', 'message') - 0.1, 'shimmer', -17, 0],
      [W('cn2', 'from') - 0.05, 'heartbeat', -13, 0],
      [c.endCard + 0.1, 'endTicks', -8, 0],
    ];
    c.beds = [
      [c.hookEnd, c.lane, 'rain', -24],
      [c.lane, c.door + 1.2, 'rain', -27],
      [c.door + 1.2, c.endCard, 'rain', -36],
    ];
    c.music = [
      { at: 0, kind: 'hook' },
      { at: c.hookEnd, kind: 'mystery' },
      { at: c.receipt, kind: 'cozy2' },
      { at: c.steps, kind: 'romance' },
      { at: c.brother, kind: 'ache' },
      { at: c.door, kind: 'cozy' },
      { at: L('cn2').s - 0.2, kind: 'drone' },
      { at: c.endCard - 0.15, kind: 'cut' },
      { at: c.endCard + 0.1, kind: 'sting' },
    ];
    return c;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = build;
  else g.PP.CUES = build(g.TIMING);
})(typeof window !== 'undefined' ? window : globalThis);
