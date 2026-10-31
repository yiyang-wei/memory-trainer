#!/usr/bin/env python3
"""Rasterize the app icon into the PNG sizes the manifest and iOS need.

public/icon.svg is the design source: a rounded card (#card) and the art in one group
(#art), drawn to sit inside the maskable safe zone and scaled up on the card. The
full-bleed icons square the card's corners, and the maskable one also sets the art's
scale back to 1 so the launcher's mask never cuts into it.
Run after editing the design:  python3 scripts/generate-icons.py  (needs cairosvg)
"""

import io
import xml.etree.ElementTree as ET

import cairosvg
from PIL import Image

SRC = "public/icon.svg"
OUT = "public"
SVG_NS = "http://www.w3.org/2000/svg"
ART_AT_SCALE_1 = "translate(256 256) scale(1) translate(-256 -256)"

ET.register_namespace("", SVG_NS)


def variant(*, full_bleed, safe_zone):
    """The source SVG, with the card squared off and/or the art at its safe-zone size."""
    root = ET.parse(SRC).getroot()
    for el in root.iter():
        if el.get("id") == "card" and full_bleed:
            el.attrib.pop("rx", None)
        if el.get("id") == "art" and safe_zone:
            el.set("transform", ART_AT_SCALE_1)
    return ET.tostring(root)


def render(svg, size):
    png = cairosvg.svg2png(bytestring=svg, output_width=size, output_height=size)
    return Image.open(io.BytesIO(png)).convert("RGBA")


def save(img, name, *, opaque):
    if opaque:  # iOS composites any alpha onto black, so flatten first
        img = img.convert("RGB")
    img.save(f"{OUT}/{name}", optimize=True)
    print(f"  {name}  {img.size[0]}x{img.size[1]}")


if __name__ == "__main__":
    print("writing icons:")
    card = variant(full_bleed=False, safe_zone=False)
    square = variant(full_bleed=True, safe_zone=False)
    maskable = variant(full_bleed=True, safe_zone=True)
    # Apple touch icon: opaque and square; iOS applies its own rounding and would
    # otherwise composite transparent corners onto black.
    save(render(square, 180), "apple-touch-icon.png", opaque=True)
    save(render(card, 192), "icon-192.png", opaque=False)
    save(render(card, 512), "icon-512.png", opaque=False)
    # Maskable: full-bleed, art inside the central safe zone (radius 40% of the icon).
    save(render(maskable, 512), "icon-maskable-512.png", opaque=True)
