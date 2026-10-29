"""Contact sheet of review stills: python3 -I tools/contact.py <dir> <out.jpg> [cols] [width]"""
import sys, glob, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 5
w = int(sys.argv[4]) if len(sys.argv) > 4 else 380
files = sorted(glob.glob(os.path.join(d, 't*.png')))
h = int(w * 16 / 9)
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * (h + 26)), '#111')
dr = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS)
    x, y = (i % cols) * w, (i // cols) * (h + 26)
    sheet.paste(im, (x, y + 26))
    dr.text((x + 6, y + 6), os.path.basename(f)[1:-4] + ' s', fill='#ddd')
sheet.save(out, quality=88)
print(out, sheet.size)
