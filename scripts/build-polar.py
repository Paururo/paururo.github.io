#!/usr/bin/env python3
"""Polar, redrawn as pixel art from his character sheet.

Usage: python3 scripts/build-polar.py path/to/polar-character-sheet.png

1. Every pose is cut out of the sheet: the cream paper, the ground line under
   the feet and the shadows go; the paper between the legs opens up.
2. Closed eyes are redrawn whole (the eye ring is bare white skin, so a shut
   eye keeps its white ring, with a dark lid line across it).
3. In-between frames are drawn at full size: blinks, breaths, the squash
   before a hop and the stretch after it.
4. Everything is reduced to one pixel grid (1.5 sheet pixels per art pixel),
   mapped to one palette, cleaned of stray pixels and outlined once.
5. A walk is drawn on the standing pose: the legs step one foot at a time.
6. The sheet is written to assets/img/polar.png as an indexed PNG; the frame
   names it prints go in POLAR_POSES in js/polar.js.

The pose boxes below are where each bird sits in that particular sheet."""
import json, os, sys
from collections import deque
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
F = 1.5
src = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(float)
BG = np.array([253.0, 250.0, 243.0])
H, W, _ = src.shape
LUMW = np.array([0.299, 0.587, 0.114])

# every blob of ink on the paper, numbered
fg = np.abs(src - BG).sum(axis=2) > 40
lab = np.zeros((H, W), int)
n_lab = 0
for y0 in range(H):
    for x0 in np.nonzero(fg[y0] & (lab[y0] == 0))[0]:
        if lab[y0, x0]: continue
        n_lab += 1
        q = deque([(y0, x0)]); lab[y0, x0] = n_lab
        while q:
            cy, cx = q.popleft()
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = cy + dy, cx + dx
                if 0 <= ny < H and 0 <= nx < W and fg[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = n_lab; q.append((ny, nx))

BOXES = {
  'idle':  [(22, 157, 121, 281), (174, 154, 258, 280), (306, 152, 390, 280), (440, 152, 527, 280), (573, 153, 660, 280)],
  'walk':  [(716, 159, 834, 281), (830, 157, 951, 280), (945, 157, 1065, 280), (1057, 157, 1179, 281), (1169, 157, 1291, 281), (1288, 158, 1416, 281)],
  'hop':   [(26, 359, 138, 480), (146, 363, 259, 491), (275, 338, 382, 452), (401, 363, 519, 479), (532, 371, 652, 494)],
  'flap':  [(722, 369, 833, 495), (854, 357, 983, 494), (1009, 352, 1146, 494), (1162, 366, 1312, 495), (1304, 372, 1416, 495)],
  'chirp': [(24, 560, 134, 681), (151, 562, 261, 682), (279, 557, 389, 682), (408, 558, 518, 681), (540, 567, 650, 683)],
  'peck':  [(728, 562, 842, 680), (861, 592, 996, 679), (1014, 592, 1151, 679), (1169, 575, 1282, 680), (1293, 565, 1409, 680)],
  'preen': [(38, 757, 145, 878), (178, 757, 267, 878), (301, 757, 397, 878), (427, 757, 536, 879), (565, 754, 671, 878)],
  'sleep': [(753, 759, 855, 875), (891, 757, 983, 875), (1025, 757, 1118, 875), (1172, 762, 1270, 875), (1309, 763, 1406, 874)],
  'fly':   [(797, 910, 899, 1016), (904, 908, 1019, 1009), (1027, 925, 1147, 1007), (1168, 924, 1288, 1016), (1306, 908, 1425, 1005)],
}
CLOSED = {'idle3', 'hop3', 'preen1', 'preen2', 'preen3', 'preen4', 'preen5', 'sleep1', 'sleep2', 'sleep3', 'sleep4', 'sleep5'}

def shift(m, dy, dx):
    out = np.zeros_like(m)
    ys = slice(max(dy, 0), m.shape[0] + min(dy, 0)); yd = slice(max(-dy, 0), m.shape[0] + min(-dy, 0))
    xs = slice(max(dx, 0), m.shape[1] + min(dx, 0)); xd = slice(max(-dx, 0), m.shape[1] + min(-dx, 0))
    out[ys, xs] = m[yd, xd]
    return out
def dilate(m, r=1):
    for _ in range(r):
        m = m | shift(m, 1, 0) | shift(m, -1, 0) | shift(m, 0, 1) | shift(m, 0, -1)
    return m
def erode(m, r=1):
    for _ in range(r):
        m = m & shift(m, 1, 0) & shift(m, -1, 0) & shift(m, 0, 1) & shift(m, 0, -1)
    return m
def fill_holes(m):
    h, w = m.shape
    outside = np.zeros_like(m)
    stack = [(y, x) for y in range(h) for x in (0, w - 1)] + [(y, x) for x in range(w) for y in (0, h - 1)]
    while stack:
        y, x = stack.pop()
        if outside[y, x] or m[y, x]: continue
        outside[y, x] = True
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not outside[ny, nx] and not m[ny, nx]: stack.append((ny, nx))
    return ~outside
def blobs(mask):
    seen = np.zeros_like(mask); out = []
    for y, x in zip(*np.nonzero(mask)):
        if seen[y, x]: continue
        st = [(y, x)]; seen[y, x] = True; pts = []
        while st:
            cy, cx = st.pop(); pts.append((cy, cx))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < mask.shape[0] and 0 <= nx < mask.shape[1] and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True; st.append((ny, nx))
        out.append(np.array(pts))
    return out

# ---------------- 1. cut out ----------------
def cut(row, box):
    x0, y0, x1, y1 = box
    ids, counts = np.unique(lab[y0:y1 + 1, x0:x1 + 1], return_counts=True)
    cid = ids[ids > 0][np.argmax(counts[ids > 0])]
    pad = 6
    X0, Y0, X1, Y1 = max(0, x0 - pad), max(0, y0 - pad), min(W, x1 + pad + 1), min(H, y1 + pad + 1)
    crop = src[Y0:Y1, X0:X1]
    comp = lab[Y0:Y1, X0:X1] == cid
    lum = crop @ LUMW
    diff = np.abs(crop - BG).sum(axis=2)
    ground = np.zeros_like(comp)
    if row != 'fly':
        # the ground line: rows near the bottom whose light pixels reach past the dark feet
        ys, xs = np.nonzero(comp); bot = ys.max()
        top_ground = None
        for y in range(bot - 12, bot + 1):
            dk = np.nonzero(comp[y] & (lum[y] < 110))[0]
            lt = np.nonzero(comp[y] & (lum[y] > 135))[0]
            if len(lt) == 0: continue
            beyond = len(lt) if len(dk) == 0 else ((lt < dk.min()) | (lt > dk.max())).sum()
            if beyond >= 5: top_ground = y if top_ground is None else top_ground; 
        if top_ground is not None:
            ground[top_ground:] = comp[top_ground:] & (lum[top_ground:] > 135)
    core = fill_holes(comp & ~ground)
    ys_, xs_ = np.nonzero(core); top_, bot_ = ys_.min(), ys_.max()
    # pupils: round, solid dark blobs (toe outlines are thin and long)
    pupils = np.zeros_like(core)
    for q in blobs((lum < 40) & core):
        hq, wq = np.ptp(q[:, 0]) + 1, np.ptp(q[:, 1]) + 1
        if 25 <= len(q) <= 220 and 5 <= hq <= 15 and 5 <= wq <= 15 and 0.6 <= hq / wq <= 1.6 and len(q) / (hq * wq) > 0.5:
            pupils[q[:, 0], q[:, 1]] = True
    near_pupil = dilate(pupils, 3)
    for p in blobs(core & ~comp & (lum > 228)):
        py, px = p[:, 0], p[:, 1]
        if py.mean() < top_ + 0.55 * (bot_ - top_): continue
        y0, x0 = py.min(), px.min(); y1, x1 = py.max(), px.max()
        # round a pupil it is an eye (the head is low when he pecks): keep it
        if near_pupil[py, px].any(): continue
        core[py, px] = False
    # a soft edge, un-blended from the paper; nothing light below the feet
    band = dilate(core, 2) & ~core & ~ground
    if ground.any():
        band &= ~((lum > 135) & (np.arange(core.shape[0])[:, None] >= np.nonzero(ground.any(axis=1))[0].min() - 1))
    alpha = np.where(core, 1.0, np.where(band, np.clip(diff / 380.0, 0, 1), 0.0))
    a3 = np.maximum(alpha, 1e-3)[..., None]
    rgb = np.where(((alpha > 0) & ~core)[..., None], np.clip((crop - (1 - a3) * BG) / a3, 0, 255), crop)
    return rgb, alpha

# which way he looks: the beak against the middle of the body
def facing(rgb, alpha):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    red = (r > 150) & (g < 110) & (b < 110) & (alpha > 0.5)
    ys, xs = np.nonzero(alpha > 0.5)
    if not red.any(): return 'front'
    rx, cx, span = np.nonzero(red)[1].mean(), xs.mean(), xs.max() - xs.min()
    return 'right' if rx >= cx else 'left'

CW, CH, BASE, MID = 176, 160, 152, 88
names, cells = [], []
for row, boxes in BOXES.items():
    for i, box in enumerate(boxes):
        rgb, alpha = cut(row, box)
        if facing(rgb, alpha) == 'left':
            rgb, alpha = rgb[:, ::-1], alpha[:, ::-1]
        m = alpha > 0.5
        ys, xs = np.nonzero(m)
        top, bottom = ys.min(), ys.max()
        # line poses up by the middle of the torso (rows 35-72% of the bird):
        # the tail and wing tips that reach the ground no longer shift them
        band_ = (ys >= top + 0.35 * (bottom - top)) & (ys <= top + 0.72 * (bottom - top))
        fx = xs[band_].mean() if row != 'fly' and f'{row}{i + 1}' != 'hop3' else (xs.min() + xs.max()) / 2
        ox, oy = int(round(MID - fx)), int(round(BASE - bottom))
        cell = np.zeros((CH, CW, 4))
        h, w = alpha.shape
        ty0, tx0 = max(0, oy), max(0, ox)
        sy0, sx0 = ty0 - oy, tx0 - ox
        hh, ww = min(h - sy0, CH - ty0), min(w - sx0, CW - tx0)
        cell[ty0:ty0 + hh, tx0:tx0 + ww, :3] = rgb[sy0:sy0 + hh, sx0:sx0 + ww]
        cell[ty0:ty0 + hh, tx0:tx0 + ww, 3] = alpha[sy0:sy0 + hh, sx0:sx0 + ww]
        clipped = (h - sy0 > hh and alpha[sy0 + hh:].max() > 0) or (w - sx0 > ww and alpha[:, sx0 + ww:].max() > 0) or (sy0 > 0 and alpha[:sy0].max() > 0) or (sx0 > 0 and alpha[:, :sx0].max() > 0)
        if clipped: print('CLIPPED', row, i + 1)
        names.append(f'{row}{i + 1}'); cells.append(cell)
C = dict(zip(names, cells))

# ---------------- 2. eyes ----------------
WHITE = np.array([248, 245, 236.]); SHADE = np.array([222, 216, 202.])
RIM = np.array([60, 44, 32.]); LID = np.array([40, 28, 20.])
def is_red(rgb): return (rgb[..., 0] > 120) & (rgb[..., 0] > rgb[..., 1] * 1.8) & (rgb[..., 0] > rgb[..., 2] * 1.8)
def find_closed_eye(c):
    rgb, a = c[..., :3], c[..., 3] > 0.5
    lum = rgb @ LUMW
    ys, xs = np.nonzero(a); top, bot = ys.min(), ys.max()
    upper = np.zeros_like(a); upper[top:int(top + 0.66 * (bot - top))] = True
    inner = erode(a, 4)
    nr = dilate(is_red(rgb) & a, 2)
    ring = [p for p in blobs((lum > 215) & inner & upper & ~nr) if 25 <= len(p) <= 400]
    if ring:
        p = max(ring, key=len); return float(p[:, 1].mean()) + 0.5, float(p[:, 0].mean()) + 0.5, 'ring'
    arcs = [p for p in blobs((lum < 80) & inner & upper & ~nr) if len(p) >= 6]
    arcs = [p for p in arcs if np.ptp(p[:, 0]) <= 8 and 7 <= np.ptp(p[:, 1]) <= 24]
    def headish(p):
        m = np.zeros_like(a); m[p[:, 0], p[:, 1]] = True
        ring_ = dilate(m, 3) & ~dilate(m, 1) & a
        r_, g_, b_ = rgb[..., 0][ring_], rgb[..., 1][ring_], rgb[..., 2][ring_]
        return ((r_ > g_) & (r_ > b_ + 20)).mean() > 0.6
    arcs = [p for p in arcs if headish(p)]
    if arcs:
        p = max(arcs, key=lambda q: np.ptp(q[:, 1])); return float(p[:, 1].mean()) + 0.5, float(p[:, 0].mean()) - 0.5, 'arc'
    return None
def draw_closed_eye(c, cx, cy, rx=8.2, ry=7.4):
    ys, xs = np.mgrid[0:c.shape[0], 0:c.shape[1]]
    d = ((xs + 0.5 - cx) / rx) ** 2 + ((ys + 0.5 - cy) / ry) ** 2
    body = c[..., 3] > 0.5
    c[(d > 1) & (d <= 1.5) & body, :3] = RIM
    disc = (d <= 1) & body
    c[disc, :3] = WHITE
    c[disc & (ys + 0.5 > cy + ry * 0.55), :3] = SHADE
    span = rx - 1.6
    for dx in np.arange(-span, span + 0.01, 0.25):
        y = cy + 1.4 * (1 - (dx / span) ** 2) - 0.6
        for t in (0.0, 1.2):
            yy, xx = int(np.floor(y + t)), int(np.floor(cx + dx))
            if body[yy, xx]: c[yy, xx, :3] = LID
def find_open_eyes(c, n):
    rgb, a = c[..., :3], c[..., 3] > 0.5
    lum = rgb @ LUMW
    ys, xs = np.nonzero(a); top, bot = ys.min(), ys.max()
    upper = np.zeros_like(a); upper[top:int(top + 0.66 * (bot - top))] = True
    white = (lum > 200) & a
    cand = []
    for p in blobs((lum < 70) & erode(a, 3) & upper):
        if len(p) < 30: continue
        y0, x0 = p.min(0); y1, x1 = p.max(0)
        if not (6 <= x1 - x0 + 1 <= 14 and 6 <= y1 - y0 + 1 <= 14): continue
        ring = white[max(0, y0 - 5):y1 + 6, max(0, x0 - 5):x1 + 6].sum()
        if ring >= 20: cand.append((len(p), float(p[:, 1].mean()) + 0.5, float(p[:, 0].mean()) + 0.5, max(x1 - x0, y1 - y0) + 1))
    cand.sort(reverse=True)
    return cand[:2] if n in ('idle2', 'idle4') else cand[:1]
def blink(c, n, stage):
    c = c.copy()
    for _, cx, cy, size in find_open_eyes(C[n], n):
        R = size / 2 + 1.2
        ys, xs = np.mgrid[0:c.shape[0], 0:c.shape[1]]
        inside = ((xs + 0.5 - cx) ** 2 + (ys + 0.5 - cy) ** 2 <= R * R) & (c[..., 3] > 0.5)
        if stage == 'half': inside &= (ys + 0.5) < cy + 0.5
        c[inside, :3] = WHITE
        span = R + 0.8
        for dx in np.arange(-span, span + 0.01, 0.25):
            bow = 1.3 * (1 - (dx / span) ** 2) if stage == 'shut' else 0.3 * (1 - (dx / span) ** 2)
            y = (cy + bow - 0.4) if stage == 'shut' else (cy + bow)
            for t in (0.0, 1.2):
                yy, xx = int(np.floor(y + t)), int(np.floor(cx + dx))
                if c[yy, xx, 3] > 0.5: c[yy, xx, :3] = LID
    return c
eye_log = {}
for n in names:
    if n in CLOSED:
        e = {'preen4': (109.5, 67.0, 'by hand')}.get(n) or find_closed_eye(C[n])
        eye_log[n] = e
        if e: draw_closed_eye(C[n], e[0], e[1])

# small repairs: a stray white mark on the crown in one flight pose
def repaint(c, box, cond):
    x0, y0, x1, y1 = box
    rgb = c[..., :3]; a = c[..., 3] > 0.5
    lum = rgb @ LUMW
    bad = np.zeros_like(a); bad[y0:y1, x0:x1] = cond(lum[y0:y1, x0:x1]) & a[y0:y1, x0:x1]
    good = a & ~bad
    for y, x in zip(*np.nonzero(bad)):
        for r in range(1, 6):
            win = good[max(0, y - r):y + r + 1, max(0, x - r):x + r + 1]
            if win.sum() >= 4:
                c[y, x, :3] = np.median(rgb[max(0, y - r):y + r + 1, max(0, x - r):x + r + 1][win], axis=0)
                break
repaint(C['fly4'], (113, 60, 133, 71), lambda l: l > 140)

# ---------------- 3. in-betweens ----------------
def stretch(c, rows, at):
    """Taller (rows > 0) or shorter by a few rows through the chest; feet stay put."""
    a = c[..., 3] > 0.5
    ys, _ = np.nonzero(a); top, bot = ys.min(), ys.max()
    y = int(top + at * (bot - top))
    if rows > 0:
        out = np.concatenate([c[rows:y + 1], np.repeat(c[y:y + 1], rows, axis=0), c[y + 1:]])[:c.shape[0]]
        out = np.concatenate([c[:0], out])
        res = np.zeros_like(c); res[:y + 1 - rows] = c[rows:y + 1]; res[y + 1 - rows:y + 1] = np.repeat(c[y:y + 1], rows, axis=0); res[y + 1:] = c[y + 1:]
        return res
    k = -rows
    res = np.zeros_like(c); res[k:y + 1] = c[:y + 1 - k]; res[y + 1:] = c[y + 1:]
    # the rows lost above the cut: drop the ones just above it
    return res
extra = {
    'idle1Half': blink(C['idle1'], 'idle1', 'half'),
    'idle1Shut': blink(C['idle1'], 'idle1', 'shut'),
    'idle2Half': blink(C['idle2'], 'idle2', 'half'),
    'idle2Shut': blink(C['idle2'], 'idle2', 'shut'),
    'idle1Breath': stretch(C['idle1'], 2, 0.62),
    'sleep4Breath': stretch(C['sleep4'], 2, 0.58),
    'hopSquash': stretch(C['hop1'], -5, 0.58),
    'hopStretch': stretch(C['hop2'], 5, 0.58),
}
order = names + list(extra)
C.update(extra)

# ---------------- 4. pixels ----------------
cw, ch = round(CW / F), round(CH / F)
def reduce(c):
    a = c[..., 3:4]
    pm = np.concatenate([c[..., :3] * a, a], axis=2)
    img = Image.fromarray(np.clip(pm, 0, 255).astype(np.uint8) if False else (pm * np.array([1, 1, 1, 255])).clip(0, 255).astype(np.uint8))
    small = np.asarray(img.resize((cw, ch), Image.BOX)).astype(float)
    al = small[..., 3] / 255
    rgb = np.where(al[..., None] > 0.01, small[..., :3] / np.maximum(al[..., None], 1e-3), 0)
    return np.clip(rgb, 0, 255), al
small = {n: reduce(C[n]) for n in order}
pts = np.concatenate([rgb[al > 0.5] for rgb, al in small.values()])
rng = np.random.default_rng(11)
K = 48
cent = pts[rng.choice(len(pts), K, replace=False)].copy()
for _ in range(30):
    d = ((pts[:, None, :] - cent[None]) ** 2).sum(-1)
    lb = d.argmin(1)
    for k in range(K):
        sel = pts[lb == k]
        if len(sel): cent[k] = sel.mean(0)
OUTLINE = np.array([38, 27, 19.])
pal = np.vstack([cent, OUTLINE])
plum = pal @ LUMW
OI = len(pal) - 1

def clean(rgb, al):
    m = al > 0.5
    # lone opaque pixels go, pinholes close
    nb = sum(shift(m, dy, dx).astype(int) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx)
    m = (m & (nb >= 2)) | (~m & (nb >= 7))
    idx = ((rgb[..., None, :] - pal[None, None]) ** 2).sum(-1).argmin(-1)
    idx[~m] = -1
    h, w = idx.shape
    # stray pixels unlike all four neighbours take the local majority (eyes kept)
    for _ in range(2):
        new = idx.copy()
        for y in range(1, h - 1):
            for x in range(1, w - 1):
                c = idx[y, x]
                if c < 0 or plum[c] > 200 or plum[c] < 50: continue
                n4 = (idx[y - 1, x], idx[y + 1, x], idx[y, x - 1], idx[y, x + 1])
                if c in n4: continue
                n8 = [idx[y + dy, x + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dy or dx) and idx[y + dy, x + dx] >= 0]
                if n8:
                    vals, cnt = np.unique(n8, return_counts=True)
                    if cnt.max() >= 4: new[y, x] = vals[cnt.argmax()]
        idx = new
    # one outline, on the silhouette's own edge
    op = idx >= 0
    edge = op & ~erode(op, 1)
    # a dark pixel just inside the new outline would double it: it takes its inner neighbour's colour
    inner_ring = op & ~edge & dilate(edge, 1)
    for y, x in zip(*np.nonzero(inner_ring)):
        c = idx[y, x]
        if plum[c] >= 70: continue
        # not the eye: no eye white nearby
        win = idx[max(0, y - 3):y + 4, max(0, x - 3):x + 4]
        if (plum[win[win >= 0]] > 205).any(): continue
        ring2 = [idx[y + dy, x + dx] for dy in (-2, -1, 0, 1, 2) for dx in (-2, -1, 0, 1, 2)
                 if 0 <= y + dy < h and 0 <= x + dx < w and idx[y + dy, x + dx] >= 0 and not edge[y + dy, x + dx] and plum[idx[y + dy, x + dx]] >= 70]
        if ring2:
            vals, cnt = np.unique(ring2, return_counts=True)
            idx[y, x] = vals[cnt.argmax()]
    idx[edge] = OI
    return idx

frames = []
for n in order:
    idx = clean(*small[n])
    out = np.zeros((ch, cw, 4), np.uint8)
    op = idx >= 0
    out[op, :3] = pal[idx[op]].round().astype(np.uint8)
    out[op, 3] = 255
    if out[0].any() or out[-1].any() or out[:, 0].any() or out[:, -1].any(): print('TOUCHES EDGE', n)
    frames.append(out)
sheet = np.concatenate(frames, axis=1)
meta = {'cell': [cw, ch], 'feet': [MID / F, BASE / F], 'frames': order, 'palette': pal.round().astype(int).tolist()}

# ---------------- 5. a walk, drawn on the standing pose ----------------
OUT = np.array([38, 27, 19, 255], np.uint8)
names = meta['frames']
def cell(n): k = names.index(n); return sheet[:, k * cw:(k + 1) * cw].copy()

base = cell('idle1')
a = base[..., 3] > 0
rgb = base[..., :3].astype(int)
sat = rgb.max(2) - rgb.min(2)
lum = rgb @ np.array([0.299, 0.587, 0.114])
ys, xs = np.nonzero(a); bot = ys.max()
# the belly line: the lowest coloured (feathered) pixel in each column
belly = np.full(cw, -1)
for x in range(cw):
    col = np.nonzero(a[:, x] & (sat[:, x] >= 35))[0]
    if len(col): belly[x] = col.max()
# leg pixels: grey, dark or outline, below the belly line and its outline
leg = np.zeros_like(a)
for x in range(cw):
    for y in range(max(belly[x] + 2, bot - 16), ch):
        if a[y, x] and sat[y, x] < 45: leg[y, x] = True
# keep only what hangs from the bottom: the two legs
lab = np.zeros(leg.shape, int); comps = []
for y0, x0 in zip(*np.nonzero(leg)):
    if lab[y0, x0]: continue
    st = [(y0, x0)]; lab[y0, x0] = len(comps) + 1; pts = []
    while st:
        y, x = st.pop(); pts.append((y, x))
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < ch and 0 <= nx < cw and leg[ny, nx] and not lab[ny, nx]: lab[ny, nx] = len(comps) + 1; st.append((ny, nx))
    comps.append(np.array(pts))
comps = [c for c in comps if len(c) >= 12 and c[:, 0].max() >= bot - 2]
comps.sort(key=lambda c: c[:, 1].mean())
assert len(comps) >= 2, 'need two legs'
back, front = comps[0], comps[-1]
if len(comps) > 2:   # a leg in more than one piece: nearest wins
    for c in comps[1:-1]:
        (back if abs(c[:, 1].mean() - back[:, 1].mean()) < abs(c[:, 1].mean() - front[:, 1].mean()) else front)
def sprite(c):
    y0, x0 = c.min(0); y1, x1 = c.max(0)
    s = np.zeros((y1 - y0 + 1, x1 - x0 + 1, 4), np.uint8)
    s[c[:, 0] - y0, c[:, 1] - x0] = base[c[:, 0], c[:, 1]]
    return s, (int(x0), int(y0))
back_s, back_at = sprite(back)
front_s, front_at = sprite(front)
# the body alone: legs gone, the belly's bottom edge outlined again
body = base.copy()
for c in (back, front): body[c[:, 0], c[:, 1]] = 0
op = body[..., 3] > 0
for x in range(cw):
    col = np.nonzero(op[:, x])[0]
    if len(col) and not (body[col.max(), x, :3] == OUT[:3]).all() and col.max() + 1 < ch:
        body[col.max() + 1, x] = OUT
def blit(dst, s, at, dx, dy):
    x0, y0 = at[0] + dx, at[1] + dy
    h, w = s.shape[:2]
    for yy in range(h):
        for xx in range(w):
            if s[yy, xx, 3] and 0 <= y0 + yy < ch and 0 <= x0 + xx < cw: dst[y0 + yy, x0 + xx] = s[yy, xx]
def lifted(s):
    """A foot in the air: toes curled up by one row, claws tucked."""
    t = s.copy()
    h = t.shape[0]
    low = t[h - 2:].copy()
    t[h - 2:] = 0
    t[h - 3:h - 1] = np.where(low[..., 3:4] > 0, low, t[h - 3:h - 1])
    return t
# four frames: each foot planted for three, in the air for one, half a cycle apart
PLAN = [  # (back dx, back up, front dx, front up, body up)
    (+2, 0, -2, 0, 0),
    (0, 0, 0, 2, 1),
    (-2, 0, +2, 0, 0),
    (0, 2, 0, 0, 1),
]
frames = []
for bdx, bup, fdx, fup, lift in PLAN:
    f = np.zeros_like(base)
    blit(f, lifted(back_s) if bup else back_s, back_at, bdx, -bup)
    blit(f, lifted(front_s) if fup else front_s, front_at, fdx, -fup)
    # the body on top, a pixel higher while a foot is in the air
    b = np.roll(body, -lift, axis=0) if lift else body
    f[b[..., 3] > 0] = b[b[..., 3] > 0]
    frames.append(f)
# into the sheet in place of the old walk frames
keep = [n for n in names if not n.startswith('walk')]
cells = {n: cell(n) for n in keep}
new_names = []
for n in names:
    if n.startswith('walk'):
        if n == 'walk1':
            for i, f in enumerate(frames): cells[f'walk{i + 1}'] = f; new_names.append(f'walk{i + 1}')
        continue
    new_names.append(n)
sheet = np.concatenate([cells[n] for n in new_names], axis=1)
meta['frames'] = new_names

# ---------------- 6. into the site, as an indexed PNG ----------------
pal_ = [tuple(c) for c in meta['palette']]
op = sheet[..., 3] > 0
lut = {c: i + 1 for i, c in enumerate(pal_)}
idx = np.zeros(sheet.shape[:2], np.uint8)
idx[op] = [lut[tuple(int(v) for v in c)] for c in sheet[op][:, :3]]
im = Image.frombytes('P', (idx.shape[1], idx.shape[0]), idx.tobytes())
flat = [0, 0, 0] + [v for c in pal_ for v in c]
im.putpalette(flat + [0] * (768 - len(flat)))
dst = os.path.join(ROOT, 'assets', 'img', 'polar.png')
im.save(dst, transparency=0, optimize=True)
print(f"wrote {os.path.relpath(dst, ROOT)}: {len(meta['frames'])} poses of {meta['cell'][0]} x {meta['cell'][1]}, feet at {[round(v, 2) for v in meta['feet']]}")
print('POLAR_POSES =', json.dumps(meta['frames']))
