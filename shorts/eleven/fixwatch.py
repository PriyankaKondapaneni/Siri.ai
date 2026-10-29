"""Set the watch in K5 to exactly 11:11: find the dial, inpaint the old hands away, draw new hands.
    python fixwatch.py in.png out.png"""
import sys, math, numpy as np, cv2
img = cv2.imread(sys.argv[1]); h, w = img.shape[:2]
g = cv2.medianBlur(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), 5)
cs = cv2.HoughCircles(g, cv2.HOUGH_GRADIENT, dp=1.2, minDist=200, param1=120, param2=60, minRadius=90, maxRadius=200)
# the dial: the circle whose inside is brightest (a cream face)
best = None
for x, y, r in (cs[0] if cs is not None else []):
    m = np.zeros_like(g); cv2.circle(m, (int(x), int(y)), int(r * 0.8), 255, -1)
    v = g[m > 0].mean()
    if best is None or v > best[3]: best = (int(x), int(y), int(r), v)
cx, cy, R, _ = best
print('dial', cx, cy, R)
# the hands: anything clearly darker than the dial around it, inside the inner dial, except the two subdials
local = cv2.medianBlur(g, 41)
diff = local.astype(np.int16) - g.astype(np.int16)
yy, xx = np.mgrid[0:h, 0:w]
rr = np.hypot(xx - cx, yy - cy)
hands = ((diff > 14) & (rr < R * 0.76)).astype(np.uint8) * 255
small = cv2.HoughCircles(g, cv2.HOUGH_GRADIENT, dp=1.2, minDist=30, param1=100, param2=28, minRadius=int(R * 0.17), maxRadius=int(R * 0.33))
for x, y, r in (small[0] if small is not None else []):
    d = math.hypot(x - cx, y - cy)
    if R * 0.25 < d < R * 0.7: cv2.circle(hands, (int(x), int(y)), int(r * 1.05), 0, -1)
hands = cv2.dilate(hands, np.ones((3, 3), np.uint8), iterations=3)
out = cv2.inpaint(img, hands, 9, cv2.INPAINT_TELEA)
# new hands, supersampled for smooth edges
S = 4
big = cv2.resize(out, (w * S, h * S), interpolation=cv2.INTER_CUBIC)
col = (38, 32, 34)
def hand(angle_deg, length, width):
    a = math.radians(angle_deg)
    x2, y2 = cx + math.sin(a) * length, cy - math.cos(a) * length
    xb, yb = cx - math.sin(a) * length * 0.16, cy + math.cos(a) * length * 0.16
    cv2.line(big, (int(xb * S), int(yb * S)), (int(x2 * S), int(y2 * S)), col, int(width * S), cv2.LINE_AA)
hour = (11 + 11 / 60) / 12 * 360
minute = 11 / 60 * 360
hand(hour, R * 0.46, max(5, R * 0.05))
hand(minute, R * 0.8, max(3.5, R * 0.034))
cv2.circle(big, (cx * S, cy * S), int(R * 0.06 * S), col, -1, cv2.LINE_AA)
cv2.circle(big, (cx * S, cy * S), int(R * 0.025 * S), (150, 170, 190), -1, cv2.LINE_AA)
out = cv2.resize(big, (w, h), interpolation=cv2.INTER_AREA)
cv2.imwrite(sys.argv[2], out)
cv2.imwrite(sys.argv[2].replace('.png', '-crop.png'), out[max(0, cy - R - 20):cy + R + 20, max(0, cx - R - 20):cx + R + 20])
