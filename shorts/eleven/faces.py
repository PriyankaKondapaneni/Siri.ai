"""Find each cut-out's eyes (the big dark irises inside the face) and its skin tone, for code-drawn blinks and
mouths. Writes assets/art/v2/faces.json and a review sheet: python faces.py <review.jpg>"""
import sys, json, numpy as np, cv2
NAMES = 'M1 M2 M3 M4 M5 M6 M7 K2 K3 K4 S1'.split()
out, tiles = {}, []
for n in NAMES:
    im = cv2.imread(f'assets/art/v2/cut/{n}.png', cv2.IMREAD_UNCHANGED)
    bgr = im[..., :3]; H, W = bgr.shape[:2]
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    skin = ((hsv[..., 0] < 25) & (hsv[..., 1] > 18) & (hsv[..., 1] < 110) & (hsv[..., 2] > 200)).astype(np.uint8)
    dark = (bgr.max(2) < 90).astype(np.uint8)
    nn, lbl, st, cen = cv2.connectedComponentsWithStats(dark, connectivity=8)
    cands = []
    ring_k = np.ones((25, 25), np.uint8)
    for i in range(1, nn):
        x, y, w, h, a = st[i]
        if not (900 < a < 20000 and 0.45 < w / h < 1.6 and y < H * 0.55): continue
        m = (lbl == i).astype(np.uint8)
        ring = cv2.dilate(m, ring_k) - m
        sk = skin[ring > 0].mean()
        if sk < 0.25: continue
        cands.append((sk, a, cen[i][0], cen[i][1], w, h))
    cands.sort(key=lambda c: -c[0] * c[1])
    eyes = sorted(cands[:2], key=lambda c: c[2])
    sk = bgr[skin > 0]
    tone = np.median(sk, 0)[::-1].astype(int).tolist() if len(sk) else [250, 225, 210]
    out[n] = {'eyes': [[round(c[2] / W, 4), round(c[3] / H, 4), round(c[4] / W, 4), round(c[5] / H, 4)] for c in eyes], 'skin': tone}
    t = cv2.cvtColor(im, cv2.COLOR_BGRA2BGR).copy()
    for c in eyes: cv2.rectangle(t, (int(c[2] - c[4] / 2), int(c[3] - c[5] / 2)), (int(c[2] + c[4] / 2), int(c[3] + c[5] / 2)), (0, 0, 255), 5)
    tiles.append(cv2.resize(t[:1024], (300, 300)))
json.dump(out, open('assets/art/v2/faces.json', 'w'), indent=1)
rows = [np.hstack(tiles[i:i + 6] + [np.zeros((300, 300, 3), np.uint8)] * (6 - len(tiles[i:i + 6]))) for i in range(0, len(tiles), 6)]
cv2.imwrite(sys.argv[1], np.vstack(rows))
for n in NAMES: print(n, out[n])
