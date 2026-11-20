#!/usr/bin/env python3
"""Mean frame luma for the #750 evidence PNGs.

Method (deliberately simple and stated so it can be re-run):
  - decode PNG to 8-bit RGB (Pillow, mode RGB);
  - luma per pixel L = 0.299*R + 0.587*G + 0.114*B, computed on the sRGB values
    as stored (NO linearisation, NO gamma handling);
  - mean over every pixel of the frame.

That is Rec.601 on the encoded values. A plain mean of the three colour channels
instead of luma lands ~1 luma higher on the darkest frames (68.6 vs 67.7 on
750-projects-390-dark-after.png), which is exactly the spread a reader sees if they
pick the other convention -- so the convention is pinned here.

Usage: python3 mean-luma.py <dir-with-pngs> > brightness.json
"""
import glob, json, os, sys
import numpy as np
from PIL import Image

def main(d):
    rows = []
    for p in sorted(glob.glob(os.path.join(d, '*.png'))):
        im = Image.open(p).convert('RGB')
        a = np.asarray(im).astype(np.float64)
        luma = (0.299 * a[:, :, 0] + 0.587 * a[:, :, 1] + 0.114 * a[:, :, 2]).mean()
        rows.append({'file': os.path.basename(p), 'w': im.size[0], 'h': im.size[1],
                     'luma': round(float(luma), 2), 'bytes': os.path.getsize(p)})
    json.dump(rows, sys.stdout, indent=1)

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '.')
