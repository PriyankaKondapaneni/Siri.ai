// The phone: a paper-cut handset with a dark messaging app. A voice message from "Unknown" at 11:11 PM; its
// waveform follows Kabir's actual voice (the note stem's envelope), the transcript types out as he speaks.
(function (g) {
  const PP = g.PP;
  const ENV = g.ENVELOPE || { note: [] };

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  PP.roundRect = roundRect;

  function wrap(ctx, text, maxW) {
    const words = text.split(' '), lines = [];
    let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
    if (cur) lines.push(cur);
    return lines;
  }

  /**
   * Draw the phone centred at (x, y), `scale` 1 = 560 px wide.
   * o: { t, msgs: [{ s, e, text, words, time, urgent, deleted }], header: 'Unknown', clock: '11:11', banner: t0,
   *      glow (0..1 screen light), deleting: { t0 } }
   */
  PP.phone = function (ctx, x, y, scale, o) {
    const t = o.t;
    const W = 560, H = 1120;
    PP.with(ctx, () => {
      ctx.translate(x, y);
      ctx.rotate(o.rot || 0);
      ctx.scale(scale, scale);
      ctx.translate(-W / 2, -H / 2);
      // the screen's light on the world around it
      if (o.glow) PP.glowAt(ctx, W / 2, H / 2, 900, o.urgent ? '255,90,90' : '150,200,255', 0.35 * o.glow);
      // body: a graphite frame with a soft drop shadow and a thin metallic edge
      PP.with(ctx, () => {
        ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 30;
        roundRect(ctx, 0, 0, W, H, 76); ctx.fillStyle = '#16181d'; ctx.fill();
      });
      const edge = ctx.createLinearGradient(0, 0, W, H);
      edge.addColorStop(0, '#5a5f6a'); edge.addColorStop(0.5, '#23262d'); edge.addColorStop(1, '#4a4e58');
      ctx.lineWidth = 5; ctx.strokeStyle = edge; roundRect(ctx, 2, 2, W - 4, H - 4, 74); ctx.stroke();
      roundRect(ctx, 18, 18, W - 36, H - 36, 62); ctx.fillStyle = '#0d1018'; ctx.fill();
      PP.with(ctx, () => {
        roundRect(ctx, 18, 18, W - 36, H - 36, 62); ctx.clip();
        // status bar and header
        ctx.fillStyle = 'rgba(230,236,255,0.9)'; ctx.font = '600 30px Inter'; ctx.fillText(o.clock || '11:11', 60, 74);
        roundRect(ctx, W / 2 - 70, 34, 140, 40, 20); ctx.fillStyle = '#000'; ctx.fill();
        ctx.fillStyle = 'rgba(230,236,255,0.9)'; ctx.fillRect(W - 120, 52, 44, 20); ctx.fillRect(W - 74, 58, 4, 8);
        ctx.fillStyle = '#1a2030'; ctx.fillRect(18, 100, W - 36, 120);
        ctx.fillStyle = '#3a4560'; ctx.beginPath(); ctx.arc(110, 160, 40, 0, 7); ctx.fill();
        ctx.fillStyle = '#c9d3ee'; ctx.font = '600 44px Inter'; ctx.textAlign = 'center'; ctx.fillText('?', 110, 176); ctx.textAlign = 'left';
        ctx.fillStyle = '#f2f5ff'; ctx.font = '600 38px Inter'; ctx.fillText(o.header || 'Unknown', 170, 156);
        ctx.fillStyle = 'rgba(200,210,240,0.6)'; ctx.font = '500 26px Inter'; ctx.fillText(o.sub || 'voice message', 170, 192);
        if (o.emptyText && !(o.msgs || []).length) { ctx.fillStyle = 'rgba(200,210,240,0.45)'; ctx.font = '500 32px Inter'; ctx.textAlign = 'center'; ctx.fillText(o.emptyText, W / 2, H / 2 + 40); ctx.textAlign = 'left'; }
        // messages: newest at the bottom
        let by = H - 120;
        const shown = (o.msgs || []).filter((m) => t >= m.s - 0.5);
        for (let i = shown.length - 1; i >= 0; i--) {
          const m = shown[i];
          const age = t - (m.s - 0.5);
          const pop = PP.ease.outBack(PP.clamp(age / 0.3), 1.8);
          ctx.font = '500 30px Inter';
          const lines = wrap(ctx, m.text, W - 160);
          const bh = 150 + lines.length * 40;
          const del = m.deleted != null ? PP.ease.in(PP.clamp((t - m.deleted) / 0.35)) : 0;
          PP.with(ctx, () => {
            ctx.translate(-del * 700, 0);
            ctx.globalAlpha = pop;
            const bx = 40, bw = W - 80, top = by - bh;
            roundRect(ctx, bx, top, bw, bh, 34);
            ctx.fillStyle = m.urgent ? '#4a1418' : '#202a40';
            ctx.fill();
            // play button and waveform: bars light up as the message plays
            const playing = t >= m.s && t < m.e;
            const prog = PP.clamp((t - m.s) / (m.e - m.s));
            ctx.fillStyle = m.urgent ? '#ff6b6b' : '#7fb2ff';
            ctx.beginPath(); ctx.arc(bx + 62, top + 70, 34, 0, 7); ctx.fill();
            ctx.fillStyle = '#0d1018';
            if (playing) { ctx.fillRect(bx + 50, top + 54, 9, 32); ctx.fillRect(bx + 66, top + 54, 9, 32); }
            else { ctx.beginPath(); ctx.moveTo(bx + 52, top + 50); ctx.lineTo(bx + 80, top + 70); ctx.lineTo(bx + 52, top + 90); ctx.fill(); }
            const nb = 30, x0 = bx + 116, span = bw - 210;
            for (let k = 0; k < nb; k++) {
              const tk = m.s + ((k + 0.5) / nb) * (m.e - m.s);
              const fr = Math.round(tk * 30);
              const live = Math.max(ENV.note[fr] || 0, ENV.note[fr + 1] || 0);
              const hgt = 8 + live * 52 + (playing && Math.abs(k / nb - prog) < 0.04 ? 6 : 0);
              ctx.fillStyle = k / nb <= prog ? (m.urgent ? '#ff8a8a' : '#a9ccff') : 'rgba(180,195,230,0.35)';
              roundRect(ctx, x0 + (k * span) / nb, top + 70 - hgt / 2, (span / nb) * 0.6, hgt, 3);
              ctx.fill();
            }
            ctx.fillStyle = 'rgba(210,220,245,0.75)'; ctx.font = '500 24px Inter';
            ctx.fillText(m.time || '11:11 PM', bx + bw - 140, top + 128);
            const secs = Math.max(0, Math.round((m.e - m.s) * (1 - prog)));
            ctx.fillText(`0:${String(secs).padStart(2, '0')}`, x0, top + 128);
            // the transcript, typing out with the words
            ctx.font = '500 30px Inter';
            const words = m.words || [];
            let budget = words.filter((w) => t >= w.s).length, wi = 0;
            lines.forEach((ln, li) => {
              const ws = ln.split(' ');
              const show = ws.slice(0, Math.max(0, budget - wi)).join(' ');
              wi += ws.length;
              ctx.fillStyle = '#eef2ff';
              if (show) ctx.fillText(show, bx + 32, top + 178 + li * 40);
            });
          });
          if (m.deleted != null && t > m.deleted) {
            // the trash can, catching it
            const k = PP.clamp((t - m.deleted) / 0.5);
            PP.with(ctx, () => { ctx.globalAlpha = Math.sin(k * Math.PI); ctx.fillStyle = '#ff6b6b'; ctx.translate(W / 2, by - bh / 2); ctx.scale(1.4, 1.4); ctx.fillRect(-26, -18, 52, 8); ctx.fillRect(-10, -28, 20, 10); roundRect(ctx, -22, -8, 44, 56, 8); ctx.fill(); });
          }
          by -= bh + 30;
        }
        // the notification banner sliding down
        const hold = o.bannerHold ?? 1.0;
        if (o.banner != null && t > o.banner && t < o.banner + hold + 0.6) {
          const k = t - o.banner, slide = k < 0.3 ? PP.ease.out(k / 0.3) : k > hold + 0.3 ? 1 - PP.ease.in((k - hold - 0.3) / 0.3) : 1;
          PP.with(ctx, () => {
            ctx.translate(0, -180 + slide * 210);
            const lines = o.bannerText ? wrap((ctx.font = '500 26px Inter', ctx), o.bannerText, W - 140) : ['Voice message · 11:11 PM'];
            const bh = 90 + lines.length * 36;
            roundRect(ctx, 34, 40, W - 68, bh, 30); ctx.fillStyle = 'rgba(40,48,70,0.96)'; ctx.fill();
            ctx.fillStyle = o.bannerTitle ? '#ff8a80' : '#f2f5ff'; ctx.font = '600 30px Inter'; ctx.fillText(o.bannerTitle || 'Unknown', 70, 94);
            ctx.fillStyle = 'rgba(210,220,245,0.9)'; ctx.font = '500 26px Inter';
            lines.forEach((ln, i) => ctx.fillText(ln, 70, 134 + i * 36));
          });
        }
        // glass sheen
        const gr = ctx.createLinearGradient(0, 0, W, H);
        gr.addColorStop(0, 'rgba(255,255,255,0.08)'); gr.addColorStop(0.4, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0.04)');
        ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      });
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
