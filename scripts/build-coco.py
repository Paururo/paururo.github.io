#!/usr/bin/env python3
"""Draw Polar's coconuts as pixel art at the scale of his own sprite (one art
pixel per CSS pixel on a desktop screen): the house that hangs in the top
right corner (assets/img/coco.png) and the half shell on the desk that he
climbs into (assets/img/coco-half.png).

The coconut is a shell lit from the top left, with its fibres running from
pole to pole, the three eyes at the top where the rope goes in, and a round
door he flies in and out through, lined with the white of the dried flesh.
The half shell sits open side up: the cut edge a ring of white flesh, the
far wall lit inside, a shadow on the desk. The same seed always gives the
same pictures.

Prints the points js/polar.js needs (COCO_* and BOWL_*), in art pixels from
the top left corner of each picture.

Usage: python3 scripts/build-coco.py
"""
import math
import os
import random

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'img', 'coco.png')
OUT_HALF = os.path.join(ROOT, 'assets', 'img', 'coco-half.png')

# ---- geometry, in art pixels ----
ROPE = 26                   # rope above the shell
RX, RY = 39, 42             # half width and half height of the shell
W = 2 * RX + 8
H = ROPE + 2 * RY + 6
CX, CY = RX + 4, ROPE + RY + 1
HX, HY, HR = CX - 1, CY - 3, 18.5          # the door

# ---- palette ----
OUTLINE = (38, 27, 19)            # the same dark as Polar's outline
SHELL = [(61, 36, 19), (84, 51, 27), (108, 68, 36), (134, 88, 48), (160, 110, 64), (186, 136, 84)]
FIBRE_DARK = (70, 42, 22)
FIBRE_LIGHT = (196, 150, 96)
FIBRE_PALE = (214, 176, 122)
EYE = (44, 28, 16)
EYE_RIM = (150, 100, 56)
INSIDE = [(20, 12, 8), (28, 17, 10), (38, 24, 14)]
FLESH = (240, 230, 206)
FLESH_SHADE = (205, 188, 152)
CUT = (122, 80, 44)
ROPE_C = [(122, 94, 54), (170, 138, 88), (212, 184, 132)]

LIGHT = (-0.55, -0.62, 0.56)


def norm(v):
    n = math.sqrt(sum(c * c for c in v))
    return tuple(c / n for c in v)


def main():
    rnd = random.Random(7)
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    px = img.load()
    L = norm(LIGHT)

    def inside_shell(x, y):
        # a little flatter on top, where it hangs, and fuller below
        dy = (y + 0.5 - CY) / RY
        rx = RX * (1 + 0.04 * dy)
        return ((x + 0.5 - CX) / rx) ** 2 + dy ** 2 <= 1

    def shade(x, y):
        nx, ny = (x + 0.5 - CX) / RX, (y + 0.5 - CY) / RY
        nz = math.sqrt(max(0.0, 1 - nx * nx - ny * ny))
        lum = max(0.0, nx * L[0] + ny * L[1] + nz * L[2])
        # a band of reflected light along the lower right rim
        rim = max(0.0, (nx * 0.6 + ny * 0.8)) ** 3 * 0.35 if nz < 0.45 else 0
        return lum * 0.92 + rim + 0.06

    def in_door(x, y, grow=0.0):
        return (x + 0.5 - HX) ** 2 + (y + 0.5 - HY) ** 2 <= (HR + grow) ** 2

    # the shell, in bands of brown
    for y in range(H):
        for x in range(W):
            if inside_shell(x, y):
                v = shade(x, y)
                band = min(len(SHELL) - 1, int(v * (len(SHELL) - 0.2)))
                px[x, y] = SHELL[band] + (255,)

    # fibres, running from the top of the shell to the bottom, like meridians
    for _ in range(620):
        x0 = CX + rnd.uniform(-RX, RX)
        y0 = CY + rnd.uniform(-RY, RY)
        if not inside_shell(int(x0), int(y0)) or in_door(int(x0), int(y0), 3):
            continue
        dy = (y0 - CY) / RY
        across = math.sqrt(max(1e-3, 1 - dy * dy))
        u = (x0 - CX) / (RX * across)
        length = rnd.randint(3, 7)
        v = shade(int(x0), int(y0))
        colour = FIBRE_DARK if rnd.random() < 0.55 else (FIBRE_PALE if v > 0.8 else FIBRE_LIGHT if v > 0.45 else SHELL[2])
        x, y = x0, y0
        for _ in range(length):
            ix, iy = int(round(x)), int(round(y))
            if inside_shell(ix, iy) and not in_door(ix, iy, 2):
                px[ix, iy] = colour + (255,)
            dyr = (y - CY) / RY
            slope = -u * RX * dyr / (RY * math.sqrt(max(1e-3, 1 - dyr * dyr)))
            step = 1 / math.sqrt(1 + slope * slope)
            y += step
            x += slope * step

    # the three eyes, at the top, around the rope
    for ex, ey in ((CX - 7, CY - RY + 9), (CX + 6, CY - RY + 9), (CX, CY - RY + 15)):
        for y in range(ey - 2, ey + 3):
            for x in range(ex - 2, ex + 3):
                d = (x - ex) ** 2 + (y - ey) ** 2
                if d <= 2:
                    px[x, y] = EYE + (255,)
                elif d <= 5 and px[x, y][3] and y > ey:
                    px[x, y] = EYE_RIM + (255,)

    # the door: the cut edge, the white of the flesh, and the dark inside
    for y in range(H):
        for x in range(W):
            if not in_door(x, y, 1.6):
                continue
            dx, dy = x + 0.5 - HX, y + 0.5 - HY
            r = math.hypot(dx, dy)
            if r > HR:
                px[x, y] = OUTLINE + (255,)          # the cut edge, seen from the front
            elif r > HR - 2.2:
                # the wall of the shell: its cut face catches the light below the door
                px[x, y] = (FLESH if dy > 2 else FLESH_SHADE if dy > -6 else CUT) + (255,)
            else:
                depth = (dy + HR) / (2 * HR)       # darker under the top of the door
                px[x, y] = INSIDE[0 if depth < 0.45 else 1 if depth < 0.8 else 2] + (255,)

    # the rope, twisted, and its knot on top of the shell
    top = CY - RY
    for y in range(0, top + 3):
        for k in range(3):
            px[CX - 1 + k, y] = ROPE_C[(y + 2 * k) % 3] + (255,)
    for y in range(top - 2, top + 3):
        for x in range(CX - 3, CX + 4):
            if abs(x - CX) + abs(y - top) * 1.4 <= 4.2:
                px[x, y] = ROPE_C[(x + y) % 3 if abs(x - CX) < 3 else 0] + (255,)

    # a few fibres that stick out of the shell at the bottom
    for x, n in ((CX - 12, 2), (CX - 5, 3), (CX + 3, 2), (CX + 11, 2), (CX + 18, 1)):
        y = max(yy for yy in range(H) if inside_shell(x, yy))
        for k in range(1, n + 1):
            px[x + (k % 2 if x > CX else 0), y + k] = FIBRE_DARK + (255,)

    # a one-pixel outline round everything, as Polar has
    solid = [[img.getpixel((x, y))[3] > 0 for x in range(W)] for y in range(H)]
    for y in range(H):
        for x in range(W):
            if solid[y][x]:
                continue
            if any(0 <= x + dx < W and 0 <= y + dy < H and solid[y + dy][x + dx]
                   for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                # the rope keeps a softer edge
                on_rope = abs(x - CX) <= 2 and y < top - 2
                px[x, y] = (ROPE_C[0] if on_rope else OUTLINE) + (255,)

    img.save(OUT, optimize=True)
    print(f'wrote {os.path.relpath(OUT, ROOT)} ({W} x {H})')
    print(f'const COCO_CELL = [{W}, {H}];')
    print(f'const COCO_PIVOT = [{CX + 0.5}, 0];')
    print(f'const COCO_DOOR = [{HX}, {HY}, {HR}];')
    print(f'const COCO_SHELL = [{CX}, {CY}, {RX}, {RY}];')


# ---- the half shell on the desk ----
BW, BH = 78, 60
BX, BY = 39, 12             # centre of the cut edge
BRX, BRY = 35, 10           # the cut edge, outside
BIX, BIY = 31, 8            # and inside, where the flesh ends
DEPTH = 42                  # from the cut edge to the bottom


def half():
    rnd = random.Random(11)
    img = Image.new('RGBA', (BW, BH), (0, 0, 0, 0))
    px = img.load()
    L = norm(LIGHT)

    def on_rim(x, y, rx, ry):
        return ((x + 0.5 - BX) / rx) ** 2 + ((y + 0.5 - BY) / ry) ** 2 <= 1

    def in_body(x, y):
        # the half sphere under the cut edge, a little flat where it sits
        if y + 0.5 < BY:
            return False
        return ((x + 0.5 - BX) / BRX) ** 2 + ((y + 0.5 - BY) / DEPTH) ** 2 <= 1 and y < BY + DEPTH - 1

    # its shadow on the desk
    for y in range(BH):
        for x in range(BW):
            d = ((x + 0.5 - BX - 2) / (BRX + 1)) ** 2 + ((y + 0.5 - (BY + DEPTH - 2)) / 4.6) ** 2
            if d <= 1:
                px[x, y] = (60, 36, 18, 70 if d > 0.55 else 105)

    # the outside of the shell, lit from the top left
    for y in range(BH):
        for x in range(BW):
            if not in_body(x, y):
                continue
            nx, ny = (x + 0.5 - BX) / BRX, (y + 0.5 - BY) / DEPTH
            nz = math.sqrt(max(0.0, 1 - nx * nx - ny * ny))
            v = max(0.0, nx * L[0] + ny * 0.35 * L[1] + nz * L[2]) * 0.95 + 0.08
            px[x, y] = SHELL[min(len(SHELL) - 1, int(v * (len(SHELL) - 0.3)))] + (255,)
    # fibres, from the bottom up round the shell
    for _ in range(330):
        x0, y0 = BX + rnd.uniform(-BRX, BRX), BY + rnd.uniform(1, DEPTH)
        if not in_body(int(x0), int(y0)):
            continue
        u = (x0 - BX) / BRX
        colour = FIBRE_DARK if rnd.random() < 0.55 else FIBRE_LIGHT if u < 0.2 else SHELL[2]
        x, y = x0, y0
        for _ in range(rnd.randint(2, 5)):
            ix, iy = int(round(x)), int(round(y))
            if in_body(ix, iy):
                px[ix, iy] = colour + (255,)
            y -= 1
            x += u * 0.55

    # the cut edge: brown outside, white flesh, and the inside of the shell
    for y in range(BH):
        for x in range(BW):
            if not on_rim(x, y, BRX, BRY):
                continue
            if on_rim(x, y, BIX, BIY):
                dy = y + 0.5 - BY
                if dy < -BIY + 1.6:
                    px[x, y] = FLESH_SHADE + (255,)       # the flesh down the far wall
                elif dy < -1:
                    px[x, y] = CUT + (255,)               # the far wall, lit
                elif dy < 2:
                    px[x, y] = INSIDE[2] + (255,)
                else:
                    px[x, y] = INSIDE[1] + (255,)         # the bottom, in shade
            elif on_rim(x, y, BRX - 1.2, BRY - 0.9):
                px[x, y] = (FLESH if y + 0.5 >= BY - 1 else FLESH_SHADE) + (255,)
            else:
                px[x, y] = SHELL[3 if x < BX else 1] + (255,)

    # a one-pixel outline, round the shell but not the shadow
    solid = [[px[x, y][3] == 255 for x in range(BW)] for y in range(BH)]
    for y in range(BH):
        for x in range(BW):
            if solid[y][x]:
                continue
            if any(0 <= x + dx < BW and 0 <= y + dy < BH and solid[y + dy][x + dx]
                   for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                px[x, y] = OUTLINE + (255,)
    img.save(OUT_HALF, optimize=True)
    print(f'wrote {os.path.relpath(OUT_HALF, ROOT)} ({BW} x {BH})')
    print(f'const BOWL_CELL = [{BW}, {BH}];')
    print(f'const BOWL_RIM = [{BX}, {BY}, {BIX}, {BIY}];')
    print(f'const BOWL_EDGE = [{BRX}, {BRY}, {BY + DEPTH - 1}];')


if __name__ == '__main__':
    main()
    half()
