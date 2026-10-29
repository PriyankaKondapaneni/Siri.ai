"""Blink and mouth variants by patching only the eyes or mouth of a cut-out.
  prep  <name> <variant>   crop a square around the face, write crop + edit mask (transparent = editable) for the API
  paste <name> <variant>   paste the edited region back into the full cut-out with a feathered mask -> cut/<name><v>.png
Regions are normalized (x0, y0, x1, y1) of the cut-out; the crop is a square of side `side` (fraction of width)."""
import sys, os, json
import numpy as np
from PIL import Image, ImageFilter

F = {
 'M2': {'c': (0.60, 0.25), 'side': 0.62, 'b': (0.45, 0.17, 0.76, 0.27)},
 'M4': {'c': (0.53, 0.21), 'side': 0.60, 'b': (0.34, 0.14, 0.70, 0.23)},
 'M5': {'c': (0.67, 0.25), 'side': 0.60, 'b': (0.52, 0.18, 0.84, 0.28)},
 'M6': {'c': (0.58, 0.33), 'side': 0.80, 'b': (0.32, 0.22, 0.83, 0.36)},
 'M7': {'c': (0.63, 0.36), 'side': 0.62, 'b': (0.45, 0.28, 0.83, 0.40)},
 'K3': {'c': (0.60, 0.40), 'side': 0.66, 'b': (0.37, 0.26, 0.84, 0.38), 'm': (0.44, 0.40, 0.73, 0.51)},
 'K4': {'c': (0.68, 0.42), 'side': 0.62, 'b': (0.48, 0.27, 0.89, 0.39), 'm': (0.52, 0.44, 0.83, 0.55)},
}
ROOT = 'assets/art'
TMP = os.path.join(ROOT, 'patch')
os.makedirs(TMP, exist_ok=True)

def geom(name, v):
    im = Image.open(f'{ROOT}/cut/{name}.png').convert('RGBA')
    W, H = im.size
    f = F[name]
    s = int(f['side'] * W)
    cx, cy = f['c'][0] * W, f['c'][1] * H
    x0 = int(min(max(cx - s / 2, 0), W - s)); y0 = int(min(max(cy - s / 2, 0), H - s))
    box = f['b' if v == 'b' else 'm']
    r = (int(box[0] * W), int(box[1] * H), int(box[2] * W), int(box[3] * H))
    return im, (x0, y0, s), r

def prep(name, v):
    im, (x0, y0, s), r = geom(name, v)
    flat = Image.new('RGBA', im.size, (150, 150, 150, 255)); flat.alpha_composite(im)
    crop = flat.crop((x0, y0, x0 + s, y0 + s)).resize((1024, 1024), Image.LANCZOS).convert('RGB')
    crop.save(f'{TMP}/{name}{v}_in.png')
    m = Image.new('RGBA', (s, s), (0, 0, 0, 255))
    hole = Image.new('RGBA', (r[2] - r[0], r[3] - r[1]), (0, 0, 0, 0))
    m.paste(hole, (r[0] - x0, r[1] - y0))
    m.resize((1024, 1024), Image.NEAREST).save(f'{TMP}/{name}{v}_mask.png')

def paste(name, v):
    im, (x0, y0, s), r = geom(name, v)
    ed = Image.open(f'{TMP}/{name}{v}_out.png').convert('RGB').resize((s, s), Image.LANCZOS)
    full = im.copy()
    # feathered mask: the edit region shrunk a little and blurred, so the patch melts into the original
    m = Image.new('L', im.size, 0)
    pad = int(0.012 * im.size[0])
    m.paste(255, (r[0] + pad, r[1] + pad, r[2] - pad, r[3] - pad))
    m = m.filter(ImageFilter.GaussianBlur(pad * 1.2))
    layer = Image.new('RGBA', im.size, (0, 0, 0, 0)); layer.paste(ed.convert('RGBA'), (x0, y0))
    a = np.array(im).astype(np.float32); b = np.array(layer).astype(np.float32); k = (np.array(m).astype(np.float32) / 255)[..., None]
    out = a.copy(); out[..., :3] = a[..., :3] * (1 - k) + b[..., :3] * k
    Image.fromarray(out.clip(0, 255).astype(np.uint8), 'RGBA').save(f'{ROOT}/cut/{name}{v}.png')
    # a review crop: original | patched
    rv = Image.new('RGB', (s * 2, s)); fl = Image.new('RGBA', im.size, (150, 150, 150, 255))
    o1 = fl.copy(); o1.alpha_composite(im); o2 = fl.copy(); o2.alpha_composite(Image.open(f'{ROOT}/cut/{name}{v}.png'))
    rv.paste(o1.crop((x0, y0, x0 + s, y0 + s)).convert('RGB'), (0, 0)); rv.paste(o2.crop((x0, y0, x0 + s, y0 + s)).convert('RGB'), (s, 0))
    rv.resize((512, 256)).save(f'{TMP}/{name}{v}_review.jpg', quality=85)

if __name__ == '__main__':
    {'prep': prep, 'paste': paste}[sys.argv[1]](sys.argv[2], sys.argv[3])
