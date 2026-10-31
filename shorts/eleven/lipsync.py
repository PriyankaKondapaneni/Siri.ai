"""Lip sync for Wan shots: follow the face through the clip, then paint mouth shapes in time with the voice.

Wan is asked to keep the speaker's mouth closed. Here the face is tracked from the start frame (where the engine
knows exactly where the mouth is) with optical flow on features around it (eyes, nose, outline), giving a
similarity transform per frame; the mouth is covered with the face's own skin tone and redrawn in the series'
flat style: closed, or open in the shape of the vowel being spoken, as loud as the voice is.
"""
import json, re
import numpy as np
import cv2

LINE = (29, 26, 29)
MOUTH = (124, 42, 51)
TONGUE = (226, 123, 130)
TEETH = (251, 246, 239)


def start_to_clip(X, Y, cw=480, ch=864, W=1080, H=1920):
    """A point in the 1080x1920 start frame -> the clip's pixels (the start frame was centre-cropped to the clip's shape)."""
    s = max(cw / W, ch / H)
    nw, nh = W * s, H * s
    return (X * s - (nw - cw) / 2, Y * s - (nh - ch) / 2), s


def track(frames, cx, cy, mw):
    """Per-frame (x, y, scale, angle) of the mouth in clip pixels, by tracking features around the face from frame 0."""
    g0 = cv2.cvtColor(frames[0], cv2.COLOR_RGB2GRAY)
    h, w = g0.shape
    mask = np.zeros_like(g0)
    x0, x1 = int(max(0, cx - 2.4 * mw)), int(min(w, cx + 2.4 * mw))
    y0, y1 = int(max(0, cy - 3.2 * mw)), int(min(h, cy + 1.2 * mw))
    mask[y0:y1, x0:x1] = 255
    cv2.ellipse(mask, (int(cx), int(cy)), (int(0.9 * mw), int(0.6 * mw)), 0, 0, 360, 0, -1)  # not the mouth itself
    p0 = cv2.goodFeaturesToTrack(g0, 80, 0.01, max(3, mw * 0.12), mask=mask, blockSize=5)
    out = [(cx, cy, 1.0, 0.0)]
    if p0 is None or len(p0) < 6:
        return out * len(frames)
    base = p0.reshape(-1, 2).copy()
    cur = base.copy()
    alive = np.ones(len(base), bool)
    prev = g0
    lk = dict(winSize=(21, 21), maxLevel=3, criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 30, 0.01))
    M_last = np.array([[1, 0, 0], [0, 1, 0]], np.float32)
    for f in frames[1:]:
        g = cv2.cvtColor(f, cv2.COLOR_RGB2GRAY)
        nxt, st, _ = cv2.calcOpticalFlowPyrLK(prev, g, cur.reshape(-1, 1, 2).astype(np.float32), None, **lk)
        back, st2, _ = cv2.calcOpticalFlowPyrLK(g, prev, nxt, None, **lk)
        fb = np.linalg.norm(back.reshape(-1, 2) - cur, axis=1)
        alive &= (st.ravel() == 1) & (st2.ravel() == 1) & (fb < 1.5)
        cur = nxt.reshape(-1, 2)
        M = None
        if alive.sum() >= 5:
            M, inl = cv2.estimateAffinePartial2D(base[alive], cur[alive], method=cv2.RANSAC, ransacReprojThreshold=2.5)
        if M is None: M = M_last
        M_last = M
        x, y = M @ np.array([cx, cy, 1.0])
        sc = float(np.hypot(M[0, 0], M[1, 0])); ang = float(np.arctan2(M[1, 0], M[0, 0]))
        out.append((float(x), float(y), sc, ang))
        prev = g
    # smooth the path a little (tracking jitter reads as a twitching mouth)
    a = np.array(out)
    k = np.array([1, 2, 3, 2, 1], float); k /= k.sum()
    for c in range(4):
        pad = np.pad(a[:, c], 2, mode='edge'); a[:, c] = np.convolve(pad, k, mode='valid')
    return [tuple(r) for r in a]


def load_envelope(path):
    txt = open(path).read()
    return json.loads(txt[txt.index('{'):txt.rindex('}') + 1])


def vowel_at(words, t):
    for w in words:
        if w['s'] <= t < w['e']:
            vs = re.findall('[aeiouy]', re.sub('[^a-z]', '', w['w'].lower()))
            if not vs: return 'E'
            v = vs[min(len(vs) - 1, int((t - w['s']) / max(0.05, w['e'] - w['s']) * len(vs)))]
            return {'a': 'A', 'e': 'E', 'i': 'I', 'o': 'O', 'u': 'O', 'y': 'I'}[v]
    return ''


def mouth_state(env, words, t, on_twos=True):
    """'' (closed), or (openness 1|2, vowel) for episode time t, held on twos like the rest of the animation."""
    if on_twos: t = np.floor(t * 12) / 12
    fr = int(round(t * 30))
    v = max(env[fr] if fr < len(env) else 0, env[fr + 1] if fr + 1 < len(env) else 0)
    if v <= 0.12: return ''
    return (2 if v > 0.45 else 1, vowel_at(words, t) or 'E')


def skin_tone(img, x, y, r):
    """The face's own skin colour around (x, y): the bright, low-saturation pixels of a ring around the mouth."""
    h, w = img.shape[:2]
    yy, xx = np.mgrid[max(0, int(y - 2 * r)):min(h, int(y + 2 * r)), max(0, int(x - 2.5 * r)):min(w, int(x + 2.5 * r))]
    d = np.hypot((xx - x) / 1.3, yy - y)
    ring = (d > 1.3 * r) & (d < 2.2 * r)
    px = img[yy[ring], xx[ring]].astype(np.float32)
    if len(px) < 10: return np.array([240, 220, 205], np.float32)
    lum = px.mean(1)
    px = px[lum > np.percentile(lum, 55)]
    return np.median(px, 0)


def paint(img, x, y, mw, ang, state, alpha=1.0, cover=(0, 0)):
    """Paint a mouth on img (float RGB, output resolution) centred at (x, y), width mw, tilted by ang.
    cover: the size of the mouth Wan drew there (output pixels), so the patch hides all of it."""
    skin = skin_tone(img, x, y, max(mw * 0.5, cover[0] * 0.6))
    layer = img.copy()
    # cover what Wan drew there with the face's own tone, feathered
    patch = np.zeros(img.shape[:2], np.float32)
    ax, ay = max(mw * 0.72, cover[0] * 0.62 + mw * 0.12), max(mw * 0.5, cover[1] * 0.62 + mw * 0.12)
    cv2.ellipse(patch, (int(x), int(y + mw * 0.05)), (int(ax), int(ay)), np.degrees(ang), 0, 360, 1.0, -1)
    patch = cv2.GaussianBlur(patch, (0, 0), mw * 0.08)[..., None]
    layer = layer * (1 - patch) + skin[None, None, :] * patch
    lw = max(2, int(round(mw * 0.06)))
    deg = np.degrees(ang)
    if not state:
        # closed: a soft, slightly smiling line
        pts = []
        for u in np.linspace(-1, 1, 15):
            px = u * mw * 0.32; py = -0.06 * mw * (1 - u * u) + 0.02 * mw
            pts.append([x + px * np.cos(ang) - py * np.sin(ang), y + px * np.sin(ang) + py * np.cos(ang)])
        cv2.polylines(layer, [np.array(pts, np.int32)], False, LINE, lw, cv2.LINE_AA)
    else:
        lvl, v = state
        open_ = 0.35 if lvl == 1 else 0.7
        sx, sy, teeth = {'A': (1, 1.15, 0), 'E': (1.2, 0.72, 1), 'I': (1.32, 0.5, 1), 'O': (0.68, 0.95, 0)}.get(v, (1, 1, 0))
        rw = mw * (0.28 + open_ * 0.1) * sx
        rh = (mw * 0.085 + open_ * mw * 0.27) * sy
        c = (int(x), int(y + rh * 0.15))
        inner = np.zeros(img.shape[:2], np.uint8)
        cv2.ellipse(inner, c, (int(rw), int(max(2, rh))), deg, 0, 360, 255, -1, cv2.LINE_AA)
        m = inner.astype(np.float32)[..., None] / 255
        fill = np.empty_like(layer); fill[:] = MOUTH
        # tongue at the bottom, teeth along the top for E and I
        t_mask = np.zeros(img.shape[:2], np.uint8)
        cv2.ellipse(t_mask, (c[0], int(c[1] + rh * 0.75)), (int(rw * 0.8), int(max(1, rh * 0.6))), deg, 0, 360, 255, -1, cv2.LINE_AA)
        tm = (t_mask.astype(np.float32) / 255)[..., None]
        fill = fill * (1 - tm) + np.array(TONGUE, np.float32) * tm
        if teeth:
            top = np.zeros(img.shape[:2], np.uint8)
            cv2.ellipse(top, (c[0], int(c[1] - rh * 0.55)), (int(rw * 1.05), int(max(1, rh * 0.45))), deg, 0, 360, 255, -1, cv2.LINE_AA)
            tt = (top.astype(np.float32) / 255)[..., None]
            fill = fill * (1 - tt) + np.array(TEETH, np.float32) * tt
        layer = layer * (1 - m) + fill * m
        cv2.ellipse(layer, c, (int(rw), int(max(2, rh))), deg, 0, 360, LINE, lw, cv2.LINE_AA)
    return img * (1 - alpha) + layer * alpha


def refine(frames, path, mw):
    """Snap the tracked point onto the mouth actually drawn in each frame: the dark (line) or red (open) shape
    nearest the prediction, inside a small window. Falls back to the tracked point when nothing clear is found."""
    out = []
    for f, (x, y, sc, a) in zip(frames, path):
        h, w = f.shape[:2]
        r = mw * sc
        x0, x1 = int(max(0, x - 1.2 * r)), int(min(w, x + 1.2 * r))
        y0, y1 = int(max(0, y - 0.6 * r)), int(min(h, y + 1.6 * r))
        win = f[y0:y1, x0:x1].astype(np.float32)
        if win.size == 0: out.append((x, y, sc, a, 0, 0)); continue
        lum = win.mean(2)
        skin = np.percentile(lum, 70)
        # the inside of a mouth: a deeper, darker red than warm-lit skin
        red = (win[..., 0] - win[..., 1] > 70) & (win[..., 1] < 140) & (lum < skin * 0.9) & (win[..., 0] > 90)
        best, bd = None, 1e9
        # an open mouth first: its red inside, wherever it is near the prediction (a turned head drags it sideways)
        n, lab, st, cen = cv2.connectedComponentsWithStats(red.astype(np.uint8) * 255, 8)
        for i in range(1, n):
            bx, by, bw, bh, area = st[i]
            if area < 0.02 * r * r or bw > 2.4 * r: continue
            cx, cy = cen[i]
            d = np.hypot(cx + x0 - x, (cy + y0 - y - 0.25 * r) * 1.2)
            if d < bd: best, bd = (cx + x0, by + y0 + bh * 0.45, bw * 1.25, bh * 1.35), d
        if not best:
            dark = lum < skin * 0.62
            n, lab, st, cen = cv2.connectedComponentsWithStats((dark * 255).astype(np.uint8), 8)
            for i in range(1, n):
                bx, by, bw, bh, area = st[i]
                if area < 4 or bw < 0.18 * r or bw > 2.0 * r or bh > 1.6 * r: continue
                if bx == 0 or by == 0 or bx + bw >= x1 - x0 or by + bh >= y1 - y0: continue  # touches the window: hair, chin, collar
                cx, cy = cen[i]
                d = np.hypot(cx + x0 - x, (cy + y0 - y) * 1.5)
                if d < bd: best, bd = (cx + x0, cy + y0, bw, bh), d
        out.append((best[0], best[1], sc, a, best[2], best[3]) if best and bd < 1.0 * r else (x, y, sc, a, 0, 0))
    a = np.array(out)
    k = np.array([1, 2, 3, 2, 1], float); k /= k.sum()
    for c in range(2):
        pad = np.pad(a[:, c], 2, mode='edge'); a[:, c] = np.convolve(pad, k, mode='valid')
    # the cover patch must hide whatever Wan drew: keep the largest drawn size over a few frames
    for c in (4, 5):
        a[:, c] = np.maximum.reduce([np.roll(a[:, c], d) for d in (-2, -1, 0, 1, 2)])
    return [tuple(r) for r in a]
