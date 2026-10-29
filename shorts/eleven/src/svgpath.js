// SVG path data (M, L, C, Q, Z; absolute) to sampled points, so shapes can be drawn exactly as authored and still
// get the paper fill and boiling ink line of everything else.
(function (g) {
  const PP = g.PP;
  PP.svgPts = function (d, step = 4) {
    return PP.cached('svg:' + d + ':' + step, () => {
      const tok = d.match(/[MLCQZ]|-?\d*\.?\d+/gi);
      const pts = [];
      let i = 0, cmd = null, cur = [0, 0], start = [0, 0];
      const num = () => Number(tok[i++]);
      const bez = (p0, ps) => {
        const n = Math.max(4, Math.round(Math.hypot(ps.at(-1)[0] - p0[0], ps.at(-1)[1] - p0[1]) / step));
        for (let k = 1; k <= n; k++) {
          const t = k / n, u = 1 - t;
          if (ps.length === 3) pts.push([u * u * u * p0[0] + 3 * u * u * t * ps[0][0] + 3 * u * t * t * ps[1][0] + t * t * t * ps[2][0], u * u * u * p0[1] + 3 * u * u * t * ps[0][1] + 3 * u * t * t * ps[1][1] + t * t * t * ps[2][1]]);
          else pts.push([u * u * p0[0] + 2 * u * t * ps[0][0] + t * t * ps[1][0], u * u * p0[1] + 2 * u * t * ps[0][1] + t * t * ps[1][1]]);
        }
      };
      while (i < tok.length) {
        if (/[MLCQZ]/i.test(tok[i])) cmd = tok[i++].toUpperCase();
        if (cmd === 'M') { cur = [num(), num()]; start = cur; pts.push(cur); cmd = 'L'; }
        else if (cmd === 'L') { cur = [num(), num()]; pts.push(cur); }
        else if (cmd === 'C') { const a = [num(), num()], b = [num(), num()], c = [num(), num()]; bez(cur, [a, b, c]); cur = c; }
        else if (cmd === 'Q') { const a = [num(), num()], c = [num(), num()]; bez(cur, [a, c]); cur = c; }
        else if (cmd === 'Z') { pts.push(start); cur = start; }
      }
      return pts;
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
