// Film finishing: per-scene colour grades, bloom, a smooth handheld camera, anamorphic flares, film subtitles and
// title typography. Everything here is a pure function of time, so every frame renders the same way twice.
(function (g) {
  const PP = g.PP;
  const W = PP.W, H = PP.H;

  // ---- colour grades: a soft-light wash for the mood, a multiply for the shadows, a saturation trim
  const LOOKS = {
    night: { wash: 'rgba(70,110,200,0.16)', shade: 'rgba(222,226,246,1)', sat: 1 },
    phone: { wash: 'rgba(70,120,210,0.2)', shade: 'rgba(190,200,235,1)', sat: 0.9 },
    morning: { wash: 'rgba(255,190,120,0.26)', shade: 'rgba(255,236,214,1)', sat: 1 },
    train: { wash: 'rgba(80,160,165,0.16)', shade: 'rgba(222,232,232,1)', sat: 0.95 },
    dusk: { wash: 'rgba(255,140,80,0.28)', shade: 'rgba(235,205,200,1)', sat: 1 },
    danger: { wash: 'rgba(255,50,40,0.30)', shade: 'rgba(230,170,170,1)', sat: 0.9 },
    dark: { wash: 'rgba(255,170,110,0.18)', shade: 'rgba(200,190,200,1)', sat: 0.9 },
    cold: { wash: 'rgba(110,140,190,0.26)', shade: 'rgba(190,195,215,1)', sat: 0.45 },
  };
  PP.grade = function (ctx, look, k = 1) {
    const L = LOOKS[look];
    if (!L || k <= 0) return;
    PP.with(ctx, () => {
      ctx.globalAlpha = k;
      ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = L.shade; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = L.wash; ctx.fillRect(0, 0, W, H);
      if (L.sat < 1) { ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgba(128,128,128,${1 - L.sat})`; ctx.fillRect(0, 0, W, H); }
    });
  };

  // ---- bloom: the bright parts of the frame, blurred at quarter size and screened back on
  const small = PP.canvas(W / 4, H / 4), sm = small.getContext('2d');
  PP.bloom = function (ctx, src, a = 0.22) {
    sm.clearRect(0, 0, small.width, small.height);
    sm.filter = 'brightness(0.85) contrast(2.4) blur(7px)';
    sm.drawImage(src, 0, 0, small.width, small.height);
    sm.filter = 'none';
    PP.with(ctx, () => { ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = a; ctx.drawImage(small, 0, 0, W, H); });
  };

  // ---- a smooth handheld drift (no stepping): offset px and a hair of roll
  PP.handheld = (t, amp = 6, seed = 1) => [PP.fbm1(t * 0.55, seed) * amp * 2, PP.fbm1(t * 0.5, seed + 7) * amp * 2, PP.fbm1(t * 0.4, seed + 13) * amp * 0.0012];

  // ---- an anamorphic flare: a horizontal streak and a soft core
  PP.flare = function (ctx, x, y, a = 1, rgb = '255,220,180') {
    if (a <= 0) return;
    PP.with(ctx, () => {
      ctx.globalCompositeOperation = 'screen';
      ctx.translate(x, y); ctx.scale(6, 0.12);
      let gr = ctx.createRadialGradient(0, 0, 0, 0, 0, 200);
      gr.addColorStop(0, `rgba(${rgb},${0.55 * a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = gr; ctx.fillRect(-200, -200, 400, 400);
    });
    PP.glowAt(ctx, x, y, 120, rgb, 0.5 * a);
  };

  // ---- subtitles: short phrases, clean type, a soft shadow; voice notes in italics like a film's offscreen voice
  PP.subtitleChunks = function (T) {
    const out = [];
    for (const l of T.lines) {
      const ws = T.words.filter((w) => w.line === l.id);
      let cur = [];
      const flush = () => { if (cur.length) out.push({ words: cur, who: l.who, kind: l.kind }); cur = []; };
      ws.forEach((w, i) => {
        cur.push(w);
        const len = cur.map((c) => c.w).join(' ').length, next = ws[i + 1];
        const rest = ws.slice(i + 1).map((c) => c.w).join(' ').length;
        if (/[.!?…]$/.test(w.w) || (next && next.s - w.e > 0.45) || (len >= 26 && rest > 8) || (/,$/.test(w.w) && len > 12 && rest > 8)) flush();
      });
      flush();
    }
    out.forEach((c, i) => { c.s = c.words[0].s - 0.05; c.e = Math.min(c.words.at(-1).e + 0.3, out[i + 1] ? out[i + 1].words[0].s - 0.08 : 1e9); });
    return out;
  };
  PP.subtitle = function (ctx, ch, t, y = 1500) {
    const a = Math.min(PP.clamp((t - ch.s) / 0.12), PP.clamp((ch.e - t) / 0.15));
    if (a <= 0) return;
    // Mira's inner voice (narration) reads as a thought: smaller, italic, warm cream, a little higher in the frame;
    // what anyone says out loud stays bold white at the bottom
    const thought = ch.kind === 'narr';
    if (thought) y -= 120;
    const text = ch.words.map((w) => w.w).join(' ').replace(/\.\.\./g, '…');
    // a soft dark band behind the line keeps it readable over bright frames
    PP.with(ctx, () => {
      const gr = ctx.createLinearGradient(0, y - 110, 0, y + 110);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, `rgba(0,0,0,${0.32 * a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, y - 110, W, 220);
    });
    PP.with(ctx, () => {
      ctx.globalAlpha = a;
      ctx.font = thought ? 'italic 400 46px Inter' : `${ch.kind === 'note' ? 'italic 500' : '600'} 52px Inter`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 3;
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.strokeText(text, 540, y);
      ctx.fillStyle = thought ? '#ffe6c4' : ch.kind === 'note' ? '#e3ecff' : '#ffffff';
      ctx.fillText(text, 540, y);
    });
  };

  // ---- spaced, thin title type with a glow
  PP.spaced = function (ctx, text, x, y, o = {}) {
    PP.with(ctx, () => {
      ctx.globalAlpha *= o.alpha ?? 1;
      ctx.font = o.font || '200 200px Inter';
      ctx.letterSpacing = `${o.spacing ?? 10}px`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.blur ?? 30; }
      ctx.fillStyle = o.color || '#f4f6ff';
      ctx.fillText(text, x + (o.spacing ?? 10) / 2, y);
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
