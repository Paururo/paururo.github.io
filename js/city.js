// ============================================================
// The tools as a voxel city, Valencia. The sequencer sends reads down its cables
// to BAMpiro, the central station, and from there a railway line runs to each
// question, with a building for the tool that answers it. A yellow bus goes
// east to Sagunt, where the papers I led are, and a tram west to Paterna, where
// I work. Built of small blocks, drawn in 3D and shown at a low resolution, in
// crisp pixels. Point at a building to light it up, press it for its ticket;
// drag, or use the arrows, to turn the city round and to look at it from higher
// up or lower down.
// ============================================================
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.min.js';

const P = {
  grass: '#8CC279', grass2: '#7FB86C', grass3: '#9ACC87', turf: '#6F9E59', dirt: '#9C7650', dirt2: '#84613F', pebble: '#B4A48D',
  pave: '#DAD6CB', pave2: '#CFCBBF', pave3: '#C3BEB1', water: '#6BB6D6', water2: '#58A4C8', water3: '#8FCCE4', lily: '#5C9E48',
  sleeper: '#7E6048', ballast: '#A49F96', ballast2: '#948F86',
  red: '#D0503F', blue: '#3F6FC4', green: '#3E9B5A', ochre: '#E0A030', plum: '#8B6BB0',
  white: '#F2EFE8', white2: '#E4DFD4', cream: '#E9DFC6', cream2: '#DACDAE', brick: '#C4674F', brick2: '#B25A44', brick3: '#9C4C3A',
  stone: '#B7B2A6', stone2: '#A29D91', glass: '#A9CFE3', frame: '#59616A', dark: '#3A3F46', screen: '#1F2A30',
  wood: '#9C6B43', wood2: '#83573A', plank: '#B98A5C', roof: '#6E5A4E', roof2: '#5F4D42',
  leaf: '#56A452', leaf2: '#468F45', leaf3: '#6CB85E', pine: '#3E7E4B', pine2: '#336B3F',
  trunk: '#7A5436', skin: '#F0C8A0', hair: '#4A3426', steel: '#8D949C', steel2: '#747B84', black: '#26292D', light: '#FFE38A',
  // Sagunt and its port
  tapial: '#D8C39A', tapial2: '#C8B089', dry: '#A9A25E', dry2: '#9A9451', dry3: '#B9B374', tile: '#C2653E', tile2: '#AA5533',
  sand: '#EBD9A9', sand2: '#E1CC98', sea: '#4F9CC8', sea2: '#3F8BBA', sea3: '#72B6DB', foam: '#E9F3F7', deep: '#2E6B98',
  rust: '#8A5236', rust2: '#6E4230', iron: '#4B5159', asphalt: '#5D6067', asphalt2: '#66696F', orange: '#F28C28', bus: '#F4C430',
};
const LINES = { red: P.red, blue: P.blue, green: P.green, ochre: P.ochre, plum: P.plum };
const BASES = ['#6BD88E', '#FF7A6B', '#7FA8FF', '#FFD166'];
const BASE = { A: BASES[0], C: BASES[1], G: BASES[2], T: BASES[3] };
const FLOWERS = ['#F7F3EA', '#F5D35B', '#F29BB4', '#B9A3E3'];
const esc = (x) => String(x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// a colour a little darker (k < 1) or lighter
const shade = (hex, k) => '#' + [1, 3, 5].map(i => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * k))).toString(16).padStart(2, '0')).join('');
// a number in [0, 1) for each block, the same every time
function hash(x, y, z) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1440662683)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// a colour with a few blocks of other shades in it: tone(base, [other, share], ...)
const tone = (base, ...others) => (x, y, z) => {
  let r = hash(x, y, z);
  for (const [c, p] of others) { if (r < p) return c; r -= p; }
  return base;
};

// A railway route through the middle of the given blocks (units of the scene), each
// corner turned on an arc of radius R, measured along its length
function routeOf(pts, R = 2.5) {
  const c = pts.map(([x, z]) => [x + 0.75, z + 0.75]);
  const out = [c[0]];
  for (let i = 1; i < c.length - 1; i++) {
    const [px, pz] = c[i - 1], [x, z] = c[i], [nx, nz] = c[i + 1];
    const d1 = [Math.sign(x - px), Math.sign(z - pz)], d2 = [Math.sign(nx - x), Math.sign(nz - z)];
    const ox = x - d1[0] * R + d2[0] * R, oz = z - d1[1] * R + d2[1] * R;          // the centre of the arc
    const t0 = Math.atan2(-d2[1], -d2[0]);
    let dt = Math.atan2(d1[1], d1[0]) - t0;
    if (dt > Math.PI) dt -= 2 * Math.PI;
    if (dt < -Math.PI) dt += 2 * Math.PI;
    for (let k = 0; k <= 16; k++) { const t = t0 + dt * k / 16; out.push([ox + Math.cos(t) * R, oz + Math.sin(t) * R]); }
  }
  out.push(c[c.length - 1]);
  const len = [0];
  for (let i = 1; i < out.length; i++) len.push(len[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
  return { pts: out, len, L: len[len.length - 1] };
}
// the point `u` along a route; past either end it runs straight on
function pointOn(r, u) {
  const n = r.pts.length;
  const i = u <= 0 ? 1 : u >= r.L ? n - 1 : r.len.findIndex(l => l >= u);
  const [a, b] = [r.pts[i - 1], r.pts[i]], f = (u - r.len[i - 1]) / (r.len[i] - r.len[i - 1]);
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}

// a road from `start` along legs: ['to', x, z] runs straight there, ['turn', cx, cz, angle]
// turns round a centre by an angle; measured along its length like a railway route
function pathOf(start, legs) {
  const pts = [start];
  let [x, z] = start;
  for (const leg of legs) {
    if (leg[0] === 'to') { [x, z] = [leg[1], leg[2]]; pts.push([x, z]); continue; }
    const [, cx, cz, turn] = leg, r = Math.hypot(x - cx, z - cz), t0 = Math.atan2(z - cz, x - cx);
    const n = Math.max(4, Math.ceil(Math.abs(turn) * r * 4));
    for (let k = 1; k <= n; k++) { const t = t0 + turn * k / n; pts.push([cx + Math.cos(t) * r, cz + Math.sin(t) * r]); }
    [x, z] = pts[pts.length - 1];
  }
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, len, L: len[len.length - 1] };
}

// ---- a board of blocks, and the ways to build on it ----
// Two blocks to a unit of the scene, so a board is 148 blocks by 96. A building
// is filled solid (only the blocks that can be seen become meshes), then carved
// and trimmed: windows sit a block deep over a sill, roofs step up a block at a time.
function makeBoard(W = 148, D = 96) {
  const S = 2, LOW = 8, H = 64;
  const n = W * D * H;
  const cells = new Uint16Array(n), tagOf = new Uint8Array(n), glowOf = new Uint8Array(n), partOf = new Uint8Array(n);
  const colors = [null], colorIds = new Map(), tagNames = [''], tagIds = new Map([['', 0]]);
  const inside = (x, y, z) => x >= 0 && x < W && z >= 0 && z < D && y >= -LOW && y < H - LOW;
  const at = (x, y, z) => ((y + LOW) * D + z) * W + x;
  let part = 0;
  function put(x, y, z, c, tag = '', glow = false) {
    if (!inside(x, y, z)) return;
    const col = typeof c === 'function' ? c(x, y, z) : c;
    let id = colorIds.get(col);
    if (id === undefined) { id = colors.length; colors.push(col); colorIds.set(col, id); }
    let t = tagIds.get(tag);
    if (t === undefined) { t = tagNames.length; tagNames.push(tag); tagIds.set(tag, t); }
    const i = at(x, y, z);
    cells[i] = id; tagOf[i] = t; glowOf[i] = glow === 2 ? 2 : glow ? 1 : 0; partOf[i] = part;
  }
  // what is built in fn belongs to part k (a wall that can be taken away, and what hangs on it)
  const inPart = (k, fn) => { part = k; fn(); part = 0; };
  const colorAt = (x, y, z) => (inside(x, y, z) ? colors[cells[at(x, y, z)]] : null);
  const del = (x, y, z) => { if (inside(x, y, z)) cells[at(x, y, z)] = 0; };
  const fill = (x0, y0, z0, w, h, d, c, tag = '', glow = false) => {
    for (let x = x0; x < x0 + w; x++) for (let y = y0; y < y0 + h; y++) for (let z = z0; z < z0 + d; z++) put(x, y, z, c, tag, glow);
  };
  const ground = (x0, z0, w, d, c) => { for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) put(x, -1, z, c); };
  const isGrass = (x, z) => [P.grass, P.grass2, P.grass3].includes(colorAt(x, -1, z));

  // a building's block, and its faces: along a face, up it and into it (-1 is just outside)
  const block = (x0, z0, x1, z1, y0, y1, c, tag) => { fill(x0, y0, z0, x1 - x0 + 1, y1 - y0 + 1, z1 - z0 + 1, c, tag); return { x0, z0, x1, z1, y0, y1, tag }; };
  const side = (b, f) => ({
    S: (a, y, d = 0) => [a, y, b.z1 - d], N: (a, y, d = 0) => [a, y, b.z0 + d],
    E: (a, y, d = 0) => [b.x1 - d, y, a], W: (a, y, d = 0) => [b.x0 + d, y, a],
  })[f];
  const span = (b, f) => (f === 'S' || f === 'N' ? [b.x0, b.x1] : [b.z0, b.z1]);
  // colour a patch of a face, `d` blocks in (-1 stands proud of it); paint(i, j) gives [colour, glow]
  function paint(b, f, a0, y0, w, h, fn, d = 0) {
    const s = side(b, f);
    for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) { const r = fn(i, j); if (r) put(...s(a0 + i, y0 + j, d), r[0], b.tag, r[1]); }
  }
  // an opening `deep` blocks deep, with something at the back of it
  function recess(b, f, a0, y0, w, h, fn, deep = 1) {
    const s = side(b, f);
    for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
      for (let d = 0; d < deep; d++) del(...s(a0 + i, y0 + j, d));
      const r = fn(i, j);
      put(...s(a0 + i, y0 + j, deep), r[0], b.tag, r[1]);
    }
  }
  const flat = (c, glow = false) => () => [c, glow];
  // a window: glass a block in, a sill under it, a bar across a big one
  function windowIn(b, f, a0, y0, w, h, { glass = P.glass, glow = true, sill = P.stone, bars = false } = {}) {
    recess(b, f, a0, y0, w, h, (i, j) => (bars && ((w > 2 && i === w >> 1) || (h > 3 && j === h >> 1)) ? [P.frame, false] : [glass, glow]));
    if (sill) paint(b, f, a0, y0 - 1, w, 1, flat(sill), -1);
  }
  // windows spaced evenly along faces; skip(face, a) leaves a place out
  function windows(b, faces, y0, w, h, step, opts = {}) {
    for (const f of faces) {
      const [lo, hi] = span(b, f), L = hi - lo + 1;
      const n = Math.floor((L - 2 - w) / step) + 1, m = lo + Math.floor((L - ((n - 1) * step + w)) / 2);
      for (let i = 0; i < n; i++) { const a = m + i * step; if (!opts.skip || !opts.skip(f, a)) windowIn(b, f, a, y0, w, h, opts); }
    }
  }
  // a ledge all round, `out` blocks proud of the walls
  function ledge(b, y, c, out = 1) {
    for (let x = b.x0 - out; x <= b.x1 + out; x++) for (let z = b.z0 - out; z <= b.z1 + out; z++)
      if (x < b.x0 || x > b.x1 || z < b.z0 || z > b.z1) put(x, y, z, c, b.tag);
  }
  // corner stones, every other pair of blocks up each corner
  function quoins(b, c) {
    for (let y = b.y0; y <= b.y1; y++) if ((y - b.y0) % 4 < 2) for (const [x, z] of [[b.x0, b.z0], [b.x1, b.z0], [b.x0, b.z1], [b.x1, b.z1]]) put(x, y, z, c, b.tag);
  }
  // a pitched roof: the ridge along x or z, `run` blocks in for each block up, the gable ends in `wall`
  function pitched(b, y0, along, c, wall, { over = 1, run = 1 } = {}) {
    const [a0, a1] = along === 'x' ? [b.x0 - over, b.x1 + over] : [b.z0 - over, b.z1 + over];
    const [e0, e1] = along === 'x' ? [b.x0, b.x1] : [b.z0, b.z1];
    const [c0, c1] = along === 'x' ? [b.z0 - over, b.z1 + over] : [b.x0 - over, b.x1 + over];
    for (let k = 0; c0 + k * run <= c1 - k * run; k++) {
      const lo = c0 + k * run, hi = c1 - k * run, top = lo + run > hi - run;
      for (let a = a0; a <= a1; a++) for (let q = lo; q <= hi; q++) {
        const edge = top || q < lo + run || q > hi - run;
        if (!edge && (a < e0 || a > e1)) continue;                   // only the eaves reach past the gables
        const [x, z] = along === 'x' ? [a, q] : [q, a];
        put(x, y0 + k, z, edge ? c : wall, b.tag);
      }
    }
  }
  // a rounded clump: leaves, a bush, rocks; centres may fall between blocks
  function clump(cx, cy, cz, rx, ry, rz, c, tag = '', rough = 0.35) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++) {
      const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 + ((z + 0.5 - cz) / rz) ** 2;
      if (d <= 1 + (hash(x, y, z) - 0.5) * rough) put(x, y, z, c, tag);
    }
  }


  // the board itself: grass over a turf edge and layers of earth
  function lawn() {
    const grass = tone(P.grass, [P.grass2, 0.16], [P.grass3, 0.05]);
    const earth = tone(P.dirt, [P.dirt2, 0.12], [P.pebble, 0.05]);
    const deep = tone(P.dirt2, [P.dirt, 0.1], [P.pebble, 0.04]);
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
      put(x, -1, z, grass); put(x, -2, z, P.turf);
      put(x, -3, z, earth); put(x, -4, z, earth); put(x, -5, z, deep); put(x, -6, z, deep);
    }
  }

  // railway track: two rails either side of a stripe in the line's colour, sleeper ends peeping out,
  // round the curves as well as along the straights
  const ballast = tone(P.ballast, [P.ballast2, 0.35]);
  function lay(route, color, from, to) {
    const mid = new Map(), rails = new Set(), ends = new Set();
    for (let k = 0; from + k * 0.05 <= to + 1e-6; k++) {
      const u = from + k * 0.05, [x, z] = pointOn(route, u), [x2, z2] = pointOn(route, u + 0.01);
      const l = Math.hypot(x2 - x, z2 - z) || 1, tx = (x2 - x) / l, tz = (z2 - z) / l;
      const cell = (o) => `${Math.floor((x - tz * o) * 2)},${Math.floor((z + tx * o) * 2)}`;   // o across the track
      mid.set(cell(0), Math.abs(tx) > Math.abs(tz) ? 'x' : 'z');
      rails.add(cell(0.5)); rails.add(cell(-0.5));
      if (k % 20 === 0) { ends.add(cell(1)); ends.add(cell(-1)); }
    }
    for (const k of ends) if (!mid.has(k) && !rails.has(k)) { const [x, z] = k.split(',').map(Number); put(x, -1, z, P.sleeper); }
    for (const k of rails) if (!mid.has(k)) { const [x, z] = k.split(',').map(Number); put(x, -1, z, ballast); put(x, 0, z, P.steel); }
    for (const [k, along] of mid) {
      const [x, z] = k.split(',').map(Number);
      if (color) { put(x, -1, z, ballast); put(x, 0, z, color); }
      else put(x, -1, z, (along === 'x' ? x : z) % 2 === 0 ? P.sleeper : ballast);
    }
  }
  // a buffer stop just past the end of a line
  function bumper(route) {
    const [x, z] = pointOn(route, route.L + 1.25), [x0, z0] = pointOn(route, route.L);
    const cx = Math.floor(x * 2), cz = Math.floor(z * 2), across = Math.abs(x - x0) > Math.abs(z - z0);
    for (let k = -1; k <= 1; k++) { const bx = cx + (across ? 0 : k), bz = cz + (across ? k : 0); put(bx, 0, bz, P.dark); put(bx, 1, bz, k ? P.red : P.white); }
  }

  // the bus road along the south edge (blocks x0 to x1, rows 92 to 95), a roundabout to turn in, a stop
  const asphalt = tone(P.asphalt, [P.asphalt2, 0.25]);
  function road(x0, x1) { for (let x = x0; x <= x1; x++) for (let z = 92; z <= 95; z++) put(x, -1, z, asphalt); }
  function roundabout(cx, cz) {
    for (let x = cx - 6; x <= cx + 6; x++) for (let z = cz - 6; z <= cz + 6; z++) {
      const r = Math.hypot(x + 0.5 - cx, z + 0.5 - cz);
      if (r <= 5.4) put(x, -1, z, r < 1.6 ? P.grass : asphalt);
      if (r >= 1.6 && r < 2.3) put(x, 0, z, P.stone);
    }
    fill(cx - 1, 0, cz - 1, 2, 1, 2, P.grass2); fill(cx - 1, 1, cz - 1, 2, 1, 2, FLOWERS[1]);
  }
  function shelter(x, z) {
    for (const dx of [0, 4]) fill(x + dx, 0, z, 1, 4, 1, P.steel2);
    fill(x, 4, z - 1, 5, 1, 2, P.bus);
    fill(x + 1, 1, z, 3, 1, 1, P.plank);
    fill(x + 5, 0, z + 1, 1, 5, 1, P.steel2); put(x + 5, 5, z + 1, P.bus); put(x + 5, 6, z + 1, P.bus);
  }

  // a tram line along the south edge (rows 92 to 95): grass between the rails, poles for the wire,
  // a buffer at its end; a stop with a shelter, the red sign of Metrovalencia and line 4's blue
  function tramLine(x0, x1, s0, s1) {
    const pave = tone(P.pave, [P.pave2, 0.3]);
    for (let x = x0; x <= x1; x++) {
      put(x, -1, 92, P.steel); put(x, -1, 95, P.steel); put(x, 0, 92, P.steel); put(x, 0, 95, P.steel);
      put(x, -1, 93, '#7FAE62'); put(x, -1, 94, '#7FAE62');
      if ((x - x0) % 16 === 8) { fill(x, 1, 91, 1, 6, 1, P.dark); fill(x, 7, 91, 1, 1, 3, P.dark); }
    }
    const end = x0 > 0 ? x0 - 1 : x1 + 1;
    for (let z = 92; z <= 95; z++) { put(end, 0, z, P.dark); put(end, 1, z, z % 2 ? P.red : P.white); }
    for (let x = s0; x <= s1; x++) for (let z = 89; z <= 91; z++) put(x, 0, z, z === 91 ? '#E8D24A' : pave);
    const m = Math.round((s0 + s1) / 2);
    for (const x of [m - 7, m + 7]) fill(x, 1, 89, 1, 4, 1, P.steel2);
    fill(m - 8, 5, 88, 17, 1, 3, P.red); fill(m - 6, 1, 89, 13, 3, 1, P.glass, '', true);
    fill(s0 + 3, 1, 90, 1, 6, 1, P.steel2); fill(s0 + 2, 7, 90, 3, 2, 1, P.red); put(s0 + 3, 7, 90, P.white); fill(s0 + 2, 5, 90, 3, 2, 1, '#2C4A9A');
  }

  // the last touches, then only the blocks that can be seen
  function finish(extra) {
    // flowers and tufts in the grass
    for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) {
      if (!isGrass(x, z) || colorAt(x, 0, z)) continue;
      const r = hash(x, 1, z);
      if (r < 0.012) put(x, 0, z, FLOWERS[Math.floor(hash(x, 2, z) * FLOWERS.length)]);
      else if (r < 0.04) put(x, 0, z, P.turf);
    }
    // only the blocks that can be seen: nothing is ever seen from below, and a part that can be
    // taken away hides nothing that stays
    const filled = (x, y, z, p) => { if (!inside(x, y, z)) return false; const i = at(x, y, z); return cells[i] > 0 && (partOf[i] === p || partOf[i] === 0); };
    const list = [];
    for (let y = -LOW; y < H - LOW; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      const i = at(x, y, z), id = cells[i], p = partOf[i];
      if (!id) continue;
      if (filled(x, y + 1, z, p) && filled(x - 1, y, z, p) && filled(x + 1, y, z, p) && filled(x, y, z - 1, p) && filled(x, y, z + 1, p)) continue;
      list.push({ x, y, z, c: colors[id], tag: tagNames[tagOf[i]], glow: glowOf[i], part: p });
    }
    return { list, S, W: W / S, D: D / S, ...extra };
  }
  return { W, D, put, colorAt, del, fill, inPart, ground, isGrass, block, side, span, paint, recess, flat, windowIn, windows, ledge, quoins, pitched, clump, lawn, lay, bumper, ballast, road, roundabout, shelter, tramLine, finish };
}

// ---- the tool city ----
function buildTools(lineages) {
  const b = makeBoard();
  const { put, colorAt, del, fill, ground, isGrass, block, side, span, paint, recess, flat, windowIn, windows, ledge, quoins, pitched, clump, lay, bumper, ballast, road, roundabout, shelter, tramLine } = b;
  b.lawn();
  // squares and yards
  const pave = tone(P.pave, [P.pave2, 0.3]);
  ground(30, 28, 40, 40, pave);                                                          // round the station
  ground(56, 68, 6, 4, pave);                                                            // from its door to the market
  ground(72, 54, 22, 14, tone(P.pave2, [P.pave3, 0.3]));                                 // the snpick yard
  ground(56, 72, 28, 20, (x, y, z) => (((x >> 1) + (z >> 1)) % 2 ? P.pave : P.pave2));   // the market square
  ground(4, 68, 28, 24, tone(P.pave2, [P.pave3, 0.25]));                                 // the depot yard
  ground(132, 76, 14, 14, tone(P.dirt, [P.dirt2, 0.3], [P.pebble, 0.06]));               // the building site

  // how far a train may go: `lo` for its tail (into the station's arch), `hi` for its nose (up to the buffers)
  const routes = {};
  const line = (name, pts, lo = -1) => {
    const route = routeOf(pts);
    lay(route, LINES[name], lo < 0 ? -0.75 : 0, route.L + 0.75);
    bumper(route);
    routes[name] = { route, lo, hi: route.L + 0.6 };
  };
  line('red', [[24, 14], [24, 6], [39, 6]]);
  line('blue', [[33, 19], [70, 19]]);
  line('green', [[33, 25], [66, 25]]);
  line('ochre', [[24, 32], [24, 38], [29, 38]]);
  line('plum', [[64, 26], [64, 36], [70, 36]], 0.6);                                     // it starts at a junction, so it stops short of it

  // ---- the sequencer, where the reads come from ----
  const seqr = block(4, 36, 21, 57, 1, 11, tone(P.white, [P.white2, 0.1]), 'reads');
  fill(5, 0, 37, 16, 1, 20, P.dark, 'reads');                                          // on a dark plinth
  for (const [x, z] of [[4, 36], [21, 36], [4, 57], [21, 57]]) for (let y = 1; y <= 11; y++) del(x, y, z);   // rounded corners
  fill(6, 12, 38, 14, 1, 18, P.stone, 'reads');                                        // the lid
  fill(9, 13, 42, 8, 1, 6, P.stone2, 'reads');
  // a screen facing the station, with reads running across it
  paint(seqr, 'E', 40, 4, 14, 7, (i, j) => {
    if (i === 0 || i === 13 || j === 0 || j === 6) return [P.black, false];
    if (j % 2 === 0 || hash(i, j, 7) < 0.2) return [P.screen, false];
    return [BASES[Math.floor(hash(i, j, 11) * 4)], true];
  });
  recess(seqr, 'E', 43, 2, 8, 1, flat(P.black));                                        // the slot for the flow cell
  paint(seqr, 'E', 52, 2, 1, 1, flat(P.blue, true));
  for (const f of ['N', 'S', 'E', 'W']) { const [lo, hi] = span(seqr, f); paint(seqr, f, lo + 1, 10, hi - lo - 1, 1, flat(P.blue, true)); }   // a light all round
  for (const y of [3, 5, 7]) recess(seqr, 'S', 7, y, 12, 1, flat(P.dark));             // vents
  // a cable for each base, to the station
  BASES.forEach((c, i) => { const z = 42 + i * 4; fill(22, 0, z, 1, 2, 1, P.dark, 'reads'); for (let x = 23; x < 32; x++) put(x, 0, z, c, 'reads'); });

  // ---- BAMpiro, the central station ----
  const cream = tone(P.cream, [P.cream2, 0.07]);
  const hall = block(32, 30, 65, 63, 0, 12, cream, 'BAMpiro');
  fill(32, 0, 30, 34, 2, 34, P.stone2, 'BAMpiro');                                     // a stone plinth
  // arches where the lines go in
  const portal = (f, c) => {
    recess(hall, f, c - 2, 0, 5, 4, flat(P.black), 2);
    recess(hall, f, c - 1, 4, 3, 1, flat(P.black), 2);
    paint(hall, f, c - 3, 0, 1, 5, flat(P.stone)); paint(hall, f, c + 3, 0, 1, 5, flat(P.stone));
    paint(hall, f, c - 2, 4, 1, 1, flat(P.stone)); paint(hall, f, c + 2, 4, 1, 1, flat(P.stone));
    paint(hall, f, c - 1, 5, 3, 1, flat(P.stone));
  };
  // two rows of windows, none behind the tower, round the door and its sign, or where the arches go
  const covered = (f, a) => ((f === 'N' || f === 'W') && a < 43) || (f === 'S' && a > 49);
  const arches = (f, a) => (f === 'E' && ((a > 34 && a < 44) || (a > 46 && a < 56))) || ((f === 'N' || f === 'S') && a > 44 && a < 54);
  windows(hall, ['N', 'S', 'E', 'W'], 3, 2, 4, 6, { skip: (f, a) => covered(f, a) || arches(f, a) });
  windows(hall, ['N', 'S', 'E', 'W'], 8, 2, 2, 6, { skip: covered });
  portal('E', 39); portal('E', 51); portal('N', 49); portal('S', 49);
  // the way in: glass doors, a canopy, a sign with the colours of the lines
  recess(hall, 'S', 53, 0, 9, 6, (i, j) => (j === 5 || i % 2 === 0 ? [P.frame, false] : [P.glass, true]));
  fill(52, 6, 64, 11, 1, 2, P.dark, 'BAMpiro');
  paint(hall, 'S', 51, 8, 13, 2, (i) => (i % 2 === 0 && i > 1 && i < 11 ? [Object.values(LINES)[(i - 2) / 2], true] : [P.black, false]));
  ledge(hall, 11, P.cream2);
  for (let x = 32; x <= 65; x++) for (let z = 30; z <= 63; z++) if (x === 32 || x === 65 || z === 30 || z === 63) put(x, 13, z, P.cream2, 'BAMpiro');   // the parapet
  quoins(hall, P.stone);
  for (const [x, z] of [[46, 33], [58, 57]]) { fill(x, 13, z, 3, 2, 3, P.steel, 'BAMpiro'); put(x + 1, 15, z + 1, P.dark, 'BAMpiro'); }
  fill(50, 13, 56, 4, 1, 5, P.glass, 'BAMpiro', true);
  // a glass vault over the platforms, ribbed in steel, a fan window at each end
  const vault = [15, 17, 18, 19, 19, 20, 20, 20, 20, 19, 19, 18, 17, 15];
  for (let x = 32; x <= 65; x++) vault.forEach((top, i) => {
    const z = 40 + i;
    for (let y = 13; y <= top; y++) {
      let rib = (x - 32) % 5 === 0;
      if (x === 32 || x === 65) {
        const a = Math.atan2(y + 0.5 - 13, z + 0.5 - 47);
        rib = y === top || [Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4].some(m => Math.abs(a - m) < 0.13);
      }
      put(x, y, z, rib ? P.steel : P.glass, 'BAMpiro', !rib);
    }
  });
  // the clock tower, at the back corner so it hides nothing
  const brick = tone(P.brick, [P.brick2, 0.28], [P.brick3, 0.06]);
  const tower = block(32, 30, 41, 39, 0, 29, brick, 'BAMpiro');
  quoins(tower, P.stone);
  // a round clock on every side: a brass rim, the hands at three o'clock
  const clock = (f) => {
    const [lo] = span(tower, f);
    paint(tower, f, lo + 1, 18, 8, 8, (i, j) => {
      const d = (i - 3.5) ** 2 + (j - 3.5) ** 2;
      if (d > 16.5) return null;
      const hand = (i === 3 && j >= 3 && j <= 6) || (j === 3 && (i === 4 || i === 5));
      return [d > 9.5 ? P.ochre : hand ? P.black : P.white, false];
    }, -1);
  };
  for (const f of ['N', 'S', 'E', 'W']) {
    const [lo] = span(tower, f);
    windowIn(tower, f, lo + 4, 13, 2, 3);
    clock(f);
    recess(tower, f, lo + 4, 28, 2, 2, flat(P.black));                                   // the belfry
  }
  ledge(tower, 27, P.stone);
  // a pointed roof, with a flag on top
  for (let k = 0; k < 6; k++) fill(31 + k, 30 + k, 29 + k, 12 - 2 * k, 1, 12 - 2 * k, k % 2 ? P.red : shade(P.red, 0.86), 'BAMpiro');
  fill(36, 36, 34, 2, 1, 2, P.ochre, 'BAMpiro');
  fill(36, 37, 34, 1, 5, 1, P.dark, 'BAMpiro');
  fill(37, 40, 34, 3, 2, 1, (x, y) => (y === 41 ? P.red : P.white), 'BAMpiro');

  // ---- pathotypr: a lighthouse that tells who it is and what resists ----
  const lighthouse = { x: 44, z: 5 }, LX = 89, LZ = 11;                                   // its axis, on a line between blocks
  const from = (x, z) => Math.hypot(x + 0.5 - LX, z + 0.5 - LZ);
  const R = (y) => 5.8 - 1.4 * y / 31;
  const rock = tone(P.stone, [P.stone2, 0.35], [P.pebble, 0.15]);
  // on a rocky knoll
  for (let x = LX - 9; x <= LX + 9; x++) for (let z = LZ - 9; z <= LZ + 9; z++) {
    const r = from(x, z), h = hash(x, 3, z);
    if (r > 6.5 + h * 1.8 || !isGrass(x, z) || colorAt(x, 0, z)) continue;
    put(x, -1, z, rock, 'pathotypr');
    if (r < 5.4 + h * 1.4) put(x, 0, z, rock, 'pathotypr');
  }
  for (let y = 0; y < 32; y++) for (let x = LX - 7; x <= LX + 7; x++) for (let z = LZ - 7; z <= LZ + 7; z++) {
    const r = from(x, z);
    if (y < 2 && r <= R(y) + 1) put(x, y, z, P.stone, 'pathotypr');                          // a stone foot
    else if (r <= R(y)) put(x, y, z, Math.floor((y - 2) / 6) % 2 ? P.red : P.white, 'pathotypr');
  }
  // a door and small windows, cut in where the wall is along a way out from the axis
  const cut = (dx, dz, a, y, c, glow = false) => {
    let k = 0;
    const cell = (s) => (dx ? [LX + dx * s - (dx < 0 ? 1 : 0), LZ + a] : [LX + a, LZ + dz * s - (dz < 0 ? 1 : 0)]);
    while (from(...cell(k + 1)) <= R(y)) k++;
    const [ox, oz] = cell(k), [ix, iz] = cell(k - 1);
    del(ox, y, oz); put(ix, y, iz, c, 'pathotypr', glow);
  };
  for (let y = 2; y <= 5; y++) for (const a of [-1, 0]) cut(0, 1, a, y, P.wood2);
  for (const [dx, dz, y0] of [[0, 1, 13], [1, 0, 19], [0, 1, 25], [-1, 0, 13]]) for (const a of [-1, 0]) for (let y = y0; y < y0 + 2; y++) cut(dx, dz, a, y, P.glass, true);
  for (let x = LX - 7; x <= LX + 7; x++) for (let z = LZ - 7; z <= LZ + 7; z++) {
    const r = from(x, z);
    if (r <= 5.6) put(x, 32, z, P.frame, 'pathotypr');                                    // the gallery
    if (r > 4.7 && r <= 5.6) { put(x, 34, z, P.white, 'pathotypr'); if (((x + z) & 1) === 0) put(x, 33, z, P.white, 'pathotypr'); }   // its railing
    [4.7, 3.9, 2.9, 1.6].forEach((q, k) => { if (r <= q) put(x, 37 + k, z, k % 2 ? shade(P.red, 0.88) : P.red, 'pathotypr'); });      // the dome
  }
  // the lantern: thin posts round the lamp, which shows between them
  for (let k = 0; k < 8; k++) {
    const a = (k + 0.5) * Math.PI / 4;
    fill(Math.floor(LX + Math.cos(a) * 3.2), 33, Math.floor(LZ + Math.sin(a) * 3.2), 1, 4, 1, P.dark, 'pathotypr');
  }
  fill(LX - 1, 41, LZ - 1, 2, 2, 2, P.dark, 'pathotypr');

  // ---- get_MNV: the codon factory, three bases in, one amino acid out ----
  const fac = block(74, 20, 93, 33, 0, 11, brick, 'get_MNV');
  quoins(fac, P.brick3);
  windows(fac, ['N', 'S', 'W'], 3, 3, 5, 5, { bars: true });
  windows(fac, ['E'], 3, 3, 5, 5, { bars: true, skip: (f, a) => a > 19 && a < 31 });
  recess(fac, 'E', 23, 0, 7, 7, (i, j) => [j === 6 ? P.dark : j % 2 ? P.steel : P.steel2, false]);   // the loading door, its shutter down
  // a sawtooth roof, its glass to the sun
  for (let x = 74; x <= 93; x++) for (let z = 20; z <= 33; z++) {
    const k = (z - 20) % 7, top = [12, 13, 13, 14, 15, 16, 16][k];
    for (let y = 12; y <= top; y++) put(x, y, z, k === 6 ? P.glass : y % 2 ? P.roof : P.roof2, 'get_MNV', k === 6);
  }
  // a round chimney with white bands and a dark cap
  const round = (x, z, w) => Math.abs(x + 0.5 - 78) + Math.abs(z + 0.5 - 24) <= w;
  for (let y = 12; y <= 26; y++) for (let x = 76; x <= 79; x++) for (let z = 22; z <= 25; z++) if (round(x, z, 2.5)) put(x, y, z, y === 21 || y === 23 ? P.white : brick, 'get_MNV');
  for (let x = 75; x <= 80; x++) for (let z = 21; z <= 26; z++) if (round(x, z, 3.5)) put(x, 27, z, round(x, z, 1) ? P.black : P.dark, 'get_MNV');
  // the belt out front: codons going in, an amino acid coming out
  for (let x = 75; x <= 93; x++) {
    fill(x, 2, 35, 1, 1, 2, P.dark, 'get_MNV');
    if ((x - 75) % 6 === 0) fill(x, 0, 35, 1, 2, 2, P.steel, 'get_MNV');
  }
  ['ATG', 'CCA', 'GAT'].forEach((cod, k) => [...cod].forEach((b, j) => put(77 + k * 4 + j, 3, 35, BASE[b], 'get_MNV')));
  fill(90, 3, 35, 2, 2, 2, '#B07FD8', 'get_MNV');

  // ---- eskaks: a hall of scales, dN against dS ----
  fill(102, 0, 20, 20, 1, 18, tone(P.stone, [P.stone2, 0.2]), 'eskaks');                 // a stone floor, a step down at the front
  const esk = block(104, 22, 119, 31, 1, 12, tone(P.cream, [P.cream2, 0.1]), 'eskaks');
  for (const x of [105, 109, 113, 117]) {                                                // four columns in front
    fill(x, 1, 34, 2, 10, 2, P.white, 'eskaks');
    fill(x, 1, 34, 2, 1, 2, P.white2, 'eskaks'); fill(x, 10, 34, 2, 1, 2, P.white2, 'eskaks');
  }
  fill(104, 11, 32, 16, 2, 4, P.white2, 'eskaks');
  pitched({ x0: 104, x1: 119, z0: 22, z1: 35, tag: 'eskaks' }, 13, 'z', tone(P.blue, [shade(P.blue, 0.88), 0.35]), P.white, { run: 2 });
  recess(esk, 'S', 111, 1, 2, 6, (i, j) => [j === 5 ? P.glass : P.wood2, j === 5]);
  windowIn(esk, 'S', 107, 4, 2, 4, { sill: null }); windowIn(esk, 'S', 115, 4, 2, 4, { sill: null });
  windows(esk, ['E', 'W', 'N'], 4, 2, 4, 4);
  fill(111, 18, 27, 2, 6, 2, P.steel, 'eskaks');                                         // the post of the balance

  // ---- snpick: the picking yard, an alignment with the variable sites in colour ----
  const aln = ['ACGTTGCAAGTCCGTA', 'ACGATGCTAGTCCGTA', 'ACGTTGCTAGTCTGTA', 'ACGATGCAAGTCTGTA'];
  const varies = [...aln[0]].map((_, i) => new Set(aln.map(r => r[i])).size > 1);
  aln.forEach((r, row) => [...r].forEach((b, i) => {
    const x = 76 + i, z = 57 + row * 2;
    if (varies[i]) fill(x, 0, z, 1, 2, 1, BASE[b], 'snpick', true);
    else put(x, 0, z, i % 2 ? P.stone : P.stone2, 'snpick');
  }));
  fill(72, 0, 58, 3, 3, 5, (x, y, z) => ((z - 58) % 2 ? P.wood : P.wood2), 'snpick');     // the crate the picks go in
  for (let z = 59; z <= 61; z++) del(73, 2, z);
  put(73, 1, 59, BASE.T, 'snpick'); put(73, 1, 60, BASE.C, 'snpick'); put(73, 1, 61, BASE.A, 'snpick');
  const ochre = tone(P.ochre, [shade(P.ochre, 0.9), 0.25]);
  for (const x of [72, 92]) for (const z of [54, 66]) fill(x, 0, z, 2, 12, 2, ochre, 'snpick');   // the gantry's legs
  for (const x of [72, 92]) fill(x, 12, 54, 2, 1, 14, P.ochre, 'snpick');                  // and the rails its bridge runs on
  for (const x of [72, 93]) for (let i = 0; i < 10; i++) { put(x, 1 + i, 56 + i, shade(P.ochre, 0.82), 'snpick'); put(x, 1 + i, 65 - i, shade(P.ochre, 0.82), 'snpick'); }

  // ---- a park by the observatory, with a tree that branches in two, in two and in two again ----
  ground(96, 54, 18, 18, tone(P.grass2, [P.grass, 0.25], [P.grass3, 0.04]));
  for (let x = 96; x < 114; x++) for (let z = 54; z < 72; z++) { const r = Math.hypot(x + 0.5 - 105, z + 0.5 - 63); if (r > 6.6 && r < 7.9) put(x, -1, z, tone(P.pave2, [P.pebble, 0.2])); }
  const leaves = tone(P.leaf, [P.leaf2, 0.3], [P.leaf3, 0.14]);
  fill(104, 0, 62, 2, 9, 2, P.trunk);
  let tip = 0;
  const branch = (x, y, z, dx, dz, len, depth) => {
    for (let i = 1; i <= len; i++) put(x + dx * i, y + i, z + dz * i, P.trunk);
    const ex = x + dx * len, ey = y + len, ez = z + dz * len;
    if (depth === 0) { clump(ex + 0.5, ey + 1.6, ez + 0.5, 2.3, 1.9, 2.3, leaves); put(ex, ey + 1, ez + 2, lineages[(tip++ * 3) % lineages.length]); return; }
    const [ax, az] = dx ? [0, 1] : [1, 0];
    branch(ex, ey, ez, ax, az, len - 1, depth - 1);
    branch(ex, ey, ez, -ax, -az, len - 1, depth - 1);
  };
  branch(104, 8, 62, -1, 0, 5, 2);
  branch(105, 8, 63, 1, 0, 5, 2);
  const bench = (x, z, back) => { fill(x, 1, z, 3, 1, 1, P.plank); put(x, 0, z, P.dark); put(x + 2, 0, z, P.dark); fill(x, 2, z + back, 3, 1, 1, P.plank); fill(x, 1, z + back, 1, 1, 1, P.dark); fill(x + 2, 1, z + back, 1, 1, 1, P.dark); };
  bench(100, 69, 1); bench(108, 56, -1);

  // ---- distree: an observatory that measures the tree ----
  const obs = block(116, 56, 127, 67, 0, 7, tone(P.white, [P.white2, 0.08]), 'distree');
  ledge(obs, 7, P.white2);
  windows(obs, ['N', 'E', 'W', 'S'], 3, 1, 2, 3, { sill: null, skip: (f, a) => f === 'S' && a > 119 && a < 124 });
  recess(obs, 'S', 121, 0, 2, 4, flat(P.wood2));
  // the dome, its slit open to the tree
  for (let y = 8; y <= 13; y++) {
    const r = Math.sqrt(Math.max(0, 6.4 ** 2 - (y - 7.5) ** 2));
    for (let x = 115; x <= 128; x++) for (let z = 55; z <= 68; z++) {
      if (Math.hypot(x + 0.5 - 122, z + 0.5 - 62) > r) continue;
      put(x, y, z, Math.abs(z + 0.5 - 62) < 1.1 && x < 122 ? P.dark : (hash(x, y, z) < 0.2 ? P.steel2 : P.steel), 'distree');
    }
  }
  // the telescope, out of the slit
  [[117, 11], [116, 11], [115, 12], [114, 12], [113, 13], [112, 13]].forEach(([x, y], i) => fill(x, y, 61, 1, 2, 2, i === 5 ? P.glass : i === 2 ? P.dark : P.white2, 'distree', i === 5));

  // ---- fstic: the market square, three populations and a little mixing ----
  const pops = [P.red, P.ochre, P.blue];
  [64, 71, 78].forEach((x0, k) => {
    const c = pops[k];
    for (const [x, z, h] of [[x0, 76, 7], [x0 + 5, 76, 7], [x0, 79, 6], [x0 + 5, 79, 6]]) fill(x, 0, z, 1, h, 1, P.wood, 'fstic');
    fill(x0 + 1, 0, 78, 4, 2, 2, P.wood2, 'fstic');
    fill(x0 + 1, 2, 78, 4, 1, 2, P.plank, 'fstic');
    // its own colour on the counter, and one or two from the other stalls
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
      const r = hash(x0 + i, 3, j);
      if (hash(x0 + i, 4, j) < 0.8) put(x0 + 1 + i, 3, 78 + j, r < 0.2 ? pops[(k + 1) % 3] : r < 0.3 ? pops[(k + 2) % 3] : c, 'fstic');
    }
    for (let x = x0; x <= x0 + 5; x++) {                                                  // a striped awning
      const s = (x - x0) % 2 ? P.white : c;
      put(x, 7, 76, s, 'fstic'); put(x, 7, 77, s, 'fstic'); put(x, 6, 78, s, 'fstic'); put(x, 6, 79, s, 'fstic'); put(x, 5, 80, s, 'fstic');
    }
  });
  // the scoreboard: how far apart the populations are
  fill(66, 0, 88, 1, 4, 1, P.dark, 'fstic'); fill(75, 0, 88, 1, 4, 1, P.dark, 'fstic');
  fill(66, 4, 88, 10, 6, 1, P.black, 'fstic');
  [[67, 3, P.red], [70, 2, P.ochre], [73, 4, P.blue]].forEach(([x, h, c]) => fill(x, 5, 88, 2, h, 1, c, 'fstic', true));

  // ---- mycolorsTB: a house painted in the fourteen lineage colours ----
  const lin = (i) => lineages[((i % lineages.length) + lineages.length) % lineages.length];
  const house = block(112, 76, 125, 87, 0, 13, tone(P.white, [P.white2, 0.08]), 'mycolorsTB');
  for (let x = 112; x <= 125; x++) for (let y = 0; y <= 13; y++) put(x, y, 87, lin(x - 112), 'mycolorsTB');
  for (let z = 76; z <= 87; z++) for (let y = 0; y <= 13; y++) put(125, y, z, lin(100 - z), 'mycolorsTB');
  for (const y of [3, 9]) for (const [f, a] of [['S', 114], ['S', 122], ['E', 78], ['E', 84]]) windowIn(house, f, a, y, 2, 3, { sill: P.white });
  windowIn(house, 'S', 118, 9, 2, 3, { sill: P.white });
  recess(house, 'S', 118, 0, 2, 6, flat(P.wood2));
  fill(117, 6, 88, 4, 1, 1, P.white, 'mycolorsTB');                                     // a little hood over the door
  windows(house, ['N', 'W'], 3, 2, 3, 5); windows(house, ['N', 'W'], 9, 2, 3, 5);
  pitched(house, 14, 'x', (x, y) => (y % 2 ? P.plum : shade(P.plum, 0.86)), (x, y, z) => (x === 125 ? lin(100 - z) : P.white));
  fill(115, 14, 78, 2, 7, 2, brick, 'mycolorsTB'); fill(115, 21, 78, 2, 1, 2, P.dark, 'mycolorsTB');
  // a garden with a white fence, and flowers in the lineage colours
  for (let x = 110; x <= 127; x++) if (x < 117 || x > 120) { put(x, 1, 91, P.white); if (x % 2 === 0) put(x, 0, 91, P.white); }
  for (const x of [110, 127]) for (let z = 88; z <= 91; z++) { put(x, 1, z, P.white); if (z % 2 === 0) put(x, 0, z, P.white); }
  ground(118, 88, 2, 4, pave);
  for (let x = 112; x <= 125; x += 2) if (x < 117 || x > 120) put(x, 0, 88, lin(x));

  // ---- karyon: under works ----
  const core = block(135, 79, 142, 86, 0, 7, tone(P.stone, [P.stone2, 0.25]), 'karyon');
  windows(core, ['N', 'S', 'E', 'W'], 2, 2, 3, 4, { glass: P.dark, glow: false, sill: null });
  for (let x = 135; x <= 142; x++) for (let z = 79; z <= 86; z++) {                       // the next floor, begun
    if (x > 135 && x < 142 && z > 79 && z < 86) continue;
    for (let y = 8; y < 8 + Math.floor(hash(x, 9, z) * 4); y++) put(x, y, z, P.stone, 'karyon');
  }
  for (const [x, z] of [[135, 79], [142, 79], [135, 86], [142, 86]]) fill(x, 8, z, 1, 4, 1, P.steel2, 'karyon');
  // scaffolding round it: poles, planks at two levels, a rail on top
  for (let x = 133; x <= 144; x++) for (let z = 77; z <= 88; z++) {
    const ring = x < 135 || x > 142 || z < 79 || z > 86;
    if (!ring) continue;
    const outer = x === 133 || x === 144 || z === 77 || z === 88;
    if (outer && ((x - 133) % 4 === 0 || x === 144) && ((z - 77) % 4 === 0 || z === 88)) fill(x, 0, z, 1, 13, 1, P.ochre, 'karyon');
    for (const y of [5, 10]) put(x, y, z, (x + z) % 2 ? P.plank : P.wood, 'karyon');
    if (outer) put(x, 13, z, P.ochre, 'karyon');
  }
  // a tower crane: its mast at the corner, its jib out over the site
  for (let y = 0; y <= 29; y++) fill(145, y, 76, 2, 1, 2, y % 3 === 0 ? shade(P.ochre, 0.78) : P.ochre, 'karyon');
  fill(122, 30, 76, 26, 1, 2, P.ochre, 'karyon');
  fill(145, 31, 76, 2, 2, 2, P.ochre, 'karyon');
  fill(145, 27, 78, 2, 2, 1, P.glass, 'karyon', true); fill(145, 29, 78, 2, 1, 1, P.dark, 'karyon');
  fill(137, 29, 76, 2, 1, 2, P.dark, 'karyon');                                             // the trolley
  for (let y = 18; y < 29; y++) put(137, y, 77, P.black, 'karyon');                          // its cable
  fill(136, 16, 76, 3, 1, 3, P.wood, 'karyon'); fill(136, 17, 76, 3, 1, 3, (x, y, z) => ((x + z) % 2 ? P.brick : P.brick2), 'karyon');   // a load of bricks
  // a barrier with a sign, cones, and someone in a hard hat
  for (let x = 132; x <= 145; x++) { put(x, 1, 90, (x >> 1) % 2 ? P.red : P.white, 'karyon'); if ((x - 132) % 4 === 0) put(x, 0, 90, P.dark, 'karyon'); }
  paint({ x0: 137, x1: 140, z0: 90, z1: 90, tag: 'karyon' }, 'S', 137, 2, 4, 3, (i, j) => [(i + j) % 2 ? P.ochre : P.black, false], 0);
  for (const [x, z] of [[131, 91], [146, 91]]) { put(x, 0, z, '#EE7D34'); put(x, 1, z, P.white); }

  // ---- the depot, where the older wagons rest ----
  const shed = block(6, 70, 29, 81, 0, 9, brick, 'depot');
  quoins(shed, P.brick3);
  for (const x0 of [8, 15, 22]) {                                                         // three arched doorways
    recess(shed, 'S', x0, 0, 5, 6, flat(P.black), 2);
    recess(shed, 'S', x0 + 1, 6, 3, 1, flat(P.black), 2);
    paint(shed, 'S', x0 - 1, 0, 1, 7, flat(P.stone)); paint(shed, 'S', x0 + 5, 0, 1, 7, flat(P.stone));
    paint(shed, 'S', x0, 6, 1, 1, flat(P.stone)); paint(shed, 'S', x0 + 4, 6, 1, 1, flat(P.stone));
    paint(shed, 'S', x0 + 1, 7, 3, 1, flat(P.stone));
    for (let z = 82; z <= 85; z++) {                                                        // and a short track out of each
      put(x0 + 1, 0, z, P.steel, 'depot'); put(x0 + 3, 0, z, P.steel, 'depot');
      put(x0 + 2, -1, z, z % 2 ? P.sleeper : ballast); put(x0 + 1, -1, z, ballast); put(x0 + 3, -1, z, ballast);
    }
  }
  windows(shed, ['E', 'W', 'N'], 4, 2, 3, 4);
  pitched(shed, 10, 'x', (x, y) => (y % 2 ? P.roof : P.roof2), brick);
  lay(routeOf([[2, 43], [15, 43]]), null, 0, 13);
  [[7, P.steel], [15, '#A08C7A'], [23, '#8FA3B0']].forEach(([x0, c]) => {                // the old wagons
    for (const x of [x0, x0 + 4]) for (const z of [86, 88]) put(x, 1, z, P.black, 'depot');
    fill(x0, 2, 86, 5, 1, 3, P.dark, 'depot');
    fill(x0, 3, 86, 5, 3, 3, (x) => ((x - x0) % 2 ? c : shade(c, 0.9)), 'depot');
    fill(x0, 6, 86, 5, 1, 3, shade(c, 1.12), 'depot');
  });
  // a water tower for the old engines
  for (const [x, z] of [[34, 71], [37, 71], [34, 74], [37, 74]]) fill(x, 0, z, 1, 7, 1, P.steel2);
  for (let y = 7; y <= 13; y++) for (let x = 33; x <= 38; x++) for (let z = 70; z <= 75; z++) {
    const d = Math.abs(x + 0.5 - 36) + Math.abs(z + 0.5 - 73);
    if (y <= 11 && d <= 3.5) put(x, y, z, (x + z) % 2 ? P.wood : P.wood2);
    else if (y > 11 && d <= 3.5 - (y - 11) * 1.4) put(x, y, z, P.dark);
  }

  // ---- a pond with koi, stones round it, reeds and lilies ----
  for (let x = 86; x <= 107; x++) for (let z = 75; z <= 90; z++) {
    const ex = (x + 0.5 - 97) / 9, ez = (z + 0.5 - 83) / 7, r = ex * ex + ez * ez;
    if (r > 1.18 || !isGrass(x, z)) continue;
    if (r > 0.84) { put(x, -1, z, rock); if (hash(x, 0, z) < 0.35) put(x, 0, z, rock); continue; }
    del(x, -1, z); put(x, -2, z, tone(P.water, [P.water2, 0.3], [P.water3, 0.08]));
  }
  for (const [x, z] of [[91, 79], [101, 86], [95, 87]]) { fill(x, -2, z, 2, 1, 2, P.lily); put(x, -1, z, '#F29BB4'); }
  for (const [x, z] of [[89, 80], [90, 80], [104, 84], [104, 85]]) { fill(x, 0, z, 1, 2 + (x & 1), 1, P.leaf2); put(x, 2 + (x & 1), z, P.trunk); }

  // ---- trees, round and pointed, bushes, lamps and people ----
  const tree = (x, z, h) => { fill(x, 0, z, 2, h, 2, P.trunk); clump(x + 1, h + 2.4, z + 1, 3.6, 3, 3.6, leaves); };
  const pine = (x, z, h) => {
    fill(x, 0, z, 2, 3, 2, P.trunk);
    for (let y = 2; y < 2 + h; y++) { const r = 0.9 + (2 + h - y) * 0.42; for (let dx = -4; dx <= 5; dx++) for (let dz = -4; dz <= 5; dz++) if (Math.hypot(dx - 0.5, dz - 0.5) <= r) put(x + dx, y, z + dz, (y + dx + dz) % 3 ? P.pine : P.pine2); }
  };
  [[6, 6, 5, 0], [18, 10, 6, 1], [28, 6, 4, 0], [56, 6, 6, 1], [68, 20, 5, 0], [98, 6, 7, 1], [112, 8, 5, 0], [132, 10, 6, 1],
    [140, 22, 4, 0], [6, 22, 7, 1], [24, 24, 5, 0], [140, 60, 6, 0], [86, 70, 4, 1], [40, 86, 6, 0], [44, 84, 5, 1]].forEach(([x, z, h, p]) => (p ? pine : tree)(x, z, h));
  for (const [x, z] of [[2, 30], [26, 62], [128, 46], [144, 50], [12, 60]]) clump(x + 0.5, 0.6, z + 0.5, 1.9, 1.5, 1.9, leaves, '', 0.5);
  const lamp = (x, z) => { fill(x, 0, z, 1, 8, 1, P.dark); put(x, 8, z, P.light, '', true); put(x, 9, z, P.dark); };
  [[70, 44], [94, 44], [118, 44], [42, 24], [54, 70], [132, 66], [84, 72], [96, 91], [128, 91]].forEach(([x, z]) => lamp(x, z));
  // signals where the lines leave the station
  for (const [x, z] of [[68, 35], [68, 55], [46, 26], [53, 67]]) { fill(x, 0, z, 1, 5, 1, P.dark); put(x, 5, z, '#58D08A', '', true); put(x, 6, z, '#EF5A4C', '', true); put(x, 7, z, P.black); }
  const person = (x, z, shirt, hair = P.hair) => { put(x, 0, z, P.dark); put(x, 1, z, shirt); put(x, 2, z, P.skin); if (hair) put(x, 3, z, hair); };
  [[60, 83, P.red], [62, 85, P.red, '#D9A441'], [72, 84, P.blue], [74, 83, P.blue, null], [79, 85, P.ochre], [66, 82, P.ochre, '#8A4B2E'],
    [52, 60, P.green], [100, 73, P.plum], [58, 69, P.blue, '#D9A441'], [57, 66, P.white], [110, 74, P.green, '#8A4B2E'],
    [139, 91, '#EE7D34', P.ochre], [83, 88, P.plum], [26, 84, P.stone, null], [118, 90, lin(3)]].forEach(([x, z, c, h]) => person(x, z, c, h === undefined ? P.hair : h));

  // ---- the road to Sagunt: the yellow bus waits by the market, and turns at the roundabout ----
  road(55, 147); roundabout(54, 92); shelter(62, 90);
  // ---- and the tram to Paterna, line 4, from its stop by the depot ----
  tramLine(0, 44, 24, 44);

  // where a label goes when the middle of the top of its blocks is not the place (the crane would lift it too high)
  const pins = { karyon: [139, 14, 83] };
  return b.finish({ routes, lighthouse, pins });
}

// ---- Sagunt and its port, where the papers I led live ----
// The castle along the top of its hill, the Roman theatre in the slope, the old
// town at its foot, orange groves with a farm, and el Port: the blast furnace,
// the hospital and its water works, the harbour, the beach and the sea. The road
// comes in from the tool city along the south edge.
function buildSagunto(lineages) {
  const b = makeBoard();
  const { W, D, put, colorAt, del, fill, ground, block, side, span, paint, recess, flat, windowIn, windows, ledge, pitched, clump, road, roundabout, shelter } = b;
  b.lawn();
  const at = (x, z) => z * W + x;

  // ---- the hill: a ridge along the north, a long slope down to the town ----
  const crest = (x) => 12 + Math.round(Math.sin(x / 19) * 1.5);
  const hh = new Int16Array(W * D);
  for (let x = 0; x < 98; x++) for (let z = 0; z < 48; z++) {
    const rise = Math.min(1, x / 14) * Math.min(1, Math.max(0, (97 - x) / 18));
    const dz = z - crest(x), t = Math.max(0, 1 - (dz / (dz > 0 ? 28 : 15)) ** 2);
    hh[at(x, z)] = Math.max(0, Math.round(rise * t * (18 + Math.sin(x / 6.5) * 2.5) + (hash(x, 5, z) - 0.5) * 1.2));
  }
  // the Roman theatre, its rows of seats cut into the slope, facing the town
  const TX = 38, TZ = 42;
  for (let x = TX - 14; x <= TX + 14; x++) for (let z = TZ - 14; z < TZ; z++) {
    const r = Math.hypot(x + 0.5 - TX, z + 0.5 - TZ);
    if (r <= 12.6) hh[at(x, z)] = r < 4 ? 0 : Math.min(11, Math.floor((r - 4) / 0.8) + 1);
  }
  const dry = tone(P.dry, [P.dry2, 0.3], [P.dry3, 0.15]);
  const rock = tone(P.stone, [P.stone2, 0.4], [P.pebble, 0.15]);
  const seat = (x, y, z) => (y % 2 ? '#D9D0BE' : '#C7BCA7');
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    const h = hh[at(x, z)];
    if (!h) continue;
    const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => hh[at(Math.min(W - 1, Math.max(0, x + dx)), Math.min(D - 1, Math.max(0, z + dz)))]);
    const steep = Math.max(...n.map(v => Math.abs(v - h))) >= 2;
    const inTheatre = Math.hypot(x + 0.5 - TX, z + 0.5 - TZ) <= 12.6 && z < TZ;
    for (let y = 0; y < h; y++) put(x, y, z, inTheatre ? seat : y === h - 1 && !steep ? dry : rock);
  }
  ground(TX - 4, TZ - 4, 8, 4, tone(P.pave, [P.pave2, 0.3]));   // the orchestra
  // the stage building across the front of it, with three doors
  const scaena = block(TX - 15, TZ, TX + 14, TZ + 2, 0, 11, tone('#D6C7A8', ['#C9B894', 0.3]), '');
  for (const dx of [-8, -1, 6]) recess(scaena, 'N', TX + dx, 0, 3, 5, flat(P.black), 1);
  for (let x = TX - 15; x <= TX + 14; x += 2) put(x, 12, TZ + 1, '#C9B894');
  // pines on the gentle slopes
  for (let x = 4; x < 94; x += 7) for (let z = 3; z < 40; z += 6) {
    const px = x + Math.floor(hash(x, 7, z) * 4), pz = z + Math.floor(hash(x, 8, z) * 4), h = hh[at(px, pz)];
    if (!h || Math.abs(pz - crest(px)) < 5 || Math.hypot(px + 0.5 - TX, pz + 0.5 - TZ) < 16 || (px > 43 && px < 69 && pz < 24) || hash(px, 9, pz) < 0.35) continue;
    fill(px, h, pz, 1, 2, 1, P.trunk);
    for (let k = 0; k < 4; k++) { const r = 2.2 - k * 0.5; for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (Math.hypot(dx, dz) <= r) put(px + dx, h + 2 + k, pz + dz, (dx + dz + k) % 3 ? P.pine : P.pine2); }
  }

  // ---- the castle: walls along the ridge, towers, an enclosure with its keep, the Valencian flag ----
  const wall = tone(P.tapial, [P.tapial2, 0.35], [shade(P.tapial, 1.05), 0.1]);
  const g = (x, z) => hh[at(x, z)];
  for (let x = 10; x <= 92; x++) {
    const c = crest(x), base = Math.min(g(x, c), g(x, c + 1));
    for (const z of [c, c + 1]) fill(x, base, z, 1, g(x, z) - base + 4, 1, wall, 'castell');
    if (x % 2 === 0) put(x, base + 4 + Math.max(0, g(x, c + 1) - base), c + 1, wall, 'castell');
  }
  for (const x of [12, 26, 40, 72, 86]) {
    const c = crest(x), base = Math.min(...[0, 1, 2, 3].flatMap(dx => [c - 1, c + 2].map(z => g(x + dx, z))));
    fill(x, base, c - 1, 4, 9 + g(x, c) - base, 4, wall, 'castell');
    for (let dx = 0; dx < 4; dx++) for (let dz = -1; dz < 3; dz++) if ((dx === 0 || dx === 3 || dz === -1 || dz === 2) && (dx + dz) % 2 === 0) put(x + dx, 9 + g(x, c), c + dz, wall, 'castell');
    recess({ x0: x, x1: x + 3, z0: c - 1, z1: c + 2, tag: 'castell' }, 'S', x + 1, g(x, c) + 5, 2, 2, flat(P.black), 1);
  }
  // an enclosure on the south side, paved, with the keep
  const c0 = crest(56);
  for (let x = 46; x <= 66; x++) for (let z = c0 + 2; z <= c0 + 9; z++) {
    const edge = x === 46 || x === 66 || z === c0 + 9;
    const top = g(x, z);
    if (edge) { fill(x, 0, z, 1, top + 3, 1, wall, 'castell'); if ((x + z) % 2 === 0) put(x, top + 3, z, wall, 'castell'); }
    else fill(x, 0, z, 1, top + 1, 1, (xx, yy, zz) => (yy === top ? P.pave2 : wall), 'castell');
  }
  const kb = g(56, c0 + 5);
  const keep = block(53, c0 + 3, 59, c0 + 8, kb, kb + 12, wall, 'castell');
  windowIn(keep, 'S', 55, kb + 7, 2, 2, { glass: P.black, glow: false, sill: null });
  for (let x = 53; x <= 59; x++) for (let z = c0 + 3; z <= c0 + 8; z++) if ((x === 53 || x === 59 || z === c0 + 3 || z === c0 + 8) && (x + z) % 2 === 0) put(x, kb + 13, z, wall, 'castell');
  fill(56, kb + 13, c0 + 5, 1, 6, 1, P.dark, 'castell');
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) put(57 + i, kb + 16 + j, c0 + 5, j === 1 ? P.red : P.ochre, 'castell');   // la senyera

  // ---- the old town at the foot of the hill: white and ochre houses, tiled roofs, a church, a square ----
  const pave = tone(P.pave, [P.pave2, 0.3]);
  ground(0, 88, 70, 4, pave);                                          // the pavement along the road
  ground(0, 64, 70, 3, pave); ground(17, 46, 3, 42, pave); ground(47, 46, 3, 42, pave);   // streets
  const walls = [P.white, P.cream, '#EBCB93', '#E9C9BA', '#F1E7D2'];
  const house = (x0, z0, w, d, h, k) => {
    const c = walls[k % walls.length];
    const hs = block(x0, z0, x0 + w - 1, z0 + d - 1, 0, h - 1, tone(c, [shade(c, 0.95), 0.2]), '');
    const shutters = k % 3 ? '#5E8C5A' : '#8A5A3C';
    for (let y = 2; y < h - 2; y += 4) for (const f of ['N', 'S', 'E', 'W']) {
      const [lo, hi] = span(hs, f);
      for (let a = lo + 1; a < hi - 1; a += 3) { recess(hs, f, a, y, 1, 2, flat('#3C4550')); paint(hs, f, a + 1, y, 1, 2, flat(shutters)); }
    }
    recess(hs, 'S', x0 + Math.floor(w / 2), 0, 1, 3, flat(P.wood2));
    if (k % 3 === 2) { fill(x0, h, z0, w, 1, d, P.white2, ''); for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) if (x === x0 || z === z0 || x === x0 + w - 1 || z === z0 + d - 1) put(x, h + 1, z, c); }
    else pitched(hs, h, w >= d ? 'x' : 'z', (x, y) => (y % 2 ? P.tile : P.tile2), c);
  };
  let k = 0;
  for (const [x0, x1] of [[1, 16], [20, 46], [50, 69]]) for (const [z0, z1] of [[46, 63], [67, 87]]) {
    for (let x = x0; x <= x1 - 5; ) {
      const w = 5 + Math.floor(hash(x, 1, z0) * 4);
      if (x + w - 1 > x1) break;
      for (let z = z0; z <= z1 - 5; ) {
        const d = 6 + Math.floor(hash(x, 2, z) * 3);
        if (z + d - 1 > z1) break;
        const church = x0 === 20 && z0 === 46 && x < 43, square = x0 === 50 && z0 === 67;
        if (!church && !square) house(x, z, w, d, 6 + 2 * Math.floor(hash(x, 3, z) * 3), k++);
        z += d + (hash(x, 4, z) < 0.3 ? 1 : 0);
      }
      x += w;
    }
  }
  // the church of Santa Maria, with its bell tower
  const stoneC = tone('#CDB894', ['#BFA981', 0.3]);
  const church = block(21, 47, 37, 62, 0, 13, stoneC, '');
  pitched(church, 14, 'z', (x, y) => (y % 2 ? P.tile : P.tile2), stoneC, { run: 2 });
  windows(church, ['E', 'W'], 5, 1, 5, 4, { glass: '#7A8FB0', sill: null });
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) if ((i - 2) ** 2 + (j - 2) ** 2 <= 5) put(27 + i, 7 + j, 62, (i + j) % 2 ? '#C9A2D6' : '#7A8FB0', '', true);   // the rose window
  recess(church, 'S', 28, 0, 3, 5, flat(P.wood2));
  const bell = block(38, 47, 42, 51, 0, 29, stoneC, '');
  recess(bell, 'S', 39, 24, 3, 3, flat(P.black)); recess(bell, 'E', 48, 24, 3, 3, flat(P.black));
  for (let k2 = 0; k2 < 3; k2++) fill(38 + k2, 30 + k2, 47 + k2, 5 - 2 * k2, 1, 5 - 2 * k2, P.tile, '');
  // the square: two palms and a fountain
  ground(50, 67, 20, 21, tone(P.pave3, [P.pave2, 0.3]));
  const palm = (x, z, h) => {
    fill(x, 0, z, 1, h, 1, (xx, y) => (y % 2 ? '#8A6A48' : '#7A5C3C'));
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
      put(x + dx, h, z + dz, P.leaf); put(x + 2 * dx, h - 1, z + 2 * dz, P.leaf2);
      if (!dx || !dz) put(x + 3 * dx, h - 2, z + 3 * dz, P.leaf2);
    }
    put(x, h, z, P.leaf);
  };
  palm(53, 71, 10); palm(66, 83, 9);
  for (let x = 57; x <= 62; x++) for (let z = 74; z <= 79; z++) {
    const r = Math.hypot(x + 0.5 - 60, z + 0.5 - 77);
    if (r <= 3) put(x, 0, z, r > 2.2 ? P.stone : P.water, '', r <= 2.2);
  }
  put(59, 1, 76, P.stone); put(59, 2, 76, P.water3);

  // ---- the orange groves, and the farm with its cattle ----
  const earthRows = (x, y, z) => (z % 2 ? '#9B7349' : '#8B653F');
  ground(70, 46, 32, 42, earthRows);
  for (let x = 71; x < 100; x += 4) for (let z = 46; z < 86; z += 4) {
    if (x > 70 && x < 100 && z > 46 && z < 62) continue;               // the farm
    if (z > 62 && z < 67) continue;                                       // the ditch
    put(x, 0, z, P.trunk); put(x, 1, z, P.trunk);
    clump(x + 0.5, 2.8, z + 0.5, 1.8, 1.4, 1.8, (xx, yy, zz) => (hash(xx, yy, zz) < 0.16 ? P.orange : hash(xx, yy + 1, zz) < 0.4 ? P.pine : '#4C8A40'));
  }
  for (let x = 70; x < 102; x++) { del(x, -1, 64); put(x, -2, 64, P.water2); put(x, -1, 63, P.stone2); put(x, -1, 65, P.stone2); }   // an irrigation ditch
  const farm = block(86, 48, 97, 57, 0, 7, tone(P.white, [P.white2, 0.15]), 'masia');
  pitched(farm, 8, 'x', (x, y) => (y % 2 ? P.tile : P.tile2), P.white);
  windows(farm, ['S', 'N', 'E', 'W'], 3, 1, 2, 3, { glass: '#3C4550', sill: null });
  recess(farm, 'S', 91, 0, 2, 4, flat(P.wood2));
  fill(89, 4, 58, 7, 1, 2, P.tile, 'masia');                             // the porch roof
  for (const x of [89, 95]) fill(x, 0, 59, 1, 4, 1, P.wood, 'masia');
  // the corral, with cattle
  for (let x = 72; x <= 84; x++) for (let z = 48; z <= 60; z++) {
    if (x > 72 && x < 84 && z > 48 && z < 60) { put(x, -1, z, '#8E7A52'); continue; }
    put(x, 1, z, P.wood, 'masia'); if ((x + z) % 3 === 0) put(x, 0, z, P.wood, 'masia');
  }
  const cow = (x, z, dir) => {
    const hide = (xx, yy, zz) => (hash(xx, yy, zz) < 0.35 ? P.black : '#F3F1EC');
    fill(x, 1, z, 4, 2, 2, hide, 'masia');
    for (const [dx, dz] of [[0, 0], [3, 0], [0, 1], [3, 1]]) put(x + dx, 0, z + dz, '#3A3A3A', 'masia');
    const hx = dir > 0 ? x + 4 : x - 1;
    fill(hx, 2, z, 1, 2, 2, hide, 'masia'); put(hx + (dir > 0 ? 1 : -1), 2, z, '#E8A8A0', 'masia'); put(hx + (dir > 0 ? 1 : -1), 2, z + 1, '#E8A8A0', 'masia');
  };
  cow(74, 50, 1); cow(78, 55, -1); cow(75, 57, 1);

  // ---- el Port: the blast furnace, Alto Horno number 2, rusty in its steel frame ----
  const AX = 116, AZ = 14;
  const rust = tone(P.rust, [P.rust2, 0.3], ['#B06E45', 0.2]);
  const disc = (cx, cz, y, R, c, tag) => { for (let x = Math.floor(cx - R - 1); x <= cx + R + 1; x++) for (let z = Math.floor(cz - R - 1); z <= cz + R + 1; z++) if (Math.hypot(x + 0.5 - cx, z + 0.5 - cz) <= R) put(x, y, z, c, tag); };
  const ring = (cx, cz, y, r0, r1, c, tag, every = 1) => { for (let x = Math.floor(cx - r1 - 1); x <= cx + r1 + 1; x++) for (let z = Math.floor(cz - r1 - 1); z <= cz + r1 + 1; z++) { const r = Math.hypot(x + 0.5 - cx, z + 0.5 - cz); if (r > r0 && r <= r1 && (x + z) % every === 0) put(x, y, z, c, tag); } };
  for (let y = 0; y <= 33; y++) {
    const R = y < 5 ? 3.6 : y < 9 ? 3.6 + (y - 5) * 0.25 : y < 28 ? 4.6 - (y - 9) * 0.05 : 3.6 - (y - 28) * 0.35;
    disc(AX, AZ, y, R, y % 8 === 4 ? P.steel : rust, 'alt-forn');
  }
  // its frame: four columns, and three platforms with railings round it
  for (const [dx, dz] of [[-7, -7], [5, -7], [-7, 5], [5, 5]]) fill(AX + dx, 0, AZ + dz, 2, 38, 2, P.iron, 'alt-forn');
  for (const y of [12, 24, 36]) {
    for (let x = AX - 7; x <= AX + 6; x++) for (let z = AZ - 7; z <= AZ + 6; z++) {
      const edge = x === AX - 7 || x === AX + 6 || z === AZ - 7 || z === AZ + 6;
      if (edge || Math.hypot(x + 0.5 - AX, z + 0.5 - AZ) > 4.8) put(x, y, z, P.iron, 'alt-forn');
      if (edge && (x + z) % 2 === 0) put(x, y + 1, z, P.steel, 'alt-forn');
    }
  }
  for (const [dx, dz] of [[-2, -2], [1, -2], [-2, 1], [1, 1]]) fill(AX + dx, 34, AZ + dz, 1, 9, 1, P.rust2, 'alt-forn');   // the uptakes
  fill(AX - 2, 43, AZ - 2, 4, 1, 4, P.rust2, 'alt-forn');
  for (let i = 0; i < 11; i++) fill(AX - 3 - i, 42 - Math.floor(i * 2.3), AZ + 1 + Math.floor(i * 0.5), 2, 2, 1, P.rust2, 'alt-forn');   // the downcomer
  for (let y = 0; y <= 16; y++) disc(102, 20, y, y < 4 ? 1.2 : y < 7 ? 1.2 + (y - 4) * 0.5 : 2.8, y < 4 ? P.iron : rust, 'alt-forn');   // the dust catcher
  // three hot blast stoves in a row, pale steel with domed tops
  for (const cz of [2, 8, 14]) for (let y = 0; y <= 28; y++) disc(104, cz + 0.5, y, y < 25 ? 2.4 : 2.4 - (y - 24) * 0.55, y % 6 === 5 ? P.steel2 : tone('#B9BEC3', ['#A9AEB4', 0.3]), 'alt-forn');
  // the skip incline, a lattice from the quay up to the top
  for (let i = 0; i <= 30; i++) {
    const x = 126 - Math.round(i * 0.25), y = Math.round(i * 1.15), z = 22 - Math.round(i * 0.2);
    for (const dz of [0, 1]) if (i % 2 === 0 || dz === 0) put(x, y, z + dz, i % 3 ? P.rust2 : P.iron, 'alt-forn');
    if (i % 6 === 0) fill(x, 0, z, 1, y, 1, P.iron, 'alt-forn');
  }
  const cast = block(107, 23, 121, 29, 0, 6, tone(P.brick, [P.brick2, 0.3]), 'alt-forn');
  pitched(cast, 7, 'x', (x, y) => (y % 2 ? P.iron : P.rust2), P.brick);

  // ---- the hospital, and the plant that cleans its water ----
  ground(102, 36, 20, 34, tone(P.pave, [P.pave2, 0.3]));
  const hosp = block(104, 40, 121, 52, 0, 13, tone('#EEF0EF', ['#E3E7E6', 0.12]), 'hospital');
  for (const f of ['N', 'S', 'E', 'W']) { const [lo, hi] = span(hosp, f); for (const y of [2, 6, 10]) paint(hosp, f, lo + 1, y, hi - lo - 1, 2, (i) => (i % 3 === 2 ? [P.white, false] : ['#8FB8D4', true])); }
  recess(hosp, 'S', 110, 0, 5, 4, (i) => (i % 2 ? [P.glass, true] : [P.frame, false]));
  fill(108, 4, 53, 9, 1, 3, P.white2, 'hospital');
  fill(110, 14, 44, 5, 1, 5, P.white, 'hospital');
  for (let i = 0; i < 5; i++) { put(110 + i, 15, 46, P.red, 'hospital'); put(112, 15, 44 + i, P.red, 'hospital'); }   // a red cross on the roof
  // an ambulance at the door
  fill(118, 0, 56, 4, 3, 2, P.white, 'hospital'); fill(118, 1, 56, 4, 1, 2, P.red, 'hospital'); put(121, 2, 56, '#3C4550', 'hospital'); put(121, 2, 57, '#3C4550', 'hospital'); put(119, 3, 56, '#58A6FF', 'hospital', true);
  // two round tanks, a pipe from the hospital
  for (const cx of [108, 117]) for (let x = cx - 4; x <= cx + 4; x++) for (let z = 60; z <= 68; z++) {
    const r = Math.hypot(x + 0.5 - cx, z + 0.5 - 64.5);
    if (r > 4) continue;
    if (r > 3.2) fill(x, 0, z, 1, 2, 1, tone(P.stone, [P.stone2, 0.3]), 'hospital');
    else put(x, 0, z, (x + z) % 3 ? '#5E8F86' : '#6FA096', 'hospital');
  }
  for (const cx of [108, 117]) fill(cx - 3, 2, 64, 7, 1, 1, P.steel, 'hospital');
  for (let z = 53; z < 60; z++) put(112, 0, z, P.steel2, 'hospital');

  // ---- the harbour: a quay with a crane and containers, a ship ----
  ground(124, 0, 12, 34, tone('#BDBAB2', ['#B0ADA5', 0.3]));
  for (let z = 1; z < 33; z += 4) put(135, 0, z, P.dark);
  const boxes = [P.red, P.blue, P.green, P.ochre, '#E2E0DA', '#3F8B8E'];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const h = 1 + Math.floor(hash(i, 3, j) * 3); for (let y = 0; y < h; y++) fill(125 + j * 3, y * 2, 20 + i * 4, 2, 2, 3, boxes[Math.floor(hash(i, y, j) * boxes.length)]); }
  for (const x of [128, 134]) for (const z of [8, 16]) fill(x, 0, z, 1, 14, 1, P.blue);   // the container crane
  fill(128, 14, 8, 7, 1, 9, P.blue); fill(128, 15, 11, 20, 1, 3, P.blue); fill(143, 12, 12, 1, 3, 1, P.dark);
  // the sea: a basin by the quay, and open water past the beach
  for (let x = 124; x < W; x++) for (let z = 0; z < D; z++) {
    const port = z < 34 && x > 135, open = x > 135 + Math.round(Math.sin(z / 6) * 1.5);
    if (!(port || open)) continue;
    del(x, -1, z); del(x, -2, z);
    const shore = !(port || x - 1 > 135 + Math.round(Math.sin(z / 6) * 1.5));
    put(x, -2, z, shore ? P.foam : tone(P.sea, [P.sea2, 0.3], [P.sea3, 0.08]));
    for (let y = -6; y <= -3; y++) put(x, y, z, y < -4 ? P.deep : P.sea2);
  }
  // a cargo ship at the quay
  for (let x = 138; x <= 146; x++) for (let z = 3; z <= 29; z++) {
    const bow = z < 7 ? 7 - z : 0;
    if (x < 138 + Math.floor(bow / 2) || x > 146 - Math.ceil(bow / 2)) continue;
    put(x, -1, z, '#7E2F2A'); put(x, 0, z, P.black); put(x, 1, z, P.black);
    put(x, 2, z, P.steel2);
  }
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) fill(139 + j * 4, 3, 7 + i * 4, 3, 2, 3, boxes[(i + j * 2) % boxes.length]);
  const bridgeHouse = block(139, 24, 145, 28, 3, 9, P.white, '');
  paint(bridgeHouse, 'N', 139, 8, 7, 1, flat('#3C4550', true));
  fill(141, 10, 26, 2, 2, 2, P.red); fill(141, 12, 26, 2, 1, 2, P.black);

  // ---- the beach, with umbrellas, a lifeguard's chair and the promenade's palms ----
  for (let x = 122; x < W; x++) for (let z = 34; z < 92; z++) if (colorAt(x, -1, z)) put(x, -1, z, tone(P.sand, [P.sand2, 0.35]), 'platja');
  ground(120, 34, 2, 58, tone(P.pave, [P.pave2, 0.3]));
  const stripes = [[P.red, P.white], [P.blue, P.white], [P.ochre, P.white], [P.green, P.white]];
  [[125, 40], [129, 47], [124, 55], [130, 62], [126, 70], [129, 79]].forEach(([x, z], i) => {
    fill(x, 0, z, 1, 3, 1, P.white, 'platja');
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) put(x + dx, 3, z + dz, stripes[i % 4][(dx + 1) % 2], 'platja');
    fill(x + 1, 0, z + 2, 2, 1, 1, boxes[i % boxes.length], 'platja');
  });
  fill(132, 0, 50, 1, 4, 1, P.wood, 'platja'); fill(134, 0, 50, 1, 4, 1, P.wood, 'platja'); fill(132, 4, 50, 3, 1, 2, P.wood, 'platja'); fill(132, 5, 51, 3, 2, 1, P.white, 'platja'); put(133, 6, 51, P.red, 'platja');
  for (const z of [38, 50, 62, 74, 86]) palm(121, z, 9);

  // ---- the road: the Sagunt stop by the town, the roundabout at the port where the bus turns ----
  road(0, 108); roundabout(114, 92); shelter(46, 90);
  for (const x of [8, 30, 64, 88, 104]) { fill(x, 0, 91, 1, 8, 1, P.dark); put(x, 8, 91, P.light, '', true); put(x, 9, 91, P.dark); }
  for (let x = 52; x <= 55; x++) for (let z = 92; z <= 95; z++) if (x % 2 === 0) put(x, -1, z, P.white);   // a zebra crossing

  // ---- people ----
  const person = (x, z, shirt, hair = P.hair, y = 0) => { put(x, y, z, P.dark); put(x, y + 1, z, shirt); put(x, y + 2, z, P.skin); if (hair) put(x, y + 3, z, hair); };
  [[56, 72, P.red], [62, 81, P.blue, '#D9A441'], [45, 90, P.green], [80, 58, P.plum, '#8A4B2E'], [99, 60, P.ochre], [110, 57, P.white],
    [127, 44, P.red, null], [131, 58, P.blue], [126, 76, P.ochre, '#D9A441'], [18, 70, P.stone], [36, 88, lineages[3 % lineages.length]]].forEach(([x, z, c, h]) => person(x, z, c, h === undefined ? P.hair : h));

  return b.finish({ pins: { castell: [56, 24, 20], 'alt-forn': [114, 24, 22] } });
}

// ---- Paterna: the Parc Cientific, and I2SysBio, where I work ----
// The site is on two levels: a plateau with the car park, the promenade along its edge and the
// institute's door, and a lawn that slopes down from it, crossed by a zigzag path, to the street
// where the tram stops. The institute stands at an angle to it all: its door is up on the plateau,
// and as the ground falls away it goes on level, held up on pillars (it is built on a grid of its
// own, buildI2, turned and set down here).
const TOP = 8;                                                              // the plateau's top block
const I2 = { cx: 60, cz: 40, turn: 0.5, sign: [67, 55] };                   // where the institute stands, and its sign in front of it, on the slope
function siteH(x, z) {
  if (z > 81) return -1;                                                    // the street along the south
  // a level patch in the slope for the sign, along the building's front
  const [sx, sz] = I2.sign, [c, s] = [Math.cos(I2.turn), Math.sin(I2.turn)], dx = x + 0.5 - sx, dz = z + 0.5 - sz;
  if (Math.abs(dx * c - dz * s) <= 9 && Math.abs(dx * s + dz * c) <= 2.5) return 4;
  if (x <= 58) return TOP;                                                  // the plateau
  if (x <= 60) return TOP - 3;                                              // a step down, under the railing
  return Math.max(-1, Math.round(TOP - 3 - 6 * (x - 61) / 45));            // the lawn, down to the street's level
}
function buildPaterna() {
  const b = makeBoard();
  const { W, D, put, colorAt, del, fill, ground, clump } = b;
  b.lawn();
  const pave = tone(P.pave, [P.pave2, 0.3]);
  const concrete = tone('#C9C0AE', ['#BEB5A2', 0.3], ['#D2CABA', 0.1]);
  const earth = tone(P.dirt, [P.dirt2, 0.2], [P.pebble, 0.06]);
  const lawn = tone(P.grass, [P.grass2, 0.3], ['#A7B56A', 0.12], ['#9DAA60', 0.06]);

  // ---- the ground: raised into the plateau and the slope, a wall where they meet the street ----
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    const h = siteH(x, z);
    if (h <= -1) continue;
    for (let y = -1; y < h; y++) put(x, y, z, z >= 80 ? concrete : earth);
    put(x, h, z, z >= 80 ? concrete : x <= 58 ? tone(P.grass, [P.grass2, 0.2]) : lawn);
  }
  // the promenade along the plateau's edges, with a railing over the drops
  for (let x = 0; x <= 58; x++) for (let z = 72; z <= 79; z++) put(x, TOP, z, ((x >> 2) + (z >> 2)) % 2 ? '#D8D4CA' : '#CDC8BD');
  for (let z = 0; z <= 79; z++) for (let x = 54; x <= 58; x++) put(x, TOP, z, ((x >> 2) + (z >> 2)) % 2 ? '#D8D4CA' : '#CDC8BD');
  for (let x = 0; x <= 58; x++) { if (x % 2 === 0) put(x, TOP + 1, 80, P.steel2); put(x, TOP + 2, 80, P.steel); }
  for (let z = 0; z <= 79; z++) { if (z % 2 === 0) put(59, TOP + 1, z, P.steel2); put(59, TOP + 2, z, P.steel); }
  for (let x = 61; x <= 106; x++) { const h = siteH(x, 79); if (x % 2 === 0) put(x, h + 1, 80, P.steel2); put(x, h + 2, 80, P.steel); }
  for (const x of [10, 26, 42]) { fill(x, TOP + 1, 76, 1, 8, 1, P.dark); put(x, TOP + 9, 76, P.light, '', true); put(x, TOP + 10, 76, P.dark); }
  for (const x of [18, 34]) { fill(x, TOP + 1, 74, 3, 1, 1, P.plank); put(x, TOP + 1, 75, P.dark); put(x + 2, TOP + 1, 75, P.dark); fill(x, TOP + 2, 75, 3, 1, 1, P.plank); }
  // the car park on the plateau
  const tarmac = tone(P.asphalt, [P.asphalt2, 0.25]);
  for (let x = 2; x <= 26; x++) for (let z = 4; z <= 66; z++) put(x, TOP, z, x === 14 || z % 6 === 0 ? '#E8E6DF' : tarmac(x, TOP, z));
  const cars = [P.red, P.white, P.blue, '#3C4550', '#B9BEC3', P.ochre];
  for (let z = 7; z < 64; z += 6) for (const x of [4, 17]) if (hash(x, 1, z) < 0.7) {
    fill(x, TOP + 1, z, 5, 1, 3, cars[Math.floor(hash(x, 2, z) * cars.length)]); fill(x + 1, TOP + 2, z, 3, 1, 3, '#2E3844');
  }
  // the way in: paving from the promenade to the institute's door
  for (let x = 30; x <= 53; x++) for (let z = 50; z <= 71; z++) if (x > 44 || z > 64) put(x, TOP, z, pave);

  // ---- the lawn: a zigzag path down to the street, picnic tables, young trees, cypresses at the foot ----
  const path = [[61, 66], [76, 76], [84, 62], [98, 76], [108, 84]];
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, az] = path[i], [bx, bz] = path[i + 1], n = Math.max(Math.abs(bx - ax), Math.abs(bz - az)) * 2;
    for (let k = 0; k <= n; k++) {
      const x = Math.round(ax + (bx - ax) * k / n), z = Math.round(az + (bz - az) * k / n);
      for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) if (z + dz < 80) put(x + dx, siteH(x + dx, z + dz), z + dz, tone('#CFC7B5', ['#C2B9A5', 0.3]));
    }
  }
  const table = (x, z) => {
    const s = siteH(x, z);
    for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 4; dz++) { for (let y = siteH(x + dx, z + dz) + 1; y <= s; y++) put(x + dx, y, z + dz, earth); put(x + dx, s, z + dz, lawn); }   // a level patch
    fill(x, s + 1, z, 4, 1, 1, P.wood2, 'xarxa'); fill(x, s + 1, z + 3, 4, 1, 1, P.wood2, 'xarxa');
    fill(x, s + 2, z + 1, 4, 1, 2, P.plank, 'xarxa');
    for (const dx of [0, 3]) fill(x + dx, s + 1, z + 1, 1, 1, 2, P.dark, 'xarxa');
  };
  table(90, 46); table(88, 70); table(96, 56);
  const sapling = (x, z) => { const s = siteH(x, z); fill(x, s + 1, z, 1, 5, 1, P.trunk); fill(x + 1, s + 1, z, 1, 3, 1, P.plank); clump(x + 0.5, s + 6.5, z + 0.5, 1.5, 1.3, 1.5, tone(P.leaf3, [P.leaf, 0.4]), '', 0.9); };
  for (const [x, z] of [[80, 54], [92, 66], [102, 70], [74, 70], [104, 50], [100, 40]]) sapling(x, z);
  for (let z = 30; z <= 74; z += 4) { const s = siteH(110, z); fill(110, s + 1, z, 2, 11 + (z % 3), 2, tone(P.pine2, [P.pine, 0.4])); put(110, s + 12 + (z % 3), z, P.pine2); }

  // ---- the street below: a pavement, and palms on a small square to the east ----
  ground(0, 82, W, 7, (x, y, z) => ((x >> 2) + (z >> 2)) % 2 ? '#D8D4CA' : '#CDC8BD');
  ground(114, 0, 34, 82, tone(P.pave3, [P.pave2, 0.3]));
  const palm = (x, z, h, y0 = 0) => {
    fill(x, y0, z, 1, h, 1, (xx, y) => (y % 2 ? '#8A6A48' : '#7A5C3C'));
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
      put(x + dx, y0 + h, z + dz, P.leaf); put(x + 2 * dx, y0 + h - 1, z + 2 * dz, P.leaf2);
      if (!dx || !dz) put(x + 3 * dx, y0 + h - 2, z + 3 * dz, P.leaf2);
    }
    put(x, y0 + h, z, P.leaf);
  };
  for (const [x, z] of [[120, 10], [134, 18], [142, 36], [122, 50], [140, 64], [128, 76]]) palm(x, z, 9 + (x % 3));
  for (const [x, z] of [[6, 70], [30, 6], [46, 20]]) palm(x, z, 8, TOP + 1);
  for (let x = 116; x <= 146; x += 10) { fill(x, 0, 44, 3, 1, 1, P.plank); fill(x, 1, 45, 3, 1, 1, P.plank); }

  // ---- the tram stop, Santa Gemma - Parc Cientific UV, on line 4, and the line to Valencia ----
  b.tramLine(50, W - 1, 62, 98);

  // ---- people ----
  const person = (x, z, shirt, hair = P.hair) => { const s = siteH(x, z); put(x, s + 1, z, P.dark); put(x, s + 2, z, shirt); put(x, s + 3, z, P.skin); if (hair) put(x, s + 4, z, hair); };
  [[92, 50, P.blue], [94, 50, P.red, '#D9A441'], [90, 73, P.green], [44, 68, P.plum], [30, 76, P.ochre], [84, 86, P.white, null], [90, 90, P.stone], [100, 78, P.red]].forEach(([x, z, c, h]) => person(x, z, c, h === undefined ? P.hair : h));

  return b.finish({ pins: { xarxa: [98, 12, 58] } });
}

// the institute on a grid of its own, 64 blocks by 40: four bays of a concrete grid filled with white
// louvers over a band of glass, five floors from its door; the tower at its west end, cream, taller,
// with the strip of glass over the door and the perforated canopy; an open frame on the roof; and,
// where the ground (ground(x, z) gives its top block) falls away beneath it, pillars down to it
function buildI2(ground) {
  const b = makeBoard(64, 40);
  const { put, fill, block, side, span, paint, recess, flat } = b;
  const concrete = tone('#C9C0AE', ['#BEB5A2', 0.3], ['#D2CABA', 0.1]);
  const cream = tone('#E5DBC7', ['#DBD0BA', 0.3]);
  const base = TOP + 1, F = 5, top = base + 5 * F;
  const main = block(16, 10, 55, 29, base, top, concrete, 'i2sysbio');
  const louver = (y) => (y % 2 ? '#FBFBF8' : '#D3D5D2');
  const facade = (f) => {
    const [lo, hi] = span(main, f), s = side(main, f);
    for (let a = lo; a <= hi; a++) for (let y = base; y <= top; y++) {
      const pillar = (a - lo) % 10 < 2 || a >= hi - 1, slab = (y - base) % F === 0 || y === top;
      if (pillar || slab) { put(...s(a, y, -1), concrete, 'i2sysbio'); continue; }
      const k = (y - base) % F, down = hash(Math.floor((a - lo) / 10), Math.floor((y - base) / F), f.charCodeAt(0)) < 0.3;
      if (k === 1 && !down) { const mull = (a - lo) % 10 === 6; put(...s(a, y, 0), mull ? P.white : '#5E7F94', 'i2sysbio', !mull); }
      else put(...s(a, y, 0), louver(y), 'i2sysbio');
    }
  };
  for (const f of ['S', 'N', 'E']) facade(f);
  // the roof: gravel, its plant, and the grid going on up into an open frame
  for (let x = 16; x <= 55; x++) for (let z = 10; z <= 29; z++) {
    const edge = x === 16 || x === 55 || z === 10 || z === 29;
    if (!edge) { put(x, top, z, hash(x, 6, z) < 0.3 ? '#BDB6A8' : '#C9C3B6', 'i2sysbio'); continue; }
    if ((x - 16) % 10 < 2 || x >= 54 || (z - 10) % 10 < 2 || z >= 28) fill(x, top + 1, z, 1, 3, 1, concrete, 'i2sysbio');
    put(x, top + 4, z, concrete, 'i2sysbio');
  }
  fill(30, top + 1, 15, 8, 2, 6, P.steel, 'i2sysbio'); fill(42, top + 1, 17, 5, 3, 5, P.steel2, 'i2sysbio');
  // the tower at the west end, the way in at its foot
  const tower = block(4, 8, 15, 31, base, top + 6, cream, 'i2sysbio');
  paint(tower, 'S', 7, base + 6, 6, top - base - 4, (i, j) => (i === 0 || i === 5 || j % 4 === 0 ? [P.white, false] : ['#8FB6CE', true]));
  recess(tower, 'S', 7, base, 6, 5, (i, j) => (j === 4 || i % 2 === 0 ? [P.frame, false] : [P.glass, true]));
  for (let x = 5; x <= 14; x++) for (let z = 32; z <= 33; z++) put(x, base + 5, z, (x + z) % 2 ? P.steel2 : P.dark, 'i2sysbio');   // the perforated canopy
  paint(tower, 'S', 4, base, 3, 10, (i) => (i % 2 ? null : [P.white, false]), -1);                                     // white fins beside the door
  // pillars down to the falling ground: under the grid's columns, front and back, and along the middle
  const pillars = [];
  for (let x = 16; x <= 55; x += 10) for (const z of [9, 19, 29]) pillars.push([Math.min(x, 54), z]);
  pillars.push([54, 9], [54, 19], [54, 29]);
  for (const [x, z] of pillars) {
    const g = Math.min(ground(x, z), ground(x + 1, z), ground(x, z + 1), ground(x + 1, z + 1));
    if (g < base - 1) fill(x, g + 1, z, 2, base - 1 - g, 2, concrete, 'i2sysbio');
  }
  return b.finish({ pins: { i2sysbio: [36, top + 8, 20] } });
}

// ---- inside I2SysBio: the lab ----
// A floor of the institute, as its photographs show it, open like a doll's house: the walls on your
// side drop to their skirting as you turn it round. Islands of white benches, each with a panel of
// sockets down its spine, a lamp over it on two posts and a sink at its end; the bench under the
// windows, the white louvers outside them; the biosafety cabinets in a row, pink medium on their steel;
// the fridges, the -80, the incubators and their gas along the wall, the door and the coats on their
// hooks; the desks, two screens on each, where the genomes are read (mine is in thesis mode), and the
// coffee. What shines by itself, screens and lit panels, is drawn in its own colours day and night.
const LAB_WALLS = { N: [1, 0, -1], S: [2, 0, 1], W: [3, -1, 0], E: [4, 1, 0] };   // each wall's part, and the way it faces
function buildLab(lineages) {
  const b = makeBoard();
  const { W, D, put, del, fill, clump, inPart } = b;
  const H = 18;                                                                          // the top of the walls
  const white = '#F4F4F0', grey = '#9AA1A8', dark = '#2E3238', steel = '#B8BEC4', black = '#26292D', cap = '#A69F92';
  const plaster = tone('#F2EFE8', ['#EAE6DD', 0.18]);
  const slab = tone('#BDB6A8', ['#B1AA9C', 0.3]);
  const SHINE = 2;                                                                       // lit by itself

  // ---- the floor, and the slab under it, cut where the lab ends ----
  const vinyl = tone('#DADBD6', ['#D2D3CE', 0.2], ['#E1E2DD', 0.08]);
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { put(x, -1, z, vinyl); put(x, -2, z, slab); put(x, -3, z, slab); put(x, -4, z, '#A8A194'); }

  // ---- the walls: a grey skirting that stays, and above it the wall, which can go ----
  const wall = (k, x0, z0, w, d) => { fill(x0, 0, z0, w, 2, d, '#8E959C'); inPart(k, () => { fill(x0, 2, z0, w, H - 2, d, plaster); fill(x0, H, z0, w, 1, d, cap); }); };
  wall(1, 0, 0, W, 1); wall(2, 0, D - 1, W, 1); wall(3, 0, 1, 1, D - 2); wall(4, W - 1, 1, 1, D - 2);
  // the building's columns, where the windows break
  wall(1, 34, 1, 3, 2); wall(1, 68, 1, 3, 2); wall(1, 101, 1, 3, 2); wall(4, W - 3, 45, 2, 3);
  // the windows, from the bench up, framed every nine blocks and across the middle: through most
  // panes the white louvers outside and the light between them, through the rest the Parc
  const glazing = (k, a0, a1) => inPart(k, () => {
    for (let a = a0; a <= a1; a++) {
      const open = hash(Math.floor((a - a0) / 9), 7, a0) < 0.35;
      for (let y = 5; y < H; y++) {
        const frame = (a - a0) % 9 === 0 || a === a1 || y === 5 || y === 11 || y === H - 1;
        const c = frame ? '#8C9399' : !open ? (y % 2 ? '#F8F8F4' : '#B9D5E2')
          : y > 7 ? '#CFE5EF' : a % 11 < 4 ? '#6E9E5E' : hash(a, y, 5) < 0.5 ? '#B8735A' : '#C6866B';   // the sky; a tree, or brick
        if (k === 1) put(a, y, 0, c); else put(W - 1, y, a, c);
      }
    }
  });
  glazing(1, 1, 33); glazing(1, 37, 67); glazing(1, 71, 100); glazing(4, 5, 44); glazing(4, 48, D - 6);

  // ---- furniture ----
  // a worktop, pale with a dark edge, and white cupboards under it, doors to the side the room sees
  const worktop = (x0, z0, x1, z1, tag = '') => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) put(x, 5, z, x === x0 || x === x1 || z === z0 || z === z1 ? '#4E545A' : '#E7E8E4', tag); };
  const cupboards = (x0, z0, x1, z1, f, tag = '') => {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) { put(x, 0, z, '#6B7178', tag); for (let y = 1; y <= 4; y++) put(x, y, z, white, tag); }
    const [lo, hi] = f === 'S' || f === 'N' ? [x0, x1] : [z0, z1];
    for (let a = lo; a <= hi; a++) {
      const [x, z] = f === 'S' ? [a, z1] : f === 'N' ? [a, z0] : f === 'E' ? [x1, a] : [x0, a];
      if ((a - lo) % 4 === 0) for (let y = 1; y <= 4; y++) put(x, y, z, '#DCDDD8', tag);
      if ((a - lo) % 4 === 2) put(x, 3, z, grey, tag);
    }
  };
  // what stands on the benches, from y up
  const bottle = (x, y, z, glass = '#D6ECF3', lid = '#2D6CB5', tag = '') => { fill(x, y, z, 1, 2, 1, glass, tag); put(x, y + 2, z, lid, tag); };
  const tips = (x, y, z, c, tag = '') => fill(x, y, z, 2, 1, 2, c, tag);
  const rack = (x, y, z, tag = '') => { fill(x, y, z, 3, 1, 2, white, tag); BASES.slice(0, 3).forEach((c, i) => put(x + i, y + 1, z + (i % 2), c, tag)); };
  const pipettes = (x, y, z, tag = '') => { fill(x, y, z, 2, 1, 2, dark, tag); fill(x, y + 1, z, 1, 4, 1, grey, tag); [['#F5D35B', 1, 0], ['#3F6FC4', 0, 1], ['#E0603C', 1, 1]].forEach(([c, dx, dz]) => fill(x + dx, y + 2, z + dz, 1, 3, 1, c, tag)); };
  const fuge = (x, y, z, tag = '') => { fill(x, y, z, 3, 2, 3, white, tag); fill(x, y + 2, z, 3, 1, 3, '#4A5058', tag); put(x + 1, y + 2, z + 1, '#6E757D', tag); put(x + 1, y + 1, z + 2, '#6BE07F', tag, SHINE); };
  const stirrer = (x, y, z, tag = '') => { fill(x, y, z, 2, 1, 2, white, tag); fill(x, y + 1, z, 2, 1, 2, '#3C4148', tag); fill(x, y + 2, z, 1, 2, 1, '#CFE7EF', tag); };
  const balance = (x, y, z, tag = '') => { fill(x, y, z, 3, 1, 3, white, tag); fill(x, y + 1, z, 3, 2, 2, '#D9EEF4', tag); put(x + 1, y, z + 2, '#6BE07F', tag, SHINE); };
  const pcr = (x, y, z, tag = '') => { fill(x, y, z, 3, 2, 4, '#C9CDD1', tag); fill(x, y + 2, z, 3, 1, 3, '#555B62', tag); put(x + 1, y + 1, z + 3, '#4FA3D9', tag, SHINE); };
  const scope = (x, y, z, tag = '') => { fill(x, y, z, 3, 1, 3, white, tag); fill(x + 1, y + 1, z, 1, 3, 1, dark, tag); fill(x, y + 2, z + 1, 3, 1, 2, dark, tag); fill(x, y + 4, z, 3, 1, 2, white, tag); put(x + 1, y + 5, z, dark, tag); };
  const notebook = (x, y, z, c = '#3E9B5A', tag = '') => fill(x, y, z, 2, 1, 1, c, tag);
  const ice = (x, y, z, tag = '') => { fill(x, y, z, 2, 2, 2, '#3E7FD1', tag); fill(x, y + 2, z, 2, 1, 2, white, tag); };
  const stool = (x, z, tag = '') => { fill(x, 3, z, 3, 1, 3, black, tag); fill(x + 1, 1, z + 1, 1, 2, 1, grey, tag); for (const [dx, dz] of [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]]) put(x + dx, 0, z + dz, dark, tag); };
  const plant = (x, y, z, big = false) => { fill(x, y, z, big ? 3 : 1, big ? 3 : 1, big ? 3 : 1, '#E8E4DA'); clump(x + (big ? 1.5 : 0.5), y + (big ? 6 : 2.2), z + (big ? 1.5 : 0.5), big ? 3 : 1.3, big ? 3.6 : 1.2, big ? 3 : 1.3, tone(P.leaf, [P.leaf2, 0.35], [P.leaf3, 0.15]), '', 0.6); };
  const mug = (x, z, c, tag = '') => { put(x, 5, z, c, tag); put(x + 1, 5, z, shade(c, 0.8), tag); };

  // a person four blocks across, looking N, S, E or W: standing, working at a bench with their hands
  // out over it, or sitting, on a stool or at a desk on an office chair; a white coat or their own
  // clothes, blue gloves, a mask, hair short, long, tied back or in a bun. `empty`: only the chair.
  function person(x, z, face, { pose = 'stand', coat = true, top = '#5B7A99', legs = '#3B4F73', shoes = '#2A2D33', skin = P.skin, hair = '#3A2A20', style = 'short', gloves = false, mask = false, empty = false, tag = '' } = {}) {
    // a runs across them (0 to 3), f from their back (0) to their front (1) and on out ahead of them
    const at = (a, f) => (face === 'S' ? [x + 3 - a, z + f] : face === 'N' ? [x + a, z + 1 - f] : face === 'E' ? [x + f, z + a] : [x + 1 - f, z + 3 - a]);
    const p = (a, y, f, c) => { const [px, pz] = at(a, f); put(px, y, pz, c, tag); };
    const sit = pose === 'sit' || pose === 'stool', seat = pose === 'sit' ? 2 : 3, base = sit ? seat + 2 : 5;
    const body = coat ? '#F6F6F2' : top, hands = gloves ? '#6C9BE0' : skin;
    if (sit) {
      // the seat on its column and foot, and an office chair's back
      for (let a = 0; a < 4; a++) for (let f = 0; f < 2; f++) p(a, seat, f, black);
      for (let y = 1; y < seat; y++) p(1, y, 0, grey);
      for (const [a, f] of [[1, 0], [0, 0], [3, 0], [1, -1], [1, 1]]) p(a, 0, f, dark);
      if (pose === 'sit') for (let a = 0; a < 4; a++) for (let y = seat + 1; y <= seat + 5; y++) p(a, y, -1, black);
      if (empty) return;
      for (let a = 0; a < 4; a++) {
        for (let f = 0; f <= 2; f++) p(a, seat + 1, f, legs);
        for (let y = 1; y <= seat; y++) p(a, y, 2, a === 1 || a === 2 ? shade(legs, 0.85) : legs);
        p(a, 0, 2, shoes); p(a, 0, 3, shoes);
      }
    } else for (let a = 0; a < 4; a++) for (let f = 0; f < 2; f++) {
      p(a, 0, f, shoes);
      for (let y = 1; y <= 4; y++) p(a, y, f, coat && y === 4 ? body : (a === 1 || a === 2) && y < 3 ? shade(legs, 0.82) : legs);
    }
    // the body, the shirt at a coat's neck, the arms: down at the sides, or out in front
    for (let a = 0; a < 4; a++) for (let f = 0; f < 2; f++) for (let y = base; y < base + 4; y++) p(a, y, f, body);
    if (coat) { p(1, base + 3, 1, top); p(2, base + 3, 1, top); }
    const reach = pose !== 'stand';
    for (const a of [-1, 4]) {
      for (let y = reach ? base + 2 : base + 1; y < base + 4; y++) for (let f = 0; f < 2; f++) p(a, y, f, body);
      if (reach) { p(a, base + 1, 1, body); p(a, base + 1, 2, body); p(a, base + 1, 3, hands); } else p(a, base, 1, hands);
    }
    // the head: a face to the front with its eyes, the hair over the back and the top
    for (let a = 0; a < 4; a++) for (let f = 0; f < 2; f++) for (let y = base + 4; y < base + 7; y++) p(a, y, f, skin);
    p(1, base + 5, 1, '#2B2522'); p(2, base + 5, 1, '#2B2522');
    if (mask) for (let a = 0; a < 4; a++) p(a, base + 4, 1, '#BFD9EE');
    for (let a = 0; a < 4; a++) {
      for (let y = style === 'short' ? base + 5 : base + 4; y <= base + 6; y++) p(a, y, 0, hair);
      p(a, base + 6, 1, hair); p(a, base + 7, 0, hair); p(a, base + 7, 1, hair);
      if (style === 'long') for (let y = base + 2; y <= base + 6; y++) p(a, y, -1, hair);
    }
    if (style === 'pony') { p(1, base + 6, -1, hair); p(2, base + 6, -1, hair); p(1, base + 5, -1, hair); p(2, base + 4, -1, hair); }
    if (style === 'bun') { p(1, base + 8, 0, hair); p(2, base + 8, 0, hair); p(1, base + 7, -1, hair); p(2, base + 7, -1, hair); }
  }

  // ---- the bench under the windows, the west end of the north wall ----
  for (const [x0, x1] of [[9, 33], [37, 67], [71, 100]]) { cupboards(x0, 1, x1, 5, 'S'); worktop(x0, 1, x1, 5); }
  stirrer(11, 6, 2); stirrer(14, 6, 2); balance(21, 6, 2); bottle(28, 6, 3); bottle(29, 6, 2, '#B7772F', '#26292D');
  fuge(40, 6, 2); balance(45, 6, 2); bottle(56, 6, 3, '#D6ECF3', '#3E9B5A'); stirrer(59, 6, 2); fill(62, 6, 2, 4, 2, 3, steel); fill(62, 8, 2, 4, 1, 3, '#8E959C');
  scope(74, 6, 2); bottle(80, 6, 3, '#B7772F', '#26292D'); stirrer(84, 6, 2); tips(90, 6, 3, '#58B368'); rack(94, 6, 2); bottle(99, 6, 3);
  person(50, 6, 'N', { pose: 'work', hair: '#1E1B1A', style: 'bun', skin: '#E8B990' });

  // ---- the biosafety cabinets along the rest of it: on a stand, the sash up and the lamp on inside,
  // the panel over it, the biohazard label; pink medium, a rack and a pipette on the steel ----
  const cabinet = (x0) => {
    for (const [x, z] of [[x0, 1], [x0 + 10, 1], [x0, 6], [x0 + 10, 6]]) fill(x, 0, z, 1, 4, 1, grey);
    fill(x0, 1, 1, 11, 1, 1, grey);
    fill(x0, 4, 1, 11, 12, 6, '#EDEFEE');
    for (let x = x0 + 1; x <= x0 + 9; x++) {
      for (let z = 2; z <= 6; z++) { for (let y = 5; y <= 7; y++) del(x, y, z); put(x, 4, z, steel); }
      for (let y = 5; y <= 7; y++) put(x, y, 1, '#FFFFFF', '', SHINE);
      for (let y = 8; y <= 11; y++) put(x, y, 6, '#C4E2EC', '', true);
      put(x, 12, 6, '#3F454C');
    }
    put(x0 + 2, 12, 6, '#6BE07F', '', SHINE); put(x0 + 8, 13, 6, '#F2C230'); put(x0 + 8, 14, 6, '#F2C230'); put(x0 + 9, 14, 6, '#F2C230');
    fill(x0 + 2, 5, 3, 2, 2, 1, '#EE8FA6'); put(x0 + 2, 7, 3, '#F4F4F0'); rack(x0 + 5, 5, 3); put(x0 + 8, 5, 4, '#3F6FC4'); put(x0 + 8, 6, 4, '#3F6FC4');
  };
  [106, 119, 132].forEach(cabinet);
  person(109, 8, 'N', { pose: 'stool', gloves: true, hair: '#3A2A20', style: 'pony' });
  person(122, 8, 'N', { pose: 'stool', empty: true });
  person(135, 8, 'N', { pose: 'stool', gloves: true, mask: true, hair: '#7A5230', skin: '#E8B990' });
  fill(143, 0, 8, 3, 4, 3, '#F2C230'); fill(143, 4, 8, 3, 1, 3, '#E0B020'); put(144, 2, 10, black);   // the yellow bin, for what has touched the cells

  // ---- along the west wall: a fridge, the -80, two incubators on a stand and their gas, the
  // reagents behind a glass door; the basin, the extinguisher, the door, the coats ----
  fill(1, 0, 8, 5, 14, 6, '#F3F3F0'); for (let z = 8; z <= 13; z++) { put(5, 0, z, '#6B7178'); put(5, 9, z, '#D5D6D2'); }
  fill(6, 5, 12, 1, 3, 1, grey); fill(6, 10, 12, 1, 3, 1, grey); put(5, 12, 9, '#6BE07F', '', SHINE);
  fill(1, 0, 16, 7, 14, 8, '#E9EAE7'); for (let z = 16; z <= 23; z++) { put(7, 0, z, '#6B7178'); put(7, 1, z, z % 2 ? '#6B7178' : '#E9EAE7'); put(7, 12, z, '#3F454C'); }
  put(7, 12, 18, '#5FB0E8', '', SHINE); put(7, 12, 19, '#5FB0E8', '', SHINE); fill(8, 5, 22, 1, 5, 1, dark);
  for (const [x, z] of [[1, 26], [6, 26], [1, 32], [6, 32]]) fill(x, 0, z, 1, 4, 1, grey);
  for (const y0 of [4, 10]) {
    fill(1, y0, 26, 6, 6, 7, '#CDD2D6');
    for (let z = 26; z <= 32; z++) for (let y = y0; y < y0 + 6; y++) if (z === 26 || z === 32 || y === y0 || y === y0 + 5) put(6, y, z, '#AEB4BA');
    put(6, y0 + 4, 28, '#6BE07F', '', SHINE); put(6, y0 + 4, 29, '#6BE07F', '', SHINE);
  }
  fill(2, 0, 34, 2, 13, 2, '#8E959C'); fill(2, 13, 34, 2, 1, 2, '#5B6168'); put(2, 14, 34, dark); put(1, 9, 34, dark); put(1, 9, 35, dark);
  fill(1, 0, 38, 5, 15, 7, white);
  for (let z = 39; z <= 43; z++) for (let y = 2; y <= 13; y++) {
    const shelf = y % 3 === 2, r = hash(z, y, 40);
    put(5, y, z, shelf ? steel : r < 0.25 ? '#D6ECF3' : r < 0.45 ? '#2D6CB5' : r < 0.6 ? '#B7772F' : r < 0.75 ? '#C8372D' : r < 0.85 ? '#3E9B5A' : '#EDF6F9', '', SHINE);
  }
  fill(1, 0, 50, 3, 5, 5, white); for (let z = 51; z <= 53; z++) { put(2, 5, z, steel); put(3, 5, z, steel); } put(2, 4, 52, '#7F868D'); del(2, 5, 52); put(1, 6, 52, steel); put(1, 7, 52, steel); put(2, 7, 52, steel);
  inPart(3, () => {
    fill(1, 8, 51, 1, 3, 3, white); put(1, 8, 52, grey); put(1, 7, 54, '#3F6FC4');                  // the towels and the soap
    fill(1, 3, 57, 1, 3, 1, '#C8372D'); put(1, 6, 57, black);                                       // the extinguisher
    fill(1, 10, 60, 1, 2, 2, '#24324A'); put(1, 11, 60, '#FFFFFF');                                // the plate by the door
    fill(1, 16, 65, 1, 1, 6, '#2FA35A', '', SHINE); put(1, 16, 67, '#FFFFFF', '', SHINE);           // the way out, lit
    // the door, open: the corridor through its frame, and the leaf swung into the room on its hinges
    for (let z = 63; z <= 72; z++) for (let y = 2; y <= 15; y++) { const way = z > 63 && z < 72 && y < 15; put(0, y, z, way ? '#8F99A3' : '#6B7178', way ? 'out' : ''); }
    for (let x = 1; x <= 8; x++) for (let y = 0; y <= 14; y++) put(x, y, 63, x >= 3 && x <= 5 && y >= 8 && y <= 12 ? '#A9CFE3' : x === 8 || y === 14 ? '#B8956A' : '#C9A67A', 'out');
    put(7, 7, 64, steel, 'out');
    fill(1, 14, 75, 1, 1, 11, steel);                                                              // the hooks, and the coats on them
    for (const z0 of [75, 79, 83]) for (let z = z0; z < z0 + 3; z++) for (let y = 6; y <= 13; y++) put(1, y, z, y === 13 ? '#E4E4DE' : y === 8 && z === z0 + 1 ? '#E1E1DB' : '#F6F6F2');
  });
  for (let z = 64; z <= 71; z++) { put(0, 0, z, '#8F99A3', 'out'); put(0, 1, z, '#8F99A3', 'out'); for (let x = 1; x <= 6; x++) put(x, -1, z, '#5C636B'); }   // and a mat
  // a big centrifuge on the floor, a plant in the corner
  fill(12, 0, 46, 6, 6, 6, white); fill(12, 6, 46, 6, 1, 6, '#4A5058'); put(14, 6, 48, '#6E757D'); put(15, 6, 49, '#6E757D'); put(14, 4, 51, '#6BE07F', '', SHINE);
  plant(4, 0, 89, true);

  // ---- the islands: drawers either side with room for knees between, a worktop, the spine with its
  // sockets, a lamp over it on two posts, and at the south end the sink ----
  function island(x0, z0, z1, tag) {
    for (let z = z0; z <= z1; z++) {
      const k = z - z0;
      fill(x0 + 4, 0, z, 3, 5, 1, '#E6E6E1', tag);                                            // the panel down the middle
      if (k % 12 >= 6 && z <= z1 - 6) continue;                                               // room for knees
      for (const x of [x0, x0 + 1, x0 + 2, x0 + 3, x0 + 7, x0 + 8, x0 + 9, x0 + 10]) { put(x, 0, z, '#6B7178', tag); for (let y = 1; y <= 4; y++) put(x, y, z, white, tag); }
      if (k % 12 === 2 || z === z1 - 3) for (const x of [x0, x0 + 10]) { put(x, 2, z, grey, tag); put(x, 4, z, grey, tag); }   // drawer handles
    }
    worktop(x0, z0, x0 + 10, z1, tag);
    for (let z = z0 + 1; z <= z1 - 6; z++) {
      fill(x0 + 4, 6, z, 3, 3, 1, white, tag);
      const s = (z - z0) % 6;
      if (s === 3 || s === 4) for (const x of [x0 + 4, x0 + 6]) put(x, 7, z, s === 3 ? '#C8372D' : '#FFFFFF', tag);   // a red socket by a white one
    }
    for (const z of [z0 + 1, z1 - 6]) fill(x0 + 5, 9, z, 1, 9, 1, grey, tag);                   // two posts, and the lamp between them
    for (let z = z0 + 2; z <= z1 - 7; z++) { put(x0 + 5, 17, z, grey, tag); put(x0 + 5, 16, z, '#FFF4D6', tag, true); }
    // the sink at the end: a steel basin, a swan-neck tap, glass drying on a rack over it
    for (let x = x0 + 3; x <= x0 + 7; x++) for (let z = z1 - 4; z <= z1 - 1; z++) put(x, 5, z, steel, tag);
    for (let x = x0 + 4; x <= x0 + 6; x++) for (let z = z1 - 3; z <= z1 - 2; z++) { del(x, 5, z); put(x, 4, z, '#7F868D', tag); }
    fill(x0 + 5, 6, z1 - 5, 1, 4, 1, steel, tag); put(x0 + 5, 9, z1 - 4, steel, tag); put(x0 + 5, 8, z1 - 3, steel, tag);
    for (let x = x0 + 4; x <= x0 + 6; x++) for (let y = 11; y <= 15; y++) put(x, y, z1 - 5, (x + y) % 2 ? '#A7AEB5' : '#DDEBF1', tag);
  }
  const T = 'pgl';
  [34, 62, 90, 118].forEach(x0 => island(x0, 12, 46, T));
  // what is on them, and who is at them
  pipettes(35, 6, 14, T); tips(35, 6, 18, '#3F7FD6', T); tips(35, 6, 21, '#F2C230', T); rack(41, 6, 15, T); bottle(41, 6, 24, '#D6ECF3', '#2D6CB5', T); notebook(36, 6, 28, '#3E9B5A', T); ice(41, 6, 33, T);
  person(32, 13, 'E', { pose: 'work', gloves: true, hair: '#7A5230', style: 'bun', tag: T });
  person(45, 31, 'W', { pose: 'stool', gloves: true, hair: '#1E1B1A', style: 'long', skin: '#C99571', tag: T }); stool(46, 19, T);
  scope(63, 6, 20, T); pipettes(69, 6, 14, T); tips(69, 6, 26, '#58B368', T); bottle(65, 6, 30, '#B7772F', '#26292D', T); bottle(64, 6, 31, '#D6ECF3', '#C8372D', T); rack(69, 6, 36, T);
  person(60, 19, 'E', { pose: 'stool', gloves: true, mask: true, hair: '#C99A55', style: 'pony', tag: T });
  person(73, 37, 'W', { pose: 'work', top: '#3E9B5A', hair: '#3A2A20', tag: T }); stool(74, 31, T);
  pcr(91, 6, 15, T); tips(97, 6, 16, '#3F7FD6', T); fuge(97, 6, 26, T); pipettes(91, 6, 33, T); notebook(97, 6, 34, '#3F6FC4', T);
  person(101, 19, 'W', { pose: 'stool', hair: '#8A3F26', style: 'long', skin: '#F2D0B0', tag: T }); stool(86, 31, T);
  rack(119, 6, 16, T); bottle(125, 6, 18, '#D6ECF3', '#2D6CB5', T); bottle(126, 6, 18, '#D6ECF3', '#2D6CB5', T); tips(125, 6, 27, '#F2C230', T); ice(119, 6, 30, T); stirrer(125, 6, 35, T);
  person(116, 30, 'E', { pose: 'work', hair: '#9E9A95', skin: '#E8B990', tag: T });
  person(78, 49, 'S', { hair: '#C99A55', style: 'long', skin: '#F2D0B0' });

  // ---- a low shelf of binders between the benches and the desks, facing the desks ----
  fill(30, 0, 51, 32, 7, 3, '#E4E4DF');
  for (let x = 31; x <= 60; x++) for (const y0 of [1, 4]) {
    const r = hash(x, y0, 53);
    if (r > 0.88) continue;
    const c = ['#3F6FC4', '#D0503F', '#3E9B5A', '#E0A030', '#8B6BB0', '#F4F4F0', '#2C4A9A'][Math.floor(r / 0.88 * 7)];
    for (let y = y0; y < y0 + 2; y++) put(x, y, 53, c);
  }
  plant(33, 7, 52); fill(40, 7, 51, 4, 2, 3, '#C9A36B'); fill(52, 7, 52, 3, 1, 2, white);

  // ---- the desks, where the genomes are read: two screens on each, and what they show ----
  const PIX = { o: '#E0853C', w: '#E9E4D8', g: '#8FD694', b: '#7FB2E6', k: '#3A3F46', '-': '#9AA1A8', r: '#D0503F', x: '#5C6670' };
  const SCREENS = {
    code: ['#1E2328', ['ooo....', '.wwww..', '.gggg..', 'bbbbb..']],
    shell: ['#1E2328', ['gg.....', 'ggggg..', 'g......', 'gggg...']],
    tree: ['#F7F7F3', ['k--0...', 'k----1.', 'k-2....', 'k---3..']],
    genes: ['#F7F7F3', ['bb.bbb.', '-------', 'rr.r.rr', '.g..g.g']],
    ring: ['#1E2328', ['.ABCDE.', 'N.xx..F', 'M..xx.G', '.LKJIH.']],     // the fourteen lineages round the tree, in their colours
  };
  const pixel = (bg, ch) => (ch === '.' ? bg : /[0-9]/.test(ch) ? lineages[+ch] : /[A-N]/.test(ch) ? lineages[ch.charCodeAt(0) - 65] : PIX[ch]);
  const monitor = (x, z, kind, tag) => {
    const [bg, rows] = SCREENS[kind];
    put(x + 3, 5, z, '#555B62', tag); put(x + 3, 5, z + 1, '#555B62', tag);
    for (let i = 0; i < 7; i++) for (let j = 0; j < 4; j++) { put(x + i, 6 + j, z, dark, tag); put(x + i, 6 + j, z + 1, pixel(bg, rows[3 - j][i]), tag, SHINE); }
  };
  const desk = (x0, z0, screens, tag = '') => {
    for (let x = x0; x <= x0 + 15; x++) for (let z = z0; z <= z0 + 5; z++) put(x, 4, z, '#F1F0EB', tag);
    for (const [x, z] of [[x0, z0], [x0 + 15, z0], [x0, z0 + 5], [x0 + 15, z0 + 5]]) fill(x, 0, z, 1, 4, 1, grey, tag);
    fill(x0 + 1, 1, z0, 14, 3, 1, '#DCDDD8', tag);
    monitor(x0 + 1, z0, screens[0], tag); monitor(x0 + 8, z0, screens[1], tag);
    fill(x0 + 5, 5, z0 + 3, 6, 1, 1, '#3A3F46', tag); put(x0 + 12, 5, z0 + 3, '#3A3F46', tag);
  };
  desk(30, 58, ['genes', 'code']); person(36, 64, 'N', { pose: 'sit', coat: false, top: '#D0503F', legs: '#2F3440', hair: '#1E1B1A' }); mug(42, 60, '#3F6FC4');
  desk(56, 58, ['shell', 'tree']); person(62, 64, 'N', { pose: 'sit', empty: true }); plant(57, 5, 61);
  desk(82, 58, ['tree', 'genes']); person(88, 64, 'N', { pose: 'sit', coat: false, top: '#E0A030', hair: '#7A5230', style: 'long', skin: '#E8B990' });
  desk(108, 58, ['code', 'shell']); person(114, 64, 'N', { pose: 'sit', empty: true }); mug(110, 61, '#D0503F');
  desk(30, 76, ['shell', 'genes']); person(36, 82, 'N', { pose: 'sit', empty: true });
  // mine: the tree of the fourteen lineages, the code, the thesis in a pile, a mug
  desk(56, 76, ['ring', 'code'], 'desk'); person(62, 82, 'N', { pose: 'sit', coat: false, top: '#46545A', legs: '#2F3440', hair: '#3A2A20', style: 'pony', tag: 'desk' });
  fill(57, 5, 79, 3, 2, 2, white, 'desk'); put(57, 7, 79, '#1E98AC', 'desk'); put(58, 7, 79, white, 'desk'); mug(70, 80, '#E0A030', 'desk');
  desk(82, 76, ['code', 'tree']); person(88, 82, 'N', { pose: 'sit', coat: false, top: '#8B6BB0', legs: '#2F3440', hair: '#C99A55', style: 'bun' });
  desk(108, 76, ['genes', 'shell']); person(114, 82, 'N', { pose: 'sit', empty: true }); plant(121, 5, 79);

  // ---- the coffee, in the corner by the windows: a counter, the machine with its light on, cups ----
  cupboards(137, 58, 145, 70, 'W'); worktop(137, 58, 145, 70);
  fill(141, 6, 61, 3, 5, 3, '#2E3238'); put(141, 9, 62, '#E0473A', '', SHINE); put(141, 7, 62, steel); fill(141, 6, 66, 2, 1, 2, '#C9A36B');
  for (const [z, c] of [[64, '#FFFFFF'], [65, '#D0503F'], [68, '#3F6FC4']]) put(139, 6, z, c);
  person(132, 63, 'E', { hair: '#1E1B1A', skin: '#9C6B4E' });
  plant(141, 0, 87, true);

  // ---- on the south wall: the whiteboard with a tree drawn on it, and a board of notices ----
  inPart(2, () => {
    for (let x = 40; x <= 67; x++) for (let y = 6; y <= 14; y++) put(x, y, 94, x === 40 || x === 67 || y === 6 || y === 14 ? '#9AA1A8' : '#FBFBF8');
    for (let y = 8; y <= 13; y++) put(43, y, 94, dark);
    [[8, 48, 0], [10, 51, 1], [12, 46, 2], [13, 49, 3]].forEach(([y, x1, k]) => { for (let x = 44; x < x1; x++) put(x, y, 94, dark); put(x1, y, 94, lineages[k]); });
    for (const [y, x0, x1] of [[12, 55, 64], [10, 55, 61], [8, 55, 63]]) for (let x = x0; x <= x1; x++) if (hash(x, y, 9) < 0.8) put(x, y, 94, y === 10 ? '#D0503F' : '#2C4A9A');
    for (let x = 90; x <= 104; x++) for (let y = 7; y <= 12; y++) put(x, y, 94, '#C9A36B');
    for (const [x0, y0, c] of [[91, 8, '#FBFBF8'], [95, 10, '#F5D35B'], [98, 8, '#FBFBF8'], [101, 9, '#F29BB4']]) fill(x0, y0, 94, 3, 2, 1, c);
  });

  return b.finish({ pins: { pgl: [67, 20, 29], desk: [63, 13, 79] } });
}

// ---- turning blocks into meshes ----
// in strips across the board, so that what is out of view, or out of the sun's, is not drawn; what
// glows at night apart, and what shines by itself (shineMat, unlit) apart again
function meshesOf(city, solidMat, glowMat, strips = 4, shineMat = glowMat) {
  const width = Math.ceil(city.W * city.S / strips);
  const solid = Array.from({ length: strips }, () => []), glow = Array.from({ length: strips }, () => []), shine = Array.from({ length: strips }, () => []);
  for (const v of city.list) [solid, glow, shine][v.glow][Math.min(strips - 1, Math.floor(v.x / width))].push(v);
  const box = new THREE.BoxGeometry(1 / city.S, 1 / city.S, 1 / city.S);
  const make = (list, material) => {
    const mesh = new THREE.InstancedMesh(box, material, list.length);
    const m = new THREE.Matrix4(), c = new THREE.Color();
    list.forEach((v, i) => {
      m.makeTranslation((v.x + 0.5) / city.S - city.W / 2, (v.y + 0.5) / city.S, (v.z + 0.5) / city.S - city.D / 2);
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, c.set(v.c));
    });
    mesh.userData.tags = list.map(v => v.tag);
    mesh.userData.base = list.map(v => new THREE.Color(v.c));
    return mesh;
  };
  const meshes = [];
  for (const list of solid) if (list.length) { const m = make(list, solidMat); m.castShadow = true; m.receiveShadow = true; meshes.push(m); }
  for (const list of glow) if (list.length) { const m = make(list, glowMat); m.receiveShadow = true; meshes.push(m); }
  for (const list of shine) if (list.length) meshes.push(make(list, shineMat));
  for (const m of meshes) m.computeBoundingSphere();
  return meshes;
}

// where each building's label goes: over the middle of its top (dx moves a board along)
function anchorsOf(city, dx = 0) {
  const box = {};
  for (const v of city.list) {
    if (!v.tag) continue;
    const b = box[v.tag] || (box[v.tag] = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity, y1: -Infinity });
    b.x0 = Math.min(b.x0, v.x); b.x1 = Math.max(b.x1, v.x); b.z0 = Math.min(b.z0, v.z); b.z1 = Math.max(b.z1, v.z); b.y1 = Math.max(b.y1, v.y);
  }
  const out = {}, S = city.S;
  for (const [tag, b] of Object.entries(box)) {
    const [x, y, z] = city.pins[tag] || [(b.x0 + b.x1 + 1) / 2, b.y1 + 1, (b.z0 + b.z1 + 1) / 2];
    out[tag] = new THREE.Vector3(x / S - city.W / 2 + dx, y / S + 1.2, z / S - city.D / 2);
  }
  return out;
}

// ---- what moves ----
const lambert = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const cube = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; return m; };
// many boxes as one mesh, each in its own colour: [w, h, d, x, y, z, colour]
function boxesOf(list, material) {
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const gp = unit.attributes.position.array, gn = unit.attributes.normal.array, gi = unit.index.array, nv = gp.length / 3;
  const pos = new Float32Array(list.length * gp.length), nor = new Float32Array(list.length * gp.length), col = new Float32Array(list.length * gp.length);
  const idx = [], c = new THREE.Color();
  list.forEach(([w, h, d, x, y, z, color], b) => {
    c.set(color);
    for (let i = 0; i < gp.length; i += 3) {
      const o = b * gp.length + i;
      pos[o] = gp[i] * w + x; pos[o + 1] = gp[i + 1] * h + y; pos[o + 2] = gp[i + 2] * d + z;
      nor[o] = gn[i]; nor[o + 1] = gn[i + 1]; nor[o + 2] = gn[i + 2];
      col[o] = c.r; col[o + 1] = c.g; col[o + 2] = c.b;
    }
    for (const i of gi) idx.push(b * nv + i);
  });
  unit.dispose();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}
// One car of a train, 2.7 long, on two bogies 1.8 apart: the line's colour with a pale stripe,
// windows and a door; a windscreen and lamps at an end that can lead, a coupling at an end that cannot
const CAR = 3, BOGIE = 0.9;
function carOf(color, front, back, body, lit) {
  const dark = '#30343A', solid = [
    [0.5, 0.3, 0.95, BOGIE, 0.68, 0, dark], [0.5, 0.3, 0.95, -BOGIE, 0.68, 0, dark], [2.5, 0.12, 1.1, 0, 0.86, 0, dark],
    [2.7, 1.1, 1.3, 0, 1.38, 0, color], [2.72, 0.12, 1.32, 0, 1.08, 0, '#F6F3EA'], [2.6, 0.2, 1.16, 0, 2.03, 0, '#EDEBE4'],
    [0.36, 0.86, 1.34, 0, 1.36, 0, shade(color, 0.8)],
  ];
  const glass = [-0.95, -0.5, 0.5, 0.95].map(dx => [0.32, 0.36, 1.34, dx, 1.56, 0, '#E8FFF0']);
  for (const [cab, s] of [[front, 1], [back, -1]]) {
    if (cab) glass.push([0.06, 0.42, 1.0, s * 1.36, 1.62, 0, '#CFE8F2'], [0.06, 0.12, 0.22, s * 1.37, 1.2, 0.38, '#FFF6C8'], [0.06, 0.12, 0.22, s * 1.37, 1.2, -0.38, '#FFF6C8']);
    else solid.push([0.2, 0.18, 0.3, s * 1.45, 0.95, 0, dark]);
  }
  if (front) solid.push([0.8, 0.14, 0.6, 0.3, 2.2, 0, '#9AA1A8']);
  const g = new THREE.Group();
  g.add(boxesOf(solid, body), boxesOf(glass, lit));
  return g;
}

// the yellow bus, 3 long on four wheels, its windows lit at night
function busOf(body, lit) {
  const solid = [
    [2.96, 0.95, 1.18, 0, 0.98, 0, P.bus], [2.98, 0.14, 1.2, 0, 0.57, 0, '#D9A21F'], [2.86, 0.12, 1.1, 0, 1.51, 0, '#F7F4EC'],
    [0.9, 0.1, 0.7, -0.6, 1.62, 0, '#E4E1D8'], [0.1, 0.24, 1.0, 1.5, 0.62, 0, P.dark], [0.1, 0.24, 1.0, -1.5, 0.62, 0, P.dark],
    ...[[0.92, 0.56], [0.92, -0.56], [-0.92, 0.56], [-0.92, -0.56]].map(([x, z]) => [0.44, 0.44, 0.16, x, 0.3, z, P.black]),
  ];
  const glass = [
    [2.3, 0.36, 1.2, -0.22, 1.16, 0, '#2E3844'], [0.06, 0.5, 1.0, 1.49, 1.12, 0, '#2E3844'], [0.06, 0.14, 0.76, 1.5, 1.42, 0, '#FF9A2E'],
    [0.06, 0.12, 0.2, 1.5, 0.74, 0.4, '#FFF6C8'], [0.06, 0.12, 0.2, 1.5, 0.74, -0.4, '#FFF6C8'],
    [0.06, 0.1, 0.16, -1.49, 0.8, 0.44, '#E0473A'], [0.06, 0.1, 0.16, -1.49, 0.8, -0.44, '#E0473A'],
  ];
  const g = new THREE.Group();
  g.add(boxesOf(solid, body), boxesOf(glass, lit));
  return g;
}
// the tram of line 4: two white cars with red ends and a band of windows, a cab at each end of it,
// a pantograph up to the wire on each
function tramOf(body, lit) {
  const red = '#D2232A', cars = [];
  for (const cab of [1, -1]) {
    const solid = [
      [2.5, 0.28, 1.0, 0, 0.66, 0, P.dark], [2.62, 1.08, 1.26, 0, 1.3, 0, '#F4F4F0'], [2.64, 0.13, 1.28, 0, 0.83, 0, red],
      [0.42, 1.1, 1.28, cab * 1.1, 1.3, 0, red], [2.4, 0.13, 1.08, 0, 1.9, 0, '#E4E4DF'], [0.5, 0.1, 0.5, 0, 2.0, 0, P.steel2],
      [0.08, 1.15, 0.06, 0, 2.62, 0, P.dark], [0.1, 0.06, 0.9, 0, 3.22, 0, P.dark],
      [0.26, 0.26, 1.29, -cab * 0.5, 1.07, 0, red], [0.12, 0.12, 1.3, -cab * 0.5, 1.07, 0, P.white],
      [0.14, 0.9, 1.0, -cab * 1.36, 1.2, 0, '#3A3F46'],
    ];
    const glass = [
      [1.9, 0.4, 1.28, -cab * 0.2, 1.46, 0, '#2E3844'], [0.06, 0.5, 1.0, cab * 1.33, 1.44, 0, '#2E3844'],
      [0.06, 0.12, 0.22, cab * 1.33, 0.9, 0.4, '#FFF6C8'], [0.06, 0.12, 0.22, cab * 1.33, 0.9, -0.4, '#FFF6C8'],
    ];
    const g = new THREE.Group();
    g.add(boxesOf(solid, body), boxesOf(glass, lit));
    g.userData.vehicle = 'tram';
    cars.push(g);
  }
  return cars;
}
// the tram's wire from x0 to x1, and poles at `poles` to hold it where the boards have none (the bridge)
function wireOf(x0, x1, z, poles, body) {
  const list = [[x1 - x0, 0.05, 0.05, (x0 + x1) / 2, 3.28, z, P.dark]];
  for (const x of poles) list.push([0.14, 3.6, 0.14, x, 1.8, z - 1.4, P.dark], [0.1, 0.1, 1.6, x, 3.5, z - 0.7, P.dark]);
  return boxesOf(list, body);
}
// the institute's sign on its lawn: a slab of weathered concrete, leaning back, with the logo in
// teal relief (an i joined to a raised 2, then sys, then bio up high, thin lines with dots at their
// ends running between them) and the University's and CSIC's names small in a corner. Drawn as
// shapes, so that the view shrinks it smoothly instead of dropping lines of it; its ticket shows
// the same drawing at full size.
function signCanvas() {
  const w = 384, h = 144, c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#C2BFB8'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1100; i++) { const x = hash(i, 1, 7) * w, y = hash(i, 2, 7) * h; g.fillStyle = hash(i, 3, 7) < 0.5 ? '#B3AFA7' : '#CDCAC4'; g.fillRect(x, y, 3, 3); }
  const shade = g.createLinearGradient(0, h * 0.55, 0, h); shade.addColorStop(0, 'rgba(90,80,70,0)'); shade.addColorStop(1, 'rgba(90,80,70,0.28)');
  g.fillStyle = shade; g.fillRect(0, 0, w, h);
  const teal = '#1E98AC', relief = '#15606B';
  const stroke = (width, draw) => {
    for (const [d, col] of [[3, relief], [0, teal]]) {
      g.save(); g.translate(d, d); g.strokeStyle = col; g.lineWidth = width; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); draw(); g.stroke(); g.restore();
    }
  };
  const dot = (x, y, r = 7) => { for (const [d, col] of [[3, relief], [0, teal]]) { g.fillStyle = col; g.beginPath(); g.arc(x + d, y + d, r, 0, Math.PI * 2); g.fill(); } };
  const S = (x, y) => () => { g.moveTo(x + 38, y + 8); g.bezierCurveTo(x + 28, y - 3, x + 3, y, x + 5, y + 15); g.bezierCurveTo(x + 7, y + 30, x + 40, y + 27, x + 40, y + 45); g.bezierCurveTo(x + 40, y + 62, x + 10, y + 62, x + 2, y + 50); };
  // the thin lines first, then the letters over them
  stroke(4, () => { g.moveTo(26, 40); g.lineTo(26, 122); g.moveTo(26, 94); g.lineTo(92, 94); g.moveTo(220, 76); g.lineTo(258, 76); g.moveTo(304, 30); g.lineTo(304, 108); g.moveTo(252, 6); g.lineTo(252, 30); });
  stroke(12, () => { g.moveTo(42, 34); g.bezierCurveTo(44, 6, 90, 6, 88, 30); g.bezierCurveTo(86, 46, 54, 54, 44, 72); g.lineTo(92, 72); });   // the 2
  stroke(12, S(94, 70)); stroke(12, S(186, 70));                                                                                          // s  s
  stroke(12, () => { g.moveTo(142, 70); g.lineTo(142, 102); g.bezierCurveTo(142, 118, 174, 118, 174, 102); g.moveTo(174, 70); g.lineTo(174, 124); g.bezierCurveTo(174, 142, 144, 142, 142, 130); });   // y
  stroke(12, () => { g.moveTo(252, 18); g.lineTo(252, 92); g.moveTo(252, 68); g.bezierCurveTo(254, 36, 294, 36, 294, 66); g.bezierCurveTo(294, 96, 254, 96, 252, 78); });   // b
  stroke(12, () => { g.moveTo(304, 44); g.lineTo(304, 92); });                                                                          // i
  stroke(12, () => { g.ellipse(342, 66, 22, 25, 0, 0, Math.PI * 2); });                                                                 // o
  for (const [x, y] of [[26, 36], [26, 124], [92, 94], [220, 76], [304, 26], [304, 110], [252, 6]]) dot(x, y);
  // the names in the corner
  g.fillStyle = '#6F6B64'; g.font = '600 9px Georgia, serif';
  g.fillText('VNIVERSITAT', 246, 126); g.fillText('DE VALÈNCIA', 246, 136);
  g.fillStyle = '#4A4E55'; g.fillRect(318, 121, 1.5, 15); g.fillRect(324, 122, 7, 14);
  g.font = '700 18px Helvetica, Arial, sans-serif'; g.fillText('CSIC', 334, 136);
  return c;
}
function signOf(c) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const slab = new THREE.MeshLambertMaterial({ color: '#B4B1A9' }), face = new THREE.MeshLambertMaterial({ map: tex });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 0.35), [slab, slab, slab, slab, face, slab]);
  mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.rotation.x = -0.3;
  mesh.userData.tag = 'i2sysbio';
  return mesh;
}
// the bridge over the gap between the two boards: a deck, two steel arches and their hangers, railings
function bridgeOf(x0, x1, z0, z1, body) {
  const list = [], mid = (x0 + x1) / 2, half = (x1 - x0) / 2, steel = '#6F8FAF';
  list.push([x1 - x0, 0.5, z1 - z0, mid, -0.25, (z0 + z1) / 2, P.asphalt], [x1 - x0, 0.3, z1 - z0 - 0.4, mid, -0.65, (z0 + z1) / 2, P.stone2]);
  for (const z of [z0 - 0.05, z1 + 0.05]) {
    list.push([x1 - x0, 0.08, 0.08, mid, 0.55, z, P.white]);
    for (let i = 0; i <= 24; i++) {
      const x = x0 + 0.2 + i * (x1 - x0 - 0.4) / 24, y = 3.2 * (1 - ((x - mid) / half) ** 2);
      list.push([0.5, 0.26, 0.22, x, y, z, steel]);
      if (i % 4 === 0 && i && i < 24) list.push([0.08, y, 0.08, x, y / 2, z, steel]);
      if (i % 2 === 0) list.push([0.06, 0.5, 0.06, x, 0.3, z, P.white]);
    }
  }
  return boxesOf(list, body);
}

export function initCity(root, { lineages, ticket, onPick } = {}) {
  // three boards: the tool city (Valencia); past a bridge to the east, Sagunt and its port; past one
  // to the west, the Parc Cientific in Paterna, where I2SysBio is
  // (the institute on its own grid, turned; its pillars reach down to the Parc's ground beneath them)
  const [ic, is] = [Math.cos(I2.turn), Math.sin(I2.turn)];
  const underI2 = (x, z) => { const dx = x + 0.5 - 32, dz = z + 0.5 - 20; return siteH(Math.floor(I2.cx + dx * ic + dz * is), Math.floor(I2.cz - dx * is + dz * ic)); };
  const city = buildTools(lineages), port = buildSagunto(lineages), parc = buildPaterna(), inst = buildI2(underI2), lab = buildLab(lineages);
  const SAG = 84, PAT = -84;                                                       // where their boards begin, along x
  const O = (x, y, z) => new THREE.Vector3(x - city.W / 2, y, z - city.D / 2);   // city blocks to scene
  const scene = new THREE.Scene();
  // all that is outside, and the lab inside I2SysBio, which takes the Parc's place while you are in it
  const world = new THREE.Group(), indoors = new THREE.Group();
  indoors.visible = false;
  scene.add(world, indoors);
  const solidMat = new THREE.MeshLambertMaterial(), glowMat = new THREE.MeshLambertMaterial({ emissive: 0x000000 }), shineMat = new THREE.MeshBasicMaterial();
  const boards = [[city, 0, 'tools'], [port, SAG, 'sagunto'], [parc, PAT, 'paterna']].map(([c, dx, name]) => {
    const parts = meshesOf(c, solidMat, glowMat);
    for (const m of parts) { m.position.x = dx; world.add(m); }
    return { name, dx, meshes: parts, anchors: anchorsOf(c, dx) };
  });
  const instParts = meshesOf(inst, solidMat, glowMat, 1);
  {
    const at = O(PAT + I2.cx / 2, 0, I2.cz / 2);
    for (const m of instParts) { m.position.copy(at); m.rotation.y = I2.turn; m.updateMatrixWorld(); world.add(m); }
    const anchors = anchorsOf(inst);
    for (const k in anchors) anchors[k].applyMatrix4(instParts[0].matrixWorld);
    boards.push({ name: 'paterna', meshes: instParts, anchors });
  }
  const outside = boards.flatMap(b => b.meshes);
  // the lab: what stands in it, and each of its walls apart, to drop when it comes between you and the floor
  const labAt = (list, strips) => meshesOf({ ...lab, list }, solidMat, glowMat, strips, shineMat).map(m => { m.position.x = PAT; indoors.add(m); return m; });
  const labStands = labAt(lab.list.filter(v => !v.part), 4);
  const labWalls = Object.values(LAB_WALLS).map(([k, nx, nz]) => ({ nx, nz, meshes: labAt(lab.list.filter(v => v.part === k), 1) }));
  const inside = [...labStands, ...labWalls.flatMap(w => w.meshes)];
  boards.push({ name: 'lab', meshes: inside, anchors: anchorsOf(lab, PAT) });
  const meshes = [...outside, ...inside];
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8a7a66, 1.25);
  const sun = new THREE.DirectionalLight(0xffffff, 1.9);
  sun.position.set(-30, 60, 25);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -50, right: 50, top: 50, bottom: -50, near: 1, far: 160 });
  scene.add(hemi, sun);

  // trains, one per line, there and back: each car rides its two bogies along the rails, so it
  // turns into a curve bit by bit; a train slows into each end, waits, and goes back the way it
  // came with a cab at either end. The short lines have shorter, slower trains.
  const carBody = new THREE.MeshLambertMaterial({ vertexColors: true }), carLit = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x000000 });
  const RUN = { red: [3, 0.07], blue: [3, 0.08], green: [3, 0.075], ochre: [2, 0.045], plum: [2, 0.05] };
  const trains = Object.entries(city.routes).map(([line, { route, lo, hi }], i) => {
    const [n, speed] = RUN[line] || [3, 0.07], length = n * CAR - 0.3;
    const cars = Array.from({ length: n }, (_, k) => { const c = carOf(LINES[line], k === 0, k === n - 1, carBody, carLit); world.add(c); return c; });
    return { line, cars, route, lo, hi, length, far: hi - lo - length, head: lo + length + (i * 7) % Math.max(1, hi - lo - length), dir: 1, speed, wait: 0 };
  });
  // the reads, running down the cables from the sequencer to the station
  const reads = [];
  BASES.forEach((c, i) => { for (let k = 0; k < 2; k++) { const m = cube(0.45, 0.45, 0.45, lambert(c, { emissive: c, emissiveIntensity: 0 })); world.add(m); reads.push({ m, z: 21.25 + i * 2, s: k * 2.5 + i * 0.7 }); } });
  // smoke from the codon factory
  const smoke = [0, 1, 2, 3, 4].map(i => { const m = cube(0.9, 0.9, 0.9, lambert('#F4F2EC', { transparent: true, opacity: 0.9 })); m.castShadow = false; world.add(m); return { m, s: i / 5 }; });
  // the scales of eskaks, weighing one against the other
  const scales = new THREE.Group();
  scales.position.copy(O(56, 12.4, 14));
  const vc = { vertexColors: true };
  scales.add(boxesOf([[7, 0.35, 0.4, 0, 0, 0, P.steel], [0.5, 0.5, 0.5, 0, 0, 0, P.ochre], [0.12, 0.9, 0.14, 0, 0.6, 0, P.ochre]], new THREE.MeshLambertMaterial(vc)));
  const panL = new THREE.Group(), panR = new THREE.Group();
  panL.position.x = -3.2; panR.position.x = 3.2;
  const pan = (weights) => boxesOf([[0.1, 1.3, 0.1, -0.5, -0.7, 0, P.dark], [0.1, 1.3, 0.1, 0.5, -0.7, 0, P.dark], [1.8, 0.2, 1.8, 0, -1.45, 0, P.stone], [2, 0.12, 2, 0, -1.33, 0, P.steel],
    ...weights.map(([c, x, y]) => [0.6, 0.6, 0.6, x, y, 0, c])], new THREE.MeshLambertMaterial(vc));
  panL.add(pan([[P.red, 0, -0.97]]));
  panR.add(pan([[P.green, -0.35, -0.97], [P.green, 0.35, -0.97], [P.green, 0, -0.37]]));
  scales.add(panL, panR);
  world.add(scales);
  // the bridge of the crane in the snpick yard: trucks on the rails, a trolley, a grab with a base in it
  const bridge = boxesOf([[11, 0.5, 0.8, 0, 0, 0, P.ochre], [11, 0.1, 0.84, 0, 0.3, 0, shade(P.ochre, 0.82)], [0.9, 0.45, 1.3, -5.1, 0.05, 0, P.dark], [0.9, 0.45, 1.3, 5.1, 0.05, 0, P.dark],
    [1.3, 0.6, 1.1, 0.4, 0.55, 0, P.red], [0.1, 2.1, 0.1, 0.4, -1.3, 0, P.black], [0.9, 0.3, 0.9, 0.4, -2.45, 0, P.dark], [0.1, 0.4, 0.8, 0, -2.75, 0, P.dark], [0.1, 0.4, 0.8, 0.8, -2.75, 0, P.dark],
    [0.5, 0.5, 0.5, 0.4, -2.85, 0, BASES[2]]], new THREE.MeshLambertMaterial(vc));
  world.add(bridge);
  // koi in the pond, their backs just out of the water
  const koi = [0, 1, 2].map(i => {
    const a = i === 1 ? '#F4F1EA' : '#F08A3C', b = i === 1 ? '#F08A3C' : '#F4F1EA';
    const g = boxesOf([[1.1, 0.22, 0.5, 0, 0, 0, a], [0.4, 0.23, 0.52, 0.2, 0.01, 0, b], [0.35, 0.16, 0.62, -0.72, 0, 0, a], [0.2, 0.1, 0.2, 0.62, 0.06, 0, b]], new THREE.MeshLambertMaterial(vc));
    g.castShadow = false;
    world.add(g);
    return { g, a: i * 2.1, r: 1.6 + i * 0.6 };
  });
  // the lighthouse lamp, seen between the posts of its lantern, and at night its beam sweeping round
  const lampMat = lambert('#FFE38A', { emissive: '#FFD04D', emissiveIntensity: 0.4 });
  const lamp = cube(1.7, 1.5, 1.7, lampMat); lamp.position.copy(O(city.lighthouse.x + 0.5, 17.5, city.lighthouse.z + 0.5)); world.add(lamp);
  const rayMat = new THREE.MeshBasicMaterial({ color: '#FFF1A8', transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });
  const beam = new THREE.Group();
  beam.position.copy(lamp.position);
  for (const s of [1, -1]) {
    const ray = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 1.2, 8, 8, 1, true), rayMat);
    ray.rotation.z = -s * Math.PI / 2; ray.position.x = s * 4.9;
    beam.add(ray);
  }
  world.add(beam);

  // ---- the yellow bus to Sagunt and the tram to Paterna: each waits at its stop in Valencia, and
  // takes you over a bridge to the other city with the view behind it ----
  for (const [x0, x1] of [[74, SAG], [PAT + 74, 0]]) { const d = bridgeOf(x0, x1, 46, 48, new THREE.MeshLambertMaterial(vc)); d.position.copy(O(0, 0, 0)); world.add(d); }
  const wire = wireOf(PAT + 25, 22.5, 47, [PAT + 77, PAT + 81], new THREE.MeshLambertMaterial(vc)); wire.position.copy(O(0, 0, 0)); world.add(wire);
  const bus = busOf(carBody, carLit), tram = tramOf(carBody, carLit);
  bus.userData.vehicle = 'bus';
  world.add(bus, ...tram);
  // someone in the lab, carrying a rack of tubes from the cabinets down to the coffee and back: in
  // blocks across (a, from the left), up (y) and from the back (f), centred on them; the legs swing
  // from the hip
  const labPt = (x, z) => [PAT + (x + 0.5) / lab.S - lab.W / 2, (z + 0.5) / lab.S - lab.D / 2];
  const walkWay = pathOf(labPt(109, 11), [['to', ...labPt(109, 50)], ['to', ...labPt(126, 52)]]);
  const walker = new THREE.Group(), strides = [];
  {
    const B = 1 / lab.S, coat = '#F6F6F2', skin = '#E8B990', hair = '#1E1B1A', dark = '#2B2522';
    const box = (a, y, f, w, h, d, c, y0 = 0) => [w * B, h * B, d * B, (a + w / 2 - 2) * B, (y + h / 2 - y0) * B, (f + d / 2 - 1) * B, c];
    walker.add(boxesOf([
      box(0, 4, 0, 4, 5, 2, coat), box(1, 8, 1.9, 2, 1, 0.2, '#5B7A99'),
      box(0, 9, 0, 4, 1, 2, skin), box(0, 10, 1, 4, 1, 1, skin), box(0, 10, 0, 4, 1, 1, hair), box(0, 11, 0, 4, 2, 2, hair), box(1, 10, 1.95, 1, 1, 0.1, dark), box(2, 10, 1.95, 1, 1, 0.1, dark),
      box(-1, 7, 0, 1, 2, 2, coat), box(4, 7, 0, 1, 2, 2, coat), box(-1, 7, 2, 1, 1, 1, coat), box(4, 7, 2, 1, 1, 1, coat), box(-1, 7, 3, 1, 1, 1, skin), box(4, 7, 3, 1, 1, 1, skin),
      box(0, 7, 2.5, 4, 1, 2, '#F4F4F0'), ...BASES.map((c, i) => box(i, 8, 3, 1, 1, 1, c)),
    ], carBody));
    for (const a of [0, 2]) {
      const hip = new THREE.Group();
      hip.position.set((a + 1 - 2) * B, 4 * B, 0);
      hip.add(boxesOf([box(1, 1, 0, 2, 3, 2, '#3B4F73', 4), box(1, 0, 0, 2, 1, 2, '#2A2D33', 4)], carBody));
      walker.add(hip); strides.push(hip);
    }
    indoors.add(walker);
  }
  const wk = { u: 0, dir: 1, wait: 40 };
  const signArt = signCanvas(), sign = signOf(signArt);
  sign.position.copy(O(PAT + I2.sign[0] / 2, (siteH(...I2.sign) + 1) / 2 + 1.35, I2.sign[1] / 2)); sign.rotation.set(-0.3, I2.turn, 0, 'YXZ'); world.add(sign);
  // the ways: the bus to Sagunt past the roundabout at its port and back past the one by the
  // market; the tram, with a cab at each end, straight there and back
  const TRIPS = {
    'tools>sagunto': { by: 'bus', road: pathOf([33, 47.5], [['to', 141, 47.5], ['turn', 141, 46, -1.5 * Math.PI], ['turn', 139, 46, Math.PI / 2], ['to', 136, 46.5]]) },
    'sagunto>tools': { by: 'bus', road: pathOf([136, 46.5], [['to', 29, 46.5], ['turn', 29, 46, Math.PI / 2], ['turn', 27, 46, -1.5 * Math.PI], ['to', 33, 47.5]]) },
    'tools>paterna': { by: 'tram', road: pathOf([14.5, 47], [['to', PAT + 37, 47]]) },
    'paterna>tools': { by: 'tram', road: pathOf([PAT + 42.6, 47], [['to', 20.1, 47]]) },
  };
  const CENTRE = { tools: 0, sagunto: SAG, paterna: PAT, lab: PAT };
  const trip = { leg: null, from: 'tools', to: 'tools', next: null, u: 0, on: false, speed: 0.75 };
  // a vehicle `u` along a way: the bus on its two axles, the tram's cars on their bogies behind its front
  function park(by, road, u) {
    if (by === 'bus') {
      const [fx, fz] = pointOn(road, u + 0.95), [bx, bz] = pointOn(road, u - 0.95);
      bus.position.copy(O((fx + bx) / 2, 0, (fz + bz) / 2));
      bus.rotation.y = Math.atan2(-(fz - bz), fx - bx);
      return;
    }
    tram.forEach((car, k) => {
      const c = u - 1.35 - k * 2.8;
      const [fx, fz] = pointOn(road, c + BOGIE), [bx, bz] = pointOn(road, c - BOGIE);
      car.position.copy(O((fx + bx) / 2, 0, (fz + bz) / 2));
      car.rotation.y = Math.atan2(-(fz - bz), fx - bx);
    });
  }
  // each waits at the start of its way out of the city in view
  function rest() {
    const here = view.city === 'lab' ? 'paterna' : view.city;
    park('bus', TRIPS[here === 'sagunto' ? 'sagunto>tools' : 'tools>sagunto'].road, 0);
    park('tram', TRIPS[here === 'paterna' ? 'paterna>tools' : 'tools>paterna'].road, 0);
  }

  // ---- the view ----
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 400);
  // how it is seen: turned round (yaw) and from how high (pitch), from nearly
  // the ground to straight above
  const PITCH = [0.1, 1.54];
  const tilted = (p) => Math.max(PITCH[0], Math.min(PITCH[1], p));
  // cx is where it looks along x: the middle of the city in view, or the bus on its way; cy and cz
  // move to go in at a door; zoom is how close, and px, pz how far off the middle it looks, closer in
  const view = { yaw: 0.34, pitch: Math.atan(0.72), goal: null, pitchGoal: null, cx: 0, cxGoal: null, cy: 3, cz: 1, zoom: 1, zoomGoal: null, px: 0, pz: 0, city: 'tools' };
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;
  const canvas = renderer.domElement;
  canvas.className = 'city-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  // the page keeps the room for the city from the start: the canvas fills its stage
  const stage = root.querySelector('.city-stage') || root;
  stage.prepend(canvas);
  const narrow = window.matchMedia('(max-width: 640px)');
  let compact = narrow.matches;

  let cssW = 0, cssH = 0, dirty = true;
  function resize() {
    compact = narrow.matches;
    cssW = stage.clientWidth; cssH = stage.clientHeight;
    // some 540 pixels across, each a whole number of the screen's own
    const dpr = window.devicePixelRatio || 1, k = Math.max(1, Math.ceil(cssW * dpr / 540));
    renderer.setSize(Math.max(1, Math.round(cssW * dpr / k)), Math.max(1, Math.round(cssH * dpr / k)), false);
    dirty = true;
  }
  // the whole board fits at every turn: its diagonal across the width, and a
  // little more room the higher you look from, where the board stands deeper
  function fit() {
    const [lo, hi] = PITCH, mid = Math.atan(0.72);
    const k = view.pitch < mid ? 0.88 + 0.12 * (view.pitch - lo) / (mid - lo) : 1 + 0.45 * (view.pitch - mid) / (hi - mid);
    const halfW = (compact ? 43 : 42) * k / view.zoom, aspect = cssW / cssH;
    if (camera.right === halfW && camera.top === halfW / aspect) return;
    camera.left = -halfW; camera.right = halfW; camera.top = halfW / aspect; camera.bottom = -halfW / aspect;
    camera.updateProjectionMatrix();
  }
  function place() {
    fit();
    const r = 120;
    const dx = Math.sin(view.yaw), dz = Math.cos(view.yaw);
    const x = view.cx + view.px, z = view.cz + view.pz;
    camera.position.set(x + dx * Math.cos(view.pitch) * r, view.cy + Math.sin(view.pitch) * r, z + dz * Math.cos(view.pitch) * r);
    camera.lookAt(x, view.cy, z);
    camera.updateMatrixWorld();
    // the sun, and so its shadows, go where the view goes
    sun.position.set(x - 30, 60, 25); sun.target.position.set(x, 0, 0); sun.target.updateMatrixWorld();
    // in the lab, a wall that stands between you and its floor drops to its skirting
    for (const w of labWalls) { const up = w.nx * dx + w.nz * dz <= 0.02; for (const m of w.meshes) m.visible = up; }
  }

  // ---- closer: + and -, a pinch, ctrl and the wheel; closer in, the view moves over the ground
  // with two fingers or the mouse, but never off the board ----
  const ZOOM = [1, 4];
  const zoomed = (z) => Math.max(ZOOM[0], Math.min(ZOOM[1], z));
  const ground = () => { const s = Math.sin(view.yaw), c = Math.cos(view.yaw); return [c, -s, -s, -c]; };   // right, and away up the screen
  function held() { const k = 1 - 1 / view.zoom; view.px = Math.max(-37 * k, Math.min(37 * k, view.px)); view.pz = Math.max(-24 * k, Math.min(24 * k, view.pz)); }
  // how much ground a CSS pixel covers, across the screen and up it
  const perPx = () => { fit(); const u = 2 * camera.right / Math.max(1, cssW); return [u, u / Math.max(0.2, Math.sin(view.pitch))]; };
  // closer by s about a point (ox, oy) CSS pixels from the middle of the stage, which stays where it is
  function zoomBy(s, ox = 0, oy = 0) {
    if (trip.on || glide.on) return;
    const z = zoomed(view.zoom * s);
    if (z === view.zoom) return;
    const [u, v] = perPx(), f = 1 - view.zoom / z, [rx, rz, fx, fz] = ground();
    view.px += (rx * ox * u - fx * oy * v) * f; view.pz += (rz * ox * u - fz * oy * v) * f;
    view.zoom = z; view.zoomGoal = null;
    held(); dirty = true;
  }
  // the ground follows the fingers, or the mouse, across the screen
  function panBy(dx, dy) {
    if (trip.on || glide.on || view.zoom <= 1) return;
    const [u, v] = perPx(), [rx, rz, fx, fz] = ground();
    view.px += -rx * dx * u + fx * dy * v; view.pz += -rz * dx * u + fz * dy * v;
    held(); dirty = true;
  }
  // the buttons, a step at a time (at once, with motion off)
  function nearer(k) {
    if (trip.on || glide.on) return;
    const z = zoomed((view.zoomGoal ?? view.zoom) * k);
    if (typeof animSpeed === 'number' && animSpeed <= 0) { view.zoom = z; view.zoomGoal = null; held(); } else view.zoomGoal = z;
    dirty = true;
  }

  // ---- labels over the buildings, and their tickets ----
  const tags = new Map();
  root.querySelectorAll('.city-label[data-tag]').forEach(b => {
    const tag = b.dataset.tag, home = boards.find(d => d.anchors[tag]);
    if (!home) return;
    b.addEventListener('click', (e) => { e.stopPropagation(); open(tag); });
    b.addEventListener('mouseenter', () => light(tag));
    b.addEventListener('mouseleave', () => light(''));
    b.addEventListener('focus', () => light(tag));
    b.addEventListener('blur', () => light(''));
    tags.set(tag, { tag, el: b, pos: home.anchors[tag], line: b.dataset.line, city: home.name });
  });
  // only the names of the city in view show, none on the way
  function showCity() {
    for (const l of tags.values()) l.el.hidden = trip.on || glide.on || l.city !== view.city;
    for (const [name, svg] of Object.entries(maps)) svg.toggleAttribute('hidden', name !== view.city);
    // the bus goes between Valencia and Sagunt, the tram between Valencia and Paterna; in Paterna
    // I2SysBio's door opens, and in the lab it takes you back out
    const say = (el, text) => { el.setAttribute('aria-label', text); el.title = text; };
    const inLab = view.city === 'lab';
    busButton.hidden = view.city === 'paterna' || inLab; tramButton.hidden = view.city === 'sagunto' || inLab;
    doorButton.hidden = view.city !== 'paterna' && !inLab;
    say(busButton, view.city === 'sagunto' ? 'Take the yellow bus back to Valencia' : 'Take the yellow bus to Sagunt, where my papers are');
    say(tramButton, view.city === 'paterna' ? 'Take the tram back to Valencia' : 'Take the tram to Paterna, where I work');
    say(doorButton, inLab ? 'Back outside, to the Parc Científic' : 'Step inside I2SysBio, into the lab');
    // the names shown go over their buildings now, not a frame later: until then they are out of sight, and out of reach of the keyboard
    place(); placeLabels();
    dirty = true;
  }
  const card = document.createElement('div');
  card.className = 'city-ticket';
  card.hidden = true;
  root.appendChild(card);
  let shown = '';
  function open(tag) {
    const t = ticket && ticket(tag), l = tags.get(tag);
    if (!t || !l) return;
    shown = tag;
    card.innerHTML = `<button type="button" class="city-ticket-x" aria-label="Close">×</button>`
      + `<p class="city-ticket-name"><b>${esc(t.name)}</b>${t.kind ? ` <span>${esc(t.kind)}</span>` : ''}</p>`
      + (t.meta ? `<p class="city-ticket-meta">${esc(t.meta)}</p>` : '')
      + (t.title ? `<p class="city-ticket-title">${esc(t.title)}</p>` : '')
      + (t.art === 'sign' ? `<img class="city-ticket-art" src="${signArt.toDataURL()}" width="${signArt.width}" height="${signArt.height}" alt="The I2SysBio sign on its lawn: i2sysbio in teal, with the University of Valencia and CSIC">` : '')
      + `<p class="city-ticket-desc">${esc(t.desc)}</p>`
      + (t.links && t.links.length ? `<p class="city-ticket-links">${t.links.map(k => (k.go ? `<button type="button" class="city-ticket-go" data-go="${esc(k.go)}">${esc(k.label)}</button>`
        : `<a href="${esc(k.href)}" target="_blank" rel="noopener">${esc(k.label)}</a>`)).join('')}</p>` : '');
    card.className = `city-ticket city-ticket--${l.line || 'none'}`;
    card.hidden = false;
    card.querySelector('.city-ticket-x').addEventListener('click', close);
    card.querySelectorAll('.city-ticket-go').forEach(g => g.addEventListener('click', () => go(g.dataset.go, true)));
    placeTicket();
    // on a phone it opens under the names, maybe below the screen: up it comes
    if (compact) { const r = card.getBoundingClientRect(); if (r.bottom > innerHeight || r.top < 0) card.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
    onPick && onPick(tag);
    const first = card.querySelector('.city-ticket-links a, .city-ticket-go');
    if (first && document.activeElement === l.el) first.focus();
  }
  function close() { card.hidden = true; shown = ''; }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && shown) { const l = tags.get(shown); close(); l && l.el.focus(); } });
  document.addEventListener('pointerdown', (e) => { if (shown && !card.contains(e.target) && !e.target.closest('.city-label') && e.target !== canvas) close(); });
  function placeTicket() {
    if (!shown || compact) return;
    const l = tags.get(shown);
    const lx = parseFloat(l.el.dataset.x), ly = parseFloat(l.el.dataset.y);
    const w = card.offsetWidth, h = card.offsetHeight;
    let x = lx - w / 2, y = ly + 10;
    if (y + h > cssH) y = Math.max(0, ly - l.el.offsetHeight - h - 12);
    x = Math.max(4, Math.min(cssW - w - 4, x));
    card.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }
  const v = new THREE.Vector3();
  function placeLabels() {
    for (const l of tags.values()) {
      if (l.el.hidden) continue;
      v.copy(l.pos).project(camera);
      l.el.classList.toggle('off', view.zoom > 1.01 && (Math.abs(v.x) > 1.02 || v.y < -1.02 || v.y > 1.12));
      // over its building, but never out of the city's frame
      const hw = l.el.offsetWidth / 2 + 2, hh = l.el.offsetHeight + 2;
      const x = Math.max(hw, Math.min(cssW - hw, (v.x + 1) / 2 * cssW)), y = Math.max(hh, Math.min(cssH - 2, (1 - v.y) / 2 * cssH));
      l.el.dataset.x = x; l.el.dataset.y = y;
      l.el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -100%)`;
    }
    placeTicket();
  }

  // ---- pointing at a building lights it up ----
  const byTag = meshes.map(mesh => { const idx = {}; mesh.userData.tags.forEach((t, i) => { if (t) (idx[t] || (idx[t] = [])).push(i); }); return idx; });
  let lit = '';
  const bright = new THREE.Color();
  function light(tag) {
    if (tag === lit) return;
    meshes.forEach((mesh, k) => {
      const idx = byTag[k];
      (idx[lit] || []).forEach(i => mesh.setColorAt(i, mesh.userData.base[i]));
      (idx[tag] || []).forEach(i => mesh.setColorAt(i, bright.copy(mesh.userData.base[i]).lerp(new THREE.Color('#FFFFFF'), 0.28)));
      mesh.instanceColor.needsUpdate = true;
    });
    if (lit && tags.get(lit)) tags.get(lit).el.classList.remove('lit');
    map.querySelectorAll('.city-map-stop.lit').forEach(g => g.classList.remove('lit'));
    lit = tag;
    if (lit && tags.get(lit)) tags.get(lit).el.classList.add('lit');
    if (lit) map.querySelector(`.city-map-stop[data-tag="${lit}"]`)?.classList.add('lit');
    canvas.style.cursor = lit ? 'pointer' : 'grab';
    dirty = true;
  }
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(view.city === 'lab' ? inside.filter(m => m.visible) : [...outside, bus, ...tram, sign], true)[0];
    let o = hit && !hit.object.isInstancedMesh ? hit.object : null;
    while (o && !o.userData.vehicle && !o.userData.tag) o = o.parent;
    if (o && o.userData.vehicle) return o.userData.vehicle;
    const t = o ? o.userData.tag : hit ? hit.object.userData.tags[hit.instanceId] : '';
    // the institute's own walls are the way in, the lab's door the way out (its sign, and its name, give its ticket)
    if (!o && t === 'i2sysbio' && view.city === 'paterna') return 'in';
    if (t === 'out' && view.city === 'lab') return 'out';
    return tags.has(t) && tags.get(t).city === view.city ? t : '';
  }
  const shows = (t) => (t === 'in' ? 'i2sysbio' : t);
  // dragging sideways turns the city, and with a mouse up and down tilts it (on a
  // touch screen that scrolls the page, so the arrows tilt it); with shift, or the right
  // or middle button, the mouse moves it instead, closer in; two fingers pinch it closer and
  // move it; a tap without a drag opens a ticket
  let drag = null, pinch = null, pinched = false;
  const touches = new Map();
  const middle = () => { const r = canvas.getBoundingClientRect(), [a, b] = [...touches.values()]; return { x: (a.x + b.x) / 2 - r.left - r.width / 2, y: (a.y + b.y) / 2 - r.top - r.height / 2, d: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)) }; };
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 2) { pinch = middle(); pinched = true; drag = null; }
      if (touches.size > 1) return;
    }
    const mouse = e.pointerType !== 'touch';
    drag = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, yaw: view.yaw, pitch: view.pitch, moved: false, id: e.pointerId, mouse, pan: mouse && (e.shiftKey || e.button === 1 || e.button === 2) };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && touches.size === 2) {
      const m = middle();
      zoomBy(m.d / pinch.d, m.x, m.y); panBy(m.x - pinch.x, m.y - pinch.y);
      pinch = m;
      return;
    }
    if (!drag) { if (!glide.on && !pinched) light(shows(pick(e))); return; }
    const dx = e.clientX - drag.x, dy = drag.mouse ? e.clientY - drag.y : 0;
    if (!drag.moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) { drag.moved = true; canvas.setPointerCapture(drag.id); }
    if (!drag.moved) return;
    if (drag.pan) { panBy(e.clientX - drag.lx, e.clientY - drag.ly); drag.lx = e.clientX; drag.ly = e.clientY; return; }
    view.yaw = drag.yaw - dx * 0.008; view.goal = null;
    if (drag.mouse) { view.pitch = tilted(drag.pitch + dy * 0.006); view.pitchGoal = null; }
    dirty = true;
  });
  const lift = (e) => {
    touches.delete(e.pointerId);
    if (touches.size < 2) pinch = null;
    if (!touches.size && pinched) { pinched = false; drag = null; return true; }   // the end of a pinch is not a tap
    return false;
  };
  canvas.addEventListener('pointerup', (e) => {
    const was = drag; drag = null;
    if (lift(e) || !was || was.moved || glide.on) return;
    const t = pick(e);
    if (t === 'bus' || t === 'tram') board(t); else if (t === 'in') enter(); else if (t === 'out') leave(); else if (t) open(t); else close();
  });
  canvas.addEventListener('pointercancel', (e) => { lift(e); drag = null; });
  canvas.addEventListener('pointerleave', () => { if (!drag) light(''); });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  // a pinch on a trackpad comes as the wheel with ctrl (a plain wheel scrolls the page); Safari's
  // own gestures, where a touch screen's pointers are not already doing it
  canvas.addEventListener('wheel', (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    zoomBy(Math.exp(-e.deltaY * 0.01), e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2);
  }, { passive: false });
  let gesture = 1;
  canvas.addEventListener('gesturestart', (e) => { e.preventDefault(); gesture = 1; });
  canvas.addEventListener('gesturechange', (e) => {
    e.preventDefault();
    if (touches.size) return;
    const r = canvas.getBoundingClientRect();
    zoomBy(e.scale / gesture, e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2);
    gesture = e.scale;
  });
  // the arrows turn it a quarter at a time
  const turn = (dir) => { view.goal = (view.goal ?? view.yaw) + dir * Math.PI / 2; dirty = true; };
  const tilt = (dir) => { view.pitchGoal = tilted((view.pitchGoal ?? view.pitch) + dir * 0.35); dirty = true; };
  const arrows = document.createElement('div');
  arrows.className = 'city-turn';
  arrows.innerHTML = '<button type="button" aria-label="Turn the city left">&#8634;</button><button type="button" aria-label="Turn the city right">&#8635;</button>';
  arrows.insertAdjacentHTML('beforeend', '<button type="button" aria-label="Look from higher up">&#9650;</button><button type="button" aria-label="Look from lower down">&#9660;</button>');
  arrows.children[0].addEventListener('click', () => turn(-1));
  arrows.children[1].addEventListener('click', () => turn(1));
  arrows.children[2].addEventListener('click', () => tilt(1));
  arrows.children[3].addEventListener('click', () => tilt(-1));
  arrows.insertAdjacentHTML('beforeend', '<button type="button" class="city-zoom" aria-label="Closer" title="Closer">+</button><button type="button" class="city-zoom" aria-label="Further off" title="Further off">&minus;</button>');
  arrows.children[4].addEventListener('click', () => nearer(1.6));
  arrows.children[5].addEventListener('click', () => nearer(1 / 1.6));
  // and the yellow bus, off to the other city
  const busButton = document.createElement('button');
  busButton.type = 'button';
  busButton.className = 'city-bus';
  busButton.innerHTML = '<svg viewBox="0 0 16 12" aria-hidden="true"><rect x="1" y="1.5" width="14" height="7.5" rx="1.6" fill="#F4C430" stroke="currentColor" stroke-width="1.2"/><rect x="2.6" y="3" width="7" height="2.4" fill="currentColor"/><rect x="11" y="3" width="2.4" height="3.4" fill="currentColor"/><circle cx="4.5" cy="9.6" r="1.5" fill="currentColor"/><circle cx="11.5" cy="9.6" r="1.5" fill="currentColor"/></svg>';
  busButton.addEventListener('click', () => board('bus'));
  arrows.appendChild(busButton);
  // and the tram, white with red ends
  const tramButton = document.createElement('button');
  tramButton.type = 'button';
  tramButton.className = 'city-tram';
  tramButton.innerHTML = '<svg viewBox="0 0 16 12" aria-hidden="true"><path d="M6 2 L8 0.4 L10 2" fill="none" stroke="currentColor" stroke-width="1"/><rect x="1" y="2" width="14" height="7" rx="1.8" fill="#F4F4F0" stroke="currentColor" stroke-width="1.2"/><rect x="11.4" y="2.6" width="3" height="5.8" rx="1.2" fill="#D2232A"/><rect x="2.4" y="3.6" width="8" height="2.2" fill="currentColor"/><rect x="1.6" y="7" width="9.8" height="1" fill="#D2232A"/><circle cx="4.5" cy="10" r="1.3" fill="currentColor"/><circle cx="11.5" cy="10" r="1.3" fill="currentColor"/></svg>';
  tramButton.addEventListener('click', () => board('tram'));
  arrows.appendChild(tramButton);
  // and I2SysBio's door, in and out
  const doorButton = document.createElement('button');
  doorButton.type = 'button';
  doorButton.className = 'city-door';
  doorButton.innerHTML = '<svg viewBox="0 0 16 12" aria-hidden="true"><rect x="3.5" y="0.8" width="9" height="10.6" rx="0.8" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M5 11.4 V2.2 L10.6 3.2 V11.4 Z" fill="#1E98AC" stroke="currentColor" stroke-width="1"/><circle cx="9.2" cy="7.2" r="0.8" fill="currentColor"/></svg>';
  doorButton.addEventListener('click', () => go(view.city === 'lab' ? 'out' : 'lab'));
  arrows.appendChild(doorButton);
  stage.appendChild(arrows);
  // on the bus or the tram: out of Valencia, or back
  const board = (by) => ride(view.city === 'tools' ? (by === 'bus' ? 'sagunto' : 'paterna') : 'tools');
  // a ride: the vehicle drives its way with the view behind it (between Sagunt and Paterna, by way of
  // Valencia); with motion off, you are simply there
  function ride(to) {
    if (trip.on || glide.on) return;
    if (view.city === 'lab') { leave(() => ride(to)); return; }
    const from = view.city;
    to = to || (from === 'tools' ? 'sagunto' : 'tools');
    if (to === from) return;
    trip.next = from !== 'tools' && to !== 'tools' ? to : null;
    if (trip.next) to = 'tools';
    close(); light('');
    view.zoomGoal = 1;
    Object.assign(trip, { leg: TRIPS[`${from}>${to}`], from, to, u: 0 });
    const still = typeof animSpeed === 'number' && animSpeed <= 0;
    if (still) { arrive(); Object.assign(view, { cx: CENTRE[view.city], cxGoal: null, zoom: 1, zoomGoal: null, px: 0, pz: 0 }); return; }
    trip.on = true;
    showCity();
  }
  function arrive() {
    trip.on = false; view.city = trip.to;
    rest();
    view.cxGoal = CENTRE[view.city];
    showCity();
    if (trip.next) { const next = trip.next; trip.next = null; setTimeout(() => ride(next), 300); }
  }

  // ---- in at I2SysBio's door and back out: the view closes in on the door, the lab takes the Parc's
  // place and the view draws back from the lab's own door to its whole floor; out, the same the other
  // way. With motion off, you are simply there ----
  const toDoor = new THREE.Vector3((10 + 0.5) / 2 - inst.W / 2, (TOP + 4) / 2, 33 / 2 - inst.D / 2).applyMatrix4(instParts[0].matrixWorld);
  const labDoor = new THREE.Vector3(PAT + 1 / lab.S - lab.W / 2, 3.5, 68 / lab.S - lab.D / 2);
  const WHOLE = { cx: PAT, cy: 3, cz: 1, zoom: 1 }, CLOSE = 3.4;
  const glide = { on: false, t: 0, from: null, to: null, fade: '', then: null, pace: 1 };
  function glideTo(to, fade, then) {
    Object.assign(glide, { on: true, t: 0, from: { cx: view.cx + view.px, cy: view.cy, cz: view.cz + view.pz, zoom: view.zoom }, to, fade, then });
    Object.assign(view, { cxGoal: null, zoomGoal: null, px: 0, pz: 0 }); dirty = true;
  }
  const onDoor = (p) => ({ cx: p.x, cy: p.y, cz: p.z, zoom: CLOSE });
  function through(inward, then) {
    const [from, to] = inward ? [toDoor, labDoor] : [labDoor, toDoor];
    close(); light('');
    const swap = () => {
      indoors.visible = inward; world.visible = !inward;
      view.city = inward ? 'lab' : 'paterna';
      if (!inward) rest();
    };
    if (typeof animSpeed === 'number' && animSpeed <= 0) { swap(); Object.assign(view, WHOLE, { cxGoal: null, zoomGoal: null, px: 0, pz: 0 }); showCity(); then && then(); return; }
    glideTo(onDoor(from), 'out', () => { swap(); Object.assign(view, onDoor(to)); glideTo(WHOLE, 'in', () => { showCity(); then && then(); }); showCity(); });
    showCity();
  }
  function enter(then) { if (!trip.on && !glide.on && view.city === 'paterna') through(true, then); }
  function leave(then) { if (!trip.on && !glide.on && view.city === 'lab') through(false, then); }
  // where a ticket, the map or a button sends you; from a ticket, the keyboard goes on to the first
  // name of the place it arrives at
  function go(place, fromTicket = false) {
    const onward = fromTicket && card.contains(document.activeElement)
      ? () => { const first = [...tags.values()].find(l => l.city === view.city && !l.el.hidden); first && first.el.focus({ preventScroll: true }); } : null;
    if (place === 'lab') enter(onward);
    else if (place === 'out') leave(onward);
    else ride(place);
  }

  // ---- the map of the lines, in a corner: the same city without buildings ----
  const map = document.createElement('div');
  map.className = 'city-map';
  map.setAttribute('aria-hidden', 'true');
  const stop = (tag, x, y, name, below, dashed) => `<g class="city-map-stop" data-tag="${tag}"><title>${esc(name)}</title>`
    + `<circle cx="${x}" cy="${y}" r="5"${dashed ? ' stroke-dasharray="2 2"' : ''}/>`
    + `<text x="${x}" y="${below ? y + 14 : y - 8}" text-anchor="middle">${esc(name)}</text></g>`;
  map.innerHTML = `<svg class="city-map-tools" viewBox="0 0 292 140" role="presentation">
    <g fill="none" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M13 60 H45" stroke="${P.red}"/><path d="M13 65.3 H45" stroke="${P.blue}"/><path d="M13 70.7 H45" stroke="${P.green}"/><path d="M13 76 H45" stroke="${P.ochre}"/>
      <path class="city-map-line" data-line="red" d="M59 58 L87 30 H182" stroke="${P.red}"/>
      <path class="city-map-line" data-line="blue" d="M59 64 L73 50 H210" stroke="${P.blue}"/>
      <path class="city-map-line" data-line="green" d="M59 70 H200" stroke="${P.green}"/>
      <path class="city-map-line" data-line="ochre" d="M59 77 H64 L78 91 H150" stroke="${P.ochre}"/>
      <path class="city-map-line" data-line="plum" d="M200 70 V110 H212" stroke="${P.plum}"/>
      <path d="M212 110 H272" stroke="${P.plum}" stroke-dasharray="2 5"/>
      <path d="M51 84 V106" stroke="${P.steel}" stroke-dasharray="3 3"/>
    </g>
    <g class="city-map-stop" data-tag="reads"><title>raw reads</title><rect x="3" y="54" width="10" height="28" rx="5" class="city-map-term"/></g>
    <g class="city-map-stop" data-tag="BAMpiro"><title>BAMpiro</title><rect x="44" y="52" width="15" height="32" rx="7.5"/></g>
    <g class="city-map-stop" data-tag="depot"><title>the depot</title><rect x="45" y="106" width="12" height="9" rx="1.5"/></g>
    ${stop('pathotypr', 150, 30, 'pathotypr')}${stop('get_MNV', 108, 50, 'get_MNV')}${stop('eskaks', 172, 50, 'eskaks')}
    ${stop('snpick', 104, 70, 'snpick', true)}${stop('distree', 200, 70, 'distree')}${stop('fstic', 118, 91, 'fstic', true)}
    ${stop('mycolorsTB', 212, 110, 'mycolorsTB', true)}${stop('karyon', 272, 110, 'karyon', true, true)}
    <g class="city-map-trains"></g>
    <g class="city-map-bus" data-go="sagunto"><title>the yellow bus to Sagunt</title><path d="M118 110 V132 H250" stroke="${P.bus}"/><rect x="250" y="125" width="38" height="14" rx="7"/><text x="269" y="135" text-anchor="middle">Sagunt</text></g>
    <g class="city-map-tram" data-go="paterna"><title>the tram to Paterna</title><path d="M51 116 V132 H46" stroke="#2C4A9A"/><rect x="4" y="125" width="42" height="14" rx="7"/><text x="25" y="135" text-anchor="middle">Paterna</text></g>
  </svg>
  <svg class="city-map-sagunto" viewBox="0 0 292 140" role="presentation">
    <path class="city-map-sea" d="M244 0 C236 36 248 84 238 140 H292 V0 Z"/>
    <path class="city-map-hill" d="M4 46 C24 16 94 4 176 20 C190 22 192 34 178 36 C120 30 60 38 6 58 Z"/>
    <g class="city-map-bus" data-go="tools"><title>the yellow bus back to Valencia</title><path d="M46 132 H226" stroke="${P.bus}"/><circle cx="230" cy="128" r="5" fill="none" stroke="${P.bus}" stroke-width="3"/><rect x="4" y="125" width="42" height="14" rx="7"/><text x="25" y="135" text-anchor="middle">Valencia</text></g>
    ${stop('castell', 84, 24, 'castell', true)}${stop('masia', 148, 84, 'masia', true)}${stop('alt-forn', 206, 28, 'alt forn', true)}
    ${stop('hospital', 206, 72, 'hospital', true)}${stop('platja', 232, 106, 'platja')}
    <text class="city-map-town" x="46" y="100">Sagunt</text><text class="city-map-town" x="172" y="120">el Port</text>
  </svg>
  <svg class="city-map-paterna" viewBox="0 0 292 140" role="presentation">
    <rect class="city-map-hill" x="40" y="56" width="200" height="44" rx="3"/>
    <rect class="city-map-block" x="60" y="30" width="150" height="40" rx="2"/><rect class="city-map-block" x="46" y="26" width="18" height="48" rx="2"/>
    <path d="M40 104 H244" class="city-map-edge"/>
    <g class="city-map-tram" data-go="tools"><title>the tram back to Valencia</title><path d="M96 124 H246" stroke="#2C4A9A"/><rect x="100" y="119" width="46" height="10" rx="2" class="city-map-platform"/><rect x="246" y="117" width="42" height="14" rx="7"/><text x="267" y="127" text-anchor="middle">Valencia</text></g>
    ${stop('i2sysbio', 130, 50, 'I2SysBio', true)}${stop('xarxa', 176, 86, 'researchers map', true)}
    <text class="city-map-town" x="14" y="16">Parc Cientific, Paterna</text><text class="city-map-town" x="150" y="114">Santa Gemma</text>
  </svg>
  <svg class="city-map-lab" viewBox="0 0 292 140" role="presentation">
    <rect class="city-map-room" x="46" y="5" width="204" height="131" rx="1.5"/>
    <path class="city-map-glass" d="M47 5 H184 M250 12 V128"/>
    <g class="city-map-bench"><rect x="58" y="6" width="126" height="6"/><rect x="192" y="6" width="15" height="8"/><rect x="210" y="6" width="15" height="8"/><rect x="228" y="6" width="15" height="8"/>
      <rect x="47" y="16" width="9" height="46"/><rect x="93" y="21" width="15" height="47"/><rect x="131" y="21" width="15" height="47"/><rect x="170" y="21" width="15" height="47"/><rect x="209" y="21" width="15" height="47"/>
      <rect x="87" y="75" width="44" height="4"/><rect x="235" y="84" width="13" height="18"/>
      <rect x="87" y="84" width="22" height="8"/><rect x="123" y="84" width="22" height="8"/><rect x="159" y="84" width="22" height="8"/><rect x="195" y="84" width="22" height="8"/>
      <rect x="87" y="109" width="22" height="8"/><rect x="123" y="109" width="22" height="8"/><rect x="159" y="109" width="22" height="8"/><rect x="195" y="109" width="22" height="8"/></g>
    <path class="city-map-gap" d="M46 92 V103"/>
    <g class="city-map-door" data-go="out"><title>back outside</title><rect x="2" y="90" width="42" height="14" rx="7"/><text x="23" y="100" text-anchor="middle">outside</text></g>
    ${stop('pgl', 138, 45, 'the lab', true)}${stop('desk', 134, 112, 'my desk')}
    <text class="city-map-town" x="192" y="25">cabinets</text><text class="city-map-town" x="224" y="80">coffee</text>
  </svg>`;
  const maps = { tools: map.querySelector('.city-map-tools'), sagunto: map.querySelector('.city-map-sagunto'), paterna: map.querySelector('.city-map-paterna'), lab: map.querySelector('.city-map-lab') };
  map.querySelectorAll('.city-map-bus, .city-map-tram, .city-map-door').forEach(g => g.addEventListener('click', (e) => { e.stopPropagation(); go(g.dataset.go); }));
  stage.appendChild(map);
  map.querySelectorAll('.city-map-stop').forEach(g => {
    const tag = g.dataset.tag;
    if (!tags.has(tag)) return;
    g.addEventListener('mouseenter', () => light(tag));
    g.addEventListener('mouseleave', () => light(''));
    g.addEventListener('click', (e) => { e.stopPropagation(); open(tag); });
  });
  // a dot for each train, as far along its line on the map as it is in the city
  const mapLines = {};
  map.querySelectorAll('.city-map-line').forEach(el => { mapLines[el.dataset.line] = { el, len: el.getTotalLength() }; });
  const dots = map.querySelector('.city-map-trains');
  const mapTrains = trains.map(tr => {
    const d = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    d.setAttribute('width', '7'); d.setAttribute('height', '5'); d.setAttribute('rx', '1');
    d.setAttribute('fill', LINES[tr.line]);
    dots.appendChild(d);
    return { tr, d, line: mapLines[tr.line] };
  });
  function placeMapTrains() {
    mapTrains.forEach(({ tr, d, line }) => {
      if (!line) return;
      const p = line.el.getPointAtLength(line.len * Math.max(0, Math.min(1, (tr.head - tr.length / 2) / tr.route.L)));
      d.setAttribute('x', (p.x - 3.5).toFixed(1)); d.setAttribute('y', (p.y - 2.5).toFixed(1));
    });
  }

  // ---- day and night ----
  function theme() {
    const night = document.documentElement.getAttribute('data-theme') === 'dark';
    hemi.intensity = night ? 0.45 : 1.25;
    sun.intensity = night ? 0.35 : 1.9;
    sun.color.set(night ? '#8FA0FF' : '#ffffff');
    glowMat.emissive.set(night ? '#FFC96B' : '#000000');
    glowMat.emissiveIntensity = night ? 0.9 : 0;
    carLit.emissive.set(night ? '#FFE9A8' : '#000000');
    reads.forEach(r => { r.m.material.emissiveIntensity = night ? 0.8 : 0; });
    beam.visible = night;
    dirty = true;
  }
  new MutationObserver(theme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // ---- the loop, only while the city is in sight ----
  let last = 0, visible = true, t = 0;
  new IntersectionObserver(es => { visible = es.some(x => x.isIntersecting); }).observe(root);
  const at = (x, y, z, m) => m.position.set(x - city.W / 2, y, z - city.D / 2);
  function move(dt, k) {
    t += dt * k;
    trains.forEach(tr => {
      if (tr.wait > 0) tr.wait -= dt * k;
      else {
        const left = tr.dir > 0 ? tr.hi - tr.head : tr.head - tr.length - tr.lo;
        tr.head += tr.dir * tr.speed * dt * k * Math.max(0.2, Math.min(1, left / 2, (tr.far - left) / 2 + 0.2));
        if (tr.head >= tr.hi) { tr.head = tr.hi; tr.dir = -1; tr.wait = 70; }
        if (tr.head - tr.length <= tr.lo) { tr.head = tr.lo + tr.length; tr.dir = 1; tr.wait = 70; }
      }
      tr.cars.forEach((car, j) => {
        const c = tr.head - 1.35 - j * CAR;
        const [fx, fz] = pointOn(tr.route, c + BOGIE), [bx, bz] = pointOn(tr.route, c - BOGIE);
        car.position.copy(O((fx + bx) / 2, 0, (fz + bz) / 2));
        car.rotation.y = Math.atan2(-(fz - bz), fx - bx);
      });
    });
    reads.forEach(r => { const s = (r.s + t * 0.05) % 5; at(11.5 + s, 0.73, r.z, r.m); r.m.visible = s < 4.6; });
    smoke.forEach(p => {
      const s = (p.s + t * 0.006) % 1;
      at(39 + Math.sin(s * 6) * 0.4, 14.5 + s * 7, 12 + s * 1.5, p.m);
      p.m.scale.setScalar(1.1 - s * 0.7);
      p.m.material.opacity = 0.95 - s * 0.9;
    });
    scales.rotation.z = Math.sin(t * 0.025) * 0.22;
    panL.rotation.z = -scales.rotation.z; panR.rotation.z = -scales.rotation.z;
    at(41.5, 6.8, 30.5 + Math.sin(t * 0.02) * 2.4, bridge);
    koi.forEach(q => { const a = q.a + t * 0.02; at(48.5 + Math.cos(a) * q.r * 1.5, -0.45, 41.5 + Math.sin(a) * q.r, q.g); q.g.rotation.y = -a; });
    lampMat.emissiveIntensity = 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(t * 0.08));
    beam.rotation.y = t * 0.012;
    // in the lab, the one walking: along the way, a pause at each end, and back
    if (wk.wait > 0) wk.wait -= dt * k;
    else {
      wk.u += wk.dir * 0.035 * dt * k;
      if (wk.u >= walkWay.L) { wk.u = walkWay.L; wk.dir = -1; wk.wait = 90; }
      if (wk.u <= 0) { wk.u = 0; wk.dir = 1; wk.wait = 90; }
    }
    const [wx, wz] = pointOn(walkWay, wk.u), [ax, az] = pointOn(walkWay, wk.u + wk.dir * 0.3), step = wk.wait > 0 ? 0 : Math.sin(wk.u * 6);
    walker.position.set(wx, Math.abs(step) * 0.05, wz);
    walker.rotation.y = Math.atan2(ax - wx, az - wz);
    strides[0].rotation.x = step * 0.45; strides[1].rotation.x = -step * 0.45;
  }
  function frame(ts) {
    requestAnimationFrame(frame);
    // frames of a sixtieth of a second: the city's clock stops short after a stall, a bus ride keeps to time
    const raw = last ? (ts - last) / 16.667 : 1, dt = Math.min(raw, 3), ds = Math.min(raw, 12);
    last = ts;
    if (!visible || document.hidden) return;
    // the page's animation speed (art.js), none when motion is off
    const speed = typeof animSpeed === 'number' ? animSpeed : 0.5;
    if (view.goal !== null) {
      const d = view.goal - view.yaw;
      view.yaw += Math.abs(d) < 0.002 ? d : d * Math.min(1, 0.12 * dt);
      if (Math.abs(d) < 0.002) view.goal = null;
      dirty = true;
    }
    if (view.pitchGoal !== null) {
      const d = view.pitchGoal - view.pitch;
      view.pitch += Math.abs(d) < 0.002 ? d : d * Math.min(1, 0.12 * dt);
      if (Math.abs(d) < 0.002) view.pitchGoal = null;
      dirty = true;
    }
    if (trip.on) {
      const { by, road } = trip.leg, L = road.L, ease = Math.max(0.15, Math.min(1, trip.u / 5 + 0.15, (L - trip.u) / 5 + 0.1));
      trip.u = Math.min(L, trip.u + trip.speed * ease * ds);
      park(by, road, trip.u);
      // the view goes one way only, behind the vehicle, and no further than the city it is going to
      const [a, z] = [CENTRE[trip.from], CENTRE[trip.to]], at = (by === 'bus' ? bus : tram[0]).position.x;
      const x = Math.max(Math.min(a, z), Math.min(Math.max(a, z), at)), was = view.cxGoal ?? view.cx;
      view.cxGoal = z > a ? Math.max(was, x) : Math.min(was, x);
      if (trip.u >= L) arrive();
      dirty = true;
    }
    if (view.zoomGoal !== null && !glide.on) {
      const d = Math.log(view.zoomGoal / view.zoom);
      view.zoom = Math.abs(d) < 0.003 ? view.zoomGoal : view.zoom * Math.exp(d * Math.min(1, 0.15 * dt));
      if (view.zoom === view.zoomGoal) view.zoomGoal = null;
      held(); dirty = true;
    }
    if (glide.on) {
      glide.t = Math.min(1, glide.t + ds / 40 * glide.pace);
      const e = glide.t * glide.t * (3 - 2 * glide.t), { from, to } = glide;
      view.cx = from.cx + (to.cx - from.cx) * e; view.cy = from.cy + (to.cy - from.cy) * e; view.cz = from.cz + (to.cz - from.cz) * e;
      view.zoom = from.zoom * (to.zoom / from.zoom) ** e;
      canvas.style.opacity = String(Math.min(1, glide.fade === 'out' ? (1 - glide.t) / 0.3 : glide.t / 0.3));
      dirty = true;
      if (glide.t >= 1) {
        const then = glide.then;
        glide.on = false; Object.assign(view, glide.to);
        then && then();
        if (!glide.on) canvas.style.opacity = '';
      }
    }
    if (view.cxGoal !== null) {
      const d = view.cxGoal - view.cx;
      view.cx += Math.abs(d) < 0.02 ? d : d * Math.min(1, 0.09 * ds);
      if (Math.abs(d) < 0.02 && !trip.on) view.cxGoal = null;
      dirty = true;
    }
    if (speed > 0) { move(dt, speed * 2); dirty = true; }
    if (!dirty) return;
    dirty = false;
    place();
    renderer.render(scene, camera);
    placeLabels();
    placeMapTrains();
  }
  window.addEventListener('resize', resize);
  resize(); theme(); rest(); showCity(); place(); move(0, 0);
  requestAnimationFrame(frame);
  // for the page's own tests: the clock the moving things keep, the ride, the city in view
  // and where on the stage a building is: the middle of its blocks, in the place in view
  function where(tag) {
    const sum = new THREE.Vector3(), p = new THREE.Vector3(), m = new THREE.Matrix4();
    let n = 0;
    for (const mesh of view.city === 'lab' ? inside : outside) mesh.userData.tags.forEach((t, i) => { if (t === tag) { mesh.getMatrixAt(i, m); sum.add(p.setFromMatrixPosition(m).applyMatrix4(mesh.matrixWorld)); n++; } });
    if (!n) return null;
    sum.divideScalar(n).project(camera);
    return { x: (sum.x + 1) / 2 * cssW, y: (1 - sum.y) / 2 * cssH };
  }
  return {
    tags, view, open, close, light, ride, trip, enter, leave, go, where, redraw: () => { dirty = true; },
    get clock() { return t; }, get riding() { return trip.on; }, get gliding() { return glide.on; }, door: glide,
    get walls() { return labWalls.map(w => w.meshes.every(m => m.visible)); },
  };
}
