// Effects: rain on glass, light (glows, headlights, flashes), camera shake, a glitch split for the eerie moments,
// speed lines, floating dust. All pure functions of time.
(function (g) {
  const PP = g.PP;
  const W = PP.W, H = PP.H;

  PP.glowAt = function (ctx, x, y, r, rgb = '255,190,110', a = 0.5) {
    PP.with(ctx, () => {
      ctx.globalCompositeOperation = 'screen';
      const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(${rgb},${a})`);
      gr.addColorStop(0.35, `rgba(${rgb},${a * 0.4})`);
      gr.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = gr;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    });
  };

  // rain running down a window region: streaks that slide and droplets that sit and twinkle
  PP.rain = function (ctx, t, rect, o = {}) {
    const [x0, y0, w, h] = rect;
    PP.with(ctx, () => {
      ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
      ctx.globalCompositeOperation = 'screen';
      const n = o.n ?? 60;
      for (let i = 0; i < n; i++) {
        const sp = 220 + PP.rand('rs', i) * 380, len = 30 + PP.rand('rl', i) * 70;
        const x = x0 + PP.rand('rx', i) * w + Math.sin(t * 0.7 + i) * 3;
        const y = y0 + ((PP.rand('ry', i) * h + t * sp) % (h + len)) - len;
        const gr = ctx.createLinearGradient(x, y, x, y + len);
        gr.addColorStop(0, 'rgba(200,220,255,0)');
        gr.addColorStop(1, `rgba(200,220,255,${0.22 + PP.rand('ra', i) * 0.25})`);
        ctx.strokeStyle = gr; ctx.lineWidth = 1.4 + PP.rand('rw', i) * 1.4;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y + len); ctx.stroke();
      }
      for (let i = 0; i < (o.drops ?? 80); i++) {
        const x = x0 + PP.rand('dx', i) * w, y = y0 + PP.rand('dy', i) * h, r = 1.5 + PP.rand('dr', i) * 3.5;
        ctx.fillStyle = `rgba(220,235,255,${0.25 + 0.2 * Math.sin(t * 2 + i)})`;
        ctx.beginPath(); ctx.ellipse(x, y, r * 0.8, r, 0, 0, 7); ctx.fill();
      }
    });
  };

  // headlights rushing at the camera: two flares growing from a vanishing point, then a white bloom
  PP.headlights = function (ctx, t, t0, t1, vx, vy) {
    const k = PP.clamp((t - t0) / (t1 - t0));
    if (k <= 0) return;
    const e = Math.pow(k, 2.4), spread = 30 + e * 700, r = 40 + e * 900;
    for (const s of [-1, 1]) PP.glowAt(ctx, vx + s * spread * 0.5, vy + e * 260, r, '255,236,200', 0.35 + e * 0.6);
    PP.with(ctx, () => { ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,240,215,${Math.max(0, e - 0.55) * 1.1})`; ctx.fillRect(0, 0, W, H); });
  };

  // a full-frame flash that decays
  PP.flash = function (ctx, t, t0, dur = 0.35, rgb = '255,255,255', peak = 0.9) {
    const k = (t - t0) / dur;
    if (k < 0 || k > 1) return;
    PP.with(ctx, () => { ctx.fillStyle = `rgba(${rgb},${peak * Math.pow(1 - k, 2)})`; ctx.fillRect(0, 0, W, H); });
  };

  // camera shake as an offset, decaying from t0 (stepped on twos, like the rest)
  PP.shake = function (t, t0, amp = 18, dur = 0.6) {
    const k = (t - t0) / dur;
    if (k < 0 || k > 1) return [0, 0, 0];
    const s = PP.boil(t, 24), a = amp * Math.pow(1 - k, 2);
    return [(PP.rand('shx', s) - 0.5) * 2 * a, (PP.rand('shy', s) - 0.5) * 2 * a, (PP.rand('shr', s) - 0.5) * 0.01 * a];
  };

  // the glitch: the frame split into colour channels and shifted, with a few torn horizontal slices
  PP.glitch = function (ctx, src, t, amount) {
    if (amount <= 0) return;
    const s = PP.boil(t, 24);
    PP.with(ctx, () => {
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.5 * amount;
      ctx.filter = 'sepia(1) saturate(6) hue-rotate(-50deg)';
      ctx.drawImage(src, -10 * amount, 0);
      ctx.filter = 'sepia(1) saturate(6) hue-rotate(150deg)';
      ctx.drawImage(src, 10 * amount, 0);
    });
    for (let k = 0; k < Math.round(6 * amount); k++) {
      const y = PP.rand('gy', s, k) * H, h = 10 + PP.rand('gh', s, k) * 60, dx = (PP.rand('gx', s, k) - 0.5) * 120 * amount;
      ctx.drawImage(src, 0, y, W, h, dx, y, W, h);
    }
  };

  // speed lines streaking toward a point (the near-miss)
  PP.speedLines = function (ctx, t, cx, cy, a) {
    if (a <= 0) return;
    const s = PP.boil(t, 12);
    PP.with(ctx, () => {
      ctx.strokeStyle = `rgba(255,250,240,${0.55 * a})`;
      for (let k = 0; k < 60; k++) {
        const ang = PP.rand('sla', s, k) * Math.PI * 2, r0 = 360 + PP.rand('slr', s, k) * 300, r1 = r0 + 300 + PP.rand('sll', s, k) * 700;
        ctx.lineWidth = 2 + PP.rand('slw', s, k) * 5;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0); ctx.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1); ctx.stroke();
      }
    });
  };

  // dust in a beam of light: drifting motes
  PP.dust = function (ctx, t, rect, n = 40, rgb = '255,230,190') {
    const [x0, y0, w, h] = rect;
    PP.with(ctx, () => {
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < n; i++) {
        const x = x0 + ((PP.rand('mx', i) * w + t * (8 + PP.rand('mv', i) * 14)) % w), y = y0 + ((PP.rand('my', i) * h - t * (5 + PP.rand('mu', i) * 10) + h * 10) % h);
        ctx.fillStyle = `rgba(${rgb},${0.15 + 0.35 * PP.rand('ma', i) * (0.6 + 0.4 * Math.sin(t * 1.5 + i))})`;
        ctx.beginPath(); ctx.arc(x, y, 1.2 + PP.rand('mr', i) * 2.4, 0, 7); ctx.fill();
      }
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
