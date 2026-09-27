// ============================================================
// The tools as a voxel city. The sequencer sends reads down its cables to
// BAMpiro, the central station, and from there a railway line runs to each
// question, with a building for the tool that answers it. Built of small
// blocks, drawn in 3D and shown at a low resolution, in crisp pixels. Point at
// a building to light it up, press it for its ticket; drag, or use the arrows,
// to turn the city round and to look at it from higher up or lower down.
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

// ---- the city, block by block ----
// Two blocks to a unit of the scene, so the board is 148 blocks by 96. A building
// is filled solid (only the blocks that can be seen become meshes), then carved
// and trimmed: windows sit a block deep over a sill, roofs step up a block at a time.
function buildCity(lineages) {
  const S = 2, W = 148, D = 96, LOW = 8, H = 64;
  const n = W * D * H;
  const cells = new Uint16Array(n), tagOf = new Uint8Array(n), glowOf = new Uint8Array(n);
  const colors = [null], colorIds = new Map(), tagNames = [''], tagIds = new Map([['', 0]]);
  const inside = (x, y, z) => x >= 0 && x < W && z >= 0 && z < D && y >= -LOW && y < H - LOW;
  const at = (x, y, z) => ((y + LOW) * D + z) * W + x;
  function put(x, y, z, c, tag = '', glow = false) {
    if (!inside(x, y, z)) return;
    const col = typeof c === 'function' ? c(x, y, z) : c;
    let id = colorIds.get(col);
    if (id === undefined) { id = colors.length; colors.push(col); colorIds.set(col, id); }
    let t = tagIds.get(tag);
    if (t === undefined) { t = tagNames.length; tagNames.push(tag); tagIds.set(tag, t); }
    const i = at(x, y, z);
    cells[i] = id; tagOf[i] = t; glowOf[i] = glow ? 1 : 0;
  }
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

  // ---- the board: grass over a turf edge and layers of earth ----
  const grass = tone(P.grass, [P.grass2, 0.16], [P.grass3, 0.05]);
  const earth = tone(P.dirt, [P.dirt2, 0.12], [P.pebble, 0.05]);
  const deep = tone(P.dirt2, [P.dirt, 0.1], [P.pebble, 0.04]);
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    put(x, -1, z, grass); put(x, -2, z, P.turf);
    put(x, -3, z, earth); put(x, -4, z, earth); put(x, -5, z, deep); put(x, -6, z, deep);
  }
  // squares and yards
  const pave = tone(P.pave, [P.pave2, 0.3]);
  ground(30, 28, 40, 40, pave);                                                          // round the station
  ground(56, 68, 6, 4, pave);                                                            // from its door to the market
  ground(72, 54, 22, 14, tone(P.pave2, [P.pave3, 0.3]));                                 // the snpick yard
  ground(56, 72, 28, 20, (x, y, z) => (((x >> 1) + (z >> 1)) % 2 ? P.pave : P.pave2));   // the market square
  ground(4, 68, 28, 24, tone(P.pave2, [P.pave3, 0.25]));                                 // the depot yard
  ground(132, 76, 14, 14, tone(P.dirt, [P.dirt2, 0.3], [P.pebble, 0.06]));               // the building site

  // ---- the lines: two rails either side of a stripe in the line's colour, sleeper ends peeping out ----
  const ballast = tone(P.ballast, [P.ballast2, 0.35]);
  function lay(pts, color) {
    const path = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
      const steps = Math.max(Math.abs(x1 - x0), Math.abs(z1 - z0));
      for (let k = 0; k <= steps; k++) {
        const x = Math.round(x0 + (x1 - x0) * k / steps), z = Math.round(z0 + (z1 - z0) * k / steps), last = path[path.length - 1];
        if (!last || last[0] !== x || last[1] !== z) path.push([x, z]);
      }
    }
    // the middle of the track, block by block, and which way it runs there
    const mid = new Map();
    path.forEach(([x, z], i) => {
      const [nx, nz] = path[i + 1] || [2 * x - path[i - 1][0], 2 * z - path[i - 1][1]];
      const along = nx !== x ? 'x' : 'z';
      mid.set(`${2 * x + 1},${2 * z + 1}`, along);
      if (path[i + 1]) mid.set(`${2 * x + 1 + nx - x},${2 * z + 1 + nz - z}`, along);
    });
    const rails = new Set(), ends = new Set();
    for (const [k, along] of mid) {
      const [cx, cz] = k.split(',').map(Number);
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const r = `${cx + dx},${cz + dz}`; if (!mid.has(r)) rails.add(r); }
      if ((along === 'x' ? cx : cz) % 2 === 0) for (const s of [-2, 2]) ends.add(along === 'x' ? `${cx},${cz + s}` : `${cx + s},${cz}`);
    }
    for (const k of ends) if (!mid.has(k) && !rails.has(k)) { const [x, z] = k.split(',').map(Number); put(x, -1, z, P.sleeper); }
    for (const k of rails) { const [x, z] = k.split(',').map(Number); put(x, -1, z, ballast); put(x, 0, z, P.steel); }
    for (const [k, along] of mid) {
      const [x, z] = k.split(',').map(Number);
      if (color) { put(x, -1, z, ballast); put(x, 0, z, color); }
      else put(x, -1, z, (along === 'x' ? x : z) % 2 === 0 ? P.sleeper : ballast);
    }
    return path;
  }
  // a buffer stop just past the end of a line
  function bumper(path) {
    const [x, z] = path[path.length - 1], [px, pz] = path[path.length - 2];
    const dx = Math.sign(x - px), dz = Math.sign(z - pz), cx = 2 * x + 1 + 2 * dx, cz = 2 * z + 1 + 2 * dz;
    for (let k = -1; k <= 1; k++) { const bx = cx + (dz ? k : 0), bz = cz + (dx ? k : 0); put(bx, 0, bz, P.dark); put(bx, 1, bz, k ? P.red : P.white); }
  }
  // the trains stop a block short of the buffers
  const tracks = {};
  const line = (name, pts) => { const path = lay(pts, LINES[name]); bumper(path); tracks[name] = path.slice(0, -1); };
  line('red', [[24, 14], [24, 6], [40, 6]]);
  line('blue', [[33, 19], [70, 19]]);
  line('green', [[33, 25], [66, 25]]);
  line('ochre', [[24, 32], [24, 38], [29, 38]]);
  line('plum', [[64, 26], [64, 36], [70, 36]]);

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
  for (const [x, z] of [[130, 92], [147, 91]]) { put(x, 0, z, '#EE7D34'); put(x, 1, z, P.white); }

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
  lay([[2, 43], [15, 43]], null);
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
    [140, 22, 4, 0], [6, 22, 7, 1], [24, 24, 5, 0], [140, 60, 6, 0], [86, 70, 4, 1], [40, 86, 6, 0], [50, 91, 5, 1]].forEach(([x, z, h, p]) => (p ? pine : tree)(x, z, h));
  for (const [x, z] of [[2, 30], [26, 62], [128, 46], [144, 50], [60, 94], [106, 93], [12, 60]]) clump(x + 0.5, 0.6, z + 0.5, 1.9, 1.5, 1.9, leaves, '', 0.5);
  const lamp = (x, z) => { fill(x, 0, z, 1, 8, 1, P.dark); put(x, 8, z, P.light, '', true); put(x, 9, z, P.dark); };
  [[70, 44], [94, 44], [118, 44], [42, 24], [54, 70], [132, 66], [56, 90], [84, 72]].forEach(([x, z]) => lamp(x, z));
  // signals where the lines leave the station
  for (const [x, z] of [[68, 35], [68, 55], [46, 26], [53, 67]]) { fill(x, 0, z, 1, 5, 1, P.dark); put(x, 5, z, '#58D08A', '', true); put(x, 6, z, '#EF5A4C', '', true); put(x, 7, z, P.black); }
  const person = (x, z, shirt, hair = P.hair) => { put(x, 0, z, P.dark); put(x, 1, z, shirt); put(x, 2, z, P.skin); if (hair) put(x, 3, z, hair); };
  [[60, 83, P.red], [62, 85, P.red, '#D9A441'], [72, 84, P.blue], [74, 83, P.blue, null], [79, 85, P.ochre], [66, 82, P.ochre, '#8A4B2E'],
    [52, 60, P.green], [100, 73, P.plum], [58, 69, P.blue, '#D9A441'], [57, 66, P.white], [110, 74, P.green, '#8A4B2E'],
    [139, 92, '#EE7D34', P.ochre], [83, 88, P.plum], [26, 84, P.stone, null], [118, 90, lin(3)]].forEach(([x, z, c, h]) => person(x, z, c, h === undefined ? P.hair : h));

  // ---- flowers and tufts in the grass ----
  for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) {
    if (!isGrass(x, z) || colorAt(x, 0, z)) continue;
    const r = hash(x, 1, z);
    if (r < 0.012) put(x, 0, z, FLOWERS[Math.floor(hash(x, 2, z) * FLOWERS.length)]);
    else if (r < 0.04) put(x, 0, z, P.turf);
  }

  // only the blocks that can be seen: nothing is ever seen from below
  const filled = (x, y, z) => inside(x, y, z) && cells[at(x, y, z)] > 0;
  const list = [];
  for (let y = -LOW; y < H - LOW; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const i = at(x, y, z), id = cells[i];
    if (!id) continue;
    if (filled(x, y + 1, z) && filled(x - 1, y, z) && filled(x + 1, y, z) && filled(x, y, z - 1) && filled(x, y, z + 1)) continue;
    list.push({ x, y, z, c: colors[id], tag: tagNames[tagOf[i]], glow: glowOf[i] === 1 });
  }
  // where a label goes when the middle of the top of its blocks is not the place (the crane would lift it too high)
  const pins = { karyon: [139, 14, 83] };
  return { list, S, W: W / S, D: D / S, tracks, lighthouse, pins };
}

// ---- turning blocks into meshes ----
function meshesOf(city) {
  const solid = [], glow = [];
  for (const v of city.list) (v.glow ? glow : solid).push(v);
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
  const solidMesh = make(solid, new THREE.MeshLambertMaterial());
  solidMesh.castShadow = true; solidMesh.receiveShadow = true;
  const glowMesh = make(glow, new THREE.MeshLambertMaterial({ emissive: 0x000000 }));
  glowMesh.receiveShadow = true;
  return { solidMesh, glowMesh };
}

// where each building's label goes: over the middle of its top
function anchorsOf(city) {
  const box = {};
  for (const v of city.list) {
    if (!v.tag) continue;
    const b = box[v.tag] || (box[v.tag] = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity, y1: -Infinity });
    b.x0 = Math.min(b.x0, v.x); b.x1 = Math.max(b.x1, v.x); b.z0 = Math.min(b.z0, v.z); b.z1 = Math.max(b.z1, v.z); b.y1 = Math.max(b.y1, v.y);
  }
  const out = {}, S = city.S;
  for (const [tag, b] of Object.entries(box)) {
    const [x, y, z] = city.pins[tag] || [(b.x0 + b.x1 + 1) / 2, b.y1 + 1, (b.z0 + b.z1 + 1) / 2];
    out[tag] = new THREE.Vector3(x / S - city.W / 2, y / S + 1.2, z / S - city.D / 2);
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
// three cars: the line's colour with a pale stripe, windows and doors, bogies under them; lamps and a windscreen at the front
function trainOf(color) {
  const body = [], lit = [], dark = '#30343A', roof = '#EDEBE4', door = shade(color, 0.8);
  for (let i = 0; i < 3; i++) {
    const x = -i * 3;
    body.push(
      [2.2, 0.3, 0.95, x, 0.68, 0, dark],
      [2.7, 1.1, 1.3, x, 1.38, 0, color],
      [2.72, 0.12, 1.32, x, 1.08, 0, '#F6F3EA'],
      [2.6, 0.2, 1.16, x, 2.03, 0, roof],
      [0.36, 0.86, 1.34, x, 1.36, 0, door],
    );
    [-0.95, -0.5, 0.5, 0.95].forEach(dx => lit.push([0.32, 0.36, 1.34, x + dx, 1.56, 0, '#E8FFF0']));
    if (i < 2) body.push([0.5, 0.18, 0.3, x - 1.5, 0.95, 0, dark]);
  }
  body.push([0.8, 0.14, 0.6, 0.1, 2.2, 0, '#9AA1A8']);
  lit.push([0.06, 0.42, 1.0, 1.36, 1.62, 0, '#CFE8F2'], [0.06, 0.12, 0.22, 1.37, 1.2, 0.38, '#FFF6C8'], [0.06, 0.12, 0.22, 1.37, 1.2, -0.38, '#FFF6C8']);
  const g = new THREE.Group();
  const win = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x000000 });
  g.add(boxesOf(body, new THREE.MeshLambertMaterial({ vertexColors: true })), boxesOf(lit, win));
  g.userData.win = win;
  return g;
}

export function initCity(root, { lineages, ticket, onPick } = {}) {
  const city = buildCity(lineages);
  const { solidMesh, glowMesh } = meshesOf(city);
  const O = (x, y, z) => new THREE.Vector3(x - city.W / 2, y, z - city.D / 2);   // city blocks to scene
  const scene = new THREE.Scene();
  scene.add(solidMesh, glowMesh);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8a7a66, 1.25);
  const sun = new THREE.DirectionalLight(0xffffff, 1.9);
  sun.position.set(-30, 60, 25);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -50, right: 50, top: 50, bottom: -50, near: 1, far: 160 });
  scene.add(hemi, sun);

  // trains, one per line, there and back
  const trains = Object.entries(city.tracks).map(([line, path], i) => {
    const t = trainOf(LINES[line]);
    scene.add(t);
    return { t, path, color: LINES[line], s: (i * 7) % path.length, dir: 1, speed: 0.06 + 0.012 * i };
  });
  // the reads, running down the cables from the sequencer to the station
  const reads = [];
  BASES.forEach((c, i) => { for (let k = 0; k < 2; k++) { const m = cube(0.45, 0.45, 0.45, lambert(c, { emissive: c, emissiveIntensity: 0 })); scene.add(m); reads.push({ m, z: 21.25 + i * 2, s: k * 2.5 + i * 0.7 }); } });
  // smoke from the codon factory
  const smoke = [0, 1, 2, 3, 4].map(i => { const m = cube(0.9, 0.9, 0.9, lambert('#F4F2EC', { transparent: true, opacity: 0.9 })); m.castShadow = false; scene.add(m); return { m, s: i / 5 }; });
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
  scene.add(scales);
  // the bridge of the crane in the snpick yard: trucks on the rails, a trolley, a grab with a base in it
  const bridge = boxesOf([[11, 0.5, 0.8, 0, 0, 0, P.ochre], [11, 0.1, 0.84, 0, 0.3, 0, shade(P.ochre, 0.82)], [0.9, 0.45, 1.3, -5.1, 0.05, 0, P.dark], [0.9, 0.45, 1.3, 5.1, 0.05, 0, P.dark],
    [1.3, 0.6, 1.1, 0.4, 0.55, 0, P.red], [0.1, 2.1, 0.1, 0.4, -1.3, 0, P.black], [0.9, 0.3, 0.9, 0.4, -2.45, 0, P.dark], [0.1, 0.4, 0.8, 0, -2.75, 0, P.dark], [0.1, 0.4, 0.8, 0.8, -2.75, 0, P.dark],
    [0.5, 0.5, 0.5, 0.4, -2.85, 0, BASES[2]]], new THREE.MeshLambertMaterial(vc));
  scene.add(bridge);
  // koi in the pond, their backs just out of the water
  const koi = [0, 1, 2].map(i => {
    const a = i === 1 ? '#F4F1EA' : '#F08A3C', b = i === 1 ? '#F08A3C' : '#F4F1EA';
    const g = boxesOf([[1.1, 0.22, 0.5, 0, 0, 0, a], [0.4, 0.23, 0.52, 0.2, 0.01, 0, b], [0.35, 0.16, 0.62, -0.72, 0, 0, a], [0.2, 0.1, 0.2, 0.62, 0.06, 0, b]], new THREE.MeshLambertMaterial(vc));
    g.castShadow = false;
    scene.add(g);
    return { g, a: i * 2.1, r: 1.6 + i * 0.6 };
  });
  // the lighthouse lamp, seen between the posts of its lantern, and at night its beam sweeping round
  const lampMat = lambert('#FFE38A', { emissive: '#FFD04D', emissiveIntensity: 0.4 });
  const lamp = cube(1.7, 1.5, 1.7, lampMat); lamp.position.copy(O(city.lighthouse.x + 0.5, 17.5, city.lighthouse.z + 0.5)); scene.add(lamp);
  const rayMat = new THREE.MeshBasicMaterial({ color: '#FFF1A8', transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });
  const beam = new THREE.Group();
  beam.position.copy(lamp.position);
  for (const s of [1, -1]) {
    const ray = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 1.2, 8, 8, 1, true), rayMat);
    ray.rotation.z = -s * Math.PI / 2; ray.position.x = s * 4.9;
    beam.add(ray);
  }
  scene.add(beam);

  // ---- the view ----
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 400);
  // how it is seen: turned round (yaw) and from how high (pitch), from nearly
  // the ground to straight above
  const PITCH = [0.1, 1.54];
  const tilted = (p) => Math.max(PITCH[0], Math.min(PITCH[1], p));
  const view = { yaw: 0.34, pitch: Math.atan(0.72), goal: null, pitchGoal: null };
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
    const halfW = (compact ? 43 : 42) * k, aspect = cssW / cssH;
    if (camera.right === halfW && camera.top === halfW / aspect) return;
    camera.left = -halfW; camera.right = halfW; camera.top = halfW / aspect; camera.bottom = -halfW / aspect;
    camera.updateProjectionMatrix();
  }
  function place() {
    fit();
    const r = 120;
    camera.position.set(Math.sin(view.yaw) * Math.cos(view.pitch) * r, Math.sin(view.pitch) * r + 3, Math.cos(view.yaw) * Math.cos(view.pitch) * r + 1);
    camera.lookAt(0, 3, 1);
    camera.updateMatrixWorld();
  }

  // ---- labels over the buildings, and their tickets ----
  const anchors = anchorsOf(city);
  const tags = new Map();
  root.querySelectorAll('.city-label[data-tag]').forEach(b => {
    const tag = b.dataset.tag;
    if (!anchors[tag]) return;
    b.addEventListener('click', (e) => { e.stopPropagation(); open(tag); });
    b.addEventListener('mouseenter', () => light(tag));
    b.addEventListener('mouseleave', () => light(''));
    b.addEventListener('focus', () => light(tag));
    b.addEventListener('blur', () => light(''));
    tags.set(tag, { tag, el: b, pos: anchors[tag], line: b.dataset.line });
  });
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
      + `<p class="city-ticket-desc">${esc(t.desc)}</p>`
      + (t.links && t.links.length ? `<p class="city-ticket-links">${t.links.map(k => `<a href="${esc(k.href)}" target="_blank" rel="noopener">${esc(k.label)}</a>`).join('')}</p>` : '');
    card.className = `city-ticket city-ticket--${l.line || 'none'}`;
    card.hidden = false;
    card.querySelector('.city-ticket-x').addEventListener('click', close);
    placeTicket();
    onPick && onPick(tag);
    const first = card.querySelector('a');
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
    if (compact) return;
    for (const l of tags.values()) {
      v.copy(l.pos).project(camera);
      // over its building, but never out of the city's frame
      const hw = l.el.offsetWidth / 2 + 2, hh = l.el.offsetHeight + 2;
      const x = Math.max(hw, Math.min(cssW - hw, (v.x + 1) / 2 * cssW)), y = Math.max(hh, Math.min(cssH - 2, (1 - v.y) / 2 * cssH));
      l.el.dataset.x = x; l.el.dataset.y = y;
      l.el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -100%)`;
    }
    placeTicket();
  }

  // ---- pointing at a building lights it up ----
  const byTag = { solid: {}, glow: {} };
  [[solidMesh, byTag.solid], [glowMesh, byTag.glow]].forEach(([mesh, idx]) => mesh.userData.tags.forEach((t, i) => { if (t) (idx[t] || (idx[t] = [])).push(i); }));
  let lit = '';
  const bright = new THREE.Color();
  function light(tag) {
    if (tag === lit) return;
    [[solidMesh, byTag.solid], [glowMesh, byTag.glow]].forEach(([mesh, idx]) => {
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
    const hit = ray.intersectObjects([solidMesh, glowMesh], false)[0];
    const t = hit ? hit.object.userData.tags[hit.instanceId] : '';
    return tags.has(t) ? t : '';
  }
  // dragging sideways turns the city, and with a mouse up and down tilts it (on a
  // touch screen that scrolls the page, so the arrows tilt it); a tap without a
  // drag opens a ticket
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, yaw: view.yaw, pitch: view.pitch, moved: false, id: e.pointerId, mouse: e.pointerType !== 'touch' }; });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) { light(pick(e)); return; }
    const dx = e.clientX - drag.x, dy = drag.mouse ? e.clientY - drag.y : 0;
    if (!drag.moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) { drag.moved = true; canvas.setPointerCapture(drag.id); }
    if (!drag.moved) return;
    view.yaw = drag.yaw - dx * 0.008; view.goal = null;
    if (drag.mouse) { view.pitch = tilted(drag.pitch + dy * 0.006); view.pitchGoal = null; }
    dirty = true;
  });
  canvas.addEventListener('pointerup', (e) => { const was = drag; drag = null; if (was && !was.moved) { const t = pick(e); if (t) open(t); else close(); } });
  canvas.addEventListener('pointercancel', () => { drag = null; });
  canvas.addEventListener('pointerleave', () => { if (!drag) light(''); });
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
  stage.appendChild(arrows);

  // ---- the map of the lines, in a corner: the same city without buildings ----
  const map = document.createElement('div');
  map.className = 'city-map';
  map.setAttribute('aria-hidden', 'true');
  const stop = (tag, x, y, name, below, dashed) => `<g class="city-map-stop" data-tag="${tag}"><title>${esc(name)}</title>`
    + `<circle cx="${x}" cy="${y}" r="5"${dashed ? ' stroke-dasharray="2 2"' : ''}/>`
    + `<text x="${x}" y="${below ? y + 14 : y - 8}" text-anchor="middle">${esc(name)}</text></g>`;
  map.innerHTML = `<svg viewBox="0 0 292 128" role="presentation">
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
  </svg>`;
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
    const line = Object.keys(LINES).find(k => LINES[k] === tr.color);
    const d = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    d.setAttribute('width', '7'); d.setAttribute('height', '5'); d.setAttribute('rx', '1');
    d.setAttribute('fill', tr.color);
    dots.appendChild(d);
    return { tr, d, line: mapLines[line] };
  });
  function placeMapTrains() {
    mapTrains.forEach(({ tr, d, line }) => {
      if (!line) return;
      const p = line.el.getPointAtLength(line.len * tr.s / Math.max(1, tr.path.length - 1));
      d.setAttribute('x', (p.x - 3.5).toFixed(1)); d.setAttribute('y', (p.y - 2.5).toFixed(1));
    });
  }

  // ---- day and night ----
  function theme() {
    const night = document.documentElement.getAttribute('data-theme') === 'dark';
    hemi.intensity = night ? 0.45 : 1.25;
    sun.intensity = night ? 0.35 : 1.9;
    sun.color.set(night ? '#8FA0FF' : '#ffffff');
    glowMesh.material.emissive.set(night ? '#FFC96B' : '#000000');
    glowMesh.material.emissiveIntensity = night ? 0.9 : 0;
    trains.forEach(tr => tr.t.userData.win.emissive.set(night ? '#FFE9A8' : '#000000'));
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
      tr.s += tr.dir * tr.speed * dt * k;
      if (tr.s >= tr.path.length - 1) { tr.s = tr.path.length - 1; tr.dir = -1; }
      if (tr.s <= 0) { tr.s = 0; tr.dir = 1; }
      const i = Math.floor(tr.s), f = tr.s - i;
      const a = tr.path[i], b = tr.path[Math.min(i + 1, tr.path.length - 1)];
      tr.t.position.copy(O(a[0] + (b[0] - a[0]) * f + 0.75, 0, a[1] + (b[1] - a[1]) * f + 0.75));
      const ahead = tr.path[Math.min(i + 1, tr.path.length - 1)], behind = tr.path[Math.max(i - 1, 0)];
      tr.t.rotation.y = Math.atan2(-(ahead[1] - behind[1]), ahead[0] - behind[0]) + (tr.dir < 0 ? Math.PI : 0);
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
  }
  function frame(ts) {
    requestAnimationFrame(frame);
    const dt = last ? Math.min((ts - last) / 16.667, 3) : 1;
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
    if (speed > 0) { move(dt, speed * 2); dirty = true; }
    if (!dirty) return;
    dirty = false;
    place();
    renderer.render(scene, camera);
    placeLabels();
    placeMapTrains();
  }
  window.addEventListener('resize', resize);
  resize(); theme(); place(); move(0, 0);
  requestAnimationFrame(frame);
  // for the page's own tests: the clock the moving things keep
  return { tags, view, open, close, light, redraw: () => { dirty = true; }, get clock() { return t; } };
}
