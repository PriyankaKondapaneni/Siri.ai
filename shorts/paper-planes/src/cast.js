// The cast, as paper dolls: every part is a piece of cut paper with an ink line, assembled per pose and given a
// white scissor-cut border as one sticker. Mira is fully posable; Leo is only ever a silhouette in Episode 1; the
// "someone" in the alley is a hand and a cat's eyes.
(function (g) {
  const PP = g.PP;
  const INK = '#221c24';

  // a filled paper shape with an ink outline (closed curve through control points)
  function shape(ctx, ctrl, paper, o = {}) {
    const pts = o.raw ? ctrl : PP.curve(ctrl, o.n ?? 8, true);
    PP.with(ctx, () => {
      PP.path(ctx, pts);
      ctx.fillStyle = PP.PAPERS[paper] ? PP.pattern(ctx, paper) : paper;
      ctx.fill();
      if (o.shade) { ctx.clip(); o.shade(ctx); }
    });
    if (o.line !== false) PP.ink(ctx, [...pts, pts[0], pts[1]], { w: o.w ?? 3.2, color: o.color || INK, seed: o.seed ?? 1, boil: o.boil, jitter: 0.8, wobble: 1, taper: 0.2, dry: false, step: 5 });
    return pts;
  }
  PP.shape = shape;

  // a limb: a tapered sleeve along a polyline, with a mitten hand at the end
  function limb(ctx, pts, o) {
    const P = PP.curve(pts, 10);
    const w0 = o.w0 ?? 34, w1 = o.w1 ?? 26;
    const left = [], right = [];
    for (let i = 0; i < P.length; i++) {
      const a = P[Math.max(0, i - 1)], c = P[Math.min(P.length - 1, i + 1)];
      let dx = c[0] - a[0], dy = c[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      dx /= l; dy /= l;
      const h = PP.lerp(w0, w1, i / (P.length - 1)) / 2;
      left.push([P[i][0] - dy * h, P[i][1] + dx * h]);
      right.push([P[i][0] + dy * h, P[i][1] - dx * h]);
    }
    shape(ctx, [...left, ...right.reverse()], o.paper || 'mustard', { raw: true, boil: o.boil, seed: o.seed, shade: (c) => { c.fillStyle = 'rgba(120,60,0,0.16)'; c.fillRect(-400, -400, 800, 800); } });
    const e = P[P.length - 1], pe = P[P.length - 2];
    const ang = Math.atan2(e[1] - pe[1], e[0] - pe[0]);
    // the cuff
    PP.with(ctx, () => {
      ctx.translate(e[0], e[1]);
      ctx.rotate(ang);
      shape(ctx, [[-4, -w1 / 2 - 1], [6, -w1 / 2 - 1], [6, w1 / 2 + 1], [-4, w1 / 2 + 1]], o.cuff || 'cream', { raw: true, boil: o.boil, seed: (o.seed ?? 1) + 3, w: 2.5 });
      if (o.hand !== false) hand(ctx, o.handKind || 'open', o.boil, (o.seed ?? 1) + 9, o.handFlip ? -1 : 1, o.skin || 'skin');
    });
  }

  // a slender hand pointing along +x from the wrist; kinds: open, fist, hold (pinching something), point
  function hand(ctx, kind, boil, seed, flip = 1, skin = 'skin') {
    ctx.scale(1, flip);
    const finger = (pts, w, sd) => PP.with(ctx, () => {
      const P = PP.curve(pts, 6);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = INK; ctx.lineWidth = w + 4.4; ctx.beginPath(); P.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke();
      ctx.strokeStyle = PP.pattern(ctx, skin); ctx.lineWidth = w; ctx.stroke();
    });
    // fingers first (the palm covers their roots), then the palm, then the thumb
    if (kind === 'open') { finger([[20, -8], [40, -11], [52, -12]], 7.5); finger([[22, -2], [44, -2], [57, -1]], 7.5); finger([[22, 4], [43, 6], [54, 8]], 7.2); finger([[20, 9], [36, 13], [45, 16]], 6.4); }
    else if (kind === 'point') { finger([[20, -6], [44, -8], [60, -9]], 7.5); finger([[22, 0], [32, 6], [28, 12]], 7.5); finger([[21, 5], [30, 11], [25, 15]], 7); }
    else { finger([[20, -7], [34, -8], [36, 2]], 7.5); finger([[22, -1], [36, 0], [36, 9]], 7.5); finger([[21, 5], [33, 7], [31, 14]], 7); }
    shape(ctx, [[2, -11], [20, -13], [27, -4], [26, 8], [18, 14], [2, 12]], skin, { boil, seed, w: 2.4 });
    finger(kind === 'hold' ? [[12, -8], [24, -16], [34, -10]] : [[10, -9], [20, -19], [30, -22]], 7.6);
  }
  PP.hand = hand;
  PP.limb = limb;

  // ---------------------------------------------------------------- Mira
  // pose: { eyes, mouth, brows, look: [dx, dy], blush, sweat, sleepy, bonk, armL, armR, tilt, hairBlow }
  // Arms are polylines in her local frame (origin at the bottom centre of her torso; up is -y).
  PP.MIRA_ARMS = {
    sill: { L: [[-58, -118], [-92, -40], [-40, -8]], R: [[58, -118], [92, -40], [40, -8]] },
    chin: { L: [[-58, -118], [-88, -30], [-34, -150]], R: [[58, -118], [92, -40], [40, -8]] },
    windup: { L: [[-58, -118], [-92, -40], [-40, -8]], R: [[58, -118], [120, -200], [70, -290]] },
    throw: { L: [[-58, -118], [-92, -40], [-40, -8]], R: [[58, -118], [150, -170], [215, -205]] },
    follow: { L: [[-58, -118], [-92, -40], [-40, -8]], R: [[58, -118], [140, -110], [200, -90]] },
    hold: { L: [[-58, -118], [-110, -110], [-120, -200]], R: [[58, -118], [92, -40], [40, -8]] },
    cheeks: { L: [[-58, -118], [-92, -90], [-60, -205]], R: [[58, -118], [92, -90], [60, -205]] },
    write: { L: [[-58, -118], [-92, -40], [-40, -8]], R: [[58, -118], [100, -60], [40, -40]] },
  };

  function drawMira(ctx, p, b) {
    const s = 1;
    const arms = PP.MIRA_ARMS[p.arms || 'sill'];
    // back hair, behind everything (the bob's underside)
    PP.with(ctx, () => {
      ctx.translate(0, -258);
      ctx.rotate(p.tilt || 0);
      shape(ctx, [[-98, -40], [-104, 40], [-86, 92], [-40, 80], [40, 80], [86, 92], [104, 40], [98, -40], [0, -110]], 'hair', { boil: b, seed: 11 });
    });
    // arms that sit behind the torso
    if (p.arms === 'windup') limb(ctx, arms.R, { boil: b, seed: 21, handKind: 'hold' });
    // torso: the striped tee, the mustard cardigan open over it
    shape(ctx, [[-70, -150], [70, -150], [96, -40], [100, 0], [-100, 0], [-96, -40]], 'cream', {
      boil: b, seed: 31, line: false,
      shade: (c) => { c.fillStyle = 'rgba(46,62,110,0.85)'; for (let y = -150; y < 0; y += 22) c.fillRect(-120, y, 240, 9); },
    });
    shape(ctx, [[-70, -150], [-22, -150], [-12, -60], [-20, 0], [-100, 0], [-96, -40]], 'mustard', { boil: b, seed: 32 });
    shape(ctx, [[70, -150], [22, -150], [12, -60], [20, 0], [100, 0], [96, -40]], 'mustard', { boil: b, seed: 33 });
    for (const y of [-110, -70, -30]) { PP.with(ctx, () => { ctx.fillStyle = '#8a5a2b'; ctx.beginPath(); ctx.arc(-24, y, 5, 0, 7); ctx.fill(); }); }
    // knit marks on the cardigan
    for (let k = 0; k < 10; k++) {
      const x = (k % 2 ? 1 : -1) * (40 + PP.rand('knit', k) * 40), y = -20 - PP.rand('knity', k) * 110;
      PP.ink(ctx, [[x - 5, y - 4], [x, y + 2], [x + 5, y - 4]], { w: 1.6, color: '#9b6a22', seed: 40 + k, boil: b, jitter: 0.4, dry: false, alpha: 0.8 });
    }
    // neck
    shape(ctx, [[-20, -178], [20, -178], [22, -146], [-22, -146]], 'skin', { boil: b, seed: 35, w: 2.6 });
    // head
    PP.with(ctx, () => {
      ctx.translate(0, -258);
      ctx.rotate(p.tilt || 0);
      drawMiraHead(ctx, p, b);
    });
    // arms in front
    if (p.arms !== 'windup') {
      limb(ctx, arms.L, { boil: b, seed: 22, handKind: p.arms === 'hold' ? 'hold' : 'open', handFlip: true });
      limb(ctx, arms.R, { boil: b, seed: 23, handKind: p.arms === 'throw' || p.arms === 'follow' ? 'open' : p.arms === 'write' ? 'hold' : 'open' });
    }
  }

  function drawMiraHead(ctx, p, b) {
    // face
    shape(ctx, [[-78, -30], [-70, 40], [-36, 82], [0, 90], [36, 82], [70, 40], [78, -30], [50, -82], [0, -96], [-50, -82]], 'skin', { boil: b, seed: 51 });
    // ears peek out under the hair
    shape(ctx, [[-80, 0], [-92, 6], [-90, 26], [-76, 28]], 'skin', { boil: b, seed: 52, w: 2.4 });
    shape(ctx, [[80, 0], [92, 6], [90, 26], [76, 28]], 'skin', { boil: b, seed: 53, w: 2.4 });
    const [lx, ly] = p.look || [0, 0];
    // blush: crayon hatching
    if (p.blush !== 0) {
      for (const sx of [-1, 1]) PP.hatch(ctx, PP.ellipsePoly(sx * 44, 34, 18 + (p.blush || 0) * 6, 10 + (p.blush || 0) * 3, 20), { color: 'rgba(232,110,105,0.55)', gap: 4.5, w: 2.2, seed: 60 + sx, boil: b });
    }
    // eyes
    const eyeY = 6;
    for (const sx of [-1, 1]) {
      const ex = sx * 30 + lx, ey = eyeY + ly;
      const kind = p.eyes || 'open';
      const sd = 70 + sx;
      if (kind === 'open' || kind === 'wide') {
        const r = kind === 'wide' ? 12 : 9.5;
        PP.with(ctx, () => { ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(ex, ey, r * 0.85, r * 1.12, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + 3, ey - 4, r * 0.32, 0, 7); ctx.fill(); });
        if (kind === 'wide') PP.ink(ctx, PP.circlePts(ex, ey, 17, 20, 24), { w: 2, seed: sd, boil: b, color: INK, alpha: 0.7, dry: false });
        PP.ink(ctx, [[ex + sx * 7, ey - 9], [ex + sx * 15, ey - 15]], { w: 2.4, seed: sd + 4, boil: b, color: INK, dry: false });
      } else if (kind === 'half') {
        PP.with(ctx, () => { ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(ex, ey + 3, 9, 6, 0, 0, Math.PI); ctx.fill(); });
        PP.ink(ctx, [[ex - 13, ey + 1], [ex + 13, ey + 1]], { w: 3.4, seed: sd, boil: b, color: INK, dry: false });
      } else if (kind === 'closed') {
        PP.ink(ctx, PP.curve([[ex - 12, ey], [ex, ey + 6], [ex + 12, ey]], 6), { w: 3.4, seed: sd, boil: b, color: INK, dry: false });
      } else if (kind === 'happy') {
        PP.ink(ctx, PP.curve([[ex - 12, ey + 4], [ex, ey - 6], [ex + 12, ey + 4]], 6), { w: 3.6, seed: sd, boil: b, color: INK, dry: false });
      } else if (kind === 'squeeze') {
        PP.ink(ctx, [[ex - sx * 12, ey - 8], [ex + sx * 4, ey], [ex - sx * 12, ey + 8]], { w: 3.6, seed: sd, boil: b, color: INK, dry: false });
      } else if (kind === 'x') {
        PP.ink(ctx, [[ex - 9, ey - 9], [ex + 9, ey + 9]], { w: 3.4, seed: sd, boil: b, dry: false });
        PP.ink(ctx, [[ex + 9, ey - 9], [ex - 9, ey + 9]], { w: 3.4, seed: sd + 1, boil: b, dry: false });
      }
    }
    // brows
    const brow = p.brows || 'neutral';
    for (const sx of [-1, 1]) {
      const bx = sx * 30 + lx * 0.5, by = -22;
      const tilt = brow === 'up' ? -6 : brow === 'worried' ? sx * -5 : brow === 'flat' ? 0 : brow === 'angry' ? sx * 5 : -2;
      const lift = brow === 'up' ? -8 : brow === 'flat' ? 4 : 0;
      PP.ink(ctx, [[bx - 12, by + lift - tilt * sx * -1], [bx + 12, by + lift + tilt * sx * -1]], { w: 3.4, seed: 80 + sx, boil: b, color: INK, dry: false, taper: 0.7 });
    }
    // nose
    PP.ink(ctx, PP.curve([[-2, 22], [4, 30], [-3, 33]], 5), { w: 2.2, seed: 90, boil: b, color: INK, alpha: 0.7, dry: false });
    // mouth
    const m = p.mouth || 'smile', my = 52;
    if (m === 'smile') PP.ink(ctx, PP.curve([[-14, my - 2], [0, my + 7], [14, my - 2]], 6), { w: 3.2, seed: 91, boil: b, dry: false });
    else if (m === 'grin') shape(ctx, [[-18, my - 4], [18, my - 4], [10, my + 12], [-10, my + 12]], '#7a2630', { boil: b, seed: 92, w: 2.8 });
    else if (m === 'flat') PP.ink(ctx, [[-12, my + 2], [12, my + 1]], { w: 3.2, seed: 93, boil: b, dry: false });
    else if (m === 'o') shape(ctx, PP.ellipsePoly(0, my + 4, 8, 11, 12), '#6e2430', { raw: true, boil: b, seed: 94, w: 2.6 });
    else if (m === 'small') PP.ink(ctx, PP.curve([[-6, my], [0, my + 3], [6, my]], 4), { w: 3, seed: 95, boil: b, dry: false });
    else if (m === 'wobble') PP.ink(ctx, PP.curve([[-14, my + 2], [-7, my - 3], [0, my + 2], [7, my - 3], [14, my + 2]], 5), { w: 3, seed: 96, boil: b, dry: false });
    else if (m === 'pout') PP.ink(ctx, PP.curve([[-10, my + 4], [0, my - 2], [10, my + 4]], 5), { w: 3.2, seed: 97, boil: b, dry: false });
    // the bob: a cap of hair with blunt bangs, flicking out at the jaw, and her coral clip
    shape(ctx, [[-88, 30], [-96, -40], [-70, -92], [0, -116], [70, -92], [96, -40], [88, 30], [74, 52], [70, -10], [52, -44], [20, -40], [-10, -46], [-40, -40], [-62, -20], [-72, 52]], 'hair', { boil: b, seed: 101 });
    PP.ink(ctx, PP.curve([[-62, -66], [-30, -96], [10, -104]], 6), { w: 7, color: 'rgba(150,110,95,0.55)', seed: 105, boil: b, dry: false, taper: 0.9 });
    PP.ink(ctx, PP.curve([[-30, -100], [-50, -60]], 4), { w: 1.8, color: '#5a4038', seed: 102, boil: b, dry: false });
    PP.ink(ctx, PP.curve([[20, -104], [40, -58]], 4), { w: 1.8, color: '#5a4038', seed: 103, boil: b, dry: false });
    shape(ctx, [[46, -60], [72, -70], [76, -58], [50, -48]], 'coral', { raw: true, boil: b, seed: 104, w: 2.4 });
    if (p.sleepy) {
      for (const [x, y, a, l] of [[-50, -100, -0.5, 46], [-6, -112, 0.1, 54], [40, -100, 0.7, 40], [66, -80, 1.1, 34]]) {
        PP.with(ctx, () => { ctx.translate(x, y); ctx.rotate(a); shape(ctx, [[-9, 6], [-6, -l * 0.6], [4, -l], [10, -l * 0.5], [9, 6]], 'hair', { boil: b, seed: 110 + x, w: 2.6 }); });
      }
    }
    if (p.sweat) shape(ctx, [[94, -50], [104, -28], [98, -16], [88, -26]], '#9fd0ea', { boil: b, seed: 120, w: 2.2 });
  }
  PP.drawMiraHead = drawMiraHead;

  /** Mira as a sticker. scale renders her crisply at that size. Returns the sprite (origin: bottom centre). */
  PP.mira = function (pose, boil, scale = 1) {
    const key = 'mira:' + JSON.stringify(pose) + ':' + boil + ':' + scale;
    return PP.sticker(key, 520 * scale, 640 * scale, 260 * scale, 600 * scale, (ctx) => { ctx.scale(scale, scale); drawMira(ctx, pose, boil); }, { border: 8 * scale, shadowBlur: 10 * scale, shadowDx: 6 * scale, shadowDy: 10 * scale });
  };
  /** Just her head (close-ups). Origin: the centre of her face. */
  PP.miraHead = function (pose, boil, scale = 1) {
    const key = 'mirahead:' + JSON.stringify(pose) + ':' + boil + ':' + scale;
    return PP.sticker(key, 300 * scale, 340 * scale, 150 * scale, 170 * scale, (ctx) => { ctx.scale(scale, scale); drawMiraHead(ctx, pose, boil); }, { border: 7 * scale, shadowBlur: 10 * scale, shadowDx: 6 * scale, shadowDy: 10 * scale });
  };

  // ---------------------------------------------------------------- Leo: a silhouette behind his lamp-lit blind
  // Drawn straight onto the glowing window (no sticker): hunched over a desk, messy hair, one arm drawing.
  PP.leoSilhouette = function (ctx, x, y, s, t, o = {}) {
    const b = PP.boil(t);
    const draw = PP.step(t, 6);
    const arm = Math.sin(draw * 9.0) * 0.5 + 0.5; // the pencil hand moving
    PP.with(ctx, () => {
      ctx.translate(x, y);
      ctx.scale(s, s);
      ctx.globalAlpha *= o.alpha ?? 1;
      ctx.fillStyle = o.color || 'rgba(70,38,22,0.82)';
      ctx.filter = 'blur(1.6px)';
      // shoulders and back
      const body = PP.curve([[-120, 0], [-110, -90], [-60, -140], [10, -150], [70, -120], [100, -60], [120, 0]], 8, true);
      PP.path(ctx, body); ctx.fill();
      // head, bowed toward the desk, with tufts of messy hair and a pencil behind the ear
      ctx.beginPath(); ctx.ellipse(40, -190, 52, 58, 0.35, 0, 7); ctx.fill();
      for (let k = 0; k < 7; k++) { const a = -2.6 + k * 0.42; ctx.beginPath(); ctx.ellipse(40 + Math.cos(a) * 52, -192 + Math.sin(a) * 58, 16, 9, a, 0, 7); ctx.fill(); }
      ctx.fillRect(-8, -230, 38, 7);
      // the drawing arm
      ctx.lineWidth = 34; ctx.lineCap = 'round'; ctx.strokeStyle = ctx.fillStyle;
      ctx.beginPath(); ctx.moveTo(70, -110); ctx.lineTo(140 + arm * 40, -40); ctx.lineTo(190 + arm * 50, -20 - arm * 14); ctx.stroke();
      // the desk edge
      ctx.fillRect(-160, -4, 420, 18);
    });
  };

  // ---------------------------------------------------------------- the someone: an old hand with bangles
  PP.oldHand = function (boil, grip = 0) {
    return PP.sticker('oldhand:' + boil + ':' + grip, 520, 300, 470, 150, (ctx) => {
      // a sleeve of patterned cotton
      shape(ctx, [[0, -70], [140, -60], [150, 60], [0, 70]], 'plum', { raw: true, boil, seed: 201, shade: (c) => { c.fillStyle = 'rgba(240,190,120,0.55)'; for (let k = 0; k < 30; k++) { c.beginPath(); c.arc(PP.rand('fl', k) * 150, -70 + PP.rand('fly', k) * 140, 4 + PP.rand('flr', k) * 4, 0, 7); c.fill(); } } });
      ctx.translate(-120 + 0, 0);
      // forearm and the back of the hand, fingers curling to pick something up (grip 0..1)
      shape(ctx, [[260, -52], [130, -44], [40, -40], [-10, -26], [-40, -4], [-36, 20], [10, 36], [130, 46], [260, 52]], 'skinOld', { boil, seed: 202 });
      for (let f = 0; f < 4; f++) {
        const fy = -24 + f * 15, curl = grip * (0.9 + f * 0.1);
        const p0 = [-30, fy], p1 = [-72 + curl * 20, fy - 4 + curl * 20], p2 = [-96 + curl * 52, fy + curl * 44];
        PP.with(ctx, () => { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 17; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(...p0); ctx.lineTo(...p1); ctx.lineTo(...p2); ctx.stroke(); ctx.lineWidth = 12; ctx.strokeStyle = PP.pattern(ctx, 'skinOld'); ctx.stroke(); });
      }
      // thumb
      PP.with(ctx, () => { ctx.lineCap = 'round'; ctx.lineWidth = 19; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(10, 30); ctx.lineTo(-30, 52 - grip * 10); ctx.lineTo(-60 + grip * 20, 58 - grip * 20); ctx.stroke(); ctx.lineWidth = 13; ctx.strokeStyle = PP.pattern(ctx, 'skinOld'); ctx.stroke(); });
      // wrinkles and knuckles
      for (let k = 0; k < 6; k++) PP.ink(ctx, PP.curve([[40 + k * 22, -30], [46 + k * 22, -10], [40 + k * 22, 10]], 4), { w: 1.6, color: '#7a4a38', seed: 210 + k, boil, alpha: 0.6, dry: false });
      // gold bangles
      for (let k = 0; k < 3; k++) shape(ctx, [[150 + k * 16, -58], [162 + k * 16, -58], [162 + k * 16, 58], [150 + k * 16, 58]], 'amber', { raw: true, boil, seed: 220 + k, w: 2.4, shade: (c) => { c.fillStyle = 'rgba(255,255,220,0.5)'; c.fillRect(150 + k * 16, -58, 4, 116); } });
    }, { border: 7 });
  };

  // Biscuit, in the dark: just two eyes that blink
  PP.catEyes = function (ctx, x, y, s, t, open = 1) {
    PP.with(ctx, () => {
      ctx.translate(x, y);
      ctx.scale(s, s);
      for (const sx of [-1, 1]) {
        const gr = ctx.createRadialGradient(sx * 26, 0, 0, sx * 26, 0, 40);
        gr.addColorStop(0, 'rgba(210,240,120,0.5)');
        gr.addColorStop(1, 'rgba(210,240,120,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(sx * 26 - 40, -40, 80, 80);
        ctx.fillStyle = '#d8f07a';
        ctx.beginPath();
        ctx.ellipse(sx * 26, 0, 13, 11 * open + 0.5, 0, 0, 7);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.ellipse(sx * 26, 0, 3.2, 10 * open + 0.3, 0, 0, 7);
        ctx.fill();
      }
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
