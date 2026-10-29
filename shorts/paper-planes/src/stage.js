// The stage: a camera over the alley world (sky and city in parallax behind it), the two live windows with their
// rooms, people and lamps, and high-resolution boards for close-ups. Scenes describe a camera and what happens in
// the windows; the stage draws it.
(function (g) {
  const PP = g.PP;
  const Wd = PP.WORLD;
  const INK = '#221c24';

  // Close-ups re-render a region of the world at higher resolution, so zooming in stays crisp.
  const REGIONS = {
    her: { x: 220, y: 640, w: 760, h: 900, s: 2.4 },
    his: { x: 880, y: 1060, w: 760, h: 900, s: 2.4 },
    ground: { x: 520, y: 2380, w: 1000, h: 620, s: 2.0 },
  };
  function regionBoard(mode, name, b) {
    return PP.cached(`region:${mode}:${name}:${b % 2}`, () => {
      const R = REGIONS[name];
      const c = PP.canvas(R.w * R.s, R.h * R.s), ctx = c.getContext('2d');
      ctx.scale(R.s, R.s);
      ctx.translate(-R.x, -R.y);
      PP.buildWorldInto(ctx, mode, b % 2);
      return c;
    });
  }

  /** Map world coordinates to the screen for a camera { x, y, z } centred on the frame. */
  PP.toScreen = (cam, x, y) => [(x - cam.x) * cam.z + PP.W / 2, (y - cam.y) * cam.z + PP.H / 2];

  // ---------------------------------------------------------------- rooms behind the two live windows
  function herRoom(ctx, w, lit, mode, b) {
    PP.with(ctx, () => {
      ctx.beginPath(); ctx.rect(w.x, w.y, w.w, w.h); ctx.clip();
      // rose wallpaper with little dots, warm when her light is on
      ctx.fillStyle = PP.pattern(ctx, 'rose');
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let y = w.y + 10; y < w.y + w.h; y += 26) for (let x = w.x + ((y / 26) % 2) * 13; x < w.x + w.w; x += 26) { ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 7); ctx.fill(); }
      // fairy lights strung across the top of her room
      for (let k = 0; k < 9; k++) {
        const x = w.x + 12 + k * 25, y = w.y + 26 + Math.sin(k * 0.9) * 8;
        ctx.fillStyle = k % 3 === 0 ? '#ffd27a' : k % 3 === 1 ? '#ff9c8a' : '#bfe3ff';
        ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
      }
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = mode === 'dawn' ? 'rgba(255,200,170,0.55)' : lit ? 'rgba(255,190,120,0.55)' : 'rgba(40,50,110,0.85)';
      ctx.fillRect(w.x, w.y, w.w, w.h);
    });
  }

  function hisRoom(ctx, w, lampOn, mode, b) {
    PP.with(ctx, () => {
      ctx.beginPath(); ctx.rect(w.x, w.y, w.w, w.h); ctx.clip();
      ctx.fillStyle = PP.pattern(ctx, 'kraft');
      ctx.fillRect(w.x, w.y, w.w, w.h);
      // drawings pinned on his wall
      for (let k = 0; k < 5; k++) {
        const x = w.x + 20 + k * 40 + (k % 2) * 6, y = w.y + 22 + (k % 2) * 30;
        ctx.save(); ctx.translate(x + 15, y + 18); ctx.rotate((PP.rand('pin', k) - 0.5) * 0.3);
        ctx.fillStyle = '#f6efe0'; ctx.fillRect(-15, -18, 30, 36);
        ctx.strokeStyle = 'rgba(40,40,60,0.6)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, -2, 8, 0, 5); ctx.moveTo(-8, 10); ctx.lineTo(8, 8); ctx.stroke();
        ctx.fillStyle = '#d94c3d'; ctx.beginPath(); ctx.arc(0, -16, 2.4, 0, 7); ctx.fill();
        ctx.restore();
      }
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = mode === 'dawn' ? 'rgba(255,200,170,0.5)' : lampOn ? 'rgba(255,180,100,0.5)' : 'rgba(25,32,80,0.9)';
      ctx.fillRect(w.x, w.y, w.w, w.h);
    });
  }

  // his desk lamp: an amber shade on a jointed arm; when on, a bulb and a cone of light
  PP.deskLamp = function (ctx, x, y, s, on, b) {
    PP.with(ctx, () => {
      ctx.translate(x, y);
      ctx.scale(s, s);
      PP.ink(ctx, [[0, 0], [-18, -70], [26, -120]], { w: 6, seed: 801, boil: b, color: '#2a2630' });
      PP.paperPiece(ctx, [[-30, -4], [30, -4], [26, 6], [-26, 6]], 'ink', { seed: 802, rough: 1, rim: 0, shadow: false });
      PP.with(ctx, () => {
        ctx.translate(26, -120);
        ctx.rotate(0.5);
        PP.paperPiece(ctx, [[-26, -18], [10, -18], [40, 26], [-48, 26]], 'amber', { seed: 803, rough: 1.5, rim: 0, shadow: false });
        PP.ink(ctx, [[-26, -18], [10, -18], [40, 26], [-48, 26], [-26, -18]], { w: 3, seed: 804, boil: b, color: INK, dry: false });
        if (on) {
          ctx.fillStyle = '#fff6d0';
          ctx.beginPath(); ctx.ellipse(-4, 28, 16, 8, 0, 0, 7); ctx.fill();
        }
      });
    });
  };

  // light: a soft additive glow (screen blend), used for lamps and lit windows
  PP.glow = function (ctx, x, y, r, color = '255,190,110', a = 0.55) {
    PP.with(ctx, () => {
      ctx.globalCompositeOperation = 'screen';
      const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(${color},${a})`);
      gr.addColorStop(0.4, `rgba(${color},${a * 0.35})`);
      gr.addColorStop(1, `rgba(${color},0)`);
      ctx.fillStyle = gr;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    });
  };

  /**
   * Draw the world through a camera.
   * o: { mode: 'night'|'dawn', herLit, lampOn, mira: (ctx, w) => void, leo: (ctx, w) => void (inside the windows),
   *      overWorld: (ctx) => void (world coords, above frames), blur: [cam0, cam1] for a whip pan }
   */
  PP.worldView = function (ctx, cam, t, o = {}) {
    const b = PP.boil(t);
    const mode = o.mode || 'night';
    if (o.blur) {
      // a whip pan: several cameras between two, averaged
      const tmp = PP.cached('whipbuf', () => PP.canvas(PP.W, PP.H));
      const tc = tmp.getContext('2d');
      tc.clearRect(0, 0, PP.W, PP.H);
      const n = 5;
      for (let i = 0; i < n; i++) {
        const k = i / (n - 1);
        const c = { x: PP.lerp(o.blur[0].x, o.blur[1].x, k), y: PP.lerp(o.blur[0].y, o.blur[1].y, k), z: PP.lerp(o.blur[0].z, o.blur[1].z, k) };
        tc.globalAlpha = 1 / (i + 1);
        PP.worldView(tc, c, t, { ...o, blur: null });
      }
      tc.globalAlpha = 1;
      ctx.drawImage(tmp, 0, 0);
      return;
    }
    // sky, filling the frame, with a gentle parallax
    PP.with(ctx, () => {
      const sky = PP.sky(mode);
      const px = -(cam.x - 900) * 0.12 * cam.z, py = -(cam.y - 1400) * 0.08 * cam.z;
      ctx.drawImage(sky, (PP.W - sky.width) / 2 + px, (PP.H - sky.height) / 2 + py);
      if (mode === 'night') {
        PP.with(ctx, () => { ctx.translate(px * 1.4, py * 1.4); PP.stars(ctx, PP.W, PP.H, t, 30, 5); });
        PP.drawSprite(ctx, PP.moon(b), 820 + px * 1.6, 300 + py * 1.6, 0, 0.75);
      } else {
        PP.drawSprite(ctx, PP.sun(b), 300 + px * 1.6, 520 + py * 1.6 - (o.sunRise ?? 0) * 140, PP.step(t, 6) * 0.2, 0.85);
        // doodled birds
        for (let k = 0; k < 4; k++) {
          const bx = ((t * 60 + k * 230) % 1300) - 100, by = 360 + k * 70 + Math.sin(t * 2 + k) * 12;
          const flap = Math.sin(PP.step(t, 8) * 18 + k) * 8;
          PP.ink(ctx, [[bx - 18, by - flap], [bx, by], [bx + 18, by - flap]], { w: 3, seed: 900 + k, boil: b, color: '#3a2a3a' });
        }
      }
    });
    // the city in the middle distance
    PP.with(ctx, () => {
      const city = PP.city(mode);
      const [sx, sy] = PP.toScreen(cam, 900, 1900);
      const k = 0.55 + 0.45 * cam.z;
      const ox = (sx - PP.W / 2) * 0.55 + PP.W / 2, oy = (sy - PP.H / 2) * 0.6 + PP.H / 2;
      ctx.drawImage(city, ox - (city.width * k) / 2, oy - city.height * k, city.width * k, city.height * k);
    });
    // the world board (or a sharp regional board when the camera is close)
    PP.with(ctx, () => {
      ctx.translate(PP.W / 2, PP.H / 2);
      ctx.scale(cam.z, cam.z);
      ctx.translate(-cam.x, -cam.y);
      const [jx, jy] = PP.jit(t, 'world', 0.6);
      ctx.translate(jx / cam.z, jy / cam.z);
      const viewW = PP.W / cam.z, viewH = PP.H / cam.z;
      const vx = cam.x - viewW / 2, vy = cam.y - viewH / 2;
      let region = null;
      if (cam.z > 1.25) for (const [name, R] of Object.entries(REGIONS)) if (vx >= R.x && vy >= R.y && vx + viewW <= R.x + R.w && vy + viewH <= R.y + R.h) { region = name; break; }
      if (region) {
        const R = REGIONS[region];
        ctx.drawImage(regionBoard(mode, region, b), R.x, R.y, R.w, R.h);
      } else ctx.drawImage(PP.world(mode, b), 0, 0);
      // the live windows: rooms, people, lamps, then their frames
      herRoom(ctx, Wd.her, o.herLit !== false, mode, b);
      if (o.mira && !o.miraOutside) PP.with(ctx, () => { ctx.beginPath(); ctx.rect(Wd.her.x, Wd.her.y, Wd.her.w, Wd.her.h); ctx.clip(); o.mira(ctx, Wd.her); });
      hisRoom(ctx, Wd.his, !!o.lampOn, mode, b);
      PP.with(ctx, () => {
        ctx.beginPath(); ctx.rect(Wd.his.x, Wd.his.y, Wd.his.w, Wd.his.h); ctx.clip();
        if (o.leo) o.leo(ctx, Wd.his);
        PP.deskLamp(ctx, Wd.his.x + 44, Wd.his.y + Wd.his.h - 6, 0.85, !!o.lampOn, b);
        if (!o.lampOn && mode === 'night') { ctx.fillStyle = 'rgba(16,22,56,0.55)'; ctx.fillRect(Wd.his.x, Wd.his.y, Wd.his.w, Wd.his.h); }
      });
      ctx.drawImage(PP.liveFrames(b), 0, 0);
      if (o.mira && o.miraOutside) o.mira(ctx, Wd.her);
      // glows: the lamp, her fairy lights, light spilling onto the bricks
      if (mode === 'night') {
        if (o.lampOn) {
          PP.glow(ctx, Wd.his.x + 70, Wd.his.y + Wd.his.h - 100, 260, '255,184,96', 0.55);
          PP.glow(ctx, Wd.his.x + Wd.his.w / 2, Wd.his.y + Wd.his.h / 2, 300, '255,170,90', 0.22);
        }
        if (o.herLit !== false) PP.glow(ctx, Wd.her.x + Wd.her.w / 2, Wd.her.y + 40, 220, '255,200,140', 0.3);
      }
      if (o.overWorld) o.overWorld(ctx);
    });
  };

  // ---------------------------------------------------------------- characters in the windows
  // Mira leaning on her sill (scale 0.5 fits her window), Leo at his desk facing the window.
  PP.miraInWindow = (pose, t, o = {}) => (ctx, w) => {
    const b = PP.boil(t);
    const [jx, jy] = PP.jit(t, 'miraw', 0.8);
    const s = o.scale ?? 0.5;
    PP.drawSprite(ctx, PP.mira(pose, b, 1), w.x + w.w / 2 + (o.dx ?? 0) + jx, w.y + w.h + 6 + (o.dy ?? 0) + jy, o.rot ?? 0, s);
  };
  PP.leoInWindow = (pose, t, o = {}) => (ctx, w) => {
    const b = PP.boil(t);
    const [jx, jy] = PP.jit(t, 'leow', 0.8);
    PP.drawSprite(ctx, PP.leo(pose, b, 1), w.x + w.w / 2 + 30 + (o.dx ?? 0) + jx, w.y + w.h + 10 + (o.dy ?? 0) + jy, o.rot ?? 0, o.scale ?? 0.47);
  };
})(typeof window !== 'undefined' ? window : globalThis);
