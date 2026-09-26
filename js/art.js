// ============================================================
// Drawing: pixel sprites, the koi pond behind the page, the pencil
// helices, the career chromosome and the genome ruler.
// ============================================================

// Visitors who ask their OS for less motion start with the animations off;
// the speed control can still turn them on.
const PREFERS_REDUCED_MOTION = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
let animSpeed = PREFERS_REDUCED_MOTION ? 0 : 0.5;

const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
const rgba = (c, a) => `rgba(${c.r},${c.g},${c.b},${a})`;
const tokenRgb = (name) => hexToRgb(cssVar('--' + name) || '#888888');

// Small seeded generator so a doodle wobbles the same way on every frame
function seeded(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// ==================== PIXEL SPRITES ====================
// Each sprite is a grid of characters; '.' is transparent.
const PX_PALETTE = {
  k: '#2E2925', c: '#3F4B5E', b: '#8A94A3', f: '#C2603A', g: '#D6B25A', h: '#5A3F2E',
  s: '#F0C9A6', m: '#C77B64', t: '#6E9774', d: '#3E5B7B', p: '#4A4F5C',
  a: '#E9A07F', v: '#9CC6A2', w: '#FFFDF7', u: '#7FA3C7',
  n: '#5CC95C', q: '#96E08C', j: '#3C9E47', x: '#1E1A17', o: '#2E6B33', i: '#F4A3B4',
};
const PX_SPRITES = {
  // The mascot: a fuzzy M. tuberculosis bacillus. No flagella, so it does
  // not swim: it inches along the ruler, stretched then squashed.
  bacillus: [
    '....kkkkkkkkkkkk....', '...kqqqqqqqqqqqqk...', '..kqnnnnnnnnnnnnqk..', '.knnnnwxnnnnwxnnnjk.',
    '.knnnnxxnnnnxxnnnjk.', '.knnnnnnnoonnnnnnjk.', '..kjjjjjojjojjjjjk..', '...kkkkkkkkkkkkkk...',
  ],
  bacillus2: [
    '....................', '....kkkkkkkkkkkk....', '..kkqqqqqqqqqqqqkk..', '.knnnnwxnnnnwxnnnnk.',
    'knnnnnxxnnnnxxnnnnjk', 'knnnnnnnnoonnnnnnnjk', '.kjjjjjjjojjojjjjjk.', '..kkkkkkkkkkkkkkkk..',
  ],
  bacillusBlink: [
    '....kkkkkkkkkkkk....', '...kqqqqqqqqqqqqk...', '..kqnnnnnnnnnnnnqk..', '.knnnnnnnnnnnnnnnjk.',
    '.knnnnxxnnnnxxnnnjk.', '.knnnnnnnoonnnnnnjk.', '..kjjjjjojjojjjjjk..', '...kkkkkkkkkkkkkk...',
  ],
  bacillusHappy: [
    '....kkkkkkkkkkkk....', '...kqqqqqqqqqqqqk...', '..kqnnnnnnnnnnnnqk..', '.knnnnxxnnnnxxnnnjk.',
    '.knnnxnnxnnxnnxnnjk.', '.knnnnnnnoonnnnnnjk.', '..kjjjjjojjojjjjjk..', '...kkkkkkkkkkkkkk...',
  ],
  bacillusBlush: [
    '....kkkkkkkkkkkk....', '...kqqqqqqqqqqqqk...', '..kqnnnnnnnnnnnnqk..', '.knnnnxxnnnnxxnnnjk.',
    '.knnnxnnxnnxnnxnnjk.', '.knniinnnoonnniinjk.', '..kjjjjjojjojjjjjk..', '...kkkkkkkkkkkkkk...',
  ],
  phage: [
    '....kkk....', '...kaaak...', '..kaaaaak..', '.kaaawaaak.', '.kaaaaaaak.', '..kaaaaak..',
    '...kaaak...', '....kkk....', '.....k.....', '....kkk....', '.....k.....', '...k.k.k...',
    '..k..k..k..', '.k.......k.',
  ],
  bacterium: [
    '.kkkkkkkk...', 'kaaaaaaaak..', 'akkaaakaakkk', 'kaaaakaaak.k', 'kaaaaaaaak..', '.kkkkkkkk...',
  ],
  virus: [
    '....k....', '.k.kkk.k.', '..kvvvk..', '.kvvkvvk.', 'kkvvvvvkk', '.kvkvvvk.', '..kvvvk..', '.k.kkk.k.', '....k....',
  ],
  download: [
    '..kkk..', '..kuk..', '..kuk..', 'kkkukkk', '.kuuuk.', '..kuk..', '...k...', 'kkkkkkk',
  ],
  star: [
    '...k...', '..kgk..', 'kkkgkkk', 'kgggggk', '.kgggk.', 'kgk.kgk', 'kk...kk',
  ],
};
function spriteRects(name) {
  const rows = PX_SPRITES[name];
  const rects = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.') { x++; continue; }
      let run = 1;
      while (x + run < row.length && row[x + run] === ch) run++;
      rects.push({ x, y, w: run, ch, fill: PX_PALETTE[ch] });
      x += run;
    }
  });
  return { rects, w: Math.max(...rows.map(r => r.length)), h: rows.length };
}
// The bacillus takes its colours from CSS, so a colour palette can stain it
const PX_VARS = { n: '--px-n', q: '--px-q', j: '--px-j', o: '--px-o' };
function spriteSVG(name, scale = 3, cls = '') {
  const { rects, w, h } = spriteRects(name);
  const paint = r => (PX_VARS[r.ch] ? `style="fill:var(${PX_VARS[r.ch]}, ${r.fill})"` : `fill="${r.fill}"`);
  const body = rects.map(r => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="1" ${paint(r)}/>`).join('');
  return `<svg class="px-sprite ${cls}" viewBox="0 0 ${w} ${h}" width="${w * scale}" height="${h * scale}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${body}</svg>`;
}
function fillSprites(root = document) {
  root.querySelectorAll('[data-sprite]').forEach(el => {
    el.innerHTML = spriteSVG(el.dataset.sprite, +(el.dataset.scale || 3), el.dataset.spriteClass || '');
  });
}

// ==================== SVG DEFS: rough filter + pixel dithers ====================
function injectSvgDefs() {
  const dither = (id, color, cells) => `<pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse">${cells.map(([x, y]) => `<rect x="${x}" y="${y}" width="4" height="4" style="fill:var(--${color})"/>`).join('')}</pattern>`;
  const half = [[0, 0], [4, 4]];
  const quarter = [[0, 0]];
  const threeQ = [[0, 0], [4, 4], [4, 0]];
  const colors = ['terra', 'sage', 'blue', 'ochre', 'ink'];
  const pats = colors.map(c => dither(`dither50-${c}`, c, half) + dither(`dither25-${c}`, c, quarter) + dither(`dither75-${c}`, c, threeQ)).join('');
  const holder = document.createElement('div');
  holder.innerHTML = `<svg class="svg-defs" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden">
    <defs>
      <filter id="rough" x="-5%" y="-20%" width="110%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="2.4"/></filter>
      <filter id="rough-soft" x="-5%" y="-20%" width="110%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="9"/><feDisplacementMap in="SourceGraphic" scale="3.2"/></filter>
      ${pats}
    </defs></svg>`;
  document.body.prepend(holder.firstElementChild);
}

// ==================== PENCIL HELPER (canvas) ====================
// Rough.js-style: every circle is drawn twice with a small, seeded wobble.
function pencilCircle(ctx, cx, cy, r, rnd, wob = 1) {
  for (let pass = 0; pass < 2; pass++) {
    const start = rnd() * Math.PI * 2;
    const steps = 18;
    ctx.beginPath();
    for (let i = 0; i <= steps + 1; i++) {
      const a = start + (i / steps) * Math.PI * 2;
      const rr = r + (rnd() - 0.5) * wob * 1.6;
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

// ==================== EVENT BUS ====================
// The desk, the coffee bar, the topbar, Polar and the pond talk through it.
const Bus = (() => {
  const subs = {};
  return {
    on(type, fn) { (subs[type] = subs[type] || []).push(fn); },
    emit(type, detail) { (subs[type] || []).slice().forEach(fn => { try { fn(detail); } catch (err) { console.error(err); } }); },
  };
})();

// ==================== KOI POND (page background) ====================
// Small pixel koi swim behind the page and eat the nucleotides that drift on
// the water; a click on bare paper throws in a handful. The varieties borrow
// the colours of the bases: kohaku (T, red on white), yamabuki ogon (G, gold),
// asagi (C, a net of blue scales) and midorigoi (A, green). On cue a crowd of
// them rises above the page and swims into a shape from my work, turning in
// 3D: a DNA double helix paired from the bases they ate, a tuberculosis
// bacillus, SARS-CoV-2 or a plasmid.
const KOI_BASES = ['A', 'T', 'C', 'G'];
const KOI_TOKEN = { A: 'sage', T: 'terra', C: 'blue', G: 'ochre' };
const KOI_MATE = { A: 'T', T: 'A', C: 'G', G: 'C' };
const KOI_GLYPH = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  C: ['.##', '#..', '#..', '#..', '.##'],
  G: ['.##', '#..', '#.#', '#.#', '.##'],
};
const KOI_TILE = ['.###.', '#####', '#####', '#####', '#####', '#####', '.###.'];
// Half-width of the body from the blunt nose (0) to the root of the tail
// (0.74), in art pixels for a koi 28 pixels long; the tail fans out after it.
const KOI_PROFILE = [[0, 1.6], [0.03, 2.5], [0.08, 3.2], [0.16, 3.6], [0.28, 3.6], [0.4, 3.2], [0.52, 2.5], [0.62, 1.7], [0.7, 1.1], [0.74, 1]];
const KOI_TAIL = 0.74;
function koiHalfWidth(s) {
  for (let i = 1; i < KOI_PROFILE.length; i++) {
    const [s1, w1] = KOI_PROFILE[i];
    if (s <= s1) { const [s0, w0] = KOI_PROFILE[i - 1]; return w0 + (w1 - w0) * (s - s0) / (s1 - s0); }
  }
  return KOI_PROFILE[KOI_PROFILE.length - 1][1];
}

function initKoiPond() {
  const canvas = document.getElementById('bioCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const JOINTS = 10;                         // the spine is a chain that follows the head
  let W = 0, H = 0, dpr = 1, P = 2, ap = 2;  // P: device pixels per art pixel, ap: CSS pixels per art pixel
  let koi = [], food = [], ripples = [], sparks = [], tiles = {}, pal = null, show = null;
  let clock = 0, last = 0, lastDraw = 0, dirty = true, spawnT = 240, boost = 0, showTimer = 0;
  const eaten = [];                          // the bases eaten so far, newest last
  const pointer = { x: -9999, y: -9999, still: 0 };
  const veil = document.getElementById('pondVeil');
  const caption = document.getElementById('pondCaption');
  const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  // one RGBA pixel as the little-endian word an ImageData buffer holds
  const pack = (hex, a = 255) => { const c = hexToRgb(hex); return ((a << 24) | (c.b << 16) | (c.g << 8) | c.r) >>> 0; };

  function buildPalette() {
    const dark = isDark();
    const paper = cssVar('--paper') || '#F6F6F2';
    const ink = cssVar('--ink') || '#22262A';
    const colors = {};
    KOI_BASES.forEach(b => {
      const c = cssVar('--' + KOI_TOKEN[b]) || '#888888';
      const white = dark ? mixHex('#FFE8F5', paper, 0.7) : '#FFFDF7';
      // by day, painted koi; by night, dim bodies drawn with a neon tube
      colors[b] = dark ? {
        hex: c,
        body: pack(b === 'T' ? white : mixHex(c, paper, 0.72)),
        spot: pack(b === 'T' ? c : mixHex(c, paper, 0.45)),
        pale: pack(mixHex(c, paper, 0.5)),
        fin: pack(mixHex(c, paper, 0.6), 160),
        line: pack(c),
        eye: pack(mixHex(c, '#ffffff', 0.6)),
      } : {
        hex: c,
        body: pack(b === 'T' ? white : c),
        spot: pack(b === 'T' ? c : mixHex(c, '#ffffff', 0.45)),
        pale: pack(mixHex(c, '#ffffff', 0.55)),
        fin: pack(b === 'T' ? white : mixHex(c, '#ffffff', 0.35), 150),
        line: pack(mixHex(c, ink, 0.6)),
        eye: pack(ink),
      };
    });
    pal = {
      dark, colors, ink, paper,
      ripple: cssVar(dark ? '--sage' : '--blue') || '#3F6FC4',
      body: dark ? 0.45 : 0.38,
      stage: dark ? 0.95 : 0.9,
      food: dark ? 0.9 : 0.8,
    };
    // each base is a tile in its darker ink with the letter in paper colour
    KOI_BASES.forEach(b => {
      const c = document.createElement('canvas');
      c.width = 5; c.height = 7;
      const x = c.getContext('2d');
      x.fillStyle = cssVar(`--${KOI_TOKEN[b]}-ink`) || colors[b].hex;
      KOI_TILE.forEach((row, y) => [...row].forEach((ch, i) => { if (ch === '#') x.fillRect(i, y, 1, 1); }));
      x.fillStyle = paper;
      KOI_GLYPH[b].forEach((row, y) => [...row].forEach((ch, i) => { if (ch === '#') x.fillRect(i + 1, y + 1, 1, 1); }));
      tiles[b] = c;
    });
    dirty = true;
  }

  function makeKoi(i, rnd) {
    const base = KOI_BASES[i % KOI_BASES.length];
    const L = 20 + Math.floor(rnd() * 5);    // art pixels, nose to tail tip
    const B = L + 14;                         // raster buffer, roomy enough for any bend
    const cv = document.createElement('canvas');
    cv.width = cv.height = B;
    const cctx = cv.getContext('2d');
    const img = cctx.createImageData(B, B);
    const heading = rnd() * Math.PI * 2;
    const x = W * (0.08 + rnd() * 0.84), y = H * (0.1 + rnd() * 0.8);
    const seg = L / JOINTS;
    const joints = Array.from({ length: JOINTS + 1 }, (_, j) => ({ x: x - Math.cos(heading) * seg * ap * j, y: y - Math.sin(heading) * seg * ap * j }));
    return {
      base, L, B, cv, cctx, img, u32: new Uint32Array(img.data.buffer), lay: new Uint8Array(B * B),
      seg, joints, heading,
      // kohaku patches, never the same twice: [along, across, radius along, radius across]
      spots: [[0.05, (rnd() - 0.5) * 0.3, 0.08, 1.2],
        [0.27 + rnd() * 0.08, (rnd() - 0.5) * 0.7, 0.08 + rnd() * 0.04, 0.8 + rnd() * 0.5],
        [0.5 + rnd() * 0.08, (rnd() - 0.5) * 0.9, 0.06 + rnd() * 0.03, 0.7 + rnd() * 0.4]],
      v0: 0.28 + rnd() * 0.16, phase: rnd() * 6.3, fin: rnd() * 6.3,
      w1: 0.004 + rnd() * 0.004, w2: 0.011 + rnd() * 0.008, p1: rnd() * 6.3, p2: rnd() * 6.3,
      full: rnd() * 200, excited: 0, happy: 0, nibble: 300 + rnd() * 1500,
      mode: 'free', slot: null, alpha: 1,
      ox: 0, oy: 0,
    };
  }

  function resize() {
    const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
    const nextW = window.innerWidth;
    // whole device pixels per art pixel, so every block comes out the same size
    const nextP = Math.max(2, Math.round(2 * nextDpr));
    // a phone's address bar only changes the height: the koi keep swimming
    const rebuild = !koi.length || nextW !== W || nextP !== P;
    W = nextW; H = window.innerHeight; dpr = nextDpr; P = nextP; ap = P / dpr;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    if (rebuild) {
      if (show) release();
      const rnd = seeded((Math.random() * 4294967296) >>> 0);
      const n = Math.max(5, Math.min(12, Math.round((W * H) / 120000)));
      koi = Array.from({ length: n }, (_, i) => makeKoi(i, rnd));
      food = [];
      for (let i = 0; i < 4; i++) addFood(W * (0.1 + Math.random() * 0.8), H * (0.15 + Math.random() * 0.7));
      for (let i = 0; i < 200; i++) step(1, 1);   // a head start, so they begin mid-swim
      ripples = []; sparks = [];
    }
    dirty = true;
  }

  function addRipple(x, y, max) { if (ripples.length < 20) ripples.push({ x, y, r: 0.5, max }); }
  function addFood(x, y, base, vx = 0, vy = 0) {
    if (food.length >= 28) food.shift();
    food.push({ x, y, base: base || KOI_BASES[Math.floor(Math.random() * 4)], vx, vy, age: 0, eat: 0, by: null, seed: Math.random() * 6.3 });
  }
  // a handful of bases thrown on the water; the koi nearby get excited
  function feed(x, y, n = 4, base = null) {
    addRipple(x, y, 9);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 0.3 + Math.random() * 0.9;
      addFood(x, y, base, Math.cos(a) * v, Math.sin(a) * v);
    }
    koi.forEach(q => { if (Math.hypot(q.joints[0].x - x, q.joints[0].y - y) < 560) { q.excited = 260; q.full = 0; } });
    dirty = true;
  }
  function sparkle(x, y, base) {
    const color = cssVar('--' + KOI_TOKEN[base]) || '#888888';
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      sparks.push({ x, y, vx: Math.cos(a) * (0.6 + Math.random()), vy: Math.sin(a) * (0.6 + Math.random()), life: 22, color });
    }
  }

  // keep the body chain following the head
  function followChain(q) {
    const segCss = q.seg * ap;
    for (let j = 1; j <= JOINTS; j++) {
      const a = q.joints[j - 1], b = q.joints[j];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      b.x = a.x + dx / d * segCss; b.y = a.y + dy / d * segCss;
    }
  }

  function step(dt, k) {
    const f = dt * k * (boost > 0 ? 2 : 1);   // frames of motion at the chosen speed; coffee doubles it
    if (boost > 0) boost -= dt * 16.667;
    clock += f;
    const margin = 70;
    // food drifts and slows; uneaten bases sink after forty seconds
    food.forEach(p => {
      p.age += f;
      if (p.eat) {
        p.eat = Math.min(1, p.eat + 0.1 * f);
        if (p.by) { const h = p.by.joints[0]; p.x += (h.x - p.x) * 0.35; p.y += (h.y - p.y) * 0.35; }
        return;
      }
      p.x += p.vx * f; p.y += p.vy * f;
      p.vx *= Math.pow(0.97, f); p.vy *= Math.pow(0.97, f);
      p.x += Math.sin(clock * 0.012 + p.seed) * 0.04 * f;
    });
    food = food.filter(p => p.eat < 1 && p.age < 2400);
    if (!show && (spawnT -= f) <= 0) {
      spawnT = 420 + Math.random() * 600;
      if (food.filter(p => !p.eat).length < 3) {
        const x = W * (0.1 + Math.random() * 0.8), y = H * (0.15 + Math.random() * 0.7);
        addFood(x, y); addRipple(x, y, 4);
      }
    }
    koi.forEach((q, i) => {
      q.happy = Math.max(0, q.happy - f); q.excited = Math.max(0, q.excited - f); q.full = Math.max(0, q.full - f);
      if (q.mode !== 'free') return;
      const h = q.joints[0];
      const mx = h.x + Math.cos(q.heading) * 2 * ap, my = h.y + Math.sin(q.heading) * 2 * ap;   // the mouth
      const turnMax = 0.014 * f;
      let target = null, urgency = 1, speed = q.v0 * (q.excited > 0 ? 1.9 : 1);
      const wander = (Math.sin(clock * q.w1 + q.p1) + 0.7 * Math.sin(clock * q.w2 + q.p2)) * 0.0028 * f;
      // food: the nearest base still floating
      if (q.full <= 0) {
        let best = null, bd = q.excited > 0 ? 600 : 250;
        for (const p of food) {
          if (p.eat) continue;
          const d = Math.hypot(p.x - mx, p.y - my);
          if (d < bd) { bd = d; best = p; }
        }
        if (best) {
          target = Math.atan2(best.y - my, best.x - mx); urgency = 1.7; speed *= 1.25;
          if (bd < 4 * ap) {
            best.eat = 0.01; best.by = q;
            eaten.push(best.base); if (eaten.length > 64) eaten.shift();
            q.full = 300 + Math.random() * 360; q.happy = 50;
            addRipple(mx, my, 4); sparkle(mx, my, best.base);
            Bus.emit('pond:ate', best.base);
          }
        }
      }
      // curious: they come to look at a pointer that rests over the water
      if (target === null && pointer.still > 70) {
        const dx = pointer.x - h.x, dy = pointer.y - h.y, d = Math.hypot(dx, dy);
        if (d < 260 && d > 36) { target = Math.atan2(dy, dx); urgency = 0.6; }
      }
      // the edge of the pond turns them back
      if (target === null) {
        const out = Math.max(margin - h.x, h.x - (W - margin), margin - h.y, h.y - (H - margin));
        if (out > 0) { target = Math.atan2(H / 2 - h.y, W / 2 - h.x); urgency = Math.min(1.2, 0.3 + out / margin); }
      }
      // room for everyone
      if (target === null) {
        for (let j = 0; j < koi.length; j++) {
          if (j === i) continue;
          const o = koi[j].joints[0], dx = h.x - o.x, dy = h.y - o.y;
          if (dx * dx + dy * dy < (13 * ap) ** 2) { target = Math.atan2(dy, dx); urgency = 0.6; break; }
        }
      }
      q.heading += target === null ? wander : Math.max(-turnMax * urgency, Math.min(turnMax * urgency, wrapAngle(target - q.heading)));
      const v = speed * f;
      h.x += Math.cos(q.heading) * v;
      h.y += Math.sin(q.heading) * v;
      followChain(q);
      q.phase += (0.07 + speed * 0.1 + (q.happy > 0 ? 0.25 : 0)) * f;
      q.fin += 0.05 * f;
      // now and then one nibbles at the surface
      if ((q.nibble -= f) <= 0) { q.nibble = 900 + Math.random() * 1500; addRipple(mx, my, 4.5); }
    });
    ripples.forEach(r => { r.r += 0.08 * f; });
    ripples = ripples.filter(r => r.r < r.max);
    sparks.forEach(s => { s.x += s.vx * f; s.y += s.vy * f; s.life -= f; });
    sparks = sparks.filter(s => s.life > 0);
  }

  // ---- shows: a crowd of koi swims into a shape from my work, in 3D ----
  // A shape is a set of paths in model space (about a unit sphere). It turns
  // slowly while every koi swims along its own path; nearer koi are drawn
  // over farther ones, and brighter. No lines: the koi are the drawing.
  const SHOWS = {
    dna: 'the koi are building a DNA double helix',
    bacillus: 'the koi are building a tuberculosis bacillus',
    virus: 'the koi are building SARS-CoV-2',
    plasmid: 'the koi are building a plasmid',
  };
  const circle = (r, place) => ({ loop: 2 * Math.PI * r, at: (s) => place(Math.cos(s / r) * r, Math.sin(s / r) * r) });

  function buildShow(shape) {
    const wide = W >= H;
    const kl = (L) => (L * ap) / 1;              // a koi's length in CSS px
    const out = { shape, paths: [], slots: [], yaw: 0, spin: 0.01, tilt: 0.3, roll: 0, sc: 1, cx: W / 2, cy: H / 2 };
    const add = (path, n, base, v, from = 0) => {
      out.paths.push(path);
      const len = path.loop || path.len;
      for (let i = 0; i < n; i++) out.slots.push({ path, s: from + (i + 0.5) * len / n, v, base: typeof base === 'function' ? base(i) : base });
    };
    const koiModel = () => 22 * ap / out.sc;      // a koi's length in model units
    const fit = (n0, len) => Math.max(2, Math.min(n0, Math.floor(len / (koiModel() * 1.08))));
    if (shape === 'dna') {
      out.sc = Math.min(W * 0.84 / 2.3, H * 0.84 / (wide ? 1.1 : 2.3));
      out.roll = wide ? -Math.PI / 2 + 0.16 : 0.1;    // across a wide screen, down a phone
      out.tilt = 0.28; out.spin = 0.012;
      const Hh = 1.1, R = 0.34, turns = 1.6, w = 2 * Math.PI * turns / (2 * Hh), k = Math.hypot(1, R * w);
      const strand = (ph) => ({ len: 2 * Hh * k, open: true, at: (s) => { const y = -Hh + s / k, a = w * y + ph; return [R * Math.cos(a), y, R * Math.sin(a)]; } });
      const a = strand(0), b = strand(Math.PI);
      const n = fit(30, a.len);
      const seq = eaten.slice(-n);
      const baseAt = (i) => (seq.length ? seq[i % seq.length] : KOI_BASES[(i * 7 + 3) % 4]);
      add(a, n, baseAt, 0.004);
      add(b, n, (i) => KOI_MATE[baseAt(i)], 0.004);
      out.caption = seq.length ? `the koi are building DNA from the ${seq.length} bases they ate` : SHOWS.dna;
    } else if (shape === 'bacillus') {
      out.sc = Math.min(W * 0.8 / 2.3, H * 0.8 / (wide ? 1.2 : 2.3));
      out.roll = wide ? 0.32 : Math.PI / 2 - 0.3;
      out.tilt = 0.42; out.spin = 0.006;
      const half = 0.78, r = 0.32;
      const hoops = [];
      for (let j = 0; j < 7; j++) hoops.push([-half + j * (2 * half / 6), r]);
      hoops.push([-half - 0.2, Math.sqrt(r * r - 0.04)], [half + 0.2, Math.sqrt(r * r - 0.04)]);
      hoops.forEach(([x, rr], j) => {
        const path = circle(rr, (c, s2) => [x, c, s2]);
        add(path, fit(10, path.loop), (i) => ((i + j) % 5 === 0 ? 'G' : 'A'), (j % 2 ? 1 : -1) * 0.01, j * 0.3);
      });
    } else if (shape === 'virus') {
      out.sc = Math.min(W, H) * 0.8 / 2.3;
      out.tilt = 0.45; out.spin = 0.009;
      const R = 0.62;
      [-58, -29, 0, 29, 58].forEach((lat, j) => {
        const a = lat * Math.PI / 180, rr = R * Math.cos(a), y = R * Math.sin(a);
        const path = circle(rr, (c, s2) => [c, y, s2]);
        add(path, fit(14, path.loop), 'A', (j % 2 ? 1 : -1) * 0.009, j * 0.5);
      });
      // the spikes: koi standing out from the surface, heads outward
      const N = 14, golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < N; i++) {
        const y = 1 - (i + 0.5) * 2 / N, rr = Math.sqrt(1 - y * y), th = i * golden;
        const d = [Math.cos(th) * rr, y, Math.sin(th) * rr];
        const len = koiModel() * 1.02;
        const path = { len, open: true, spike: true, at: (s) => { const t = R + 0.04 + s; return [d[0] * t, d[1] * t, d[2] * t]; } };
        out.paths.push(path);
        out.slots.push({ path, s: len, v: 0, base: 'T' });
      }
    } else if (shape === 'plasmid') {
      out.sc = Math.min(W * 0.8 / 2, H * 0.8 / (wide ? 1.3 : 2));
      out.tilt = 1.02; out.spin = 0.008; out.roll = 0.18;
      const R0 = 0.78, r = 0.13;
      [0, 2 * Math.PI / 3, 4 * Math.PI / 3].forEach((v, j) => {
        const rr = R0 + r * Math.cos(v), y = r * Math.sin(v);
        const path = circle(rr, (c, s2) => [c, y, s2]);
        const n = fit(24, path.loop);
        // one stretch of the ring is a gene: kohaku koi there
        add(path, n, (i) => (i < Math.round(n * 0.22) ? 'T' : KOI_BASES[(i + j) % 4] === 'T' ? 'C' : KOI_BASES[(i + j) % 4]), 0.011, j * 0.2);
      });
    }
    out.caption = out.caption || SHOWS[shape];
    return out;
  }

  // model point -> screen, after the shape's turn, tilt and roll
  function project(p) {
    const [x, y, z] = p;
    const cyw = Math.cos(show.yaw), syw = Math.sin(show.yaw);
    const X = x * cyw + z * syw, Z = -x * syw + z * cyw;
    const ct = Math.cos(show.tilt), stl = Math.sin(show.tilt);
    const Y2 = y * ct - Z * stl, Z2 = y * stl + Z * ct;
    const cr = Math.cos(show.roll), sr = Math.sin(show.roll);
    const X3 = X * cr - Y2 * sr, Y3 = X * sr + Y2 * cr;
    const per = 4.5 / (4.5 - Z2);
    return { x: show.cx + X3 * show.sc * per, y: show.cy + Y3 * show.sc * per, z: Z2 };
  }
  const wrapS = (path, s) => (path.loop ? ((s % path.loop) + path.loop) % path.loop : s);
  // lay a koi along its path: head at its place, body trailing behind
  function layOnPath(q) {
    const sl = q.slot, path = sl.path;
    const ds = q.seg * ap / show.sc;
    let zsum = 0;
    for (let j = 0; j <= JOINTS; j++) {
      let s = sl.s - ds * j;
      if (path.loop) s = wrapS(path, s);
      else s = Math.max(0, s);
      const p = project(path.at(s));
      q.joints[j].x = p.x; q.joints[j].y = p.y; zsum += p.z;
    }
    q.depth = zsum / (JOINTS + 1);
  }

  function makeExtra(base, rnd) {
    const q = makeKoi(0, rnd);
    q.base = base; q.extra = true;
    const side = Math.floor(rnd() * 4);
    const x = side === 0 ? -50 : side === 1 ? W + 50 : rnd() * W;
    const y = side === 2 ? -50 : side === 3 ? H + 50 : rnd() * H;
    q.heading = Math.atan2(H / 2 - y, W / 2 - x);
    q.joints.forEach((j, k) => { j.x = x - Math.cos(q.heading) * q.seg * ap * k; j.y = y - Math.sin(q.heading) * q.seg * ap * k; });
    return q;
  }

  function form(shape) {
    if (!SHOWS[shape] || !koi.length) return;
    if (show) release(true);
    show = { ...buildShow(shape), phase: 'gather', t: 0, still: animSpeed === 0 };
    // many more koi come in from the edges: one for every place in the shape
    const rnd = seeded((Math.random() * 4294967296) >>> 0);
    const slots = show.slots.slice();
    const pond = koi.filter(q => !q.extra);
    while (pond.length + koi.filter(q => q.extra).length < slots.length) koi.push(makeExtra(slots[koi.length % slots.length].base, rnd));
    // each place takes the nearest koi of its colour, then the nearest left
    const free = koi.slice();
    slots.forEach(slot => {
      const pos = project(slot.path.at(slot.s));
      let bi = -1, bd = Infinity;
      free.forEach((q, i) => {
        const d = Math.hypot(q.joints[0].x - pos.x, q.joints[0].y - pos.y) + (q.base === slot.base ? 0 : 400);
        if (d < bd) { bd = d; bi = i; }
      });
      if (bi < 0) return;
      const q = free.splice(bi, 1)[0];
      q.mode = 'gather'; q.slot = { ...slot };
      if (q.extra) q.base = slot.base;
    });
    free.forEach(q => { q.mode = 'leave'; });
    document.documentElement.classList.add('pond-show');
    if (caption) caption.textContent = show.caption;
    // without motion the shape simply appears, and goes after a while
    if (show.still) { koi.forEach(q => { if (q.slot) { layOnPath(q); q.mode = 'lock'; } }); show.phase = 'hold'; show.t = 999; }
    clearTimeout(showTimer);
    showTimer = setTimeout(() => release(), show.still ? 7000 : 17000);
    dirty = true;
    Bus.emit('pond:show', show.shape);
  }

  function release(quiet) {
    if (!show) return;
    const { cx, cy } = show;
    koi.forEach(q => {
      const h = q.joints[0];
      q.slot = null; q.alpha = 1; q.depth = 0;
      q.heading = Math.atan2(h.y - cy, h.x - cx) + (Math.random() - 0.5) * 0.6;
      q.mode = q.extra ? 'leave' : 'free';
      q.excited = 90;
    });
    show = null;
    clearTimeout(showTimer);
    if (!quiet) document.documentElement.classList.remove('pond-show');
    dirty = true;
    if (!quiet) Bus.emit('pond:show-end');
  }

  function stepShow(f) {
    show.t += f;
    if (!show.still) show.yaw += show.spin * f;
    koi.forEach(q => {
      const sl = q.slot;
      if (!sl) return;
      const p = sl.path;
      sl.s += sl.v * f;
      if (p.loop) sl.s = wrapS(p, sl.s);
      else if (p.open && !p.spike && sl.s > p.len) sl.s -= p.len;
      const tp = project(p.at(sl.s)), h = q.joints[0];
      if (q.mode === 'gather') {
        const dx = tp.x - h.x, dy = tp.y - h.y, d = Math.hypot(dx, dy);
        if (d < 16 || show.t > 240) { q.mode = 'lock'; }
        else {
          const want = Math.atan2(dy, dx);
          q.heading += Math.max(-0.14 * f, Math.min(0.14 * f, wrapAngle(want - q.heading)));
          const m = Math.min(Math.min(15, Math.max(2, d * 0.1)) * f, d);
          h.x += Math.cos(q.heading) * m; h.y += Math.sin(q.heading) * m;
          if (d < 50) { h.x += dx * 0.18; h.y += dy * 0.18; }
          followChain(q);
          q.depth = tp.z;
        }
      }
      if (q.mode === 'lock') layOnPath(q);
      // an open strand fades at its two ends, where koi wrap round
      const edge = p.open && !p.spike ? Math.min(sl.s, p.len - sl.s) / (p.len * 0.06) : 1;
      // nearer is brighter, farther is dimmer
      q.alpha = Math.max(0, Math.min(1, edge)) * (0.42 + 0.58 * Math.max(0, Math.min(1, (q.depth + 1) / 2)));
      q.phase += 0.12 * f;
    });
    if (show.phase === 'gather' && (koi.every(q => !q.slot || q.mode === 'lock') || show.t > 240)) show.phase = 'hold';
  }
  // koi without a place swim off and are gone
  function stepLeavers(f) {
    let gone = false;
    koi.forEach(q => {
      if (q.mode !== 'leave') return;
      const h = q.joints[0];
      h.x += Math.cos(q.heading) * 3.2 * f; h.y += Math.sin(q.heading) * 3.2 * f;
      followChain(q);
      q.phase += 0.2 * f;
      if (h.x < -80 || h.x > W + 80 || h.y < -80 || h.y > H + 80) { q.gone = true; gone = true; }
    });
    if (gone) koi = koi.filter(q => !q.gone || !q.extra).map(q => { if (q.gone && !q.extra) { q.gone = false; q.mode = 'free'; } return q; });
  }

  // The colour of a body pixel at s along the fish and t across it (-1..1)
  function bodyColor(q, c, s, t) {
    switch (q.base) {
      case 'T': // kohaku: white, with red patches that differ from fish to fish
        return q.spots.some(([ps, pt, rs, rt]) => ((s - ps) / rs) ** 2 + ((t - pt) / rt) ** 2 <= 1) ? c.spot : c.body;
      case 'G': // yamabuki ogon: gold, a paler shine along the back
        return Math.abs(t) < 0.28 && s > 0.08 && s < 0.66 ? c.pale : c.body;
      case 'C': // asagi: a net of scales and a pale head
        if (s < 0.12) return c.pale;
        return (Math.floor(s * q.L / 1.7) + Math.floor((t + 1) * 1.5)) % 2 ? c.body : c.spot;
      default:  // midorigoi: green, paler on the head and along the back
        return s < 0.1 || (Math.abs(t) < 0.22 && s < 0.6) ? c.pale : c.body;
    }
  }

  // Draws one koi into its own small buffer on the page's pixel grid
  function rasterize(q) {
    const { B, u32, lay } = q;
    const c = pal.colors[q.base];
    const sc = q.L / 28;
    u32.fill(0); lay.fill(0);
    const mid = q.joints[JOINTS >> 1];
    q.ox = Math.floor(mid.x / ap) - (B >> 1);
    q.oy = Math.floor(mid.y / ap) - (B >> 1);
    // a point on the spine at s (0 nose, 1 tail tip), in buffer pixels, with
    // the swimming wave that grows toward the tail
    const at = (s) => {
      const u = s * JOINTS, j = Math.min(JOINTS - 1, Math.floor(u)), fr = u - j;
      const a = q.joints[j], b = q.joints[j + 1];
      let tx = a.x - b.x, ty = a.y - b.y;
      const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const nx = -ty, ny = tx;
      const wave = Math.sin(q.phase - s * 5.2) * 1.1 * sc * Math.pow(s, 1.4);
      return { x: (a.x + (b.x - a.x) * fr) / ap - q.ox + nx * wave, y: (a.y + (b.y - a.y) * fr) / ap - q.oy + ny * wave, tx, ty, nx, ny };
    };
    // a filled disc; each pixel gets its colour from where it sits across the body
    const disc = (cx, cy, r, nx, ny, colorAt, layer) => {
      const r2 = r * r + 0.3;
      const x0 = Math.max(0, Math.floor(cx - r - 1)), x1 = Math.min(B - 1, Math.ceil(cx + r + 1));
      const y0 = Math.max(0, Math.floor(cy - r - 1)), y1 = Math.min(B - 1, Math.ceil(cy + r + 1));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
          const idx = y * B + x;
          if (dx * dx + dy * dy > r2 || layer < lay[idx]) continue;   // fins never cover the body
          const col = colorAt((dx * nx + dy * ny) / Math.max(r, 0.8));
          if (!col) continue;
          u32[idx] = col; lay[idx] = layer;
        }
      }
    };
    const finColor = () => c.fin;
    // pectoral fins, paddling, and the smaller pelvic ones
    [[0.18, 3.6, 1.6], [0.48, 2, 1]].forEach(([s, len0, w0]) => {
      const p = at(s), hw = koiHalfWidth(s) * sc;
      [-1, 1].forEach(side => {
        let dx = -p.tx * 0.45 + p.nx * side * 0.9, dy = -p.ty * 0.45 + p.ny * side * 0.9;
        const dl = Math.hypot(dx, dy); dx /= dl; dy /= dl;
        const len = (len0 + 0.8 * Math.sin(q.fin + side) * (len0 / 3.6)) * sc;
        const rx = p.x + p.nx * side * hw * 0.8, ry = p.y + p.ny * side * hw * 0.8;
        for (let d = 0; d <= len; d += 0.5) disc(rx + dx * d, ry + dy * d, w0 * (1 - 0.55 * d / len) * sc, 0, 0, finColor, 1);
      });
    });
    // body and tail, from the tail up so the head is drawn last
    const M = Math.ceil(q.L * 2.2);
    for (let m = M; m >= 0; m--) {
      const s = m / M, p = at(s);
      if (s > KOI_TAIL) {
        // the tail fin fans out into two lobes with a notch between them
        const half = (1 + (s - KOI_TAIL) / (1 - KOI_TAIL) * 2.8) * sc;
        const notch = Math.max(0, (s - 0.9) / 0.1) * 0.45;
        disc(p.x, p.y, half, p.nx, p.ny, (t) => (Math.abs(t) < notch ? 0 : c.fin), 1);
      } else {
        disc(p.x, p.y, koiHalfWidth(s) * sc, p.nx, p.ny, (t) => bodyColor(q, c, s, t), 2);
      }
    }
    // eyes on the sides of the head
    const e = at(0.07), ew = koiHalfWidth(0.07) * sc - 0.7;
    [-1, 1].forEach(side => {
      const x = Math.floor(e.x + e.nx * side * ew), y = Math.floor(e.y + e.ny * side * ew);
      if (x >= 0 && y >= 0 && x < B && y < B) { u32[y * B + x] = c.eye; lay[y * B + x] = 2; }
    });
    // a one-pixel outline, the way pixel art is inked
    for (let y = 0; y < B; y++) {
      for (let x = 0; x < B; x++) {
        const idx = y * B + x;
        if (lay[idx]) continue;
        if ((x > 0 && lay[idx - 1]) || (x < B - 1 && lay[idx + 1]) || (y > 0 && lay[idx - B]) || (y < B - 1 && lay[idx + B])) u32[idx] = c.line;
      }
    }
    q.cctx.putImageData(q.img, 0, 0);
  }

  // A pixel ring on the same grid
  function ring(cx, cy, r) {
    const n = Math.max(10, Math.round(r * 7));
    const seen = new Set();
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      const x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r);
      if (seen.has(x * 65536 + y)) continue;
      seen.add(x * 65536 + y);
      ctx.fillRect(x * P, y * P, P, P);
    }
  }
  const dot = (x, y) => ctx.fillRect(Math.round(x / ap) * P, Math.round(y / ap) * P, P, P);

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    // ripples first, under the fish
    ctx.fillStyle = pal.ripple;
    ripples.forEach(rp => {
      ctx.globalAlpha = (1 - rp.r / rp.max) * (pal.dark ? 0.6 : 0.4);
      ring(rp.x / ap, rp.y / ap, rp.r);
      if (rp.r > 2.6) ring(rp.x / ap, rp.y / ap, rp.r - 2.2);
    });
    koi.forEach(rasterize);
    // in a show the farther koi go first, so the nearer ones swim over them
    const order = show ? koi.slice().sort((a, b) => (a.depth || 0) - (b.depth || 0)) : koi;
    order.forEach(q => {
      ctx.globalAlpha = (show || q.extra ? pal.stage : pal.body) * q.alpha;
      if (pal.dark) { ctx.shadowColor = pal.colors[q.base].hex; ctx.shadowBlur = 6 * dpr; }
      ctx.drawImage(q.cv, q.ox * P, q.oy * P, q.B * P, q.B * P);
    });
    ctx.shadowBlur = 0;
    // the bases floating on the water, bobbing; eaten ones shrink into a mouth
    food.forEach(p => {
      const fade = Math.min(1, p.age / 15, (2400 - p.age) / 120);
      ctx.globalAlpha = pal.food * fade;
      const gx = Math.round(p.x / ap), gy = Math.round(p.y / ap + Math.sin(p.age * 0.05 + p.seed) * 0.6);
      if (p.eat > 0.45) {
        ctx.fillStyle = cssVar('--' + KOI_TOKEN[p.base] + '-ink');
        ctx.fillRect(gx * P, gy * P, P * (p.eat > 0.75 ? 1 : 2), P * (p.eat > 0.75 ? 1 : 2));
      } else {
        if (pal.dark) { ctx.shadowColor = pal.colors[p.base].hex; ctx.shadowBlur = 5 * dpr; }
        ctx.drawImage(tiles[p.base], (gx - 2) * P, (gy - 3) * P, 5 * P, 7 * P);
        ctx.shadowBlur = 0;
      }
    });
    sparks.forEach(s => {
      ctx.globalAlpha = Math.max(0, s.life / 22);
      ctx.fillStyle = s.color;
      dot(s.x, s.y);
    });
    ctx.globalAlpha = 1;
  }

  function frame(ts) {
    requestAnimationFrame(frame);
    if (document.hidden) { last = ts; return; }
    if (!dirty && ts - lastDraw < 30) return;   // 30 frames a second is plenty for pixel art
    const dt = last ? Math.min((ts - last) / 16.667, 4) : 1;
    last = ts;
    pointer.still += dt;
    if (animSpeed > 0) { step(dt, animSpeed * 2); dirty = true; }
    // a show keeps its pace whatever the speed dial says (but never starts moving if motion is off)
    if (show && !show.still) { stepShow(dt * Math.max(1, animSpeed * 2)); dirty = true; }
    if (koi.some(q => q.mode === 'leave')) { stepLeavers(dt * Math.max(1, animSpeed * 2)); dirty = true; }
    if (!dirty) return;
    dirty = false;
    lastDraw = ts;
    draw();
  }

  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.still = 0;
  }, { passive: true });
  document.addEventListener('mouseout', e => { if (!e.relatedTarget) pointer.x = pointer.y = -9999; });
  // a click or a tap on bare paper throws food on the water
  const NOT_WATER = 'a, button, input, select, textarea, label, [role="button"], [tabindex], p, h1, h2, h3, h4, li, figure, .card, .tool-card, .gh-card, .letter, .stat, .helix-card, .papers-track, .side-card, .notebook, .diary-entry, .stop, .experiment, .chromosome-wrap, .topbar, .bench, .console, .polar';
  document.addEventListener('pointerdown', e => {
    if (e.button > 0 || !e.target.closest || e.target.closest(NOT_WATER) || show) return;
    feed(e.clientX, e.clientY, 3 + Math.floor(Math.random() * 3));
  }, { passive: true });
  if (veil) veil.addEventListener('click', () => release());
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && show) release(); });
  window.addEventListener('resize', resize);
  new MutationObserver(buildPalette).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  Bus.on('pond:feed', d => feed(d && d.x != null ? d.x : W / 2, d && d.y != null ? d.y : H * 0.4, (d && d.n) || 5, d && d.base));
  Bus.on('pond:form', shape => form(shape));
  Bus.on('pond:release', () => release());
  Bus.on('pond:ripple', d => { addRipple(d.x, d.y, 6); dirty = true; });
  Bus.on('caffeine', ms => { boost = Math.max(boost, ms || 6000); koi.forEach(q => { q.excited = 120; }); });
  // a sneeze on the desk startles the pond: ripples, and every koi darts off
  Bus.on('sneeze', () => { koi.forEach(q => { q.excited = 90; q.happy = 30; addRipple(q.joints[0].x, q.joints[0].y, 5); }); dirty = true; });
  // read-only view for the page's own tests
  canvas.pond = { get koi() { return koi; }, get food() { return food; }, get eaten() { return eaten; }, get show() { return show; } };
  buildPalette();
  resize();
  requestAnimationFrame(frame);
}

// ==================== PENCIL HELICES ====================
let noteTip = null;
function showNoteTip(x, y, data, color) {
  if (!noteTip) {
    noteTip = document.createElement('div');
    noteTip.className = 'note-tip';
    noteTip.setAttribute('role', 'status');
    noteTip.innerHTML = '<button class="note-tip-close" type="button" aria-label="Close">&times;</button><div class="note-tip-title"></div><div class="note-tip-year"></div><div class="note-tip-detail"></div>';
    document.body.appendChild(noteTip);
    noteTip.querySelector('.note-tip-close').addEventListener('click', e => { e.stopPropagation(); hideNoteTip(); });
  }
  noteTip.style.setProperty('--tip-accent', color);
  noteTip.querySelector('.note-tip-title').textContent = data.title || data.label;
  const yearEl = noteTip.querySelector('.note-tip-year');
  yearEl.textContent = data.year || '';
  yearEl.style.display = data.year ? '' : 'none';
  noteTip.querySelector('.note-tip-detail').textContent = data.detail || '';
  noteTip.style.left = x + 'px';
  noteTip.style.top = y + 'px';
  noteTip.classList.add('visible');
}
function hideNoteTip() { if (noteTip) noteTip.classList.remove('visible'); }

function createPencilHelix(cfg) {
  const canvas = document.getElementById(cfg.canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const numPairs = Math.max(cfg.strandA.length, cfg.strandB.length);
  let W = 0, H = 0, rotation = 0.6, frame = 0, lastTime = 0, spawnAcc = 0, visible = true;
  let particles = [], nodePositions = [];
  let mouseX = -1000, mouseY = -1000;
  let ptrDown = false, ptrMoved = false, ptrStartX = 0, rotAtStart = 0, momentum = 0, lastPtrX = 0, lastPtrTime = 0;
  let activeStrand = 'both', alphaA = 1, alphaB = 1;
  const jitter = seeded(cfg.canvasId.length * 97);
  const nodeSeeds = [...Array(numPairs * 2)].map(() => Math.floor(jitter() * 1e6));

  const colA = () => tokenRgb(cfg.colorA), colB = () => tokenRgb(cfg.colorB);

  canvas.addEventListener('pointerdown', e => {
    ptrDown = true; ptrMoved = false; ptrStartX = lastPtrX = e.clientX; lastPtrTime = Date.now();
    rotAtStart = rotation; momentum = 0;
    canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; e.preventDefault();
  });
  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    mouseX = e.clientX - r.left; mouseY = e.clientY - r.top;
    if (!ptrDown) return;
    const dx = e.clientX - ptrStartX;
    if (Math.abs(dx) > 3) ptrMoved = true;
    if (ptrMoved) {
      rotation = rotAtStart + dx * 0.008;
      const now = Date.now(), dt = Math.max(now - lastPtrTime, 1);
      momentum = (e.clientX - lastPtrX) * 0.008 / Math.max(dt / 16, 1);
      lastPtrX = e.clientX; lastPtrTime = now;
      hideNoteTip();
    }
  });
  canvas.addEventListener('pointerup', e => {
    if (!ptrDown) return;
    ptrDown = false; canvas.style.cursor = 'grab';
    if (!ptrMoved) {
      const r = canvas.getBoundingClientRect();
      pick(e.clientX - r.left, e.clientY - r.top, e.clientX, e.clientY);
    }
  });
  canvas.addEventListener('pointerleave', () => { mouseX = -1000; mouseY = -1000; });

  // Strand names isolate one strand; the helix icon shows both again
  const card = canvas.closest('.helix-card');
  if (card) {
    const labels = card.querySelectorAll('.strand-label');
    labels.forEach((label, idx) => {
      label.addEventListener('click', e => {
        e.stopPropagation();
        const s = idx === 0 ? 'A' : 'B';
        activeStrand = activeStrand === s ? 'both' : s;
        labels.forEach((l, i) => {
          const on = activeStrand === 'both' || activeStrand === (i === 0 ? 'A' : 'B');
          l.classList.toggle('dimmed', !on);
          l.setAttribute('aria-pressed', activeStrand === (i === 0 ? 'A' : 'B') ? 'true' : 'false');
        });
      });
    });
    const reset = card.querySelector('.strand-reset');
    if (reset) reset.addEventListener('click', e => {
      e.stopPropagation(); activeStrand = 'both';
      labels.forEach(l => { l.classList.remove('dimmed'); l.setAttribute('aria-pressed', 'false'); });
    });
  }

  function pick(mx, my, sx, sy) {
    let best = null, bestD = Infinity;
    for (const n of nodePositions) {
      if (n.zN < 0.3) continue;
      if ((n.strand === 'A' ? alphaA : alphaB) < 0.5) continue;
      const d = Math.hypot(n.x - mx, n.y - my);
      if (d < n.size + 14 && d < bestD) { best = n; bestD = d; }
    }
    if (!best) { hideNoteTip(); return; }
    const data = best.strand === 'A' ? cfg.strandA[best.index] : cfg.strandB[best.index];
    showNoteTip(sx, sy, data, rgba(best.strand === 'A' ? colA() : colB(), 1));
  }

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    if (rect.width <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    W = rect.width;
    H = window.innerWidth < 480 ? 320 : 380;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function node(x, y, z, label, col, R, cx, mul, seed) {
    const zN = (z + R) / (2 * R);
    let size = (4 + zN * 7) * (1 + Math.sin(frame * 0.03 + z * 0.1) * 0.08);
    const hover = Math.max(0, 1 - Math.hypot(x - mouseX, y - mouseY) / 50);
    size *= 1 + hover * 0.5;
    const a = (0.25 + zN * 0.75) * mul;
    const ink = tokenRgb('ink');
    const rnd = seeded(seed);
    const neon = isDark();
    if (neon) { ctx.shadowColor = rgba(col, 0.9 * mul); ctx.shadowBlur = 12; }
    ctx.fillStyle = rgba(col, a * 0.55);
    ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // hatching on the front nodes, like a shaded pencil sketch
    if (zN > 0.55 && mul > 0.5) {
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.clip();
      ctx.strokeStyle = rgba(col, a * 0.9); ctx.lineWidth = 1;
      for (let k = -size * 2; k < size * 2; k += 3.2) { ctx.beginPath(); ctx.moveTo(x + k, y + size); ctx.lineTo(x + k + size, y - size); ctx.stroke(); }
      ctx.restore();
    }
    ctx.strokeStyle = rgba(ink, a * 0.9); ctx.lineWidth = 1.2;
    pencilCircle(ctx, x, y, size, rnd, 0.9);
    if (zN > 0.18 && label && mul > 0.25) {
      const fs = Math.round(14 + zN * 7);
      const la = Math.pow(Math.max(0, (zN - 0.18) / 0.82), 0.6) * mul;
      ctx.font = `${zN > 0.6 ? 700 : 600} ${fs}px 'Caveat', cursive`;
      const left = x < cx;
      ctx.textAlign = left ? 'right' : 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = rgba(ink, Math.min(1, la * 0.95 + hover * 0.2));
      if (neon) { ctx.shadowColor = rgba(col, 0.7 * la); ctx.shadowBlur = 8; }
      ctx.fillText(label, left ? x - size - 9 : x + size + 9, y);
      ctx.shadowBlur = 0;
    }
  }

  function draw(ts) {
    requestAnimationFrame(draw);
    if (!visible || document.hidden) { lastTime = ts; return; }
    if (W <= 0 || H <= 0) { resize(); return; }
    const dt = lastTime ? Math.min((ts - lastTime) / 16.667, 3) : 1;
    lastTime = ts;
    ctx.clearRect(0, 0, W, H);
    const cA = colA(), cB = colB(), ink = tokenRgb('ink');
    const cx = W / 2, R = Math.min(W * 0.15, 66);
    const gap = Math.min(48, (H - 70) / numPairs);
    const startY = H / 2 - ((numPairs - 1) * gap) / 2;
    const step = Math.PI * 2 / 5;
    alphaA += (((activeStrand !== 'B') ? 1 : 0.08) - alphaA) * 0.1 * dt;
    alphaB += (((activeStrand !== 'A') ? 1 : 0.08) - alphaB) * 0.1 * dt;

    // backbones: two pencil passes per strand
    const segs = numPairs * 10;
    for (let s = 0; s < 2; s++) {
      const off = s * Math.PI, col = s ? cB : cA, mul = s ? alphaB : alphaA;
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < segs; i++) {
          const t1 = i / segs * (numPairs - 1), t2 = (i + 1) / segs * (numPairs - 1);
          const a1 = rotation + t1 * step + off, a2 = rotation + t2 * step + off;
          const zN = ((Math.sin(a1) + Math.sin(a2)) / 2 + 1) / 2;
          ctx.strokeStyle = rgba(pass ? ink : col, (0.1 + zN * (pass ? 0.35 : 0.55)) * mul);
          ctx.lineWidth = pass ? 0.8 : 1.2 + zN * 2.4;
          if (!pass && isDark()) { ctx.shadowColor = rgba(col, 0.8 * mul); ctx.shadowBlur = 10; } else ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.moveTo(cx + R * Math.cos(a1) + pass * 0.8, startY + t1 * gap + pass * 0.6);
          ctx.lineTo(cx + R * Math.cos(a2) + pass * 0.8, startY + t2 * gap + pass * 0.6);
          ctx.stroke();
        }
      }
    }

    ctx.shadowBlur = 0;
    const pairs = [];
    for (let i = 0; i < numPairs; i++) {
      const a = rotation + i * step, y = startY + i * gap;
      pairs.push({ i, y, ax: cx + R * Math.cos(a), az: R * Math.sin(a), bx: cx + R * Math.cos(a + Math.PI), bz: R * Math.sin(a + Math.PI) });
    }
    pairs.sort((p, q) => Math.min(p.az, p.bz) - Math.min(q.az, q.bz));
    nodePositions = [];
    pairs.forEach(p => {
      const bondZ = ((p.az + p.bz) / 2 + R) / (2 * R);
      ctx.save();
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = rgba(ink, (0.12 + bondZ * 0.3) * Math.min(alphaA, alphaB));
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p.ax, p.y); ctx.lineTo(p.bx, p.y); ctx.stroke();
      ctx.restore();
      const zA = (p.az + R) / (2 * R), zB = (p.bz + R) / (2 * R);
      nodePositions.push({ x: p.ax, y: p.y, size: 4 + zA * 7, index: p.i, strand: 'A', zN: zA });
      nodePositions.push({ x: p.bx, y: p.y, size: 4 + zB * 7, index: p.i, strand: 'B', zN: zB });
      const la = cfg.strandA[p.i]?.label || '', lb = cfg.strandB[p.i]?.label || '';
      if (p.az > p.bz) {
        node(p.bx, p.y, p.bz, lb, cB, R, cx, alphaB, nodeSeeds[p.i * 2 + 1]);
        node(p.ax, p.y, p.az, la, cA, R, cx, alphaA, nodeSeeds[p.i * 2]);
      } else {
        node(p.ax, p.y, p.az, la, cA, R, cx, alphaA, nodeSeeds[p.i * 2]);
        node(p.bx, p.y, p.bz, lb, cB, R, cx, alphaB, nodeSeeds[p.i * 2 + 1]);
      }
    });

    // pixel sparks: little squares that drift up and fade
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.x += q.vx * animSpeed * dt; q.y += q.vy * animSpeed * dt; q.life -= q.decay * animSpeed * dt;
      if (q.life <= 0) { particles.splice(i, 1); continue; }
      ctx.fillStyle = rgba(q.col, q.life * 0.8);
      const s = q.size;
      ctx.fillRect(Math.round(q.x / s) * s, Math.round(q.y / s) * s, s, s);
    }
    if (animSpeed > 0) spawnAcc += dt;
    if (spawnAcc >= 7 && particles.length < 60) {
      spawnAcc -= 7;
      const i = Math.floor(Math.random() * numPairs);
      const b = activeStrand === 'A' ? false : activeStrand === 'B' ? true : Math.random() < 0.5;
      const a = rotation + i * step + (b ? Math.PI : 0);
      particles.push({ x: cx + R * Math.cos(a), y: startY + i * gap, vx: (Math.random() - 0.5) * 1.2, vy: -0.3 - Math.random() * 0.8, life: 1, decay: 0.008 + Math.random() * 0.012, size: Math.random() < 0.5 ? 3 : 4, col: b ? cB : cA });
    }

    frame += dt;
    if (ptrDown) { /* rotation follows the pointer */ }
    else if (Math.abs(momentum) > 0.0003) { rotation += momentum * dt; momentum *= Math.pow(0.95, dt); }
    else { momentum = 0; rotation += 0.006 * animSpeed * dt; }
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; }), { rootMargin: '100px' }).observe(canvas);
  }
  if (window.ResizeObserver) new ResizeObserver(() => resize()).observe(canvas.parentElement);
  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(draw);
}

function initHelices() {
  HELICES.forEach(cfg => {
    createPencilHelix(cfg);
    // The helix is a canvas, which screen readers and search engines cannot
    // read, so each card also carries its content as a hidden list.
    const canvas = document.getElementById(cfg.canvasId);
    const card = canvas && canvas.closest('.helix-card');
    if (!card) return;
    const names = [...card.querySelectorAll('.strand-label')].map(l => l.textContent.trim());
    const item = d => `<li>${d.title}${d.year ? ` (${d.year})` : ''}: ${d.detail}</li>`;
    const sr = document.createElement('div');
    sr.className = 'sr-only';
    sr.innerHTML = `<h4>${names[0] || ''}</h4><ul>${cfg.strandA.map(item).join('')}</ul><h4>${names[1] || ''}</h4><ul>${cfg.strandB.map(item).join('')}</ul>`;
    canvas.parentElement.appendChild(sr);
  });
  document.addEventListener('pointerdown', e => {
    if (!e.target.closest('.helix-canvas') && !(noteTip && noteTip.contains(e.target))) hideNoteTip();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hideNoteTip(); });
}

// ==================== CAREER CHROMOSOME ====================
// Education on the upper chromatid, jobs on the lower one, joined at a
// centromere; bands are dithered like a stained karyotype.
function renderCareerChromosome() {
  const holder = document.getElementById('careerChromosome');
  const list = document.getElementById('careerStops');
  if (!holder || !list) return;
  const today = new Date();
  const now = today.getFullYear() + (today.getMonth() + 0.5) / 12;
  const Y0 = 2015, Y1 = Math.floor(now) + 1;
  const X0 = 64, X1 = 968;
  const x = y => X0 + (y - Y0) / (Y1 - Y0) * (X1 - X0);
  const cen = 2019.6;                 // BSc Biology -> MSc Bioinformatics
  const startX = x(2015.55), endX = x(now);
  const tops = { edu: 46, exp: 126 };
  const H = 52;
  const colorOf = { edu: 'terra', exp: 'blue' };

  // Rounded ends, both edges pinched at the centromere
  function chromatid(y0) {
    const y1 = y0 + H, r = H / 2, cx = x(cen), p = 9;
    return `M ${startX + r} ${y0} L ${cx - 18} ${y0} Q ${cx} ${y0 + p} ${cx + 18} ${y0} L ${endX - r} ${y0} ` +
      `A ${r} ${r} 0 0 1 ${endX - r} ${y1} L ${cx + 18} ${y1} Q ${cx} ${y1 - p} ${cx - 18} ${y1} L ${startX + r} ${y1} ` +
      `A ${r} ${r} 0 0 1 ${startX + r} ${y0} Z`;
  }
  const pathEdu = chromatid(tops.edu), pathExp = chromatid(tops.exp);

  const span = c => [x(Math.max(c.start, 2015.55)), x(c.end == null ? now : c.end)];
  const bands = CAREER.map((c, i) => {
    const [bx0, bx1] = span(c);
    const y0 = tops[c.type];
    return `<g class="band" data-idx="${i}" tabindex="0" role="button" aria-label="${c.title}, ${c.place}, ${c.date}" clip-path="url(#clip-${c.type})">
      <rect class="band-fill" x="${bx0}" y="${y0 - 2}" width="${Math.max(6, bx1 - bx0)}" height="${H + 4}" fill="url(#dither${c.end == null ? 75 : 50}-${colorOf[c.type]})"/>
      <rect class="band-edge" x="${bx0}" y="${y0 - 2}" width="${Math.max(6, bx1 - bx0)}" height="${H + 4}"/>
    </g>`;
  }).join('');

  const labels = CAREER.map(c => {
    const [bx0, bx1] = span(c);
    const mid = (bx0 + bx1) / 2;
    const up = c.type === 'edu';
    const ly = up ? tops.edu - 16 : tops.exp + H + 26;
    const tick = up ? `M ${mid} ${tops.edu - 3} L ${mid} ${tops.edu - 11}` : `M ${mid} ${tops.exp + H + 3} L ${mid} ${tops.exp + H + 11}`;
    return `<path d="${tick}" class="leader"/><text class="band-label" x="${mid}" y="${ly}" text-anchor="middle">${c.short || c.title}</text>`;
  }).join('');

  let axis = `<path d="M ${X0} 226 L ${X1} 226" class="axis" filter="url(#rough)"/>`;
  for (let y = Y0; y <= Y1; y++) {
    axis += `<path d="M ${x(y)} 222 L ${x(y)} 230" class="axis"/><text class="axis-label" x="${x(y)}" y="248" text-anchor="middle">${y}</text>`;
  }
  const cenX = x(cen);
  holder.innerHTML = `<svg viewBox="0 0 1000 258" class="chromosome-svg" role="img" aria-labelledby="chromTitle chromDesc">
    <title id="chromTitle">Career drawn as a chromosome</title>
    <desc id="chromDesc">Education on the upper chromatid and jobs on the lower one, along years from ${Y0} to ${Y1}. The list below has every step.</desc>
    <defs><clipPath id="clip-edu"><path d="${pathEdu}"/></clipPath><clipPath id="clip-exp"><path d="${pathExp}"/></clipPath></defs>
    <path d="${pathEdu}" class="chromatid-bg"/><path d="${pathExp}" class="chromatid-bg"/>
    <path d="${pathEdu}" class="chromatid-grain"/><path d="${pathExp}" class="chromatid-grain"/>
    ${bands}
    <path d="${pathEdu}" class="chromatid" filter="url(#rough)"/><path d="${pathExp}" class="chromatid" filter="url(#rough)"/>
    <path d="M ${cenX} ${tops.edu + H - 7} C ${cenX - 7} ${tops.edu + H + 8}, ${cenX + 7} ${tops.exp - 8}, ${cenX} ${tops.exp + 7}" class="centromere" filter="url(#rough)"/>
    <text class="chrom-note" x="${cenX + 16}" y="${tops.exp - 9}">centromere: where biology met bioinformatics</text>
    <text class="chrom-now" x="${endX}" y="${tops.exp + H + 26}" text-anchor="end">now</text>
    ${labels}
    <text class="chrom-side" x="${X0 - 10}" y="${tops.edu + H / 2 + 5}" text-anchor="end">study</text>
    <text class="chrom-side" x="${X0 - 10}" y="${tops.exp + H / 2 + 5}" text-anchor="end">work</text>
    ${axis}
  </svg>`;

  list.innerHTML = CAREER.map((c, i) => `
    <li class="stop stop--${c.type}" data-idx="${i}">
      <span class="stop-date">${c.date}</span>
      <strong>${c.title}</strong>
      <span class="stop-place">${c.place}</span>
      <span class="stop-detail">${c.detail}</span>
    </li>`).join('');

  const select = (i) => {
    holder.querySelectorAll('.band').forEach(b => b.classList.toggle('active', +b.dataset.idx === i));
    list.querySelectorAll('.stop').forEach(st => st.classList.toggle('active', +st.dataset.idx === i));
  };
  holder.querySelectorAll('.band').forEach(b => {
    const i = +b.dataset.idx;
    b.addEventListener('click', () => select(i));
    b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(i); } });
    b.addEventListener('mouseenter', () => select(i));
  });
  list.querySelectorAll('.stop').forEach(st => st.addEventListener('mouseenter', () => select(+st.dataset.idx)));
  select(CAREER.length - 1);

  // On narrow screens the chromosome scrolls sideways: a hint below it, and
  // the edge with more to see fades out.
  const wrap = holder.parentElement;
  const hint = document.getElementById('chromHint');
  if (wrap && !wrap._edges) {
    wrap._edges = true;
    const edges = () => {
      const max = wrap.scrollWidth - wrap.clientWidth;
      wrap.classList.toggle('more-right', max > 2 && wrap.scrollLeft < max - 2);
      wrap.classList.toggle('more-left', max > 2 && wrap.scrollLeft > 2);
      if (hint) hint.hidden = max <= 2;
    };
    wrap.addEventListener('scroll', edges, { passive: true });
    window.addEventListener('resize', edges);
    edges();
  }
}

// ==================== GENOME RULER (scroll progress) ====================
// The page as a chromosome: each section is a feature on a coordinate ruler,
// and a pixel me walks along it as you scroll.
function initGenomeRuler() {
  const ruler = document.getElementById('genomeRuler');
  if (!ruler) return;
  const track = ruler.querySelector('.ruler-track');
  const walker = ruler.querySelector('.ruler-walker');
  const sections = [...document.querySelectorAll('main > section[data-feature]')];
  const colors = ['terra', 'sage', 'blue', 'ochre'];
  const draw = (frame) => { walker.innerHTML = spriteSVG(frame, 2); };
  let walkFrame = 0, walkTimer = null, lastY = window.scrollY, prevY = window.scrollY, happyUntil = 0;

  function layout() {
    const total = document.documentElement.scrollHeight;
    track.innerHTML = sections.map((s, i) => {
      const top = s.offsetTop / total * 100;
      const h = s.offsetHeight / total * 100;
      return `<a class="ruler-feature" href="#${s.id}" tabindex="-1" style="left:${top}%;width:${h}%;--c:var(--${colors[i % colors.length]})" title="${s.dataset.feature}"><i class="ruler-arrow"></i><span>${s.dataset.feature}</span></a>`;
    }).join('') + [...Array(11)].map((_, i) => `<i class="ruler-tick" style="left:${i * 10}%"></i>`).join('');
    // A label wider than its feature would run into the next one: hide it
    // (the feature keeps its name as a tooltip).
    track.querySelectorAll('.ruler-feature').forEach((f, i) => {
      const span = f.querySelector('span');
      const room = f.offsetWidth - (i === 0 ? 58 : 14);
      span.style.visibility = span.offsetWidth > room ? 'hidden' : '';
    });
    update();
  }
  function update() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    walker.style.left = `calc((100% - 88px) * ${p.toFixed(4)})`;
    // the label the bacillus is crossing steps out of its way (its box is
    // computed, not measured, so a transition in progress cannot fool it)
    const box = ruler.getBoundingClientRect();
    const wl = box.left + 24 + (box.width - 88) * p, wr = wl + 40;
    track.querySelectorAll('.ruler-feature span').forEach(span => {
      const r = span.getBoundingClientRect();
      span.classList.toggle('under-walker', r.width > 0 && r.left < wr + 4 && wl - 4 < r.right);
    });
  }
  function onScroll() {
    update();
    if (animSpeed === 0 || performance.now() < happyUntil) return;
    // alternate stretched and squashed frames while scrolling
    if (Math.abs(window.scrollY - lastY) > 24) {
      lastY = window.scrollY;
      walkFrame ^= 1;
      draw(walkFrame ? 'bacillus2' : 'bacillus');
      walker.classList.toggle('flip', window.scrollY < prevY);
      prevY = window.scrollY;
    }
    clearTimeout(walkTimer);
    walkTimer = setTimeout(() => { if (performance.now() >= happyUntil) draw('bacillus'); }, 180);
  }
  // an occasional blink while it waits
  setInterval(() => {
    if (animSpeed === 0 || document.hidden || performance.now() < happyUntil) return;
    draw('bacillusBlink');
    setTimeout(() => draw(walkFrame ? 'bacillus2' : 'bacillus'), 160);
  }, 4200);
  // Polar comes to visit: they walk a little way together, dance, and he
  // bends down to give the plush a kiss; then it walks back to its place
  let extra = 0, hopY = 0, glideRaf = 0;
  const applyExtra = () => { walker.style.transform = extra || hopY ? `translate(${extra.toFixed(1)}px, ${-hopY}px)` : ''; };
  function glide(to, ms) {
    cancelAnimationFrame(glideRaf);
    const from = extra, t0 = performance.now();
    if (to !== from) walker.classList.toggle('flip', to < from);
    const stepFn = (t) => {
      const u = Math.min(1, (t - t0) / ms);
      extra = from + (to - from) * u;
      draw(Math.floor((t - t0) / 170) % 2 ? 'bacillus2' : 'bacillus');
      applyExtra();
      if (u < 1) glideRaf = requestAnimationFrame(stepFn);
      else { draw('bacillus'); walker.classList.remove('flip'); }
    };
    glideRaf = requestAnimationFrame(stepFn);
  }
  Bus.on('ruler:walk', ({ dx, ms }) => { happyUntil = performance.now() + ms + 100; glide(extra + dx, ms); });
  Bus.on('ruler:home', ({ ms } = {}) => { happyUntil = performance.now() + (ms || 900) + 100; glide(0, ms || 900); });
  Bus.on('ruler:hop', () => {
    happyUntil = performance.now() + 600;
    draw('bacillusHappy'); hopY = 4; applyExtra();
    setTimeout(() => { hopY = 0; applyExtra(); }, 140);
  });
  Bus.on('ruler:kissed', () => {
    happyUntil = performance.now() + 2600;
    draw('bacillusBlush');
    setTimeout(() => { if (performance.now() >= happyUntil - 50) draw('bacillus'); }, 2600);
  });
  draw('bacillus');
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', layout);
  if (window.ResizeObserver) new ResizeObserver(() => layout()).observe(document.querySelector('main'));
  if (document.fonts) document.fonts.ready.then(layout);
  layout();
}

// ==================== LINEAGE COLOURS (mycolorsTB) ====================
function mixHex(hex, target, t) {
  const a = hexToRgb(hex), b = hexToRgb(target);
  const c = { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t };
  return '#' + [c.r, c.g, c.b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}
function relLum(hex) {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const c = hexToRgb(hex);
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}
const contrastHex = (a, b) => { const x = relLum(a), y = relLum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
// A lineage colour nudged just enough to be seen on the current paper (3:1,
// the minimum for graphics); most mycolorsTB colours pass untouched.
function visibleOn(hex, paper) {
  const toward = relLum(paper) > 0.4 ? '#000000' : '#ffffff';
  let c = hex;
  for (let t = 0.05; t <= 0.9 && contrastHex(c, paper) < 3; t += 0.05) c = mixHex(hex, toward, t);
  return c;
}
// The four colours of the bacillus sprite for a lineage colour
function bugVars(hex) {
  return `--px-n:${hex};--px-q:${mixHex(hex, '#ffffff', 0.45)};--px-j:${mixHex(hex, '#000000', 0.28)};--px-o:${mixHex(hex, '#000000', 0.6)}`;
}

// ==================== HALF-CIRCLE PHYLOGENY ====================
// The Mycobacterium tuberculosis complex as a fan over 180 degrees rooted at
// the bottom: the fourteen lineages of the mycolorsTB reference tree, tips
// aligned, each in its lineage colour. It grows from the root the first
// time it is seen, then a sweep moves across the tips; hovering a tip
// lights its branch.
function parseNewick(text) {
  let i = 0;
  const node = () => {
    const n = {};
    if (text[i] === '(') {
      i++; n.children = [node()];
      while (text[i] === ',') { i++; n.children.push(node()); }
      i++;
    }
    let name = '';
    while (i < text.length && !',();'.includes(text[i])) name += text[i++];
    if (name) n.label = name.split(':')[0].trim();
    return n;
  };
  return node();
}
function renderTopicTree() {
  const holder = document.getElementById('topicTree');
  if (!holder || typeof MTBC_NEWICK === 'undefined') return;
  const tree = parseNewick(MTBC_NEWICK);
  const W = 760, H = 440, cx = W / 2, cy = 400;
  const R = { root: 26, tip: 262, label: 274 };
  const paper = cssVar('--paper') || '#F6F6F2';
  const leaves = [];
  let maxDepth = 0;
  (function walk(node, depth) {
    node.depth = depth;
    if (node.children) { maxDepth = Math.max(maxDepth, depth); node.children.forEach(ch => walk(ch, depth + 1)); }
    else leaves.push(node);
  })(tree, 0);
  const pad = 7;
  const step = (R.tip - R.root - 26) / maxDepth;
  leaves.forEach((leaf, i) => { leaf.angle = 180 - pad - (i + 0.5) * (180 - 2 * pad) / leaves.length; leaf.r = R.tip; });
  (function place(node) {
    if (!node.children) return;
    node.children.forEach(place);
    const as = node.children.map(c => c.angle);
    node.angle = (Math.min(...as) + Math.max(...as)) / 2;
    node.r = R.root + node.depth * step;
    node.tips = node.children.flatMap(c => c.tips || [c.label]);
  })(tree);

  const pt = (r, a) => [cx + r * Math.cos(a * Math.PI / 180), cy - r * Math.sin(a * Math.PI / 180)];
  const f = n => n.toFixed(1);
  const arc = (r, a1, a2) => { const [x1, y1] = pt(r, a1), [x2, y2] = pt(r, a2); return `M ${f(x1)} ${f(y1)} A ${r} ${r} 0 0 1 ${f(x2)} ${f(y2)}`; };
  const radial = (r1, r2, a) => { const [x1, y1] = pt(r1, a), [x2, y2] = pt(r2, a); return `M ${f(x1)} ${f(y1)} L ${f(x2)} ${f(y2)}`; };

  const branches = [], tips = [], labels = [];
  let leafIndex = 0;
  (function draw(node) {
    if (!node.children) return;
    const as = node.children.map(c => c.angle);
    const delay = node.depth * 0.12;
    branches.push(`<path class="fan-branch grow" pathLength="1" style="--d:${f(delay)}s" d="${arc(node.r, Math.max(...as), Math.min(...as))}"/>`);
    node.children.forEach(ch => {
      if (ch.children) {
        branches.push(`<path class="fan-branch grow" pathLength="1" style="--d:${f(delay + 0.1)}s" d="${radial(node.r, ch.r, ch.angle)}"/>`);
        draw(ch);
      } else {
        const i = leafIndex++;
        const color = visibleOn(MYCOLORS_TB[ch.label] || '#888888', paper);
        const d = 0.8 + i * 0.05;
        const full = (typeof LINEAGE_NAMES !== 'undefined' && LINEAGE_NAMES[ch.label]) || ch.label;
        branches.push(`<path class="fan-leaf grow" data-leaf="${i}" pathLength="1" style="--lc:${color};--d:${f(d)}s" d="${radial(node.r, ch.r, ch.angle)}"/>`);
        const [tx, ty] = pt(ch.r, ch.angle);
        const [lx, ly] = pt(R.label, ch.angle);
        const left = ch.angle > 90;
        const rot = left ? 180 - ch.angle : -ch.angle;
        tips.push(`<a href="#research-tb" class="fan-link" data-leaf="${i}" aria-label="${full}"><title>${full}</title>
          <circle class="fan-tip" data-leaf="${i}" style="--lc:${color};--d:${f(d + 0.4)}s" cx="${f(tx)}" cy="${f(ty)}" r="6.5"/>
          <text class="fan-label" style="--d:${f(d + 0.5)}s" x="${f(lx)}" y="${f(ly)}" dy="7" text-anchor="${left ? 'end' : 'start'}" transform="rotate(${f(rot)} ${f(lx)} ${f(ly)})">${ch.label}</text></a>`);
      }
    });
  })(tree);

  holder.innerHTML = `<svg viewBox="-40 0 ${W + 80} ${H}" role="img" aria-labelledby="fanTitle fanDesc">
    <title id="fanTitle">The Mycobacterium tuberculosis complex, drawn as a half-circle phylogeny</title>
    <desc id="fanDesc">Fourteen lineages, L1 to L10 and the animal-adapted A1 to A4, in the reference topology and lineage colours of mycolorsTB. L8 branches first; then M. tuberculosis (L1, L7, L4, L2 and L3) splits from M. africanum and the animal-adapted lineages (L5, A2, A3, A4, A1, L10, L6 and L9).</desc>
    <path class="fan-sweep" d="M ${cx} ${cy} L ${f(pt(R.tip + 22, 6)[0])} ${f(pt(R.tip + 22, 6)[1])} A ${R.tip + 22} ${R.tip + 22} 0 0 1 ${f(pt(R.tip + 22, -6)[0])} ${f(pt(R.tip + 22, -6)[1])} Z"/>
    <g class="fan-body">
      <g class="fan-branches" filter="url(#rough)">${branches.join('')}</g>
      <path class="fan-branch fan-stem grow" pathLength="1" d="M ${cx} ${cy} L ${cx} ${cy + 18}"/>
      <circle class="fan-root" cx="${cx}" cy="${cy}" r="4.5"/>
      ${labels.join('')}
      ${tips.join('')}
    </g>
  </svg>`;

  const svg = holder.querySelector('svg');
  const sweep = svg.querySelector('.fan-sweep');
  const tipEls = [...svg.querySelectorAll('.fan-tip')];

  // Frame the drawing on its labels, whose length depends on the font and
  // the screen: nothing is cut at the edges and the root stays centred.
  const body = svg.querySelector('.fan-body');
  holder._fit = () => {
    let bb;
    try { bb = body.getBBox(); } catch { return; }
    if (!bb || !bb.width) return;
    const half = Math.max(cx - bb.x, bb.x + bb.width - cx) + 12;
    const top = bb.y - 8, bottom = bb.y + bb.height + 6;
    svg.setAttribute('viewBox', `${f(cx - half)} ${f(top)} ${f(2 * half)} ${f(bottom - top)}`);
  };
  holder._fit();
  if (!holder._fitBound) {
    holder._fitBound = true;
    if (document.fonts) document.fonts.ready.then(() => holder._fit());
    const narrow = window.matchMedia && window.matchMedia('(max-width: 640px)');
    // Safari before 14 only has addListener
    if (narrow && narrow.addEventListener) narrow.addEventListener('change', () => holder._fit());
    else if (narrow && narrow.addListener) narrow.addListener(() => holder._fit());
  }

  // grow in once, when first seen
  const grow = () => holder.classList.add('grown');
  if (!holder.dataset.grown && animSpeed > 0 && 'IntersectionObserver' in window) {
    holder.classList.add('will-grow');
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { grow(); holder.dataset.grown = '1'; io.disconnect(); } }, { threshold: 0.3 });
    io.observe(holder);
    setTimeout(() => { grow(); holder.dataset.grown = '1'; }, 4000);
  } else {
    holder.classList.add('grown');
  }

  // hover a tip: light its branch, dim the rest
  svg.querySelectorAll('.fan-link').forEach(a => {
    const on = () => { holder.classList.add('has-hot'); svg.querySelectorAll(`[data-leaf="${a.dataset.leaf}"]`).forEach(el => el.classList.add('hot')); };
    const off = () => { holder.classList.remove('has-hot'); svg.querySelectorAll('.hot').forEach(el => el.classList.remove('hot')); };
    a.addEventListener('mouseenter', on); a.addEventListener('focus', on);
    a.addEventListener('mouseleave', off); a.addEventListener('blur', off);
  });

  // the sweep: a wedge that travels across the half circle and back,
  // lighting tips as it passes, without dipping below the baseline
  if (holder._raf) cancelAnimationFrame(holder._raf);
  let phi = 173, dir = -1, last = 0, visible = true;
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es.some(e => e.isIntersecting); }).observe(holder);
  const tick = (ts) => {
    holder._raf = requestAnimationFrame(tick);
    const dt = last ? Math.min((ts - last) / 1000, 0.1) : 0;
    last = ts;
    if (!visible || document.hidden) return;
    const on = animSpeed > 0 && holder.classList.contains('grown');
    sweep.style.opacity = on ? '' : '0';
    if (!on) { tipEls.forEach(t => t.classList.remove('lit')); return; }
    phi += dir * 26 * animSpeed * dt;
    if (phi < 7) { phi = 7; dir = 1; } else if (phi > 173) { phi = 173; dir = -1; }
    sweep.setAttribute('transform', `rotate(${(-phi).toFixed(2)} ${cx} ${cy})`);
    tipEls.forEach((t, i) => t.classList.toggle('lit', Math.abs(leaves[i].angle - phi) < 6));
  };
  holder._raf = requestAnimationFrame(tick);
  if (!holder._themeObs) {
    holder._themeObs = new MutationObserver(() => renderTopicTree());
    holder._themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
}

// ==================== PIXEL BACTERIA, SCATTERED ====================
// One bacillus per MTBC lineage, in its mycolorsTB colour: one next to each
// section tag, and more in the page margins on wide screens.
function scatterBugs() {
  if (typeof MYCOLORS_TB === 'undefined') return;
  const lineages = Object.keys(MYCOLORS_TB);
  let k = 0;
  const bug = (cls, style = '') => {
    const lin = lineages[k++ % lineages.length];
    const name = (LINEAGE_NAMES && LINEAGE_NAMES[lin]) || lin;
    return `<span class="px-bug ${cls}" title="${name}" data-lineage="${lin}" style="--bug-delay:${(k * 0.37) % 1.6}s;${style}">${spriteSVG('bacillus', 2)}</span>`;
  };
  document.querySelectorAll('.sec-tag').forEach(tag => tag.insertAdjacentHTML('beforeend', bug('px-bug--inline')));
  const rnd = seeded(97);
  document.querySelectorAll('main > section.sec').forEach((sec, i) => {
    const h = sec.offsetHeight;
    const count = h > 1600 ? 3 : h > 700 ? 2 : 1;
    for (let j = 0; j < count; j++) {
      const top = Math.round(140 + rnd() * Math.max(80, h - 260));
      const side = (i + j) % 2 === 0 ? 'left' : 'right';
      sec.insertAdjacentHTML('beforeend', bug('px-bug--margin', `top:${top}px;${side}:calc(50% - 560px - ${58 + Math.round(rnd() * 18)}px)`));
    }
  });
  // the royal blue of L2 vanishes on the night paper and the yellow of L7 on
  // the day one: each colour is nudged just enough, again when the theme flips
  const paint = () => {
    const paper = cssVar('--paper') || '#F6F6F2';
    document.querySelectorAll('.px-bug[data-lineage]').forEach(el => {
      bugVars(visibleOn(MYCOLORS_TB[el.dataset.lineage], paper)).split(';').forEach(decl => {
        const [prop, value] = decl.split(':');
        el.style.setProperty(prop, value);
      });
    });
  };
  paint();
  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}
