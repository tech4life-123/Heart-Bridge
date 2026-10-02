"""Builds HeartBridge brand assets from the master logo (black background PNG).
Usage: python3 scripts/build-brand-assets.py <master-logo.png>
Transparent versions are derived from luminance (the master is gold/white on pure black)."""
import sys
import numpy as np
from PIL import Image

src = Image.open(sys.argv[1]).convert("RGB")
a = np.array(src).astype(float)

def to_transparent(img_arr):
    alpha = img_arr.max(axis=2) / 255.0
    alpha = np.clip(alpha * 1.15, 0, 1)
    rgb = np.where(alpha[..., None] > 0.02, img_arr / np.maximum(alpha[..., None], 0.02), 0)
    rgb = np.clip(rgb, 0, 255)
    out = np.dstack([rgb, alpha * 255]).astype("uint8")
    return Image.fromarray(out, "RGBA")

def square_crop(arr, box, pad):
    x0, y0, x1, y1 = box
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    half = max(x1 - x0, y1 - y0) / 2 + pad
    return arr[int(cy - half):int(cy + half), int(cx - half):int(cx + half)]

emblem = to_transparent(square_crop(a, (327, 150, 927, 729), 20))
emblem.resize((512, 512), Image.LANCZOS).save("public/brand/emblem-512.png", optimize=True)
emblem.resize((160, 160), Image.LANCZOS).save("public/brand/emblem-160.png", optimize=True)

full = to_transparent(a[100:1100, 100:1160])
full.resize((848, 800), Image.LANCZOS).save("public/brand/logo-full.png", optimize=True)

def on_black(size, emblem_frac):
    canvas = Image.new("RGB", (size, size), (0, 0, 0))
    e = int(size * emblem_frac)
    em = emblem.resize((e, e), Image.LANCZOS)
    canvas.paste(em, ((size - e) // 2, (size - e) // 2), em)
    return canvas

on_black(512, 0.86).save("src/app/icon.png", optimize=True)
on_black(180, 0.86).save("src/app/apple-icon.png", optimize=True)
on_black(192, 0.86).save("public/brand/icon-192.png", optimize=True)
on_black(512, 0.86).save("public/brand/icon-512.png", optimize=True)
on_black(512, 0.62).save("public/brand/icon-maskable-512.png", optimize=True)
on_black(48, 0.94).convert("RGBA").save("src/app/favicon.ico", sizes=[(48, 48), (32, 32), (16, 16)])
# Social share image 1200x630
og = Image.new("RGB", (1200, 630), (0, 0, 0))
fl = full.resize((int(630 * 848 / 800 * 0.98), int(630 * 0.98)), Image.LANCZOS)
og.paste(fl, ((1200 - fl.width) // 2, (630 - fl.height) // 2), fl)
og.save("public/brand/og.png", optimize=True)
print("ok")
