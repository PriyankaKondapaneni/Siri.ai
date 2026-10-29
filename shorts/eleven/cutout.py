"""Cut a character out of a plain backdrop: colour key from the border, GrabCut to settle the boundary, a guided
filter for soft hair edges, and colour decontamination so no grey halo is left.
    python cutout.py in.png out.png [--tol 16]
"""
import sys, numpy as np, cv2

src, dst = sys.argv[1], sys.argv[2]
tol = float(sys.argv[sys.argv.index('--tol') + 1]) if '--tol' in sys.argv else 16.0
bgr = cv2.imread(src, cv2.IMREAD_COLOR)
h, w = bgr.shape[:2]
lab = cv2.cvtColor(cv2.medianBlur(bgr, 5), cv2.COLOR_BGR2LAB).astype(np.float32)
border = np.concatenate([lab[:10].reshape(-1, 3), lab[-10:].reshape(-1, 3), lab[:, :10].reshape(-1, 3), lab[:, -10:].reshape(-1, 3)])
# the backdrop drifts a little across the frame: use the colour of the nearest border region, smoothly
# only neutral, light border pixels count as backdrop (close-ups have the subject touching the edges)
neutral = border[(np.abs(border[:, 1] - 128) < 7) & (np.abs(border[:, 2] - 128) < 9) & (border[:, 0] > 140)]
bgc = np.median(neutral if len(neutral) > 200 else border, 0)
d = np.linalg.norm(lab - bgc, axis=2)
cand = (d < tol).astype(np.uint8)
n, lbl = cv2.connectedComponents(cand, connectivity=4)
edge_labels = set(np.unique(np.concatenate([lbl[0], lbl[-1], lbl[:, 0], lbl[:, -1]]))) - {0}
bg = np.isin(lbl, list(edge_labels))
# trimap for GrabCut
k = np.ones((7, 7), np.uint8)
sure_bg = cv2.erode(bg.astype(np.uint8), k, iterations=2).astype(bool)
sure_fg = cv2.erode((~bg).astype(np.uint8), k, iterations=3).astype(bool)
mask = np.full((h, w), cv2.GC_PR_FGD, np.uint8)
mask[bg] = cv2.GC_PR_BGD
mask[sure_bg] = cv2.GC_BGD
mask[sure_fg] = cv2.GC_FGD
bgdm, fgdm = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
cv2.grabCut(bgr, mask, None, bgdm, fgdm, 4, cv2.GC_INIT_WITH_MASK)
hard = np.isin(mask, [cv2.GC_FGD, cv2.GC_PR_FGD]).astype(np.float32)
# drop specks: keep components larger than 0.2% of the frame
n2, l2, stats, _ = cv2.connectedComponentsWithStats((hard > 0.5).astype(np.uint8), connectivity=8)
keep = np.zeros_like(hard)
for i in range(1, n2):
    if stats[i, cv2.CC_STAT_AREA] > h * w * 0.002: keep[l2 == i] = 1
hard = keep
# soft edges: guided by the image, so hair strands get partial alpha
guide = bgr.astype(np.float32) / 255
alpha = cv2.ximgproc.guidedFilter(guide, hard, 4, 1e-4)
# where the pixel is clearly backdrop-coloured, push alpha down (strand gaps)
softbg = np.clip((d - tol * 0.6) / (tol * 0.9), 0, 1)
band = cv2.dilate(hard, k, 2) - cv2.erode(hard, k, 2)
alpha = np.where(band > 0, np.minimum(alpha, softbg + 0.15), alpha)
alpha = np.clip(alpha, 0, 1)
alpha[alpha < 0.04] = 0
# decontaminate: remove the backdrop colour mixed into edge pixels
bg_bgr = cv2.cvtColor(np.uint8([[bgc]]), cv2.COLOR_LAB2BGR)[0, 0].astype(np.float32)
img = bgr.astype(np.float32)
a3 = np.maximum(alpha, 0.08)[..., None]
clean = np.clip((img - (1 - a3) * bg_bgr) / a3, 0, 255)
out = np.where(alpha[..., None] > 0.97, img, clean)
rgba = np.dstack([out, alpha * 255]).astype(np.uint8)
cv2.imwrite(dst, rgba)
print(f'{dst}: {w}x{h}, subject {hard.mean() * 100:.0f}% of frame, backdrop {bgc.round(1)}')
