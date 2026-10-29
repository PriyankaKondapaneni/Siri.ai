// Type: word-synced captions on torn paper, ransom-note titles cut from mixed papers, the plane-number postage
// stamp, and handwriting that writes itself.
(function (g) {
  const PP = g.PP;
  const INK = '#221c24';

  // ---------------------------------------------------------------- captions
  // Words come from the narration's timing. Display forms: digits read faster on a phone than spelled numbers.
  const DISPLAY = { 'forty-seven': '47', 'twenty-two,': '22,', 'two': '2', 'a.m.': 'a.m.' };
  function displayWord(w, prev) {
    if (w === 'two' && prev === 'until') return '2';
    if (w === 'two.' && prev === 'number') return 'two.';
    return DISPLAY[w] ?? w;
  }
  // Group words into short phrases: break at sentence ends, commas when the phrase is long enough, and at most
  // ~18 characters or 4 words a phrase, so a caption is one glance.
  PP.captionChunks = function (words) {
    const chunks = [];
    let cur = [];
    const flush = () => { if (cur.length) chunks.push(cur); cur = []; };
    words.forEach((w, i) => {
      const shown = displayWord(w.w, words[i - 1]?.w);
      cur.push({ ...w, shown });
      const len = cur.map((c) => c.shown).join(' ').length;
      const end = /[.!?…]$/.test(w.w) || /\.\.\.$/.test(w.w);
      const comma = /[,;:]$/.test(w.w);
      const next = words[i + 1];
      const gap = next ? next.s - w.e : 1;
      if (end || gap > 0.32 || (comma && len > 8) || len >= 16 || cur.length >= 4) flush();
    });
    flush();
    return chunks.map((c, i) => ({ words: c, s: c[0].s, e: Math.min(c[c.length - 1].e + 0.35, chunks[i + 1] ? chunks[i + 1][0].s - 0.02 : 1e9) }));
  };

  PP.drawCaption = function (ctx, chunks, t, o = {}) {
    const ch = chunks.find((c) => t >= c.s - 0.04 && t < c.e);
    if (!ch) return;
    const x = o.x ?? 520, y = o.y ?? 1450, size = o.size ?? 74;
    ctx.save();
    ctx.font = `${size}px "Patrick Hand"`;
    const words = ch.words.map((w) => w.shown.replace(/\.\.\.$/, '…'));
    const gap = size * 0.28;
    const widths = words.map((w) => ctx.measureText(w).width);
    const total = widths.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
    const age = t - ch.s;
    const pop = PP.ease.outBack(PP.clamp(age / 0.16), 2.4);
    const seed = PP.hash('cap', ch.s);
    const rot = (PP.rand('cr', seed) - 0.5) * 0.05;
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(0.86 + 0.14 * pop, 0.86 + 0.14 * pop);
    // the strip: torn cream paper, a touch wider than the words
    const pw = total + size * 0.9, ph = size * 1.32;
    PP.paperPiece(ctx, PP.rectPoly(-pw / 2, -ph / 2, pw, ph), 'white', { seed, rough: 5, step: 6, shadow: { blur: 16, dx: 4, dy: 8, a: 0.4 }, rim: 3 });
    let cx = -total / 2;
    ch.words.forEach((w, i) => {
      const active = t >= w.s - 0.02 && t < (ch.words[i + 1] ? ch.words[i + 1].s : ch.e);
      const spoken = t >= w.s - 0.02;
      if (active) {
        // the highlighter swipe behind the word being spoken, drawn on in a few frames
        const k = PP.clamp((t - w.s + 0.02) / 0.12);
        PP.with(ctx, () => {
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = o.marker || '#f4c64e';
          const mx = cx - 8, mw = (widths[i] + 16) * k;
          ctx.beginPath();
          ctx.moveTo(mx, -size * 0.36);
          ctx.lineTo(mx + mw, -size * 0.4);
          ctx.lineTo(mx + mw, size * 0.3);
          ctx.lineTo(mx, size * 0.34);
          ctx.fill();
        });
      }
      ctx.fillStyle = spoken ? INK : 'rgba(34,28,36,0.38)';
      ctx.textBaseline = 'middle';
      ctx.fillText(words[i], cx, 2);
      cx += widths[i] + gap;
    });
    ctx.restore();
  };

  // ---------------------------------------------------------------- ransom-note letters
  const FACES = ['900 italic "Playfair Black Italic"', '"Alfa Slab One"', '"Archivo Black"', '"Bebas Neue"', '"Abril Fatface"', '"Rubik Mono One"', '600 Fredoka'];
  const CHIPS = [['white', '#1d1a22'], ['coral', '#fbf3e1'], ['night', '#f4c64e'], ['newsprint', '#1d1a22'], ['amber', '#2a1d26'], ['cream', '#c23b2e'], ['teal', '#fbf3e1'], ['rose', '#2a1d26'], ['ink', '#fbf3e1']];
  PP.ransomLetter = function (ch, size, seed) {
    return PP.sticker(`ransom:${ch}:${size}:${seed}`, size * 1.3, size * 1.5, size * 0.65, size * 0.75, (c) => {
      const face = FACES[Math.floor(PP.rand('rf', seed) * FACES.length)];
      const [paper, colr] = CHIPS[Math.floor(PP.rand('rc', seed) * CHIPS.length)];
      const fs = size * (face.includes('Bebas') ? 1.22 : face.includes('Rubik') ? 0.78 : 0.95);
      c.font = face.startsWith('900') ? `italic 900 ${fs}px "Playfair Black Italic"` : face.startsWith('600') ? `600 ${fs}px Fredoka` : `${fs}px ${face}`;
      const w = Math.max(c.measureText(ch).width, size * 0.42);
      const pw = w + size * 0.32, ph = size * 1.18;
      const jx = (PP.rand('rjx', seed) - 0.5) * size * 0.1;
      PP.paperPiece(c, PP.rectPoly(-pw / 2 + jx, -ph / 2, pw, ph), paper, { seed, rough: 2.2, step: 4, rim: 0, shadow: false });
      c.fillStyle = colr;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(ch, jx, size * 0.06);
    }, { border: 0, shadowBlur: 6, shadowDx: 3, shadowDy: 5, shadowAlpha: 0.45 });
  };
  /** Lay out a word in ransom letters, centred at (x, y). Letters pop in one by one from t0. Returns its width. */
  PP.ransom = function (ctx, text, x, y, size, t, t0, o = {}) {
    const seedBase = o.seed ?? 1;
    const letters = [...text];
    const sizes = letters.map((c, i) => size * (0.86 + 0.28 * PP.rand('rs', seedBase, i)));
    const ws = letters.map((c, i) => (c === ' ' ? size * 0.42 : sizes[i] * 0.78));
    const total = ws.reduce((a, b) => a + b, 0);
    let cx = x - total / 2;
    letters.forEach((c, i) => {
      const w = ws[i];
      if (c !== ' ') {
        const ti = t0 + i * (o.stagger ?? 0.045);
        const k = o.out != null ? 1 - PP.ease.in(PP.clamp((t - o.out - i * 0.02) / 0.25)) : 1;
        const p = PP.pop(t, ti, 0.3) * k;
        if (p > 0.001) {
          const sp = PP.ransomLetter(c, Math.round(sizes[i]), PP.hash(seedBase, i, c));
          const rot = (PP.rand('rr', seedBase, i) - 0.5) * 0.28 + (o.out != null ? (1 - k) * (PP.rand('ro', i) - 0.5) * 2 : 0);
          const dy = (PP.rand('ry', seedBase, i) - 0.5) * size * 0.14 + (o.out != null ? (1 - k) * 300 : 0);
          const [jx, jy] = PP.jit(t, `rn${seedBase}${i}`, 1.2);
          PP.drawSprite(ctx, sp, cx + w / 2 + jx, y + dy + jy, rot, p);
        }
      }
      cx += w;
    });
    return total;
  };

  // ---------------------------------------------------------------- the plane stamp
  // A postage stamp with the plane number. It thunks down when the number changes (scale from big, a smudge).
  PP.planeStamp = function (ctx, x, y, n, t, since, o = {}) {
    const k = PP.clamp((t - since) / 0.22);
    const land = since > -1 ? 1 + (1 - PP.ease.out(k)) * 0.9 : 1;
    const alpha = PP.clamp((t - since) / 0.06);
    PP.with(ctx, () => {
      ctx.globalAlpha *= alpha * (o.alpha ?? 1);
      const [jx, jy] = PP.jit(t, 'stamp', 0.8);
      PP.stamp(ctx, x + jx, y + jy, 176 * land, 212 * land, -0.06 + (1 - k) * 0.1, (c, w, h) => {
        c.fillStyle = PP.pattern(c, 'coral');
        c.fillRect(0, 0, w, h);
        // a tiny plane engraving and the number
        PP.plane(c, w / 2, h * 0.3, w * 0.48, { heading: -0.35, roll: 0.25, paper: 'cream', shadow: false, ink: '#5a1f18', boil: 0 });
        c.fillStyle = '#fbf3e1';
        c.textAlign = 'center';
        c.font = `${Math.round(w * 0.15)}px "Special Elite"`;
        c.fillText('PLANE Nº', w / 2, h * 0.62);
        c.font = `${Math.round(w * (String(n).length > 1 ? 0.36 : 0.42))}px "Alfa Slab One"`;
        c.fillText(String(n), w / 2, h * 0.92);
      });
      // the postmark: wavy cancellation lines and a ring, stamped over it at an angle
      if (o.postmark !== false && since > -1) {
        const pm = PP.clamp((t - since - 0.08) / 0.05);
        ctx.globalAlpha *= pm * 0.55;
        PP.ink(ctx, PP.circlePts(x + 70, y + 60, 60, 60, 40), { w: 4, color: '#2a2440', seed: 700, boil: PP.boil(t), dry: false });
        for (let k2 = 0; k2 < 3; k2++) PP.ink(ctx, Array.from({ length: 30 }, (_, i) => [x + 110 + i * 7, y + 30 + k2 * 22 + Math.sin(i * 0.8) * 6]), { w: 3.6, color: '#2a2440', seed: 701 + k2, boil: PP.boil(t), dry: false });
      }
    });
  };

  // ---------------------------------------------------------------- handwriting that writes itself
  // Reveals text left to right with a soft edge, line by line, as if written; progress 0..1 across all lines.
  PP.handwrite = function (ctx, lines, x, y, o = {}) {
    const font = o.font || '64px Caveat';
    const lh = o.lineHeight ?? 74;
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = o.color || '#28305a';
    ctx.textBaseline = 'alphabetic';
    const widths = lines.map((l) => ctx.measureText(l).width);
    const total = widths.reduce((a, b) => a + b, 0);
    let budget = (o.progress ?? 1) * total;
    lines.forEach((line, i) => {
      const w = widths[i];
      const show = PP.clamp(budget, 0, w);
      budget -= w;
      if (show <= 0) return;
      const ly = y + i * lh;
      ctx.save();
      const lx = o.align === 'center' ? x - w / 2 : x;
      ctx.beginPath();
      ctx.rect(lx - 10, ly - lh, show + 10, lh * 1.4);
      ctx.clip();
      ctx.fillText(line, lx, ly);
      ctx.restore();
    });
    ctx.restore();
  };
})(typeof window !== 'undefined' ? window : globalThis);
