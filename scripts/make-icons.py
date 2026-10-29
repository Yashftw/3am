#!/usr/bin/env python3
"""
Generate the app icons.

The repo previously shipped `icon-192.png` and `icon-512.png` that were
actually SVG documents with a .png extension, and the manifest declared them
as `image/png`. Browsers could not decode them, so Android never offered the
install prompt and iOS had no home-screen artwork - which broke the whole
"add it to your phone" flow.

This draws the 3am mark (ring + diagonal slash, monochrome) into a pixel
buffer and writes real PNGs using only the standard library, so it can be
re-run on any machine with no image dependencies:

    python scripts/make-icons.py
"""

import math
import struct
import zlib
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public"

BG = (0x0A, 0x0A, 0x0A)
FG = (0xFF, 0xFF, 0xFF)
GRID_ALPHA = 0.05

# Supersampling factor. 4x is plenty for shapes this simple and keeps the
# script fast enough to run inline.
SS = 4


def _coverage_ring(x, y, cx, cy, radius, width):
    """Signed coverage of an annulus, 1 inside, 0 outside."""
    d = math.hypot(x - cx, y - cy)
    return 1.0 if abs(d - radius) <= width / 2 else 0.0


def _coverage_segment(x, y, x0, y0, x1, y1, width):
    """Coverage of a thick line segment with butt caps."""
    dx, dy = x1 - x0, y1 - y0
    length_sq = dx * dx + dy * dy
    if length_sq == 0:
        return 0.0
    t = ((x - x0) * dx + (y - y0) * dy) / length_sq
    if t < 0.0 or t > 1.0:
        return 0.0
    px, py = x0 + t * dx, y0 + t * dy
    return 1.0 if math.hypot(x - px, y - py) <= width / 2 else 0.0


def render(size: int, inset: float = 0.0) -> bytes:
    """
    Render the mark at `size` px.

    `inset` shrinks the artwork toward the centre, leaving flat background
    around it. Android crops maskable icons to a circle inscribed in the
    safe zone, so the maskable variant needs that margin.
    """
    hi = size * SS
    # Accumulate coverage at supersampled resolution, then box-filter down.
    acc = [[0.0] * hi for _ in range(hi)]

    scale = 1.0 - inset * 2
    cx = cy = hi / 2.0
    unit = hi / 512.0 * scale  # one SVG user unit in supersampled pixels

    ring_r = 132 * unit
    stroke = 26 * unit

    # Slash endpoints, mirroring the SVG.
    sx0, sy0 = cx + (162 - 256) * unit, cy + (350 - 256) * unit
    sx1, sy1 = cx + (350 - 256) * unit, cy + (162 - 256) * unit

    for py in range(hi):
        y = py + 0.5
        row = acc[py]
        for px in range(hi):
            x = px + 0.5
            if _coverage_ring(x, y, cx, cy, ring_r, stroke):
                row[px] = 1.0
            elif _coverage_segment(x, y, sx0, sy0, sx1, sy1, stroke):
                row[px] = 1.0

    # Faint grid, echoing the app background. Drawn at final resolution so the
    # hairlines stay crisp rather than being averaged away.
    grid = [[0.0] * size for _ in range(size)]
    step = size / 4.0
    for i in range(1, 4):
        p = int(round(i * step))
        if 0 <= p < size:
            for k in range(size):
                grid[p][k] = 1.0
                grid[k][p] = 1.0

    # Downsample and composite.
    raw = bytearray()
    inv = 1.0 / (SS * SS)
    for y in range(size):
        raw.append(0)  # PNG filter type 0 for this scanline
        for x in range(size):
            total = 0.0
            for oy in range(SS):
                row = acc[y * SS + oy]
                base = x * SS
                for ox in range(SS):
                    total += row[base + ox]
            a = total * inv

            g = grid[y][x] * GRID_ALPHA * (1.0 - a)
            for ch in range(3):
                v = BG[ch] * (1 - a) + FG[ch] * a
                v = v * (1 - g) + FG[ch] * g
                raw.append(max(0, min(255, int(round(v)))))

    return _png(size, size, bytes(raw))


def _chunk(tag: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + tag
        + data
        + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    )


def _png(width: int, height: int, raw: bytes) -> bytes:
    header = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)  # 8-bit RGB
    return (
        b"\x89PNG\r\n\x1a\n"
        + _chunk(b"IHDR", header)
        + _chunk(b"IDAT", zlib.compress(raw, 9))
        + _chunk(b"IEND", b"")
    )


TARGETS = [
    ("icon-192.png", 192, 0.0),
    ("icon-512.png", 512, 0.0),
    ("icon-maskable-512.png", 512, 0.14),
    ("apple-touch-icon.png", 180, 0.0),
]


def main():
    for name, size, inset in TARGETS:
        path = OUT / name
        data = render(size, inset)
        path.write_bytes(data)
        print(f"{name:26} {size}x{size}  {len(data):>7} bytes")


if __name__ == "__main__":
    main()
