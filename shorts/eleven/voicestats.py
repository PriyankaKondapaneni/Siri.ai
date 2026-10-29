"""Pitch statistics for audition takes: median F0, spread (expressiveness), voiced share. python3 -I voicestats.py files..."""
import sys, wave, numpy as np
def load(p):
    w = wave.open(p); sr = w.getframerate(); n = w.getnframes(); b = w.readframes(n)
    x = np.frombuffer(b, dtype=np.int16).astype(np.float64) / 32768
    if w.getnchannels() > 1: x = x.reshape(-1, w.getnchannels()).mean(1)
    return x, sr
for p in sys.argv[1:]:
    x, sr = load(p)
    hop, win = int(sr * 0.01), int(sr * 0.04)
    f0 = []
    for i in range(0, len(x) - win, hop):
        fr = x[i:i + win] * np.hanning(win)
        if np.sqrt((fr ** 2).mean()) < 0.01: continue
        ac = np.correlate(fr, fr, 'full')[win - 1:]
        lo, hi = int(sr / 320), int(sr / 65)
        k = lo + np.argmax(ac[lo:hi])
        if ac[k] / (ac[0] + 1e-9) > 0.45: f0.append(sr / k)
    f0 = np.array(f0)
    st = 12 * np.log2(f0 / np.median(f0))
    print(f"{p.split('/')[-1]:12s} {len(x)/sr:5.2f}s  median F0 {np.median(f0):5.1f} Hz  spread {np.percentile(st,90)-np.percentile(st,10):4.1f} st  voiced {len(f0)*hop/len(x)*100:3.0f}%")
