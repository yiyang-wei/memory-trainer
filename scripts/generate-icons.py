#!/usr/bin/env python3
"""Rasterize the app icon into the PNG sizes the manifest and iOS need.

public/icon.svg stays the source of truth for the design; this redraws the same
four-tile mark with Pillow so we don't need an SVG rasterizer in the toolchain.
Run after editing the design:  python3 scripts/generate-icons.py
"""

from PIL import Image, ImageDraw

OUT = "public"
BG = (140, 160, 219, 255)  # C.accent — #8CA0DB
SS = 4  # supersample factor, downscaled at the end for clean edges

# Geometry from icon.svg's 128px viewBox: four 30px tiles, 7px radius, inset 24px.
VIEWBOX = 128.0
TILES = [(24, 24, 0.95), (74, 24, 0.5225), (24, 74, 0.5225), (74, 74, 0.95)]
TILE, TILE_R, CARD_R = 30.0, 7.0, 28.0


def render(size, *, rounded, content_scale=1.0):
    """Draw the icon at `size`px. `rounded` gives the card its transparent corner
    radius; maskable/Apple icons must stay full-bleed and opaque instead."""
    n = size * SS
    img = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    k = n / VIEWBOX

    if rounded:
        d.rounded_rectangle([0, 0, n - 1, n - 1], radius=CARD_R * k, fill=BG)
    else:
        d.rectangle([0, 0, n, n], fill=BG)

    # Scale the mark about the icon's centre so maskable output clears the safe zone.
    for x, y, alpha in TILES:
        cx, cy = (x + TILE / 2) * k, (y + TILE / 2) * k
        half = (TILE / 2) * k * content_scale
        mid = n / 2
        cx, cy = mid + (cx - mid) * content_scale, mid + (cy - mid) * content_scale
        tile = Image.new("RGBA", (n, n), (0, 0, 0, 0))
        ImageDraw.Draw(tile).rounded_rectangle(
            [cx - half, cy - half, cx + half, cy + half],
            radius=TILE_R * k * content_scale,
            fill=(255, 255, 255, round(255 * alpha)),
        )
        img = Image.alpha_composite(img, tile)

    return img.resize((size, size), Image.LANCZOS)


def save(img, name, *, opaque):
    if opaque:  # iOS composites any alpha onto black, so flatten first
        flat = Image.new("RGB", img.size, BG[:3])
        flat.paste(img, mask=img.split()[3])
        img = flat
    img.save(f"{OUT}/{name}", optimize=True)
    print(f"  {name}  {img.size[0]}x{img.size[1]}")


if __name__ == "__main__":
    print("writing icons:")
    # Apple touch icon: opaque and square — iOS applies its own rounding and would
    # otherwise composite transparent corners onto black.
    save(render(180, rounded=False), "apple-touch-icon.png", opaque=True)
    save(render(192, rounded=True), "icon-192.png", opaque=False)
    save(render(512, rounded=True), "icon-512.png", opaque=False)
    # Maskable: full-bleed, mark shrunk so its corners sit inside the central 80% circle.
    save(render(512, rounded=False, content_scale=0.85), "icon-maskable-512.png", opaque=True)
