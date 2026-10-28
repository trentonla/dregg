#!/usr/bin/env python3
"""Draw the app icons. Run from the repo root: python3 tools/icons.py"""
from pathlib import Path

from PIL import Image, ImageDraw

PAPER = "#FBFAF7"
INK = "#1C1B18"
OUT = Path(__file__).resolve().parent.parent / "app" / "icons"


def draw(size: int, scale: float = 1.0) -> Image.Image:
    ss = 4
    px = size * ss
    image = Image.new("RGB", (px, px), PAPER)
    draw_ctx = ImageDraw.Draw(image)

    def p(x: float, y: float) -> tuple[float, float]:
        # Keep the mark inside the maskable safe zone by shrinking about the centre.
        return ((0.5 + (x - 0.5) * scale) * px, (0.5 + (y - 0.5) * scale) * px)

    width = int(px * 0.055 * scale)
    draw_ctx.line([p(0.28, 0.72), p(0.72, 0.30)], fill=INK, width=width, joint="curve")
    r = px * 0.085 * scale
    cx, cy = p(0.61, 0.57)
    draw_ctx.ellipse([cx - r, cy - r, cx + r, cy + r], fill=PAPER, outline=INK, width=int(px * 0.028 * scale))
    return image.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    draw(192).save(OUT / "icon-192.png")
    draw(512).save(OUT / "icon-512.png")
    draw(512, scale=0.78).save(OUT / "maskable-512.png")
    print(f"wrote icons to {OUT}")


if __name__ == "__main__":
    main()
