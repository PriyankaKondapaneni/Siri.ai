"""Assemble an episode from Wan clips and the code-rendered cut.

The code engine's finished cut (deliver/11-11-episode-NN.mp4) supplies the voice and mix, the phone screens,
clocks, big type, cookie inserts and the end card. Every shot listed in kaggle/epNN/jobs.json is replaced by its
Wan clip: fitted to the shot's length (trimmed, or slowed a little if short), upscaled to 1080x1920, given the
film finish the engine gives its own frames (vignette and grain), with the engine's own subtitles laid on top.
Dissolves into or out of a Wan shot cross-fade over 0.35 s.

  python3 assemble_ai.py 02 <clips_dir> [picks.json] [out.mp4]
picks.json maps shot number to take ({"9": 2}); take 1 by default.
"""
import json, os, subprocess, sys
import numpy as np
import cv2

EP = sys.argv[1]
CLIPS = sys.argv[2]
PICKS = json.load(open(sys.argv[3])) if len(sys.argv) > 3 and sys.argv[3].endswith('.json') else {}
OUT = sys.argv[4] if len(sys.argv) > 4 else f'build/ep{EP}ai/11-11-episode-{EP}-ai.mp4'
ROOT = os.path.dirname(os.path.abspath(__file__))
DELIVER = f'{ROOT}/deliver/11-11-episode-{EP}.mp4'
W, H, FPS, DISSOLVE = 1080, 1920, 30, 0.35

shots = json.load(open(f'{ROOT}/episodes/{EP}/shots.json'))['shots']  # [s, e, look, transition, ...]
jobs = json.load(open(f'{ROOT}/kaggle/ep{EP}/jobs.json'))
ai = sorted({j['shot'] for j in jobs})
os.makedirs(os.path.dirname(OUT) or '.', exist_ok=True)


def probe_frames(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', path], capture_output=True, text=True)
    return int(r.stdout.strip())


def read_all(path, w, h):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)


def clip_size(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', path], capture_output=True, text=True)
    w, h = map(int, r.stdout.strip().split(','))
    return w, h


# the Wan clips, upscaled once to the frame size (cover, centred)
clip = {}
for k in ai:
    take = int(PICKS.get(str(k), 1))
    path = f'{CLIPS}/shot{k:02d}_t{take}.mp4'
    if not os.path.exists(path):
        alt = f'{CLIPS}/shot{k:02d}_t{3 - take}.mp4'
        print(f'shot {k}: take {take} missing, using {alt if os.path.exists(alt) else "the code shot"}')
        if not os.path.exists(alt): continue
        path = alt
    cw, ch = clip_size(path)
    clip[k] = read_all(path, cw, ch)  # kept small; upscaled frame by frame when used
    fr = clip[k]
    s0, e0 = shots[k][0], shots[k][1]
    print(f'shot {k}: {len(fr)} frames ({len(fr) / 24:.2f} s) for {e0 - s0:.2f} s')

# the engine's finish, so Wan frames sit with the rest: a soft vignette and fine grain
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
r = np.sqrt(((xx - W / 2) / (W * 0.72)) ** 2 + ((yy - H / 2) / (H * 0.72)) ** 2)
VIG = (1 - 0.32 * np.clip(r - 0.35, 0, 1) ** 1.6)[..., None]
rng = np.random.default_rng(11)
GRAIN = [rng.normal(0, 3.2, (H // 2, W // 2, 1)).astype(np.float32) for _ in range(6)]


_up = {}
def upscale(k, i):
    """frame i of shot k at 1080x1920 (cover, centred), with a light sharpen for the line work"""
    key = (k, i)
    if key in _up: return _up[key]
    im = clip[k][i]; ch, cw = im.shape[:2]
    s = max(W / cw, H / ch); nw, nh = round(cw * s), round(ch * s)
    big = cv2.resize(im, (nw, nh), interpolation=cv2.INTER_LANCZOS4)
    x0, y0 = (nw - W) // 2, (nh - H) // 2
    big = big[y0:y0 + H, x0:x0 + W]
    blur = cv2.GaussianBlur(big, (0, 0), 1.2)
    out = cv2.addWeighted(big, 1.45, blur, -0.45, 0)
    if len(_up) > 8: _up.pop(next(iter(_up)))
    _up[key] = out
    return out


def ai_frame(k, t):
    """Wan shot k at episode time t (may run past the shot's end, for dissolves)."""
    fr = clip[k]
    s0, e0 = shots[k][0], shots[k][1]
    have = len(fr) / 24
    rate = min(1.0, have / max(0.01, e0 - s0 + DISSOLVE))  # slow it slightly when the clip is short
    i = int(np.clip(round((t - s0) * rate * 24), 0, len(fr) - 1))
    im = upscale(k, i).astype(np.float32) * VIG
    g = cv2.resize(GRAIN[int(t * 24) % 6], (W, H), interpolation=cv2.INTER_LINEAR)[..., None]
    return np.clip(im + g, 0, 255)


def shot_at(t):
    k = 0
    while k + 1 < len(shots) and shots[k + 1][0] <= t: k += 1
    return k


N = probe_frames(DELIVER)
# subtitles for the Wan frames, rendered by the engine on transparency
sub_frames = [f for f in range(N) if shot_at(f / FPS) in clip or (shot_at(f / FPS) > 0 and shot_at(f / FPS) - 1 in clip and f / FPS - shots[shot_at(f / FPS)][0] < DISSOLVE)]
sub_dir = f'build/ep{EP}ai/subs'
os.makedirs(sub_dir, exist_ok=True)
todo = [f for f in sub_frames if not os.path.exists(f'{sub_dir}/f{f:05d}.png')]
if todo:
    json.dump(todo, open(f'{sub_dir}/list.json', 'w'))
    subprocess.run(['node', f'{ROOT}/frames.mjs', sub_dir, f'{sub_dir}/list.json'], env={**os.environ, 'PAGE': f'index-{EP}s.html'}, cwd=ROOT, check=True)


def subs(f, im):
    p = f'{sub_dir}/f{f:05d}.png'
    s = cv2.imread(p, cv2.IMREAD_UNCHANGED)
    if s is None or s[..., 3].max() == 0: return im
    a = s[..., 3:4].astype(np.float32) / 255
    rgb = s[..., 2::-1].astype(np.float32)
    return im * (1 - a) + rgb * a


src = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', DELIVER, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                        '-i', DELIVER, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
                        '-profile:v', 'high', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', OUT], stdin=subprocess.PIPE)
held = {}  # the last code frame before a shot, for dissolving out of it
prev_code = None
for f in range(N):
    code = np.frombuffer(src.stdout.read(W * H * 3), np.uint8).reshape(H, W, 3)
    t = f / FPS
    k = shot_at(t)
    s0 = shots[k][0]
    dissolving = shots[k][3] == 'dissolve' and t - s0 < DISSOLVE and k > 0 and (k in clip or k - 1 in clip)
    if k in clip:
        im = ai_frame(k, t)
        if dissolving:
            a = (t - s0) / DISSOLVE; a = a * a * (3 - 2 * a)
            before = ai_frame(k - 1, t) if k - 1 in clip else held.get(k, code.astype(np.float32))
            im = before * (1 - a) + im * a
        im = subs(f, im)
    else:
        im = code.astype(np.float32)
        if dissolving:  # out of a Wan shot into a code shot
            a = (t - s0) / DISSOLVE; a = a * a * (3 - 2 * a)
            im = ai_frame(k - 1, t) * (1 - a) + im * a  # the code frame already carries the subtitle
    # remember the code frame just before each Wan shot begins
    if k + 1 < len(shots) and k + 1 in clip and k not in clip and 0 <= shots[k + 1][0] - t < 1.5 / FPS:
        held[k + 1] = code.astype(np.float32)
    enc.stdin.write(np.clip(im, 0, 255).astype(np.uint8).tobytes())
    if f % 300 == 0: print(f'{f}/{N}', flush=True)
enc.stdin.close(); enc.wait(); src.wait()
print('wrote', OUT)
