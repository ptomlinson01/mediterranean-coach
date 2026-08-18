"""Generate the app icons. Run once: python make_icons.py

Kept in the repo so the icons can be regenerated or restyled without hunting for
a design tool. The mark is an olive with a single leaf on a cream plate — chosen
because it stays legible at 60px on a home screen, which rules out anything
finer, like a branch.
"""

from PIL import Image, ImageDraw
from pathlib import Path

GREEN_DARK = (16, 66, 55)
GREEN      = (31, 111, 92)
CREAM      = (247, 244, 237)
OLIVE      = (122, 152, 74)
LEAF       = (54, 122, 92)

OUT = Path(__file__).parent / "icons"
OUT.mkdir(exist_ok=True)

SS = 4   # supersample, then downsample — gives clean anti-aliased edges


def draw_icon(size: int, inset: float = 0.0) -> Image.Image:
    """`inset` pulls the artwork toward the centre, for maskable icons."""
    s = size * SS
    img = Image.new("RGB", (s, s), GREEN_DARK)
    d = ImageDraw.Draw(img)

    # Vertical wash, so the field is not a flat slab of colour.
    for y in range(s):
        t = y / s
        d.line([(0, y), (s, y)], fill=tuple(
            int(a + (b - a) * t) for a, b in zip(GREEN_DARK, GREEN)
        ))

    c = s / 2
    k = (1.0 - inset) * c          # artwork radius in pixels

    def at(x, y):
        return (c + x * k, c + y * k)

    def circle(cx, cy, r, fill):
        x, y = at(cx, cy)
        rr = r * k
        d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=fill)

    # The plate.
    circle(0, 0, 0.78, CREAM)

    # The olive, sitting just below centre so the leaf has room above it.
    circle(-0.04, 0.12, 0.34, OLIVE)

    # A highlight, which is what makes it read as a fruit rather than a dot.
    circle(-0.17, -0.01, 0.09, CREAM)

    # One leaf, angled off the olive's shoulder.
    lw, lh = int(0.62 * k), int(0.26 * k)
    leaf = Image.new("RGBA", (lw, lh), (0, 0, 0, 0))
    ImageDraw.Draw(leaf).ellipse([0, 0, lw - 1, lh - 1], fill=LEAF + (255,))
    leaf = leaf.rotate(38, expand=True, resample=Image.BICUBIC)
    lx, ly = at(0.20, -0.34)
    img.paste(leaf, (int(lx - leaf.width / 2), int(ly - leaf.height / 2)), leaf)

    return img.resize((size, size), Image.LANCZOS)


for name, size, inset in (
    ("icon-180.png", 180, 0.0),      # apple-touch-icon; iOS rounds it itself
    ("icon-192.png", 192, 0.0),
    ("icon-512.png", 512, 0.0),
    ("maskable-512.png", 512, 0.24), # art stays inside the maskable safe zone
):
    draw_icon(size, inset).save(OUT / name)
    print("wrote", OUT / name)
