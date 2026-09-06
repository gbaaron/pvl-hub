#!/usr/bin/env python3
"""
make-app-art.py - draw the PVL Hub app icon and launch splash, then install
them into the Xcode asset catalog.

Both are the site's own favicon logic scaled up: gold PVL on the hub's
near-black, over the red/gold/blue signature strip global.css already uses.
"HUB" is deliberately absent from the icon - illegible at 60px, and the app
name says it anyway.

Outputs:
    assets/icons/app-icon-1024.png                          (App Store master)
    ios/App/App/Assets.xcassets/AppIcon.appiconset/...       (app icon)
    ios/App/App/Assets.xcassets/Splash.imageset/...          (launch screen)

    python3 scripts/make-app-art.py     (or: npm run art)
"""
from PIL import Image, ImageDraw, ImageFont
import os
import shutil

BLACK = (4, 7, 7)
DEEP = (6, 10, 16)
GOLD = (246, 184, 22)
RED = (237, 31, 36)
BLUE = (4, 83, 151)
FONT = "/System/Library/Fonts/Supplemental/Arial Black.ttf"

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XCASSETS = os.path.join(ROOT, "ios", "App", "App", "Assets.xcassets")


def render(size, mark_width, glow, vignette):
    """The PVL lockup on the hub's atmospheric background, at any size.

    mark_width is the wordmark's share of the canvas - large for the icon,
    small for the splash, where the mark floats in the middle of a phone.
    """
    img = Image.new("RGB", (size, size), DEEP)
    px = img.load()

    # Ambient glow: the site's layered background compressed into one radial.
    cx, cy, R = size * 0.5, size * 0.44, size * glow
    for y in range(size):
        for x in range(size):
            d = (((x - cx) ** 2 + (y - cy) ** 2) ** 0.5) / R
            t = max(0.0, 1.0 - d) ** 2.2 * 0.16
            r, g, b = px[x, y]
            px[x, y] = (
                min(255, int(r + (GOLD[0] - r) * t)),
                min(255, int(g + (GOLD[1] - g) * t)),
                min(255, int(b + (GOLD[2] - b) * t)),
            )

    # Vignette back to black at the edges so the mark holds its contrast.
    for y in range(size):
        for x in range(size):
            d = (((x - size / 2) ** 2 + (y - size / 2) ** 2) ** 0.5) / (size * 0.72)
            t = min(1.0, max(0.0, d - vignette) / (1.0 - vignette)) * 0.85
            r, g, b = px[x, y]
            px[x, y] = (
                int(r + (BLACK[0] - r) * t),
                int(g + (BLACK[1] - g) * t),
                int(b + (BLACK[2] - b) * t),
            )

    d = ImageDraw.Draw(img)

    fs = max(24, int(size * 0.2))
    font = ImageFont.truetype(FONT, fs)
    while True:
        box = d.textbbox((0, 0), "PVL", font=font)
        if box[2] - box[0] >= size * mark_width:
            break
        fs += max(2, size // 128)
        font = ImageFont.truetype(FONT, fs)

    box = d.textbbox((0, 0), "PVL", font=font)
    w, h = box[2] - box[0], box[3] - box[1]
    tx, ty = (size - w) / 2 - box[0], size * 0.44 - h / 2 - box[1]
    d.text((tx, ty + max(2, size // 128)), "PVL", font=font, fill=(0, 0, 0))
    d.text((tx, ty), "PVL", font=font, fill=GOLD)

    # The signature strip: red -> gold -> blue, the site's own ramp.
    bar_w = int(size * mark_width)
    bar_h = max(4, int(size * 0.033))
    bx, by = (size - bar_w) // 2, int(size * 0.665)
    for i in range(bar_w):
        t = i / max(1, bar_w - 1)
        if t < 0.5:
            u = t / 0.5
            c = tuple(int(RED[k] + (GOLD[k] - RED[k]) * u) for k in range(3))
        else:
            u = (t - 0.5) / 0.5
            c = tuple(int(GOLD[k] + (BLUE[k] - GOLD[k]) * u) for k in range(3))
        d.line([(bx + i, by), (bx + i, by + bar_h)], fill=c)

    return img


# --- App icon: the mark nearly fills the tile. -----------------------------
icon = render(1024, 0.74, 0.72, 0.55)
master_dir = os.path.join(ROOT, "assets", "icons")
os.makedirs(master_dir, exist_ok=True)
master = os.path.join(master_dir, "app-icon-1024.png")
icon.save(master, "PNG")
print("wrote", os.path.relpath(master, ROOT), icon.size, icon.mode)

appicon = os.path.join(XCASSETS, "AppIcon.appiconset", "AppIcon-512@2x.png")
if os.path.isdir(os.path.dirname(appicon)):
    shutil.copyfile(master, appicon)
    print("installed", os.path.relpath(appicon, ROOT))

# --- Splash: square canvas, aspect-filled and cropped by the device, so the
#     mark stays small enough to survive the crop on any screen. -------------
splash_dir = os.path.join(XCASSETS, "Splash.imageset")
if os.path.isdir(splash_dir):
    splash = render(2732, 0.30, 0.55, 0.35)
    for name in ("splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"):
        splash.save(os.path.join(splash_dir, name), "PNG")
    print("installed", os.path.relpath(splash_dir, ROOT), "(3 scales)")
