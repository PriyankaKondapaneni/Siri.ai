// The two leads, drawn as illustrated paper dolls: Mira (22) and Leo (24). Faces are built from cut paper (skin with
// a soft shade side), almond eyes with irises and highlights, shaped brows, a nose with a bridge, shaped lips, and
// layered hair with highlight strands. Every line is ink on the boil clock; each pose becomes one sticker.
(function (g) {
  const PP = g.PP;
  const shape = PP.shape;

  const MIRA = {
    skin: 'skin', shadeCol: 'rgba(196,120,96,0.26)', ink: '#2a1c1c', iris: ['#9a6638', '#4a2c18'], irisR: 13.4, open: 1, blush: 0.35,
    eyeX: 31, eyeY: 10, eyeW: 22, lidW: 5, lashes: 3, browW: 3.4, browCol: '#3a2520', browArch: 7, browGap: 33,
    noseY: 42, noseLen: 28, mouthY: 65, mouthW: 16.5, lips: '#d6646f', lipsDark: '#a94a58', lipFull: 1.35,
    contour: [[0, -108], [41, -102], [65, -74], [72, -28], [70, 12], [61, 46], [43, 76], [21, 97], [0, 106], [-21, 97], [-43, 76], [-61, 46], [-70, 12], [-72, -28], [-65, -74], [-41, -102]],
  };
  const LEO = {
    skin: 'skinTan', shadeCol: 'rgba(150,85,60,0.34)', ink: '#241a1a', iris: ['#7a4e2a', '#33200f'], irisR: 11, open: 0.78, blush: 0,
    eyeX: 31, eyeY: 6, eyeW: 20, lidW: 4.6, lashes: 0, browW: 7, browCol: '#211514', browArch: 2.5, browGap: 21,
    noseY: 46, noseLen: 40, mouthY: 72, mouthW: 19, lips: '#c08070', lipsDark: '#8e5547', lipFull: 0.5,
    contour: [[0, -118], [45, -112], [72, -82], [79, -34], [78, 14], [73, 46], [61, 78], [38, 101], [15, 113], [0, 115], [-15, 113], [-38, 101], [-61, 78], [-73, 46], [-78, 14], [-79, -34], [-72, -82], [-45, -112]],
  };
  PP.PAPERS.skinTan = { base: '#e2b18c', mottle: 0.05, grain: 0.03 };
  PP.PAPERS.hairBrown = { base: '#3b241c', mottle: 0.12, grain: 0.06 };
  PP.PAPERS.hairBlack = { base: '#241a19', mottle: 0.12, grain: 0.06 };
  PP.PAPERS.knitNavy = { base: '#2e3c63', mottle: 0.1, grain: 0.06 };

  // ---------------------------------------------------------------- the face
  // turn (-1..1) warps the face toward three-quarter view: features slide toward the turn, the far side compresses,
  // the outline compresses less (the skull is round), the far eye narrows.
  let TURN = 0;
  const wf = (x) => { const far = Math.sign(x) === Math.sign(TURN) && TURN !== 0; return x * (far ? 1 - 0.32 * Math.abs(TURN) : 1 + 0.04 * Math.abs(TURN)) + 20 * TURN; };
  const wc = (x) => { const far = Math.sign(x) === Math.sign(TURN) && TURN !== 0; return x * (far ? 1 - 0.14 * Math.abs(TURN) : 1 + 0.03 * Math.abs(TURN)) + 6 * TURN; };
  const farScale = (sx) => (Math.sign(sx) === Math.sign(TURN) && TURN !== 0 ? 1 - 0.22 * Math.abs(TURN) : 1);
  function eye(ctx, F, p, sx, b) {
    const o = sx; // +1: the right eye (outer corner to +x)
    const cx = wf(sx * F.eyeX), cy = F.eyeY;
    const kind = p.eyes || 'open';
    const [lx, ly] = p.look || [0, 0];
    const ink = F.ink;
    const seed = 300 + sx;
    const W = F.eyeW * farScale(sx);
    if (kind === 'happy' || kind === 'closed' || kind === 'squeeze' || kind === 'x') {
      if (kind === 'squeeze') { PP.ink(ctx, [[cx - o * 14, cy - 9], [cx + o * 6, cy], [cx - o * 14, cy + 9]], { w: 4, seed, boil: b, color: ink, dry: false }); return; }
      if (kind === 'x') { PP.ink(ctx, [[cx - 10, cy - 10], [cx + 10, cy + 10]], { w: 3.6, seed, boil: b, dry: false }); PP.ink(ctx, [[cx + 10, cy - 10], [cx - 10, cy + 10]], { w: 3.6, seed: seed + 1, boil: b, dry: false }); return; }
      const up = kind === 'happy';
      const line = PP.curve(up ? [[cx - o * W, cy + 4], [cx, cy - 9], [cx + o * (W + 2), cy + 1]] : [[cx - o * W, cy - 1], [cx, cy + 8], [cx + o * (W + 2), cy - 3]], 8);
      PP.ink(ctx, line, { w: F.lidW, seed, boil: b, color: ink, dry: false, taper: 0.7 });
      for (let k = 0; k < F.lashes; k++) { const q = line[line.length - 1 - k * 3]; PP.ink(ctx, [q, [q[0] + o * (6 + k), q[1] + (up ? -4 - k * 2 : 3 + k * 2)]], { w: 2, seed: seed + 10 + k, boil: b, color: ink, dry: false }); }
      return;
    }
    // openness: how high the upper lid sits
    const open = (kind === 'wide' ? 1.3 : kind === 'half' ? 0.45 : kind === 'down' ? 0.55 : 1) * (kind === 'wide' ? 1 : F.open);
    const top = -19 * open, bot = 11 + (kind === 'wide' ? 3 : 0);
    const inner = [cx - o * W, cy + 3], outer = [cx + o * (W + 1), cy - 3];
    const upper = PP.curve([inner, [cx - o * 6, cy + top - 1], [cx + o * 8, cy + top * 0.92], outer], 6);
    const lower = PP.curve([outer, [cx + o * 6, cy + bot], [cx - o * 8, cy + bot - 1], inner], 6);
    const sclera = [...upper, ...lower];
    PP.with(ctx, () => {
      PP.path(ctx, sclera);
      ctx.fillStyle = '#fbf6ee';
      ctx.fill();
      ctx.clip();
      const ix = cx + lx * 1.0 + (kind === 'down' ? 0 : 0), iy = cy + ly + (kind === 'down' ? 4 : 1);
      const R = F.irisR * (kind === 'wide' ? 0.85 : 1);
      const gr = ctx.createRadialGradient(ix, iy, 1, ix, iy, R);
      gr.addColorStop(0, F.iris[0]);
      gr.addColorStop(0.75, F.iris[1]);
      gr.addColorStop(1, '#1a0f0a');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(ix, iy, R, 0, 7); ctx.fill();
      ctx.fillStyle = '#120a08';
      ctx.beginPath(); ctx.arc(ix, iy, R * 0.45, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(ix + R * 0.32, iy - R * 0.38, R * 0.3, 0, 7); ctx.fill();
      ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.arc(ix - R * 0.35, iy + R * 0.35, R * 0.13, 0, 7); ctx.fill();
      // the upper lid's shadow on the eyeball
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#6b4a44';
      PP.path(ctx, [...upper, [cx + o * W, cy + top + 6], [cx - o * W, cy + top + 6]]);
      ctx.fill();
    });
    // lids: a heavy upper line with a lifted outer flick and lashes, a light lower line, the crease above
    PP.ink(ctx, [[inner[0] - o * 2, inner[1] + 1], ...upper.slice(1), [outer[0] + o * 6, outer[1] - 4]], { w: F.lidW, seed: seed + 2, boil: b, color: F.ink, dry: false, taper: 0.55 });
    for (let k = 0; k < F.lashes; k++) {
      const q = upper[upper.length - 2 - k * 2];
      PP.ink(ctx, [q, [q[0] + o * (7 + k * 2), q[1] - 6 - k]], { w: 2.1, seed: seed + 20 + k, boil: b, color: F.ink, dry: false, taper: 0.9 });
    }
    PP.ink(ctx, lower.slice(1, -1), { w: 1.7, seed: seed + 3, boil: b, color: F.ink, dry: false, alpha: 0.55, taper: 0.8 });
    if (kind !== 'half') PP.ink(ctx, PP.curve([[cx - o * (W - 7), cy + top - 3], [cx + o * 2, cy + top - 7], [cx + o * (W - 3), cy + top - 3]], 6), { w: 1.6, seed: seed + 4, boil: b, color: F.ink, dry: false, alpha: 0.26, taper: 0.9 });
  }

  function brows(ctx, F, p, b) {
    const kind = p.brows || 'neutral';
    for (const sx of [-1, 1]) {
      const o = sx, cx = wf(sx * F.eyeX) + (p.look ? p.look[0] * 0.3 : 0), bs = farScale(sx);
      let y0 = F.eyeY - F.browGap, y1 = y0 - F.browArch, y2 = y0 + 2;
      if (kind === 'up') { y0 -= 9; y1 -= 10; y2 -= 7; }
      if (kind === 'worried') { y0 -= 10; y1 -= 4; y2 += 2; }
      if (kind === 'flat') { y0 += 3; y1 = y0 - 1; y2 = y0; }
      if (kind === 'angry') { y0 += 6; y1 += 1; y2 -= 3; }
      if (kind === 'soft') { y0 -= 3; y1 -= 3; y2 -= 1; }
      PP.ink(ctx, PP.curve([[cx - o * 22 * bs, y0], [cx + o * 2 * bs, y1], [cx + o * 25 * bs, y2]], 8), { w: F.browW, seed: 340 + sx, boil: b, color: F.browCol, dry: false, taper: 0.75 });
    }
  }

  function nose(ctx, F, b, leo) {
    const y = F.noseY, L = F.noseLen;
    ctx.save();
    ctx.translate(wf(0) + TURN * 8, 0);
    PP.ink(ctx, PP.curve([[5, y - L - 4], [8, y - L * 0.4], [10, y - 6]], 6), { w: 2, seed: 350, boil: b, color: F.ink, dry: false, alpha: leo ? 0.26 : 0.22, taper: 0.9 });
    PP.ink(ctx, PP.curve(leo ? [[-9, y - 1], [0, y + 3], [11, y - 2]] : [[-6, y - 2], [1, y + 1], [7, y - 3]], 6), { w: 2.4, seed: 351, boil: b, color: F.ink, dry: false, alpha: 0.75, taper: 0.6 });
    PP.with(ctx, () => { ctx.fillStyle = PP.hex('#4a2a26', 0.38); for (const x of leo ? [-8, 10] : [-6, 8]) { ctx.beginPath(); ctx.ellipse(x, y - 2, 2.6, 1.6, 0, 0, 7); ctx.fill(); } });
    ctx.restore();
  }

  function mouth(ctx, F, p, b) {
    ctx.save();
    ctx.translate(wf(0) + TURN * 4, 0);
    ctx.scale(1 - 0.16 * Math.abs(TURN), 1);
    try {
    const m = p.mouth || 'smile', y = F.mouthY, f = F.lipFull;
    const ink = F.ink;
    if (m === 'o') { shape(ctx, PP.ellipsePoly(0, y + 4, 8, 11, 14), F.lipsDark, { raw: true, boil: b, seed: 360, w: 2.4, color: ink }); return; }
    if (m === 'grin' || m === 'laugh') {
      const h = m === 'laugh' ? 20 : 13;
      const lips = [[-22, y - 3], [-8, y - 6], [0, y - 4], [8, y - 6], [22, y - 3], [12, y + h], [0, y + h + 3], [-12, y + h]];
      shape(ctx, lips, '#7c2d36', { boil: b, seed: 361, w: 2.6, color: ink, n: 6 });
      PP.with(ctx, () => { PP.path(ctx, PP.curve(lips, 6, true)); ctx.clip(); ctx.fillStyle = '#fbf6ee'; ctx.fillRect(-24, y - 8, 48, 9); });
      return;
    }
    const lift = m === 'smile' ? 4 : m === 'soft' ? 2 : m === 'pout' ? -2 : m === 'smirk' ? 3 : 0;
    const w = m === 'small' ? F.mouthW * 0.65 : F.mouthW;
    const asym = m === 'smirk' ? 4 : 0;
    // upper lip with a cupid's bow, fuller lower lip with a highlight
    PP.with(ctx, () => {
      ctx.fillStyle = PP.hex(F.lips, 0.95);
      PP.path(ctx, PP.curve([[-w, y - lift * 0.4], [-w * 0.45, y - 4 * f], [-2, y - 2 * f], [2, y - 2 * f], [w * 0.45, y - 4 * f], [w + asym, y - lift * 0.4 - asym], [0, y + 1]], 5, true));
      ctx.fill();
      PP.path(ctx, PP.curve([[-w * 0.86, y + 1 - lift * 0.3], [0, y + 1], [w * 0.86 + asym, y + 1 - lift * 0.3 - asym], [w * 0.4, y + 7 * f + 1], [-w * 0.4, y + 7 * f + 1]], 5, true));
      ctx.fill();
      ctx.fillStyle = 'rgba(255,240,235,0.55)';
      ctx.beginPath(); ctx.ellipse(2, y + 4 * f + 1, w * 0.28, 1.6 * f + 0.4, 0, 0, 7); ctx.fill();
    });
    const line = m === 'wobble' ? [[-w, y + 1], [-w / 2, y - 2], [0, y + 2], [w / 2, y - 2], [w, y + 1]] : [[-w - 1, y - lift], [-w * 0.4, y + 1], [w * 0.4, y + 1], [w + 1 + asym, y - lift - asym]];
    PP.ink(ctx, PP.curve(line, 6), { w: 2.6, seed: 362, boil: b, color: ink, dry: false, taper: 0.7 });
    } finally { ctx.restore(); }
  }

  /** A face at the origin (eye level), in a character's spec F. */
  function face(ctx, F, p, b, o = {}) {
    TURN = p.turn || 0;
    const contour = PP.curve(F.contour.map(([x, y]) => [wc(x) + (y > 60 ? TURN * (y - 60) * 0.1 : 0), y]), 6, true);
    PP.with(ctx, () => {
      PP.path(ctx, contour);
      ctx.fillStyle = PP.pattern(ctx, F.skin);
      ctx.fill();
      ctx.clip();
      // the shade side and the shadow under the hairline give the face its roundness
      ctx.fillStyle = F.shadeCol;
      ctx.filter = 'blur(10px)';
      ctx.beginPath(); ctx.ellipse(118, 30, 70, 150, 0.1, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, -128, 120, 46, 0, 0, 7); ctx.fill();
      ctx.filter = 'none';
      const bl = p.blush ?? F.blush;
      if (bl > 0) {
        for (const sx of [-1, 1]) {
          const bx = wf(sx * 46);
          const gr = ctx.createRadialGradient(bx, 42, 2, bx, 42, (26 + bl * 8) * farScale(sx));
          gr.addColorStop(0, `rgba(240,120,120,${0.2 + bl * 0.3})`);
          gr.addColorStop(1, 'rgba(240,120,120,0)');
          ctx.fillStyle = gr;
          ctx.fillRect(bx - 50, -10, 100, 100);
        }
        if (bl > 0.9) for (const sx of [-1, 1]) PP.hatch(ctx, PP.ellipsePoly(wf(sx * 46), 42, 18 * farScale(sx), 9, 16), { color: 'rgba(220,90,90,0.45)', gap: 5, w: 1.8, seed: 370 + sx, boil: b, angle: -1.1 });
      }
    });
    PP.ink(ctx, [...contour, contour[0], contour[1]], { w: 3.4, seed: 380, boil: b, color: F.ink, jitter: 0.7, wobble: 0.8, taper: 0.25, dry: false });
    if (o.leo) {
      PP.ink(ctx, PP.curve([[58, 34], [50, 52], [42, 60]], 6), { w: 1.6, seed: 385, boil: b, color: F.ink, dry: false, alpha: 0.12, taper: 0.9 });
      PP.ink(ctx, PP.curve([[-8, 104], [0, 107], [8, 104]], 4), { w: 1.8, seed: 386, boil: b, color: F.ink, dry: false, alpha: 0.35, taper: 0.8 });
    }
    brows(ctx, F, p, b);
    eye(ctx, F, p, -1, b);
    eye(ctx, F, p, 1, b);
    nose(ctx, F, b, o.leo);
    mouth(ctx, F, p, b);
    if (p.sweat) shape(ctx, [[88, -46], [99, -22], [92, -10], [82, -20]], '#9fd0ea', { boil: b, seed: 390, w: 2.2 });
  }

  function ear(ctx, F, x, y, s, b, seed) {
    shape(ctx, [[x, y - 18], [x + s * 14, y - 22], [x + s * 18, y], [x + s * 12, y + 22], [x, y + 18]], F.skin, { boil: b, seed, w: 2.6, color: F.ink });
    PP.ink(ctx, PP.curve([[x + s * 4, y - 10], [x + s * 11, y - 8], [x + s * 9, y + 10]], 5), { w: 1.8, seed: seed + 1, boil: b, color: F.ink, alpha: 0.5, dry: false });
  }

  // highlight strands in hair: lighter strokes that follow the flow
  function strands(ctx, list, col, b, seed, w = 3) {
    list.forEach((pts, i) => PP.ink(ctx, PP.curve(pts, 8), { w, seed: seed + i, boil: b, color: col, dry: false, taper: 0.9, jitter: 0.6 }));
  }

  // ---------------------------------------------------------------- Mira's head
  function miraHairBack(ctx, b, blow = 0) {
    shape(ctx, [[-92, -74], [-104, 0], [-106, 70], [-100, 120], [-110, 160], [-86, 158], [-64, 172], [-36, 156], [0, 166], [36, 156], [64, 172], [86, 158], [110, 160], [100, 120], [106, 70], [104, 0], [92, -74], [56, -124], [0, -136], [-56, -124]].map(([x, y]) => [x + (y > 100 ? blow * (y - 100) * 0.4 : 0), y]), 'hairBrown', { boil: b, seed: 401, color: MIRA.ink });
    strands(ctx, [[[96, -10], [100, 60], [94, 130]], [[84, 40], [86, 110], [72, 150]]], 'rgba(140,92,70,0.6)', b, 405, 3);
  }
  function miraHairFront(ctx, p, b) {
    // the crown, parted on her right, and a soft sweep of fringe that falls down the left side of her face
    shape(ctx, [[24, -132], [66, -118], [90, -80], [92, -42], [80, -54], [66, -82], [44, -100], [38, -97], [22, -80], [-4, -64], [-36, -58], [-60, -44], [-72, -14], [-74, 40], [-72, 100], [-82, 146], [-102, 136], [-96, 86], [-96, 20], [-90, -52], [-68, -102], [-24, -128]], 'hairBrown', { boil: b, seed: 402, color: MIRA.ink });
    strands(ctx, [[[10, -122], [-36, -106], [-70, -72], [-86, -10]], [[-20, -112], [-60, -84], [-82, -10], [-88, 90]], [[34, -120], [70, -98], [86, -56]], [[-2, -94], [-30, -80], [-56, -58]]], 'rgba(150,100,76,0.78)', b, 410, 3.4);
    strands(ctx, [[[-84, 30], [-88, 90], [-92, 130]]], 'rgba(20,10,8,0.5)', b, 420, 2);
    // the coral clip, her signature, and a small gold stud
    PP.with(ctx, () => { ctx.translate(70, -86); ctx.rotate(0.55); shape(ctx, [[-20, -6], [20, -8], [22, 4], [-20, 6]], 'coral', { raw: true, boil: b, seed: 430, w: 2.4 }); });
    PP.with(ctx, () => { ctx.fillStyle = '#e8c160'; ctx.beginPath(); ctx.arc(90, 34, 3.6, 0, 7); ctx.fill(); });
  }
  function miraHead(ctx, p, b) {
    if (p.back !== false) miraHairBack(ctx, b, p.blow || 0);
    face(ctx, MIRA, p, b);
    if (!(p.turn > 0.4)) ear(ctx, MIRA, 68 * (1 - 0.14 * Math.max(0, p.turn || 0)) + 6 * (p.turn || 0), 14, 1, b, 440);
    miraHairFront(ctx, p, b);
    if (p.sleepy) for (const [x, y, a, l] of [[-40, -128, -0.6, 44], [0, -134, 0.05, 50], [40, -126, 0.6, 38]]) PP.with(ctx, () => { ctx.translate(x, y); ctx.rotate(a); shape(ctx, [[-8, 6], [-5, -l * 0.6], [4, -l], [9, -l * 0.5], [8, 6]], 'hairBrown', { boil: b, seed: 450 + x, w: 2.4, color: MIRA.ink }); });
  }

  // ---------------------------------------------------------------- Leo's head
  function leoHead(ctx, p, b) {
    shape(ctx, [[-90, -30], [-96, -96], [-62, -142], [0, -158], [62, -148], [98, -106], [94, -30], [80, 10], [-80, 10]], 'hairBlack', { boil: b, seed: 501, color: LEO.ink });
    // the pencil, tucked behind his right ear
    PP.with(ctx, () => {
      ctx.translate(100, -22);
      ctx.rotate(-1.15);
      shape(ctx, [[-46, -6], [40, -6], [40, 6], [-46, 6]], 'amber', { raw: true, boil: b, seed: 540, w: 2.2, color: LEO.ink });
      shape(ctx, [[40, -6], [56, 0], [40, 6]], 'kraft', { raw: true, boil: b, seed: 541, w: 2, color: LEO.ink });
      shape(ctx, [[-58, -6], [-46, -6], [-46, 6], [-58, 6]], 'rose', { raw: true, boil: b, seed: 542, w: 2, color: LEO.ink });
    });
    const T = p.turn || 0;
    if (T > -0.4) ear(ctx, LEO, -76 * (1 - 0.14 * Math.max(0, -T)) + 6 * T, 12, -1, b, 510);
    face(ctx, LEO, p, b, { leo: true });
    if (T < 0.4) ear(ctx, LEO, 76 * (1 - 0.14 * Math.max(0, T)) + 6 * T, 12, 1, b, 512);
    // swept up and to his left, with volume, and one strand fallen across the forehead
    shape(ctx, [[-86, -26], [-94, -82], [-78, -124], [-40, -152], [6, -166], [52, -160], [84, -138], [100, -104], [96, -58], [86, -30], [82, -60], [70, -84], [46, -96], [16, -98], [-10, -92], [-22, -82], [-16, -60], [-30, -52], [-38, -76], [-56, -74], [-72, -60], [-80, -30]], 'hairBlack', { boil: b, seed: 520, color: LEO.ink, n: 6 });
    strands(ctx, [[[-62, -132], [-20, -152], [30, -156], [70, -138]], [[-50, -110], [-10, -128], [40, -130], [80, -112]], [[-30, -90], [-24, -70], [-28, -56]], [[60, -150], [90, -120], [96, -84]]], 'rgba(125,96,84,0.72)', b, 530, 3.2);
  }

  // ---------------------------------------------------------------- busts
  // Origin: bottom centre of the torso (where a window sill cuts them), up is -y.
  const HEAD_Y = -318;
  PP.MIRA_ARMS = {
    sill: { L: [[-64, -128], [-96, -44], [-40, -10]], R: [[64, -128], [96, -44], [40, -10]] },
    chin: { L: [[-64, -128], [-90, -40], [-30, -196]], R: [[64, -128], [96, -44], [40, -10]] },
    windup: { L: [[-64, -128], [-96, -44], [-40, -10]], R: [[64, -128], [130, -220], [80, -320]] },
    throw: { L: [[-64, -128], [-96, -44], [-40, -10]], R: [[64, -128], [160, -190], [230, -230]] },
    follow: { L: [[-64, -128], [-96, -44], [-40, -10]], R: [[64, -128], [150, -120], [215, -98]] },
    hold: { L: [[-64, -128], [-118, -120], [-132, -226]], R: [[64, -128], [96, -44], [40, -10]] },
    cheeks: { L: [[-64, -128], [-96, -100], [-62, -246]], R: [[64, -128], [96, -100], [62, -246]] },
    write: { L: [[-64, -128], [-96, -44], [-40, -10]], R: [[64, -128], [104, -64], [40, -44]] },
  };
  function miraBust(ctx, p, b) {
    const arms = PP.MIRA_ARMS[p.arms || 'sill'];
    PP.with(ctx, () => { ctx.translate(0, HEAD_Y); ctx.rotate(p.tilt || 0); miraHairBack(ctx, b, p.blow || 0); });
    if (p.arms === 'windup') PP.limb(ctx, arms.R, { boil: b, seed: 21, handKind: 'hold', w0: 30, w1: 22 });
    // neck: long and slim, with the shadow under the jaw
    shape(ctx, [[-22, -212], [22, -212], [26, -140], [-26, -140]], 'skin', { boil: b, seed: 35, w: 2.6, color: MIRA.ink, shade: (c) => { c.fillStyle = 'rgba(190,110,90,0.35)'; c.beginPath(); c.ellipse(0, -205, 40, 22, 0, 0, 7); c.fill(); } });
    // the striped tee, a delicate necklace, the mustard cardigan
    shape(ctx, [[-60, -148], [60, -148], [92, -120], [100, -40], [102, 0], [-102, 0], [-100, -40], [-92, -120]], 'cream', { boil: b, seed: 31, line: false, shade: (c) => { c.fillStyle = 'rgba(46,62,110,0.82)'; for (let y = -140; y < 0; y += 22) c.fillRect(-120, y, 240, 8); } });
    PP.ink(ctx, PP.curve([[-24, -146], [0, -112], [24, -146]], 8), { w: 1.4, seed: 36, boil: b, color: '#c9a24a', dry: false });
    PP.with(ctx, () => { ctx.fillStyle = '#e8c160'; ctx.beginPath(); ctx.arc(0, -112, 4, 0, 7); ctx.fill(); });
    shape(ctx, [[-60, -148], [-26, -150], [-14, -64], [-22, 0], [-102, 0], [-100, -40], [-92, -120]], 'mustard', { boil: b, seed: 32, color: MIRA.ink });
    shape(ctx, [[60, -148], [26, -150], [14, -64], [22, 0], [102, 0], [100, -40], [92, -120]], 'mustard', { boil: b, seed: 33, color: MIRA.ink });
    for (const y of [-104, -66, -28]) PP.with(ctx, () => { ctx.fillStyle = '#8a5a2b'; ctx.beginPath(); ctx.arc(-27, y, 4.5, 0, 7); ctx.fill(); });
    for (let k = 0; k < 10; k++) { const x = (k % 2 ? 1 : -1) * (44 + PP.rand('knit', k) * 40), y = -20 - PP.rand('knity', k) * 110; PP.ink(ctx, [[x - 5, y - 4], [x, y + 2], [x + 5, y - 4]], { w: 1.5, color: '#9b6a22', seed: 40 + k, boil: b, jitter: 0.4, dry: false, alpha: 0.75 }); }
    PP.with(ctx, () => { ctx.translate(0, HEAD_Y); ctx.rotate(p.tilt || 0); p2 = { ...p, back: false }; miraHead(ctx, p2, b); });
    if (p.arms !== 'windup') {
      PP.limb(ctx, arms.L, { boil: b, seed: 22, handKind: p.arms === 'hold' ? 'hold' : 'open', handFlip: true, w0: 30, w1: 22 });
      PP.limb(ctx, arms.R, { boil: b, seed: 23, handKind: p.arms === 'write' ? 'hold' : 'open', w0: 30, w1: 22 });
    }
  }
  let p2;

  function leoBust(ctx, p, b) {
    // broad shoulders in a navy knit, a white tee at the collar
    shape(ctx, [[-28, -222], [28, -222], [32, -150], [-32, -150]], 'skinTan', { boil: b, seed: 601, w: 2.6, color: LEO.ink, shade: (c) => { c.fillStyle = 'rgba(140,80,60,0.4)'; c.beginPath(); c.ellipse(0, -214, 46, 24, 0, 0, 7); c.fill(); } });
    shape(ctx, [[-62, -160], [62, -160], [116, -128], [128, -40], [130, 0], [-130, 0], [-128, -40], [-116, -128]], 'knitNavy', { boil: b, seed: 602, color: LEO.ink, shade: (c) => { c.strokeStyle = 'rgba(255,255,255,0.08)'; c.lineWidth = 3; for (let x = -130; x < 130; x += 12) { c.beginPath(); c.moveTo(x, -160); c.lineTo(x + 4, 0); c.stroke(); } } });
    shape(ctx, [[-40, -160], [40, -160], [30, -140], [0, -132], [-30, -140]], '#f3ede2', { boil: b, seed: 603, w: 2.4, color: LEO.ink });
    shape(ctx, [[-52, -164], [52, -164], [44, -150], [0, -142], [-44, -150]], 'knitNavy', { boil: b, seed: 604, w: 2.4, color: LEO.ink, shade: (c) => { c.strokeStyle = 'rgba(255,255,255,0.15)'; c.lineWidth = 2; for (let x = -52; x < 52; x += 7) { c.beginPath(); c.moveTo(x, -164); c.lineTo(x, -140); c.stroke(); } } });
    PP.with(ctx, () => { ctx.translate(0, HEAD_Y - 6); ctx.rotate(p.tilt || 0); leoHead(ctx, p, b); });
    const arms = { draw: { L: [[-80, -130], [-120, -40], [-30, -20]], R: [[80, -130], [130, -50], [60, -24]] }, rest: { L: [[-80, -130], [-120, -40], [-50, -10]], R: [[80, -130], [120, -40], [50, -10]] }, wave: { L: [[-80, -130], [-120, -40], [-50, -10]], R: [[80, -130], [150, -200], [150, -300]] } }[p.arms || 'rest'];
    PP.limb(ctx, arms.L, { boil: b, seed: 610, paper: 'knitNavy', handKind: 'open', handFlip: true, w0: 38, w1: 28, skin: 'skinTan' });
    PP.limb(ctx, arms.R, { boil: b, seed: 611, paper: 'knitNavy', handKind: p.arms === 'draw' ? 'hold' : 'open', w0: 38, w1: 28, skin: 'skinTan' });
  }

  // ---------------------------------------------------------------- the stickers
  PP.mira = function (pose, boil, scale = 1) {
    const key = 'mira2:' + JSON.stringify(pose) + ':' + boil + ':' + scale;
    return PP.sticker(key, 560 * scale, 720 * scale, 280 * scale, 680 * scale, (ctx) => { ctx.scale(scale, scale); miraBust(ctx, pose, boil); }, { border: 8 * scale, shadowBlur: 10 * scale, shadowDx: 6 * scale, shadowDy: 10 * scale });
  };
  PP.miraHead = function (pose, boil, scale = 1) {
    const key = 'mirahead2:' + JSON.stringify(pose) + ':' + boil + ':' + scale;
    return PP.sticker(key, 300 * scale, 380 * scale, 150 * scale, 160 * scale, (ctx) => { ctx.scale(scale, scale); miraHead(ctx, pose, boil); }, { border: 7 * scale, shadowBlur: 10 * scale, shadowDx: 6 * scale, shadowDy: 10 * scale });
  };
  PP.leo = function (pose, boil, scale = 1) {
    const key = 'leo:' + JSON.stringify(pose) + ':' + boil + ':' + scale;
    return PP.sticker(key, 600 * scale, 720 * scale, 300 * scale, 680 * scale, (ctx) => { ctx.scale(scale, scale); leoBust(ctx, pose, boil); }, { border: 8 * scale, shadowBlur: 10 * scale, shadowDx: 6 * scale, shadowDy: 10 * scale });
  };
  PP.leoHead = function (pose, boil, scale = 1) {
    const key = 'leohead:' + JSON.stringify(pose) + ':' + boil + ':' + scale;
    return PP.sticker(key, 320 * scale, 360 * scale, 160 * scale, 180 * scale, (ctx) => { ctx.scale(scale, scale); leoHead(ctx, pose, boil); }, { border: 7 * scale, shadowBlur: 10 * scale, shadowDx: 6 * scale, shadowDy: 10 * scale });
  };
})(typeof window !== 'undefined' ? window : globalThis);
