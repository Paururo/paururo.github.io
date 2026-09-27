// ============================================================
// The tools as a voxel city. The sequencer sends reads down its cables to
// BAMpiro, the central station, and from there a railway line runs to each
// question, with a building for the tool that answers it. Drawn in 3D and
// shown at a low resolution, so every block is a crisp pixel. Point at a
// building to light it up, press it for its ticket; drag, or use the arrows,
// to turn the city round and to look at it from higher up or lower down.
// ============================================================
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.min.js';

const P = {
  grass: '#8CC279', grass2: '#7FB86C', dirt: '#9C7650', dirt2: '#84613F', road: '#A3A59F', pave: '#DAD6CB', pave2: '#CFCBBF',
  water: '#6BB6D6', water2: '#58A4C8', rail: '#565B62', sleeper: '#8B6A4A',
  red: '#D0503F', blue: '#3F6FC4', green: '#3E9B5A', ochre: '#E0A030', plum: '#8B6BB0',
  white: '#F2EFE8', cream: '#E9DFC6', brick: '#C4674F', brick2: '#B25A44', stone: '#B7B2A6', glass: '#A9CFE3', dark: '#3A3F46',
  wood: '#9C6B43', roof: '#6E5A4E', leaf: '#56A452', leaf2: '#468F45', trunk: '#7A5436', skin: '#F0C8A0', steel: '#8D949C', black: '#26292D',
};
const LINES = { red: P.red, blue: P.blue, green: P.green, ochre: P.ochre, plum: P.plum };
const BASES = ['#6BD88E', '#FF7A6B', '#7FA8FF', '#FFD166'];
const esc = (x) => String(x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---- the city, block by block ----
function buildCity(lineages) {
  const vox = new Map();
  const key = (x, y, z) => `${x},${y},${z}`;
  const put = (x, y, z, c, tag = '', glow = false) => vox.set(key(x, y, z), { x, y, z, c, tag, glow });
  const del = (x, y, z) => vox.delete(key(x, y, z));
  const fill = (x0, y0, z0, w, h, d, c, tag = '', glow = false) => {
    for (let x = x0; x < x0 + w; x++) for (let y = y0; y < y0 + h; y++) for (let z = z0; z < z0 + d; z++) put(x, y, z, c, tag, glow);
  };
  // walls with windows every other block
  const shell = (x0, y0, z0, w, h, d, c, tag, { win = P.glass, from = 1, step = 2, top = 1 } = {}) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) {
      const edge = x === x0 || x === x0 + w - 1 || z === z0 || z === z0 + d - 1;
      if (!edge) continue;
      const corner = (x === x0 || x === x0 + w - 1) && (z === z0 || z === z0 + d - 1);
      const along = (z === z0 || z === z0 + d - 1) ? x - x0 : z - z0;
      const isWin = !corner && y - y0 >= from && y < y0 + h - top && (y - y0 - from) % 2 === 0 && along % step === 1;
      put(x, y, z, isWin ? win : c, tag, isWin);
    }
    fill(x0, y0 + h - 1, z0, w, 1, d, c, tag);
  };

  const W = 74, D = 48;
  // the board: grass on a thick slab of earth
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    put(x, -1, z, (x * 7 + z * 13) % 11 < 2 ? P.grass2 : P.grass);
    put(x, -2, z, P.dirt); put(x, -3, z, P.dirt2);
  }
  const ground = (x0, z0, w, d, c) => { for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) put(x, -1, z, typeof c === 'function' ? c(x, z) : c); };

  // ---- railways: rails, sleepers and the colour of the line between them ----
  const tracks = {};
  const railAt = (x, z, line) => {
    put(x, -1, z, P.sleeper);
    put(x, 0, z, LINES[line]);
  };
  const track = (line, pts) => {
    const path = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
      const n = Math.max(Math.abs(x1 - x0), Math.abs(z1 - z0));
      for (let k = 0; k <= n; k++) {
        const x = Math.round(x0 + (x1 - x0) * k / n), z = Math.round(z0 + (z1 - z0) * k / n);
        railAt(x, z, line);
        if (!path.length || path[path.length - 1][0] !== x || path[path.length - 1][1] !== z) path.push([x, z]);
      }
    }
    tracks[line] = path;
  };

  // ---- the sequencer, where the reads come from ----
  fill(2, 0, 18, 9, 6, 11, P.white, 'reads');
  fill(3, 6, 19, 7, 1, 9, P.stone, 'reads');
  fill(10, 1, 20, 1, 3, 7, P.dark, 'reads');                 // its screen
  for (let z = 21; z < 26; z += 2) put(10, 2, z, '#7FE0A0', 'reads', true);
  fill(2, 4, 18, 9, 1, 1, P.blue, 'reads', true);            // the light bar
  // the reads run to the station in a bundle of cables, one per base
  ['#6BD88E', '#FF7A6B', '#7FA8FF', '#FFD166'].forEach((c, i) => { for (let x = 11; x < 16; x++) put(x, 0, 21 + i * 2, c, 'reads'); });

  // ---- BAMpiro, the central station ----
  ground(15, 14, 20, 20, P.pave);
  shell(16, 0, 15, 17, 7, 17, P.cream, 'BAMpiro', { step: 3 });
  // a glass vault over the platforms
  for (let x = 16; x < 33; x++) {
    const h = [8, 9, 10, 10, 10, 9, 8];
    for (let i = 0; i < 7; i++) put(x, h[i], 20 + i, (x % 4 === 0) ? P.steel : P.glass, 'BAMpiro', x % 4 !== 0);
  }
  // the clock tower, at the back corner so it hides nothing
  fill(16, 0, 15, 5, 15, 5, P.brick, 'BAMpiro');
  fill(17, 15, 16, 3, 2, 3, P.red, 'BAMpiro');
  put(18, 17, 17, P.red, 'BAMpiro');
  fill(17, 11, 20, 3, 3, 1, P.white, 'BAMpiro');                                // a clock on each side you see
  put(18, 12, 20, P.black, 'BAMpiro'); put(18, 13, 20, P.black, 'BAMpiro'); put(19, 12, 20, P.black, 'BAMpiro');
  fill(21, 11, 16, 1, 3, 3, P.white, 'BAMpiro');
  put(21, 12, 17, P.black, 'BAMpiro'); put(21, 13, 17, P.black, 'BAMpiro'); put(21, 12, 18, P.black, 'BAMpiro');

  // ---- the lines ----
  track('red', [[24, 14], [24, 6], [40, 6]]);
  track('blue', [[33, 19], [70, 19]]);
  track('green', [[33, 25], [66, 25]]);
  track('ochre', [[24, 32], [24, 38], [30, 38]]);
  track('plum', [[64, 26], [64, 36], [70, 36]]);

  // ---- pathotypr: a lighthouse that tells who it is and what resists ----
  const lighthouse = { x: 44, z: 5 };
  for (let y = 0; y < 16; y++) {
    const r = y < 3 ? 3 : 2;
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      if (dx * dx + dz * dz > r * r + 1) continue;
      put(lighthouse.x + dx, y, lighthouse.z + dz, Math.floor(y / 3) % 2 ? P.red : P.white, 'pathotypr');
    }
  }
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (dx * dx + dz * dz <= 5) {
    put(lighthouse.x + dx, 16, lighthouse.z + dz, P.dark, 'pathotypr');
    if (Math.abs(dx) === 2 || Math.abs(dz) === 2) { put(lighthouse.x + dx, 17, lighthouse.z + dz, P.glass, 'pathotypr', true); put(lighthouse.x + dx, 18, lighthouse.z + dz, P.glass, 'pathotypr', true); }
  }
  fill(lighthouse.x - 1, 19, lighthouse.z - 1, 3, 1, 3, P.red, 'pathotypr');
  put(lighthouse.x, 20, lighthouse.z, P.red, 'pathotypr');
  put(lighthouse.x, 17, lighthouse.z, '#FFE38A', 'pathotypr', true); put(lighthouse.x, 18, lighthouse.z, '#FFE38A', 'pathotypr', true);

  // ---- get_MNV: the codon factory, three bases in, one amino acid out ----
  shell(37, 0, 10, 10, 6, 7, P.brick, 'get_MNV', { win: P.glass, step: 3 });
  for (let x = 37; x < 47; x++) for (let z = 10; z < 17; z++) {                // a sawtooth roof
    const s = (z - 10) % 3;
    put(x, 6 + (s === 2 ? 1 : 0), z, s === 2 ? P.glass : P.roof, 'get_MNV', s === 2);
  }
  fill(38, 6, 11, 2, 7, 2, P.brick2, 'get_MNV');                               // the chimney
  fill(38, 13, 11, 2, 1, 2, P.dark, 'get_MNV');
  fill(40, 0, 17, 7, 1, 1, P.dark, 'get_MNV');                                 // the conveyor belt out front

  // ---- eskaks: the scales, dN against dS ----
  shell(52, 0, 11, 8, 6, 6, P.white, 'eskaks', { step: 2 });
  fill(52, 6, 11, 8, 1, 6, P.blue, 'eskaks');
  fill(55, 7, 13, 2, 5, 2, P.steel, 'eskaks');                                  // the post of the balance

  // ---- snpick: the picking yard, an alignment with the variable sites in colour ----
  ground(36, 27, 11, 7, P.pave2);
  for (let x = 37; x < 46; x++) {
    const snp = [39, 42, 44].includes(x);
    put(x, 0, 30, snp ? ['#FF7A6B', '#7FA8FF', '#FFD166'][[39, 42, 44].indexOf(x)] : P.stone, 'snpick');
    put(x, 0, 31, P.stone, 'snpick');
  }
  fill(36, 0, 28, 1, 6, 1, P.ochre, 'snpick'); fill(46, 0, 28, 1, 6, 1, P.ochre, 'snpick');   // the gantry
  fill(36, 0, 33, 1, 6, 1, P.ochre, 'snpick'); fill(46, 0, 33, 1, 6, 1, P.ochre, 'snpick');
  fill(36, 6, 28, 1, 1, 6, P.ochre, 'snpick'); fill(46, 6, 28, 1, 1, 6, P.ochre, 'snpick');
  fill(38, 0, 28, 3, 2, 2, P.wood, 'snpick');                                   // the crate the picks go in

  // ---- a park by the observatory, with a tree that branches in two, and in two again ----
  ground(48, 27, 9, 9, P.grass2);
  const crown = (cx, cy, cz, r) => {
    for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) for (let dz = -r; dz <= r; dz++) {
      if (dx * dx + dy * dy * 1.6 + dz * dz > r * r + 0.8) continue;
      put(cx + dx, cy + dy, cz + dz, (dx + dy + dz) % 3 ? P.leaf : P.leaf2, '');
    }
  };
  // a tree that splits in two, and each half in two again, like a phylogeny
  const split = (x, y, z, dir, len, depth) => {
    let cx = x, cy = y;
    for (let i = 0; i < len; i++) { cx += dir[0]; cy += 1; put(cx, cy, z + dir[1] * Math.floor(i / 2), P.trunk, ''); }
    const cz = z + dir[1] * Math.floor((len - 1) / 2);
    if (depth === 0) { crown(cx, cy + 1, cz, 2); return; }
    split(cx, cy, cz, [-1, dir[1] || 1], len - 1, depth - 1);
    split(cx, cy, cz, [1, dir[1] || -1], len - 1, depth - 1);
  };
  fill(52, 0, 31, 2, 6, 2, P.trunk, '');
  split(52, 5, 31, [-1, 1], 4, 1);
  split(53, 5, 32, [1, -1], 4, 1);

  // ---- distree: an observatory that measures the tree ----
  shell(58, 0, 28, 6, 4, 6, P.white, 'distree', { step: 2 });
  for (let dx = 0; dx < 6; dx++) for (let dz = 0; dz < 6; dz++) {
    const h = 4 + Math.round(2.4 - Math.hypot(dx - 2.5, dz - 2.5) * 0.9);
    for (let y = 4; y <= h; y++) put(58 + dx, y, 28 + dz, P.steel, 'distree');
  }
  fill(56, 6, 30, 3, 1, 1, P.dark, 'distree');                                  // the telescope, at the tree

  // ---- fstic: the market square, populations mixing ----
  ground(28, 36, 14, 10, (x, z) => ((x + z) % 2 ? P.pave : P.pave2));
  [[30, P.red], [34, P.ochre], [38, P.blue]].forEach(([x, c]) => {
    fill(x, 0, 38, 1, 3, 1, P.wood, 'fstic'); fill(x + 2, 0, 38, 1, 3, 1, P.wood, 'fstic');
    for (let dx = 0; dx < 3; dx++) put(x + dx, 3, 38, dx % 2 ? P.white : c, 'fstic');
    for (let dx = 0; dx < 3; dx++) put(x + dx, 3, 39, dx % 2 ? c : P.white, 'fstic');
    fill(x, 1, 38, 3, 1, 1, P.wood, 'fstic');
  });
  fill(33, 0, 44, 5, 3, 1, P.dark, 'fstic');                                     // the scoreboard
  fill(34, 1, 45, 3, 1, 1, '#86F09C', 'fstic', true);

  // ---- mycolorsTB: a house painted in the fourteen lineage colours ----
  shell(56, 0, 38, 7, 7, 6, P.white, 'mycolorsTB', { step: 3 });
  for (let x = 56; x < 63; x++) for (let y = 0; y < 6; y++) put(x, y, 43, lineages[(x - 56) % lineages.length], 'mycolorsTB');
  for (let z = 38; z < 44; z++) for (let y = 0; y < 6; y++) put(62, y, z, lineages[(z - 38 + 7) % lineages.length], 'mycolorsTB');
  for (let i = 0; i < 4; i++) fill(56 + i, 7 + i, 38, 7 - 2 * i > 0 ? 7 - 2 * i : 1, 1, 6, P.plum, 'mycolorsTB');

  // ---- karyon: under works ----
  ground(66, 38, 7, 7, P.dirt);
  for (const [x, z] of [[66, 38], [71, 38], [66, 43], [71, 43]]) fill(x, 0, z, 1, 8, 1, P.ochre, 'karyon');
  fill(66, 4, 38, 6, 1, 1, P.ochre, 'karyon'); fill(66, 4, 43, 6, 1, 1, P.ochre, 'karyon');
  fill(66, 8, 38, 6, 1, 1, P.ochre, 'karyon'); fill(66, 8, 43, 6, 1, 1, P.ochre, 'karyon');
  fill(67, 0, 39, 4, 2, 4, P.stone, 'karyon');                                    // what is built so far
  fill(70, 0, 36, 1, 14, 1, P.ochre, 'karyon');                                    // the crane
  fill(63, 14, 36, 11, 1, 1, P.ochre, 'karyon');
  for (let x = 66; x < 73; x++) put(x, 0, 45, x % 2 ? P.red : P.white, 'karyon');   // the barrier

  // ---- the depot, where the older wagons rest ----
  ground(2, 34, 14, 12, P.pave2);
  shell(3, 0, 35, 12, 5, 6, P.brick, 'depot', { step: 3 });
  for (let x = 3; x < 15; x++) { put(x, 5, 36, P.roof, 'depot'); put(x, 6, 37, P.roof, 'depot'); put(x, 6, 38, P.roof, 'depot'); put(x, 5, 39, P.roof, 'depot'); }
  for (let x = 2; x < 16; x++) { put(x, -1, 43, P.sleeper); put(x, 0, 43, P.rail); }
  [[3, P.steel], [7, '#A08C7A'], [11, '#8FA3B0']].forEach(([x, c]) => fill(x, 1, 42, 3, 2, 3, c, 'depot'));

  // ---- a pond with koi, and trees, lamps and people ----
  ground(44, 38, 9, 7, P.water);
  for (let x = 44; x < 53; x++) for (let z = 38; z < 45; z++) { del(x, -1, z); put(x, -2, z, (x + z) % 3 ? P.water : P.water2); }
  const tree = (x, z, h = 3) => { fill(x, 0, z, 1, h, 1, P.trunk); fill(x - 1, h, z - 1, 3, 2, 3, (x + z) % 2 ? P.leaf : P.leaf2); put(x, h + 2, z, P.leaf); };
  [[3, 3], [9, 5], [14, 3], [28, 3], [34, 10], [49, 3], [56, 4], [66, 5], [70, 11], [3, 11], [12, 12], [70, 30], [44, 34], [20, 43], [26, 45]].forEach(([x, z]) => tree(x, z, 2 + (x * z) % 3));
  const lamp = (x, z) => { fill(x, 0, z, 1, 4, 1, P.dark); put(x, 4, z, '#FFE38A', '', true); };
  [[35, 22], [47, 22], [59, 22], [21, 12], [27, 35], [66, 33]].forEach(([x, z]) => lamp(x, z));
  const person = (x, z, c) => { put(x, 0, z, c); put(x, 1, z, P.skin); };
  [[30, 41, P.red], [31, 42, P.red], [36, 42, P.blue], [37, 41, P.blue], [39, 42, P.ochre], [33, 40, P.ochre], [26, 30, P.green], [50, 36, P.plum]].forEach(([x, z, c]) => person(x, z, c));

  return { vox, tracks, W, D, lighthouse };
}

// ---- turning blocks into meshes ----

// ---- turning blocks into meshes ----
function meshesOf(city) {
  const solid = [], glow = [];
  for (const v of city.vox.values()) (v.glow ? glow : solid).push(v);
  const box = new THREE.BoxGeometry(1, 1, 1);
  const make = (list, material) => {
    const mesh = new THREE.InstancedMesh(box, material, list.length);
    const m = new THREE.Matrix4(), c = new THREE.Color();
    list.forEach((v, i) => {
      m.makeTranslation(v.x - city.W / 2 + 0.5, v.y + 0.5, v.z - city.D / 2 + 0.5);
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
  for (const v of city.vox.values()) {
    if (!v.tag) continue;
    const b = box[v.tag] || (box[v.tag] = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity, y1: -Infinity });
    b.x0 = Math.min(b.x0, v.x); b.x1 = Math.max(b.x1, v.x); b.z0 = Math.min(b.z0, v.z); b.z1 = Math.max(b.z1, v.z); b.y1 = Math.max(b.y1, v.y);
  }
  const out = {};
  for (const [tag, b] of Object.entries(box)) {
    out[tag] = new THREE.Vector3((b.x0 + b.x1 + 1) / 2 - city.W / 2, b.y1 + 2.2, (b.z0 + b.z1 + 1) / 2 - city.D / 2);
  }
  return out;
}

// ---- what moves ----
const lambert = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const cube = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; return m; };
function trainOf(color) {
  const g = new THREE.Group();
  const body = lambert(color), roof = lambert('#EDEBE4'), win = lambert('#E8FFF0', { emissive: 0x000000 });
  for (let i = 0; i < 3; i++) {
    g.add(cube(2.7, 1.3, 1.3, body, -i * 3, 1.15, 0), cube(2.7, 0.3, 1.3, roof, -i * 3, 1.95, 0), cube(2.3, 0.45, 1.36, win, -i * 3, 1.35, 0));
  }
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
  BASES.forEach((c, i) => { for (let k = 0; k < 2; k++) { const m = cube(0.7, 0.5, 0.7, lambert(c, { emissive: c, emissiveIntensity: 0 })); scene.add(m); reads.push({ m, z: 21 + i * 2, s: k * 2.5 + i * 0.7 }); } });
  // smoke from the codon factory
  const smoke = [0, 1, 2, 3].map(i => { const m = cube(1, 1, 1, lambert('#F4F2EC', { transparent: true, opacity: 0.9 })); m.castShadow = false; scene.add(m); return { m, s: i / 4 }; });
  // the scales of eskaks, weighing one against the other
  const scales = new THREE.Group();
  scales.position.copy(O(56, 12.4, 14));
  const beamMat = lambert(P.steel);
  scales.add(cube(7, 0.4, 0.5, beamMat));
  const panL = new THREE.Group(), panR = new THREE.Group();
  panL.position.x = -3.2; panR.position.x = 3.2;
  panL.add(cube(0.2, 1.4, 0.2, beamMat, 0, -0.7, 0), cube(1.8, 0.3, 1.8, lambert(P.stone), 0, -1.5, 0), cube(0.9, 0.9, 0.9, lambert(P.red), 0, -0.9, 0));
  panR.add(cube(0.2, 1.4, 0.2, beamMat, 0, -0.7, 0), cube(1.8, 0.3, 1.8, lambert(P.stone), 0, -1.5, 0), cube(0.9, 0.9, 0.9, lambert(P.green), 0, -0.9, 0), cube(0.9, 0.9, 0.9, lambert(P.green), 0, 0, 0));
  scales.add(panL, panR);
  scene.add(scales);
  // the bridge of the crane in the snpick yard
  const bridge = new THREE.Group();
  bridge.add(cube(11, 0.6, 0.8, lambert(P.ochre)), cube(0.5, 2.4, 0.5, lambert(P.dark), 0, -1.4, 0), cube(1.2, 0.5, 1.2, lambert(P.red), 0, -2.8, 0));
  scene.add(bridge);
  // koi in the pond
  const koi = [0, 1, 2].map(i => { const g = new THREE.Group(); g.add(cube(1.5, 0.35, 0.7, lambert(i === 1 ? '#F4F1EA' : '#F08A3C')), cube(0.5, 0.36, 0.72, lambert(i === 1 ? '#F08A3C' : '#F4F1EA'), 0.3, 0.01, 0)); scene.add(g); return { g, a: i * 2.1, r: 1.6 + i * 0.6 }; });
  // the lighthouse lamp
  const lampMat = lambert('#FFE38A', { emissive: '#FFD04D', emissiveIntensity: 0.4 });
  const lamp = cube(1.1, 1.8, 1.1, lampMat); lamp.position.copy(O(city.lighthouse.x + 0.5, 17.9, city.lighthouse.z + 0.5)); scene.add(lamp);

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
    const phone = compact;
    const pix = phone ? 2 : 3;                         // CSS pixels per rendered pixel
    cssW = stage.clientWidth; cssH = stage.clientHeight;
    renderer.setSize(Math.max(1, Math.round(cssW / pix)), Math.max(1, Math.round(cssH / pix)), false);
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
      tr.t.position.copy(O(a[0] + (b[0] - a[0]) * f + 0.5, 0, a[1] + (b[1] - a[1]) * f + 0.5));
      const ahead = tr.path[Math.min(i + 1, tr.path.length - 1)], behind = tr.path[Math.max(i - 1, 0)];
      tr.t.rotation.y = Math.atan2(-(ahead[1] - behind[1]), ahead[0] - behind[0]) + (tr.dir < 0 ? Math.PI : 0);
    });
    reads.forEach(r => { const s = (r.s + t * 0.05) % 5; at(11.5 + s, 1.25, r.z + 0.5, r.m); r.m.visible = s < 4.6; });
    smoke.forEach(p => {
      const s = (p.s + t * 0.006) % 1;
      at(39 + Math.sin(s * 6) * 0.4, 14.5 + s * 7, 12 + s * 1.5, p.m);
      p.m.scale.setScalar(1.1 - s * 0.7);
      p.m.material.opacity = 0.95 - s * 0.9;
    });
    scales.rotation.z = Math.sin(t * 0.025) * 0.22;
    panL.rotation.z = -scales.rotation.z; panR.rotation.z = -scales.rotation.z;
    at(41.5, 6.8, 30.5 + Math.sin(t * 0.02) * 2.4, bridge);
    koi.forEach(q => { const a = q.a + t * 0.02; at(48.5 + Math.cos(a) * q.r * 1.5, -1.25, 41.5 + Math.sin(a) * q.r, q.g); q.g.rotation.y = -a; });
    lampMat.emissiveIntensity = 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(t * 0.08));
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
