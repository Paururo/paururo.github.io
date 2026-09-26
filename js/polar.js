// ============================================================
// Polar, my lovebird. While my photo is in sight he sits on my shoulder in
// it: a kiss, a chirp, and he falls asleep there. Elsewhere he only ever
// sits on real perches: the edges of cards and notes, the desk and the shelf
// in "Off the bench", or the genome ruler at the top when nothing else is in
// sight. On the desk he walks about, as far as the things on it let him. Now
// and then he flies up to the ruler to see the plush bacillus: they walk
// together, dance, and he bends down to give it a kiss. And he has a home: a
// coconut hanging in the top right corner, that he flies into by its door, to
// look out at you and sing; and on the desk half a coconut that he dives
// into head first, till only the tips of his tail show. He seldom goes to
// either by himself, and never for long: a knock on a coconut calls him to
// it. A click on him is a song and a kiss for you.
// He is pixel art redrawn from his character sheet, in
// assets/img/polar.png: one 117 x 107 cell per pose, feet on one line.
// ============================================================

const POLAR_POSES = ['idle1', 'idle2', 'idle3', 'idle4', 'idle5', 'walk1', 'walk2', 'walk3', 'walk4',
  'hop1', 'hop2', 'hop3', 'hop4', 'hop5', 'flap1', 'flap2', 'flap3', 'flap4', 'flap5', 'chirp1', 'chirp2', 'chirp3', 'chirp4', 'chirp5',
  'peck1', 'peck2', 'peck3', 'peck4', 'peck5', 'preen1', 'preen2', 'preen3', 'preen4', 'preen5', 'sleep1', 'sleep2', 'sleep3', 'sleep4', 'sleep5',
  'fly1', 'fly2', 'fly3', 'fly4', 'fly5', 'idle1Half', 'idle1Shut', 'idle2Half', 'idle2Shut', 'idle1Breath', 'sleep4Breath', 'hopSquash', 'hopStretch'];
const POLAR_CELL = [117, 107];
const POLAR_FEET = [58.67, 101.33];     // where his feet rest, inside a cell
const POLAR_HEAD = [8, -64];            // his head, from his feet
const POLAR_BEAK_DOWN = [40, -6];       // the tip of his beak when he bends down (peck3)
const POLAR_HALF = 22;                  // half his footprint, for the room he needs
// one wingbeat: up, back, level, down, and up again
const POLAR_FLY = ['fly1', 'fly5', 'fly4', 'fly3', 'fly4', 'fly5'];
// four steps drawn on his standing pose: each foot down for three, up for one
const POLAR_WALK = ['walk1', 'walk2', 'walk3', 'walk4'];

// Where he may sit: surfaces only (edges of photos, cards, notes, the desk),
// how far along their top edge he lands, and how far below it his feet rest.
const POLAR_PERCHES = [
  ['.card', 0.8, 3],
  ['.stat', 0.72, 3],
  ['.notebook', 0.92, 3],
  ['.papers-track', 0.94, 3],
  ['.stop', 0.7, 3],
  ['.helix-card', 0.86, 3],
  ['.side-card', 0.8, 3],
  ['.pub-item', 0.9, 3],
  ['.tool-card', 0.84, 3],
  ['.gh-card', 0.84, 3],
  ['.experiment', 0.9, 3],
  ['.print', 0.78, 3],
  ['.diary-entry', 0.9, 3],
  ['.letter', 0.8, 3],
  ['.bench-desk', 0.5, 4],
  ['.bench-shelf', 0.6, 2],
  ['.thing--monitor', 0.52, 5],
  ['.thing--printer', 0.5, 4],
];

// Pixel hearts, notes and a feather, for what he says
const POLAR_FX = {
  heart: ['.RR.RR.', 'RHRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'],
  note: ['..kkk', '..k.k', '..k..', '..k..', 'kkk..', 'kkk..'],
  feather: ['...g.', '..gG.', '.gGg.', '.gGg.', 'gGg..', 'gg...', 'k....'],
};
const POLAR_FX_COLORS = { R: '#E8505B', H: '#FFB3BD', k: '#F39A1B', g: '#9ACD3C', G: '#4B9E3A' };
function polarFxSVG(name, scale = 3) {
  const rows = POLAR_FX[name];
  const rects = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== '.') rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${POLAR_FX_COLORS[ch]}"/>`);
  }));
  const w = rows[0].length, h = rows.length;
  return `<svg viewBox="0 0 ${w} ${h}" width="${w * scale}" height="${h * scale}" shape-rendering="crispEdges" aria-hidden="true">${rects.join('')}</svg>`;
}

// His coconut, hanging under the top bar in the top right corner, drawn by
// scripts/build-coco.py (assets/img/coco.png) at his own scale so that he
// fits through its door: where its rope hangs from, and the door (centre and
// radius), in art pixels
const COCO_CELL = [86, 116];
const COCO_PIVOT = [43.5, 0];
const COCO_DOOR = [42, 66, 18.5];
// Half a coconut on the desk (assets/img/coco-half.png, same script): the
// centre of its cut edge and the half width and height of the edge inside;
// the half width and height outside, and its bottom; and the point of his
// chest that he turns about when he dives in
const BOWL_CELL = [78, 60];
const BOWL_RIM = [39, 12, 31, 8];
const BOWL_EDGE = [35, 10, 53];
const POLAR_PIVOT = [58.5, 66];

// whole device pixels per art pixel, the same for him and for his coconuts
function polarScale() {
  const dpr = window.devicePixelRatio || 1;
  return Math.max(1, Math.round((innerWidth < 640 ? 0.66 : 1) * dpr)) / dpr;
}

// The coconut sways a little on its rope in a breeze, and swings when he
// goes in or out or when someone knocks on it
function initCoconut() {
  const el = document.getElementById('coco');
  if (!el) return;
  const swing = el.querySelector('.coco-swing');
  let S = 1, angle = 0, spin = 0, last = 0, drawn = null;
  function applyScale() {
    S = polarScale();
    el.style.width = `${COCO_CELL[0] * S}px`;
    el.style.height = `${COCO_CELL[1] * S}px`;
    swing.style.transformOrigin = `${COCO_PIVOT[0] * S}px ${COCO_PIVOT[1] * S}px`;
  }
  // where a point of the picture is in the window, as it swings
  function at(ax, ay) {
    const r = el.getBoundingClientRect();
    const dx = (ax - COCO_PIVOT[0]) * S, dy = (ay - COCO_PIVOT[1]) * S;
    const c = Math.cos(angle), s = Math.sin(angle);
    return { x: r.left + COCO_PIVOT[0] * S + dx * c - dy * s, y: r.top + COCO_PIVOT[1] * S + dx * s + dy * c };
  }
  // a pendulum on a short rope
  function frame(ts) {
    requestAnimationFrame(frame);
    const dt = last ? Math.min((ts - last) / 16.667, 3) : 1;
    last = ts;
    if (document.hidden) return;
    if (animSpeed > 0) {
      const breeze = Math.sin(ts / 1700) * 0.008 + Math.sin(ts / 2900 + 1.3) * 0.005;
      spin += (-(angle - breeze) * 0.0045 - spin * 0.03) * dt;
      angle += spin * dt;
    } else { angle = 0; spin = 0; }
    if (drawn === null || Math.abs(angle - drawn) > 0.0003) {
      swing.style.transform = `rotate(${angle.toFixed(4)}rad)`;
      drawn = angle;
    }
  }
  el.addEventListener('click', () => {
    spin += (spin < 0 ? -1 : 1) * 0.009;
    Bus.emit('coco:knock');
  });
  window.addEventListener('resize', applyScale);
  applyScale();
  el.coco = {
    door: () => ({ ...at(COCO_DOOR[0], COCO_DOOR[1]), r: COCO_DOOR[2] * S }),
    push: (v) => { if (animSpeed > 0) spin += v; },
    get angle() { return angle; },
  };
  el.hidden = false;
  requestAnimationFrame(frame);
}

function initPolar() {
  const el = document.getElementById('polar');
  if (!el) return;
  const sprite = el.querySelector('.polar-sprite');
  const bowlEl = document.querySelector('.thing--bowl');
  let S = 1;                                     // CSS pixels per art pixel
  const st = {
    x: -300, y: -300, vx: 0, vy: 0, mode: 'fly', perch: null, facing: 1, k: 1,
    frame: '', flap: 0, t: 0, queue: [], step: null, stepStart: 0, stepUntil: 0, leaveAt: 0, lastClick: 0,
    follow: 0, zoom: 0, seedAt: performance.now() + 25000, hold: false, lift: 0, onLeave: null,
    visitAt: performance.now() + 20000 + Math.random() * 12000, walkT: 0, deskSeen: false,
    homeAt: performance.now() + 240000 + Math.random() * 120000, homeUntil: 0, nest: null, clip: null, leaving: false, pending: null,
    bw: null, rot: 0, bowlUntil: 0, bowlSide: -1,
  };
  const pointer = { x: -1, y: -1 };
  const now = () => performance.now();

  const setFrame = (name) => {
    if (st.frame === name) return;
    st.frame = name;
    sprite.style.backgroundPosition = `${-POLAR_POSES.indexOf(name) * POLAR_CELL[0] * S}px 0`;
  };
  // whole device pixels per art pixel, so every pixel of him stays crisp
  function applyScale() {
    S = polarScale();
    el.style.width = sprite.style.width = `${POLAR_CELL[0] * S}px`;
    el.style.height = sprite.style.height = `${POLAR_CELL[1] * S}px`;
    el.style.transformOrigin = `${POLAR_FEET[0] * S}px ${POLAR_FEET[1] * S}px`;
    sprite.style.backgroundSize = `${POLAR_CELL[0] * POLAR_POSES.length * S}px ${POLAR_CELL[1] * S}px`;
    if (bowlEl) {
      // the half coconut at his scale, its shell standing on the desk and its shadow just below
      bowlEl.style.width = `${BOWL_CELL[0] * S}px`;
      bowlEl.style.height = `${BOWL_CELL[1] * S}px`;
      bowlEl.style.marginBottom = `${-(BOWL_CELL[1] - BOWL_EDGE[2] - 1) * S}px`;
    }
    const f = st.frame; st.frame = ''; setFrame(f || 'idle1');
  }
  // up on the ruler he is drawn smaller, so the top bar has room for him
  function rulerScale() {
    const dpr = window.devicePixelRatio || 1;
    const css = dpr >= 1.5 ? Math.max(1, Math.round(0.56 * dpr)) / dpr : 0.56;
    return Math.min(1, css / S);
  }
  const place = () => {
    const tx = Math.round(st.x - POLAR_FEET[0] * S), ty = Math.round(st.y - POLAR_FEET[1] * S - st.lift);
    el.style.transform = `translate(${tx}px, ${ty}px) scale(${st.k.toFixed(3)})`;
    el.classList.toggle('left', st.facing < 0);
    // turned forward about his chest, as he dives into the half coconut
    const turn = st.rot ? `${st.facing < 0 ? 'scaleX(-1) ' : ''}rotate(${st.rot.toFixed(1)}deg)` : '';
    if (turn || sprite.style.transform) {
      sprite.style.transform = turn;
      sprite.style.transformOrigin = turn ? `${POLAR_PIVOT[0] * S}px ${POLAR_PIVOT[1] * S}px` : '';
    }
    // at home only what the door of the coconut shows of him can be seen, and
    // in the half coconut only what is above its front edge
    let clip = '';
    if (st.clip && st.clip.poly) {
      clip = `polygon(${st.clip.poly.map(([x, y]) => `${(x - tx).toFixed(1)}px ${(y - ty).toFixed(1)}px`).join(', ')})`;
    } else if (st.clip) {
      const ox = POLAR_FEET[0] * S, oy = POLAR_FEET[1] * S;
      const cx = ox + (st.clip.x - tx - ox) / st.k, cy = oy + (st.clip.y - ty - oy) / st.k;
      clip = `circle(${(st.clip.r / st.k).toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px)`;
    }
    if (el.style.clipPath !== clip) { el.style.clipPath = clip; el.style.webkitClipPath = clip; }
  };
  const headerBottom = () => (document.getElementById('navbar')?.getBoundingClientRect().bottom || 86);

  // ---- perches ----
  // A point on an element's top edge, following the slight tilt most of the
  // page's paper things have (read once, when he picks the spot)
  const tiltOf = (e) => {
    const m = getComputedStyle(e).transform;
    const v = m && m !== 'none' && m.match(/matrix\(([^)]+)\)/);
    if (!v) return 0;
    const [a, b] = v[1].split(',').map(parseFloat);
    return Math.atan2(b, a);
  };
  const perchPoint = (p) => {
    if (p.point) return p.point();
    const r = p.el.getBoundingClientRect();
    if (!r.width || !r.height) return { x: 0, y: 0, ok: false };
    if (p.tilt === undefined) p.tilt = tiltOf(p.el);
    const w = p.el.offsetWidth || r.width, h = p.el.offsetHeight || r.height;
    const lx = (p.ax - 0.5) * w, ly = -h / 2 + p.dy;
    const c = Math.cos(p.tilt), s = Math.sin(p.tilt);
    return { x: r.left + r.width / 2 + lx * c - ly * s, y: r.top + r.height / 2 + lx * s + ly * c, ok: true };
  };
  const inView = (pt, anywhere) => pt.ok && pt.y > (anywhere ? 40 : headerBottom() + 90) && pt.y < innerHeight - 20 && pt.x > 30 && pt.x < innerWidth - 30;

  // What stands on a surface and takes up room there
  function obstacles(e) {
    if (e.matches('.bench-desk')) {
      const top = e.getBoundingClientRect().top;
      return [...document.querySelectorAll('#bench .thing')].filter(t => !t.matches('.thing--keyboard'))
        .map(t => t.getBoundingClientRect()).filter(q => Math.abs(q.bottom - top) < 16);
    }
    if (e.matches('.bench-shelf')) {
      // what stands on the shelf, the half coconut too when it is there
      const top = e.getBoundingClientRect().top;
      return [...e.querySelectorAll('.shelf-item'), bowlEl].filter(Boolean).map(t => t.getBoundingClientRect())
        .filter(q => q.width && Math.abs(q.bottom - top) < 16);
    }
    if (e.matches('.letter')) return [...e.querySelectorAll('.letter-cup')].map(t => t.getBoundingClientRect());
    if (e.matches('.ruler-track')) return [document.querySelector('.ruler-walker').getBoundingClientRect()];
    return [];
  }
  // The free stretches of a surface, in screen x, where his feet can be
  function spans(e) {
    const r = e.getBoundingClientRect();
    const half = POLAR_HALF * S * (e.matches('.ruler-track') ? rulerScale() : 1);
    let out = [[r.left + half + 4, r.right - half - 4]];
    for (const o of obstacles(e)) {
      const a = o.left - half - 2, b = o.right + half + 2;
      out = out.flatMap(([x0, x1]) => (b <= x0 || a >= x1) ? [[x0, x1]] : [[x0, Math.min(x1, a)], [Math.max(x0, b), x1]]);
    }
    return out.filter(([x0, x1]) => x1 >= x0);
  }
  const spanAt = (e, x) => spans(e).find(([x0, x1]) => x >= x0 - 1 && x <= x1 + 1) || null;
  // Land somewhere free on a surface: where it was asked if that is free,
  // otherwise in the widest free stretch
  function spotOn(e, ax, dy, extra = {}) {
    const r = e.getBoundingClientRect();
    const free = spans(e);
    if (!free.length || !r.width) return null;
    const want = r.left + r.width * ax;
    const inside = free.find(([x0, x1]) => want >= x0 && want <= x1);
    let x;
    if (inside) x = want;
    else {
      const [x0, x1] = free.reduce((a, b) => (b[1] - b[0] > a[1] - a[0] ? b : a));
      x = x0 + (x1 - x0) * (0.3 + Math.random() * 0.4);
    }
    return { el: e, ax: (x - r.left) / r.width, dy, ...extra };
  }
  // Links and buttons he must not sit in front of, or a click meant for them
  // reaches him instead. On the desk he plays among the toys, and on the
  // ruler clicks go through him.
  const CONTROLS = 'a[href], button, input, select, textarea, summary, label, [role="button"], [tabindex]:not([tabindex="-1"])';
  const controlsInView = () => [...document.querySelectorAll(CONTROLS)]
    .filter(c => !el.contains(c) && !c.closest('#bench, .genome-ruler'))
    .map(c => ({ c, r: c.getBoundingClientRect() }))
    .filter(({ r }) => r.width && r.height && r.bottom > 0 && r.top < innerHeight);
  // the part of him that takes clicks (.polar-hit) with his feet at pt, less
  // the few pixels his feet sink into the surface
  const hitBox = (pt) => ({
    left: pt.x + (0.24 * POLAR_CELL[0] - POLAR_FEET[0]) * S, right: pt.x + (0.78 * POLAR_CELL[0] - POLAR_FEET[0]) * S,
    top: pt.y + (0.16 * POLAR_CELL[1] - POLAR_FEET[1]) * S, bottom: pt.y - 4,
  });
  const covers = (e, box, controls) => controls.some(({ c, r }) => !c.contains(e)
    && r.left < box.right && r.right > box.left && r.top < box.bottom && r.bottom > box.top);
  function candidates() {
    const out = [];
    const controls = controlsInView();
    POLAR_PERCHES.forEach(([sel, ax, dy]) => document.querySelectorAll(sel).forEach(e => {
      if (e.closest('[hidden]')) return;
      const p = spotOn(e, ax, dy, e.matches('.bench-desk') ? { desk: true, tilt: 0 } : {});
      if (!p) return;
      const pt = perchPoint(p);
      if (inView(pt) && (e.closest('#bench') || !covers(e, hitBox(pt), controls))) out.push(p);
    }));
    return out;
  }
  const bench = document.getElementById('bench');
  const deskInView = () => { if (!bench) return false; const r = bench.getBoundingClientRect(); return r.top < innerHeight * 0.7 && r.bottom > innerHeight * 0.35; };
  // somewhere new, not too far, where the reader is; while the desk is in
  // sight he keeps to the desk and what stands on it
  function pickPerch() {
    if (shoulderInView() && !(st.perch && st.perch.shoulder)) return shoulderPerch();
    let all = candidates().filter(p => !st.perch || p.el !== st.perch.el);
    const deskish = all.filter(p => p.el.closest('#bench'));
    if (deskish.length && deskInView()) {
      // mostly the desk itself, to walk on; now and then the monitor, the printer or the shelf
      const desk = deskish.find(p => p.desk);
      if (desk && Math.random() < 0.7) return desk;
      all = deskish;
    }
    if (!all.length) return null;
    const near = all.filter(p => { const q = perchPoint(p); return Math.hypot(q.x - st.x, q.y - st.y) < 760; });
    const pool = near.length ? near : all;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  // the genome ruler at the top: always there, so he never has to hover
  function rulerPerch() {
    const track = document.querySelector('.ruler-track');
    if (!track) return null;
    const r = track.getBoundingClientRect();
    return spotOn(track, Math.min(0.95, Math.max(0.05, (st.x - r.left) / r.width)), track.offsetHeight - 1, { anywhere: true, ruler: true, tilt: 0 });
  }
  // his friend the plush bacillus, on the ruler: he lands just beside it
  function friendPerch() {
    const walker = document.querySelector('.ruler-walker');
    const track = document.querySelector('.ruler-track');
    if (!walker || !track) return null;
    const w = walker.getBoundingClientRect();
    if (!w.width) return null;
    const fromLeft = st.x < w.left + w.width / 2;
    const off = () => (POLAR_BEAK_DOWN[0] * S * rulerScale() + w.width / 2 - 7) * (fromLeft ? -1 : 1);
    return {
      el: walker, friend: true, anywhere: true, ruler: true, face: fromLeft ? 1 : -1,
      point: () => { const a = walker.getBoundingClientRect(), b = track.getBoundingClientRect(); return { x: a.left + a.width / 2 + off(), y: b.bottom - 1, ok: a.width > 0 }; },
    };
  }
  // my right shoulder in the photo (on the right as you look at it), facing me
  const photo = document.querySelector('.polaroid-photo');
  function shoulderPerch() {
    if (!photo) return null;
    return {
      el: photo, shoulder: true, face: -1,
      point: () => { const r = photo.getBoundingClientRect(); return { x: r.left + r.width * 0.815, y: r.top + r.height * 0.915, ok: r.width > 0 }; },
    };
  }
  const shoulderInView = () => { const p = shoulderPerch(); return !!p && inView(perchPoint(p)); };
  // where to go next: coming to the desk from elsewhere, the desk itself;
  // otherwise a perch in sight; otherwise the ruler
  function nextPerch() {
    const fromBench = st.perch && st.perch.el && st.perch.el.closest && st.perch.el.closest('#bench');
    return (!fromBench && deskInView() && deskPerch()) || pickPerch() || rulerPerch();
  }
  function deskPerch() {
    const desk = document.querySelector('.bench-desk');
    if (!desk) return null;
    const p = spotOn(desk, 0.5, 4, { desk: true, tilt: 0 });
    return p && inView(perchPoint(p)) ? p : null;
  }

  // ---- home: his coconut ----
  const cocoEl = document.getElementById('coco');
  const coco = () => (cocoEl && !cocoEl.hidden && cocoEl.coco) || null;
  const NEST_K = 0.75;                  // inside he is a little further away
  // how far to the side his face is, when he turns it to you
  const FACE = { idle2: 0, idle2Half: 0, idle2Shut: 0, idle4: 0.4, idle5: 0.4 };
  // Where he is at home: 'out', just outside the door at his own size, where
  // he flies to and from; 'door', his face in it; 'in', down out of sight
  function nestSpot(name) {
    const d = coco().door();
    const k = name === 'out' ? 1 : NEST_K;
    const hx = POLAR_HEAD[0] * (st.frame in FACE ? FACE[st.frame] : 1) * st.facing;
    const y = d.y - POLAR_HEAD[1] * S * k + S + (name === 'in' ? (COCO_DOOR[2] + 26) * S : 0);
    return { x: d.x - hx * S * k, y, k, r: name === 'out' ? null : d.r - 1.6 * S };
  }
  function cocoPerch() {
    if (!coco()) return null;
    return { el: cocoEl, home: true, anywhere: true, point: () => ({ ...nestSpot('out'), ok: true }) };
  }
  // from one place at home to another in a step's time, the door closing
  // round him as he goes in and opening as he comes out
  function nestMove(to, ms, arc = 0) {
    st.nest = { from: st.nest ? st.nest.to : 'out', to, t0: now(), ms: Math.max(1, ms), arc };
    nestPlace(now());
  }
  function nestPlace(t) {
    const n = st.nest, d = coco().door();
    const e = Math.min(1, (t - n.t0) / n.ms);
    const q = e < 0.5 ? 2 * e * e : 1 - (2 - 2 * e) ** 2 / 2;
    const a = nestSpot(n.from), b = nestSpot(n.to);
    st.x = a.x + (b.x - a.x) * q;
    st.y = a.y + (b.y - a.y) * q - Math.sin(Math.PI * q) * n.arc * S;
    st.k = a.k + (b.k - a.k) * q;
    const wide = 150 * S, ra = a.r ?? wide, rb = b.r ?? wide;
    st.clip = (a.r === null && b.r === null) || (e >= 1 && b.r === null) ? null : { x: d.x, y: d.y, r: ra + (rb - ra) * q };
  }
  function leaveNest() {
    st.nest = null; st.clip = null; st.leaving = false;
  }
  // ---- half a coconut on the desk ----
  // a point of the half coconut, in art pixels, where it is in the window
  function bowlAt(ax, ay) {
    const r = bowlEl.getBoundingClientRect();
    return { x: r.left + ax * S, y: r.top + ay * S };
  }
  const bowlInView = () => !!bowlEl && !!bowlEl.offsetParent && inView({ ...bowlAt(BOWL_RIM[0], BOWL_RIM[1]), ok: true });
  function bowlPerch() {
    if (!bowlInView()) return null;
    const r = bowlEl.getBoundingClientRect();
    const side = st.x < r.left + r.width / 2 ? -1 : 1;
    return { el: bowlEl, bowl: true, side, point: () => ({ ...bowlAt(BOWL_RIM[0] + side * (BOWL_EDGE[0] - 7), BOWL_RIM[1] - 1), ok: true }) };
  }
  const CHEST = POLAR_PIVOT[1] - POLAR_FEET[1];   // his chest, above his feet
  // Where he is at the half coconut, as where his chest is and how far he is
  // turned forward: on the edge he came by ('rim', and 'out' to leave), bent
  // in ('lean'), diving ('dive'), only the tips of his tail out ('tail'), down
  // out of sight ('hid'), his eyes over the edge ('peek') or sitting up ('up')
  function bowlSpot(name) {
    const [cx, cy, , iy] = BOWL_RIM, s = st.bowlSide;
    const onEdge = (turn) => {
      const feet = bowlAt(cx + s * (BOWL_EDGE[0] - 7), cy - 1);
      const a = turn * Math.PI / 180 * st.facing;
      return { x: feet.x - CHEST * S * Math.sin(a), y: feet.y + CHEST * S * Math.cos(a), turn };
    };
    const at = (x, y, turn) => ({ ...bowlAt(x, y), turn });
    const head = POLAR_HEAD[1] - CHEST;           // his head, from his chest
    switch (name) {
      case 'lean': return onEdge(40);
      case 'dive': return at(cx + s * 4, cy + 2, 55);
      case 'tail': return at(cx, cy + 31, 72);
      case 'hid': return at(cx, cy + 72, 0);
      case 'peek': return at(cx, cy + iy - 5 - head, 0);
      case 'up': return at(cx - s * 2, cy + iy - 22 - head, 0);
      default: return onEdge(0);
    }
  }
  // what the front of the shell does not hide: everything but the inside
  // below its front edge, its sides, and whatever is under it
  function bowlShade() {
    const [cx, cy, ix, iy] = BOWL_RIM, [ox, , bottom] = BOWL_EDGE;
    const pts = [[-3000, -3000], [3000, -3000], [3000, bottom], [cx + ox + 8, bottom], [cx + ox + 8, cy], [cx + ix, cy]];
    for (let i = 1; i < 16; i++) pts.push([cx + ix * Math.cos(Math.PI * i / 16), cy + iy * Math.sin(Math.PI * i / 16)]);
    pts.push([cx - ix, cy], [cx - ox - 8, cy], [cx - ox - 8, bottom], [-3000, bottom]);
    const r = bowlEl.getBoundingClientRect();
    return pts.map(([x, y]) => [r.left + x * S, r.top + y * S]);
  }
  function bowlMove(to, ms, arc = 0) {
    st.bw = { from: st.bw ? st.bw.to : 'rim', to, t0: now(), ms: Math.max(1, ms), arc };
    bowlPlace(now());
  }
  function bowlPlace(t) {
    const n = st.bw;
    const e = Math.min(1, (t - n.t0) / n.ms);
    const q = e < 0.5 ? 2 * e * e : 1 - (2 - 2 * e) ** 2 / 2;
    const a = bowlSpot(n.from), b = bowlSpot(n.to);
    const px = a.x + (b.x - a.x) * q, py = a.y + (b.y - a.y) * q - Math.sin(Math.PI * q) * n.arc * S;
    st.rot = a.turn + (b.turn - a.turn) * q;
    // placed by his feet as if he were not turned: the turn is about his chest
    st.x = px + (POLAR_FEET[0] - POLAR_PIVOT[0]) * S;
    st.y = py - CHEST * S;
    st.k = 1;
    st.clip = { poly: bowlShade() };
  }
  function leaveBowl() {
    st.bw = null; st.rot = 0; st.clip = null; st.leaving = false;
  }

  // without motion he is simply at home, looking out of his door
  function settleHome() {
    const home = cocoPerch();
    if (!home) return false;
    if (st.onLeave) { st.onLeave(); st.onLeave = null; }
    st.bw = null; st.rot = 0;
    st.perch = home; st.mode = 'perch'; st.leaveAt = Infinity; st.homeUntil = 0; st.facing = 1;
    st.queue = []; st.step = null; st.stepUntil = 0; st.lift = 0; st.leaving = false;
    st.nest = { from: 'door', to: 'door', t0: 0, ms: 1, arc: 0 };
    el.classList.remove('up-front');
    setFrame('idle2');
    nestPlace(now());
    return true;
  }

  // ---- what he says ----
  function fx(kind) {
    const f = document.createElement('span');
    const heart = kind === 'kiss' || kind === 'kissUp';
    f.className = `polar-fx polar-fx--${heart ? 'heart' : kind}`;
    f.setAttribute('aria-hidden', 'true');
    f.innerHTML = kind === 'zzz' ? 'z' : polarFxSVG(heart ? 'heart' : kind, 3);
    const K = S * st.k;
    const hx = st.x + st.facing * POLAR_HEAD[0] * K, hy = st.y + POLAR_HEAD[1] * K - st.lift;
    let x = hx, y = hy - 10;
    if (kind === 'note') { x = hx + st.facing * 30 * K; y = hy; }
    if (kind === 'feather') { x = st.x; y = st.y - 40 * K; f.style.setProperty('--sway', `${(Math.random() < 0.5 ? -1 : 1) * (20 + Math.random() * 30)}px`); }
    if (kind === 'kiss') { x = st.x + st.facing * POLAR_BEAK_DOWN[0] * K; y = st.y + POLAR_BEAK_DOWN[1] * K - 12; }
    if (kind === 'kissUp') { x = st.x + st.facing * 34 * K; y = st.y - 70 * K; }
    if (st.perch && st.perch.home && st.nest && st.nest.to === 'in' && coco()) { const d = coco().door(); x = d.x + 4 * S; y = d.y - d.r * 0.3; }
    if (st.perch && st.perch.bowl && st.bw && st.bw.to === 'hid' && bowlEl) { const q = bowlAt(BOWL_RIM[0] + 4, BOWL_RIM[1] - 2); x = q.x; y = q.y; }
    f.style.left = `${Math.round(x)}px`;
    f.style.top = `${Math.round(y)}px`;
    document.body.appendChild(f);
    f.addEventListener('animationend', () => {
      // a feather that reaches the water leaves a ring on it
      if (kind === 'feather') { const r = f.getBoundingClientRect(); Bus.emit('pond:ripple', { x: r.left + r.width / 2, y: r.bottom }); }
      f.remove();
    });
    setTimeout(() => f.remove(), 4000);
  }

  // ---- what he does while sitting: a queue of small steps ----
  const seq = (names, ms, extra = {}) => names.map((f, i) => ({ f, ms, ...(typeof extra === 'function' ? extra(i) : extra) }));
  const queue = (...steps) => st.queue.push(...steps.flat());
  const blinkSide = () => seq(['idle1Half', 'idle1Shut', 'idle1Half'], 55).map((s, i) => (i === 1 ? { ...s, ms: 90 } : s));
  const blinkFront = () => seq(['idle2Half', 'idle2Shut', 'idle2Half'], 55).map((s, i) => (i === 1 ? { ...s, ms: 90 } : s));
  const hopUp = (height = 18) => seq(['hopSquash', 'hop1', 'hop2', 'hop3', 'hop4', 'hop5', 'hopSquash'], 85, i => ({ lift: [0, 2, 8, height, 8, 2, 0][i] }));
  // in by the door: he turns round to look out, blinks, and goes down inside
  const goIn = () => [{ f: 'flap4', ms: 90 }, { f: 'flap5', ms: 260, nest: ['door'], push: 0.007 }, { f: 'idle2', ms: 650 },
    ...blinkFront(), { f: 'idle2', ms: 500 }, { f: 'idle2', ms: 450, nest: ['in'] }, { f: 'idle2', ms: 900 }];
  // out by the door: a look outside, and off he flies
  const goOut = () => [{ f: 'idle2', ms: 450, nest: ['door'] }, { f: 'idle2', ms: 420 }, { f: 'idle1', ms: 240, face: -1 },
    { f: 'flap2', ms: 90 }, { f: 'flap3', ms: 240, nest: ['out'], push: -0.007 }];
  function homeThought(t) {
    if (st.nest.to === 'out') { const next = st.pending; st.pending = null; takeOff(next); return; }
    if (t > st.homeUntil && !st.hold) { st.leaving = true; queue(goOut()); return; }
    if (st.nest.to === 'door') { queue({ f: st.frame, ms: 450, nest: ['in'] }, { f: 'idle2', ms: 900 }); return; }
    const r = Math.random(), night = isDark();
    if (r < (night ? 0.5 : 0.22)) {
      // a nap
      queue(seq(['sleep4', 'sleep4', 'sleep4'], 1200, i => (i === 1 ? { fx: 'zzz' } : {})));
    } else if (r < (night ? 0.78 : 0.62)) {
      // he looks out at you, blinks, and goes back in
      queue({ f: 'idle2', ms: 450, nest: ['door'] }, { f: 'idle2', ms: 900 + Math.random() * 900 }, blinkFront(),
        { f: 'idle2', ms: 600 }, { f: 'idle2', ms: 450, nest: ['in'] }, { f: 'idle2', ms: 1200 + Math.random() * 1800 });
    } else if (r < (night ? 0.9 : 0.82)) {
      // a look round from the door, one way and then the other
      const side = Math.random() < 0.5 ? 1 : -1;
      queue({ f: 'idle1', ms: 450, face: side, nest: ['door'] }, { f: 'idle1', ms: 800 }, blinkSide(), { f: 'idle1', ms: 220, face: -side },
        { f: 'idle1', ms: 900 }, { f: 'idle1', ms: 450, nest: ['in'] }, { f: 'idle1', ms: 1500 });
    } else {
      // a song from the door
      queue({ f: 'idle1', ms: 450, face: -1, nest: ['door'] }, seq(['chirp1', 'chirp2', 'chirp3', 'chirp4', 'chirp5', 'chirp4', 'chirp3'], 150,
        i => (i === 1 || i === 4 ? { fx: 'note' } : {})), { f: 'idle1', ms: 500 }, { f: 'idle1', ms: 450, nest: ['in'] }, { f: 'idle1', ms: 1500 });
    }
  }
  // into the half coconut: a look, bent in, head first down to the tips of his tail
  const intoBowl = () => [{ f: 'idle1', ms: 450 }, ...blinkSide(), { f: 'peck1', ms: 200 }, { f: 'peck2', ms: 340, bowl: ['lean'] },
    { f: 'peck3', ms: 380, bowl: ['dive'] }, { f: 'peck3', ms: 460, bowl: ['tail'] }, { f: 'peck3', ms: 800 },
    { f: 'peck3', ms: 420, bowl: ['hid'] }, { f: 'idle2', ms: 900 }];
  // and out: eyes over the edge, sitting up, a hop onto the edge
  const outOfBowl = () => [{ f: 'idle2', ms: 420, bowl: ['peek'] }, { f: 'idle2', ms: 450 }, ...blinkFront(),
    { f: 'idle1', ms: 400, face: st.bowlSide, bowl: ['up'] }, { f: 'idle1', ms: 450 }, { f: 'hopSquash', ms: 110 },
    { f: 'hopStretch', ms: 300, bowl: ['out', 14] }, { f: 'hopSquash', ms: 120 }, { f: 'idle1', ms: 350 }];
  function bowlThought(t) {
    if (st.bw.to === 'out') { const next = st.pending; st.pending = null; takeOff(next); return; }
    if (t > st.bowlUntil && !st.hold) { st.leaving = true; queue(outOfBowl()); return; }
    if (st.bw.to === 'rim' || st.bw.to === 'lean') { queue(intoBowl()); return; }
    const r = Math.random();
    if (r < 0.4) {
      // his eyes over the edge, a blink, and down again
      queue({ f: 'idle2', ms: 440, bowl: ['peek'] }, { f: 'idle2', ms: 900 + Math.random() * 700 }, blinkFront(), { f: 'idle2', ms: 500 },
        { f: 'idle2', ms: 400, bowl: ['hid'] }, { f: 'idle2', ms: 1000 + Math.random() * 1500 });
    } else if (r < 0.62) {
      // the tips of his tail, up for a while
      queue({ f: 'peck3', ms: 420, bowl: ['tail'] }, { f: 'peck3', ms: 900 }, { f: 'peck3', ms: 380, bowl: ['hid'] }, { f: 'peck3', ms: 1300 });
    } else if (r < 0.82) {
      // he sits up and sings
      queue({ f: 'idle1', ms: 440, face: Math.random() < 0.5 ? 1 : -1, bowl: ['up'] }, seq(['chirp1', 'chirp2', 'chirp3', 'chirp4', 'chirp5', 'chirp4', 'chirp3'], 150,
        i => (i === 1 || i === 4 ? { fx: 'note' } : {})), { f: 'idle1', ms: 500 }, { f: 'idle1', ms: 400, bowl: ['hid'] }, { f: 'idle1', ms: 1200 });
    } else {
      queue(seq(['idle2', 'idle2'], 1300, i => (i === 0 ? { fx: 'zzz' } : {})));
    }
  }
  function idleThought() {
    if (st.perch && st.perch.home) { homeThought(now()); return; }
    if (st.perch && st.perch.bowl) { bowlThought(now()); return; }
    // on the desk, once in a while, into the half coconut
    if (st.perch && st.perch.desk && Math.random() < 0.04) { const b = bowlPerch(); if (b) { takeOff(b); return; } }
    const night = isDark();
    const onDesk = st.perch && st.perch.desk;
    const r = Math.random();
    if (st.perch && st.perch.shoulder) {
      queue(seq(['sleep4Breath', 'sleep4', 'sleep4Breath', 'sleep4'], 850, i => (i === 1 && Math.random() < 0.5 ? { fx: 'zzz' } : {})));
    } else if (onDesk && r < 0.45) {
      // on the desk he wanders about, as far as the things on it let him
      queue({ walk: Math.random() < 0.5 ? -1 : 1, ms: 1400 + Math.random() * 1800 }, { f: 'idle1', ms: 500 },
        Math.random() < 0.4 ? seq(['peck1', 'peck2', 'peck3', 'peck2', 'peck4', 'peck5'], 140) : [], { f: 'idle1', ms: 400 });
    } else if (night && r < 0.2) {
      // a nap: eyes close, he fluffs up and breathes slowly, then wakes the same way
      queue({ f: 'idle1Half', ms: 90 }, { f: 'idle1Shut', ms: 400 }, { f: 'sleep1', ms: 600 }, { f: 'sleep4', ms: 700 },
        seq(['sleep4Breath', 'sleep4', 'sleep4Breath', 'sleep4', 'sleep4Breath', 'sleep4'], 750, i => (i === 1 || i === 4 ? { fx: 'zzz' } : {})),
        { f: 'sleep1', ms: 400 }, { f: 'idle1Shut', ms: 160 }, { f: 'idle1Half', ms: 70 }, { f: 'idle1', ms: 600 });
    } else if (r < 0.24) {
      // breathing, and a blink
      queue({ f: 'idle1', ms: 700 }, { f: 'idle1Breath', ms: 600 }, { f: 'idle1', ms: 500 }, blinkSide(), { f: 'idle1', ms: 800 + Math.random() * 1200 });
    } else if (r < 0.35) {
      // he turns round to look at you, blinks, and turns back
      queue(seq(['idle5', 'idle4'], 120), { f: 'idle2', ms: 900 + Math.random() * 600 }, blinkFront(), { f: 'idle2', ms: 700 }, seq(['idle4', 'idle5'], 120), { f: 'idle1', ms: 500 });
    } else if (r < 0.46) {
      queue(seq(['chirp1', 'chirp2', 'chirp3', 'chirp4', 'chirp5', 'chirp4', 'chirp3'], 150, i => (i === 1 || i === 4 ? { fx: 'note' } : {})), { f: 'idle1', ms: 900 });
    } else if (r < 0.54) {
      queue({ walk: Math.random() < 0.5 ? -1 : 1, ms: 900 + Math.random() * 1100 }, { f: 'idle1', ms: 700 });
    } else if (r < 0.62) {
      queue(seq(['idle5', 'idle2'], 120), { f: 'preen2', ms: 320 },
        seq(['preen1', 'preen5', 'preen1', 'preen5', 'preen1'], 230), { f: 'preen2', ms: 300 },
        { f: 'idle2', ms: 260, shake: true, fx: Math.random() < 0.4 ? 'feather' : null }, blinkFront(), seq(['idle5'], 120), { f: 'idle1', ms: 600 });
    } else if (r < 0.7) {
      queue(seq(['peck1', 'peck2', 'peck3', 'peck2', 'peck3', 'peck4', 'peck5'], 140), { f: 'idle1', ms: 800 });
    } else if (r < 0.78) {
      queue(seq(['flap1', 'flap2', 'flap3', 'flap4', 'flap3', 'flap2', 'flap5'], 90), { f: 'idle1', ms: 900 });
    } else if (r < 0.85) {
      queue(hopUp(), { f: 'idle1', ms: 700 });
    } else if (r < 0.93) {
      st.facing *= -1;
      queue({ f: 'hopSquash', ms: 90 }, { f: 'idle1', ms: 1100 });
    } else {
      queue({ f: 'idle1', ms: 1400 + Math.random() * 1400 });
    }
  }
  function runQueue(t, dt) {
    const s = st.step;
    // strolling along the free stretch he stands on; no room, no walk
    if (s && s.walk && t < st.stepUntil && st.perch && !st.perch.point) {
      const e = st.perch.el, r = e.getBoundingClientRect();
      const span = spanAt(e, st.x);
      const room = span ? span[1] - span[0] : 0;
      const nx = st.x + s.walk * 0.3 * S * st.k * dt;
      if (room < 36 * S * st.k || nx < span[0] || nx > span[1]) {
        st.stepUntil = 0;
        if (room >= 36 * S * st.k) st.facing = -s.walk;   // the end of the free stretch: he turns round
      } else {
        st.perch.ax = (nx - r.left) / r.width; st.facing = s.walk;
        st.walkT += dt;
        setFrame(POLAR_WALK[Math.floor(st.walkT / 6.5) % POLAR_WALK.length]);
        return;
      }
    }
    // walking in step with someone else (the ruler moves him)
    if (s && s.anim === 'walk' && t < st.stepUntil) {
      st.walkT += dt;
      setFrame(POLAR_WALK[Math.floor(st.walkT / 6.5) % POLAR_WALK.length]);
      return;
    }
    if (t < st.stepUntil) return;
    if (!st.queue.length) idleThought();
    // what he thought of was to leave
    if (st.mode !== 'perch' || !st.queue.length) return;
    const n = st.queue.shift();
    st.step = n;
    st.stepStart = t;
    st.stepUntil = t + n.ms;
    st.lift = n.lift ? n.lift * S * st.k : 0;
    if (n.face) st.facing = n.face;
    if (n.emit) Bus.emit(...n.emit);
    if (n.nest && st.perch && st.perch.home) nestMove(n.nest[0], n.ms, n.nest[1] || 0);
    if (n.bowl && st.perch && st.perch.bowl) bowlMove(n.bowl[0], n.ms, n.bowl[1] || 0);
    if (n.push && coco()) coco().push(n.push);
    if (n.walk || n.anim) return;
    setFrame(n.f);
    if (n.fx) fx(n.fx);
    if (n.shake) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  }

  // On the ruler with his friend: walk together, dance, bend down, a kiss
  function rulerDance(t) {
    const walker = document.querySelector('.ruler-walker').getBoundingClientRect();
    const track = document.querySelector('.ruler-track').getBoundingClientRect();
    const bx = walker.left + walker.width / 2;
    const toFriend = bx >= st.x ? 1 : -1;
    const lo = Math.min(bx - walker.width / 2, st.x - POLAR_HALF * S * st.k), hi = Math.max(bx + walker.width / 2, st.x + POLAR_HALF * S * st.k);
    const roomR = track.right - hi - 8, roomL = lo - track.left - 8;
    const dir = roomR >= roomL ? 1 : -1;
    const dist = Math.max(0, Math.min(80, dir > 0 ? roomR : roomL));
    const steps = [{ f: 'idle1', ms: 250, face: toFriend }, ...seq(['chirp2', 'chirp3'], 160, i => (i === 0 ? { fx: 'note' } : {})), { f: 'idle1', ms: 200 }];
    if (dist > 24) steps.push({ anim: 'walk', ms: 1800, face: dir, emit: ['ruler:walk', { dx: dir * dist, ms: 1800 }] }, { f: 'idle1', ms: 250, face: toFriend });
    for (let i = 0; i < 3; i++) {
      steps.push({ f: 'hopSquash', ms: 110, emit: ['ruler:hop'] }, { f: 'hopStretch', ms: 100, lift: 5 },
        { f: 'flap3', ms: 130, lift: 9, fx: i === 1 ? 'note' : null }, { f: 'flap5', ms: 110, lift: 3 }, { f: 'idle1', ms: 130 });
    }
    steps.push({ f: 'peck1', ms: 240, face: toFriend }, { f: 'peck2', ms: 280 }, { f: 'peck3', ms: 650, fx: 'kiss', emit: ['ruler:kissed'] },
      { f: 'peck2', ms: 200 }, { f: 'peck1', ms: 160 }, { f: 'idle1', ms: 300 }, ...blinkSide(), { f: 'chirp2', ms: 180, fx: 'heart' }, { f: 'idle1', ms: 700 });
    st.onLeave = () => Bus.emit('ruler:home', { ms: 900 });
    return steps;
  }

  function land(t) {
    st.mode = 'perch';
    st.vx = st.vy = 0;
    st.step = null; st.stepUntil = 0; st.lift = 0;
    const touchdown = seq(['flap4', 'flap5'], 90).concat([{ f: 'hopSquash', ms: 110 }, { f: 'idle1', ms: 300 }]);
    el.classList.toggle('up-front', !!(st.perch && st.perch.ruler));
    if (st.perch && st.perch.bowl) {
      // on the edge of the half coconut, facing into it
      st.bowlSide = st.perch.side;
      st.facing = -st.bowlSide;
      st.bw = { from: 'rim', to: 'rim', t0: t, ms: 1, arc: 0 };
      bowlPlace(t);
      st.leaving = false; st.pending = null;
      st.bowlUntil = t + 5500 + Math.random() * 2000;
      st.queue = touchdown.concat(intoBowl());
      st.leaveAt = Infinity;
      Bus.emit('polar:landed', { x: st.x, y: st.y, el: st.perch.el });
      return;
    }
    if (st.perch && st.perch.home) {
      // home: in by the door, a look out, and not for long
      st.nest = { from: 'out', to: 'out', t0: t, ms: 1, arc: 0 };
      st.leaving = false; st.pending = null;
      st.homeUntil = t + 3500 + Math.random() * 2000;
      st.queue = goIn();
      st.leaveAt = Infinity;
      Bus.emit('polar:landed', { x: st.x, y: st.y, el: st.perch.el });
      return;
    }
    if (st.perch && st.perch.shoulder) {
      st.facing = st.perch.face;
      st.queue = touchdown.concat([{ f: 'idle1', ms: 450, face: st.perch.face }], shoulderHello(), goToSleep());
      st.leaveAt = Infinity;
      Bus.emit('polar:landed', { x: st.x, y: st.y, el: st.perch.el });
      return;
    }
    if (st.perch && st.perch.friend) {
      st.facing = st.perch.face;
      Bus.emit('polar:visit', { el: st.perch.el });
      st.queue = touchdown.concat(rulerDance(t));
      st.leaveAt = t + st.queue.reduce((sum, q) => sum + q.ms, 0) + 150;
      return;
    }
    st.queue = touchdown;
    st.leaveAt = t + (st.perch.desk ? 16000 + Math.random() * 10000 : st.perch.ruler ? 3000 + Math.random() * 2500 : 7000 + Math.random() * 9000);
    Bus.emit('polar:landed', { x: st.x, y: st.y, el: st.perch && st.perch.el });
  }

  // a kiss for me and a chirp, then his eyes close and he goes to sleep
  const shoulderHello = () => [{ f: 'hopStretch', ms: 430, fx: 'kissUp' }, { f: 'idle1', ms: 220 }, { f: 'hopStretch', ms: 380, fx: 'kissUp' }, { f: 'idle1', ms: 420 },
    ...seq(['chirp1', 'chirp2', 'chirp3', 'chirp4', 'chirp5'], 150, i => (i === 1 || i === 3 ? { fx: 'note' } : {})), { f: 'idle1', ms: 700 }];
  const goToSleep = () => [...blinkSide(), { f: 'idle1', ms: 400 }, { f: 'idle1Half', ms: 200 }, { f: 'idle1Shut', ms: 600 },
    { f: 'sleep1', ms: 800 }, { f: 'sleep4', ms: 900, fx: 'zzz' }];

  function takeOff(target) {
    const t = now();
    // at home he first goes out by the door, and then on to wherever it was
    if (st.perch && st.perch.home && st.mode === 'perch' && st.nest && st.nest.to !== 'out') {
      if (target) st.pending = target;
      if (!st.leaving) {
        st.leaving = true;
        st.homeUntil = 0;
        st.queue = goOut();
        // a move under way ends first
        if (!(st.step && st.step.nest)) { st.step = null; st.stepUntil = 0; }
      }
      return;
    }
    // in the half coconut he climbs out first
    if (st.perch && st.perch.bowl && st.mode === 'perch' && st.bw && st.bw.to !== 'rim' && st.bw.to !== 'out') {
      if (target) st.pending = target;
      if (!st.leaving) {
        st.leaving = true;
        st.bowlUntil = 0;
        st.queue = outOfBowl();
        if (!(st.step && st.step.bowl)) { st.step = null; st.stepUntil = 0; }
      }
      return;
    }
    if (st.perch && st.perch.bowl) leaveBowl();
    const fromHome = !!(st.perch && st.perch.home);
    if (fromHome) leaveNest();
    if (st.onLeave) { st.onLeave(); st.onLeave = null; }
    el.classList.remove('up-front');
    // time to visit his friend on the ruler, or to go home for a while?
    if (!target && t > st.visitAt && !st.follow) {
      st.visitAt = t + 55000 + Math.random() * 55000;
      target = friendPerch();
    }
    if (!target && !fromHome && t > st.homeAt && !st.follow && coco()) {
      st.homeAt = t + 300000 + Math.random() * 180000;
      target = cocoPerch();
    }
    st.perch = target || nextPerch();
    if (fromHome) {
      // straight off from the door: out and down, away from the top bar
      st.mode = 'fly'; st.facing = -1; st.vx = -2.2; st.vy = 0.6;
    } else {
      st.mode = 'launch';
      st.launchAt = t;
    }
    st.queue = []; st.step = null; st.lift = 0;
  }
  // crouch, spring, wings up: then he is off
  const LAUNCH = [['hopSquash', 90], ['hopStretch', 70], ['flap2', 70], ['flap3', 70]];

  function kiss() {
    Bus.emit('polar:kiss');
    if (st.mode === 'perch' && st.perch && st.perch.bowl) {
      if (st.leaving || !st.bw || st.bw.to === 'rim' || st.bw.to === 'out') { fx('heart'); return; }
      st.queue = [{ f: 'idle2', ms: 380, bowl: ['peek'] }, { f: 'idle2', ms: 500, fx: 'heart' }, ...blinkFront(),
        { f: 'idle1', ms: 400, bowl: ['up'] }, ...seq(['chirp1', 'chirp2', 'chirp3', 'chirp4', 'chirp5'], 140, i => (i === 1 ? { fx: 'note' } : i === 3 ? { fx: 'heart' } : {})),
        { f: 'idle1', ms: 500 }, { f: 'idle1', ms: 400, bowl: ['hid'] }, { f: 'idle2', ms: 900 }];
      if (!(st.step && st.step.bowl)) { st.step = null; st.stepUntil = 0; }
      st.bowlUntil = Math.max(st.bowlUntil, now() + 3000);
      return;
    }
    if (st.mode === 'perch' && st.perch && st.perch.home) {
      if (st.leaving || st.nest.to === 'out') { fx('heart'); return; }
      st.queue = [{ f: 'idle2', ms: 380, nest: ['door'] }, { f: 'idle1', ms: 200, face: -1 },
        ...seq(['chirp1', 'chirp2', 'chirp3', 'chirp4', 'chirp5'], 140, i => (i === 1 ? { fx: 'heart' } : i === 3 ? { fx: 'note' } : {})),
        { f: 'idle2', ms: 700, fx: 'heart' }, ...blinkFront(), { f: 'idle2', ms: 500 }, { f: 'idle2', ms: 450, nest: ['in'] }, { f: 'idle2', ms: 900 }];
      if (!(st.step && st.step.nest)) { st.step = null; st.stepUntil = 0; }
      st.homeUntil = Math.max(st.homeUntil, now() + 3000);
      return;
    }
    if (st.mode === 'perch' && st.perch && st.perch.shoulder) {
      st.queue = [{ f: 'sleep1', ms: 250 }, { f: 'idle1Shut', ms: 150 }, { f: 'idle1Half', ms: 90 }, { f: 'idle1', ms: 300, face: st.perch.face }, ...shoulderHello(), ...goToSleep()];
      st.step = null; st.stepUntil = 0;
      return;
    }
    if (st.mode === 'perch') {
      st.queue = [];
      queue(seq(['chirp1', 'chirp2', 'chirp3', 'chirp4', 'chirp5'], 140, i => (i === 1 ? { fx: 'heart' } : i === 3 ? { fx: 'note' } : {})));
      queue(seq(['idle5', 'idle4'], 100), { f: 'idle2', ms: 600, fx: 'heart' }, blinkFront(), seq(['idle4', 'idle5'], 100));
      queue(seq(['flap1', 'flap2', 'flap3', 'flap4', 'flap5'], 90));
      queue(hopUp(20), { f: 'idle1', ms: 900 });
      st.step = null; st.stepUntil = 0;
      st.leaveAt = Math.max(st.leaveAt, now() + 6000);
    } else {
      fx('heart');
    }
  }

  // ---- flying ----
  function flyStep(dt, k, t) {
    let tx, ty, target = null;
    if (st.follow > t && pointer.x >= 0) { tx = pointer.x; ty = pointer.y + 2; }
    else if (st.zoom > t) {
      const a = t / 600;
      tx = innerWidth / 2 + Math.cos(a) * innerWidth * 0.32; ty = innerHeight / 2 + Math.sin(a) * innerHeight * 0.28;
    } else {
      if (!st.perch) st.perch = nextPerch();
      if (!st.perch) return;
      const p = perchPoint(st.perch);
      // the spot scrolled away: another one, or the ruler, never mid-air (his
      // home is always in sight, right against the edge of the window)
      if (!st.perch.home && !inView(p, st.perch.anywhere)) { st.perch = nextPerch(); return; }
      tx = p.x; ty = p.y; target = st.perch;
    }
    // far out of the window (the page jumped a long way): he comes back from its edge
    st.x = Math.max(-160, Math.min(innerWidth + 160, st.x));
    st.y = Math.max(-160, Math.min(innerHeight + 160, st.y));
    const dx = tx - st.x, dy = ty - st.y, d = Math.hypot(dx, dy);
    const fast = st.zoom > t ? 1.8 : 1;
    const want = Math.min(4.4 * k * fast, 0.5 * k + d * 0.055);
    st.vx += ((dx / (d || 1)) * want - st.vx) * Math.min(1, 0.09 * dt);
    st.vy += ((dy / (d || 1)) * want - st.vy) * Math.min(1, 0.09 * dt);
    st.t += dt;
    st.x += st.vx * dt;
    st.y += st.vy * dt + Math.sin(st.t * 0.32) * 0.3 * k * dt;
    if (Math.abs(st.vx) > 0.35) st.facing = st.vx > 0 ? 1 : -1;
    // smaller as he nears the ruler, back to his size elsewhere
    const kWant = target && target.ruler ? rulerScale() : 1;
    const blend = target && target.ruler ? Math.max(0, Math.min(1, 1 - (d - 30) / 260)) : 1;
    st.k += ((1 + (kWant - 1) * blend) - st.k) * Math.min(1, 0.15 * dt);
    // wings beating all the way; a glide on long descents; wings spread to land
    if (d < 44 && st.zoom <= t) setFrame(d < 18 ? 'flap4' : 'flap3');
    else if (st.vy > 2.2 && d > 160) setFrame('fly2');
    else { st.flap += dt * 0.19 * Math.max(1, k); setFrame(POLAR_FLY[Math.floor(st.flap) % POLAR_FLY.length]); }
    // now and then a base for the koi, dropped over bare water
    if (t > st.seedAt && st.zoom <= t) {
      st.seedAt = t + 35000 + Math.random() * 30000;
      const under = document.elementFromPoint(st.x, Math.min(innerHeight - 2, st.y + 40));
      if (!under || !under.closest('p, h1, h2, h3, li, .card, .tool-card, .letter, .notebook, figure')) Bus.emit('pond:feed', { x: st.x, y: st.y + 30, n: 1 });
    }
    if (d < 2.5 && st.zoom <= t) {
      st.x = tx; st.y = ty;
      if (st.follow > t) { st.mode = 'perch'; st.vx = st.vy = 0; st.queue = [{ f: 'hopSquash', ms: 100 }, { f: 'idle1', ms: 400 }]; st.step = null; st.stepUntil = 0; return; }
      // the page moved while he flew: a spot now in the way of a click is no spot
      if (target && !target.point && !target.el.closest('#bench') && covers(target.el, hitBox({ x: st.x, y: st.y }), controlsInView())) { st.perch = nextPerch(); return; }
      if (target) { st.k = target.ruler ? rulerScale() : 1; land(t); }
    }
  }

  // ---- the loop ----
  let last = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    if (document.hidden) { last = ts; return; }
    const dt = last ? Math.min((ts - last) / 16.667, 3) : 1;
    last = ts;
    const k = animSpeed * 2;
    // without motion he is either asleep on my shoulder, while it is in sight,
    // or at home, looking out of his door
    if (k === 0 && coco()) {
      const asleep = st.mode === 'perch' && st.perch && st.perch.shoulder && inView(perchPoint(st.perch));
      const atDoor = st.mode === 'perch' && st.perch && st.perch.home && st.nest && st.nest.from === 'door' && st.nest.to === 'door';
      if (!asleep && !atDoor) settleHome();
    }
    if (st.mode === 'launch') {
      // the take-off frames play before he moves
      let t = ts - st.launchAt, i = 0;
      while (i < LAUNCH.length && t > LAUNCH[i][1]) { t -= LAUNCH[i][1]; i++; }
      if (i < LAUNCH.length && k > 0) { setFrame(LAUNCH[i][0]); st.lift = i >= 2 ? 6 * S * st.k : 0; }
      else { st.mode = 'fly'; st.lift = 0; st.vy = -2.4; st.vx = st.facing * 0.9; }
    } else if (st.mode === 'perch') {
      if (st.follow > ts && pointer.x >= 0) {
        // sitting on the pointer, like on a finger: keep up with it
        if (Math.hypot(pointer.x - st.x, pointer.y + 2 - st.y) > 6 && k > 0) st.mode = 'fly';
        else runQueue(ts, dt);
      } else if (st.perch) {
        const home = st.perch.home, bowl = st.perch.bowl;
        if (home) nestPlace(ts);
        if (bowl && !bowlInView()) { leaveBowl(); if (k > 0) takeOff(); place(); return; }
        if (bowl) bowlPlace(ts);
        const p = home || bowl ? { x: st.x, y: st.y, ok: true } : perchPoint(st.perch);
        st.x = p.x; st.y = p.y;
        if (st.perch.ruler && !st.perch.friend && ts > (st.lookAt || 0)) {
          st.lookAt = ts + 1200;
          if (candidates().length) st.leaveAt = Math.min(st.leaveAt, ts);
        }
        // a scroll that brings his coconut over him, or a button that turns up
        // under him: he would be in the way of a click, so he moves on at once
        if (!home && !bowl && !st.perch.ruler && !st.perch.shoulder && !st.perch.el.closest('#bench') && ts > (st.coverAt || 0)) {
          st.coverAt = ts + 250;
          if (k > 0 && !st.hold && covers(st.perch.el, hitBox(p), controlsInView())) { takeOff(); place(); return; }
        }
        if (k > 0 && !st.hold && ((!home && !bowl && !inView(p, st.perch.anywhere)) || (ts > st.leaveAt && ts > st.stepUntil))) takeOff();
        else if (k > 0) runQueue(ts, dt);
      } else if (k > 0) takeOff();
    } else if (k > 0) {
      flyStep(dt, k, ts);
    }
    place();
  }

  // ---- start: he flies in and lands on the photo, next to me ----
  function start() {
    applyScale();
    st.perch = (shoulderInView() && shoulderPerch()) || (animSpeed === 0 && cocoPerch()) || pickPerch() || rulerPerch();
    if (st.perch && st.perch.home) settleHome();
    else if (st.perch) {
      const p = perchPoint(st.perch);
      st.x = p.x; st.y = p.y;
      if (animSpeed > 0) {
        st.x = innerWidth + 80; st.y = Math.max(headerBottom() + 80, p.y - 140);
        st.mode = 'fly';
      } else {
        // without motion he is simply there: asleep on my shoulder, or sitting
        st.mode = 'perch'; st.leaveAt = Infinity;
        if (st.perch.shoulder) st.facing = st.perch.face;
        setFrame(st.perch.shoulder ? 'sleep4' : 'idle1');
        el.classList.toggle('up-front', !!st.perch.ruler);
      }
    }
    place();
    el.hidden = false;
    requestAnimationFrame(frame);
  }

  el.addEventListener('click', (e) => {
    e.stopPropagation();
    const t = now();
    // a second click soon after: he comes to sit on the pointer for a while
    if (t - st.lastClick < 1400 && animSpeed > 0) {
      if (st.perch && st.perch.home) { leaveNest(); if (coco()) coco().push(-0.006); }
      if (st.perch && st.perch.bowl) leaveBowl();
      st.follow = t + 9000;
      pointer.x = e.clientX; pointer.y = e.clientY;
      el.classList.add('following');
      st.mode = 'fly';
      fx('heart');
    } else kiss();
    st.lastClick = t;
  });
  document.addEventListener('pointermove', e => {
    if (st.follow > now()) { pointer.x = e.clientX; pointer.y = e.clientY; }
  }, { passive: true });
  const stopFollowing = () => { st.follow = 0; el.classList.remove('following'); takeOff(); };
  document.addEventListener('pointerdown', e => { if (st.follow && !el.contains(e.target)) stopFollowing(); });
  setInterval(() => { if (st.follow && st.follow < now()) stopFollowing(); }, 500);
  // someone who reaches him with the keyboard gets to keep him still
  el.addEventListener('focus', () => { st.hold = true; });
  el.addEventListener('blur', () => { st.hold = false; });
  window.addEventListener('scroll', () => {
    if (animSpeed === 0 || st.follow || st.zoom > now() || (st.perch && (st.perch.shoulder || st.perch.friend || st.perch.home))) return;
    if (shoulderInView()) takeOff(shoulderPerch());
  }, { passive: true });
  // the desk comes into sight: he flies down to walk on it
  if (bench) {
    window.addEventListener('scroll', () => {
      const seen = deskInView();
      if (seen && !st.deskSeen && animSpeed > 0 && !st.follow && !(st.perch && (st.perch.friend || st.perch.desk))) {
        const p = deskPerch();
        if (p) takeOff(p);
      }
      st.deskSeen = seen;
    }, { passive: true });
  }
  Bus.on('caffeine', () => {
    if (animSpeed === 0) return;
    if (st.onLeave) { st.onLeave(); st.onLeave = null; }
    el.classList.remove('up-front');
    if (st.perch && st.perch.home) { leaveNest(); if (coco()) coco().push(-0.008); }
    if (st.perch && st.perch.bowl) leaveBowl();
    st.zoom = now() + 3200; st.mode = 'fly'; st.perch = null;
  });
  Bus.on('polar:come', (sel) => {
    if (animSpeed === 0) return;
    const e = sel && document.querySelector(sel);
    takeOff(e ? spotOn(e, 0.5, 4) : null);
    setTimeout(kiss, 2500);
  });
  Bus.on('polar:visit-now', () => { if (animSpeed > 0) { const f = friendPerch(); if (f) takeOff(f); } });
  // a press on the half coconut: in it, his eyes over the edge and a song;
  // anywhere else, he comes to dive in
  if (bowlEl) bowlEl.addEventListener('click', () => {
    if (animSpeed === 0 || st.follow > now() || st.zoom > now()) return;
    if (st.perch && st.perch.bowl) { if (st.mode === 'perch') kiss(); return; }
    const b = bowlPerch();
    if (!b) return;
    if (st.mode === 'fly') st.perch = b;
    else takeOff(b);
  });
  // a knock on his coconut: at home he comes to the door; anywhere else he
  // comes home
  Bus.on('coco:knock', () => {
    if (animSpeed === 0) { if (st.perch && st.perch.home) fx('heart'); return; }
    if (st.follow > now() || st.zoom > now()) return;
    if (st.perch && st.perch.home) { if (st.mode === 'perch') kiss(); return; }
    if (st.mode === 'fly') st.perch = cocoPerch();
    else takeOff(cocoPerch());
  });
  // a sneeze nearby: he flaps up in surprise, then settles and has a word about it
  Bus.on('sneeze', () => {
    if (st.perch && st.perch.bowl) {
      if (st.mode === 'perch' && animSpeed > 0 && !st.leaving && st.bw && st.bw.to === 'hid') {
        st.queue = [{ f: 'idle2', ms: 300, bowl: ['peek'] }, { f: 'idle2', ms: 900 }, ...blinkFront(), { f: 'idle2', ms: 400, bowl: ['hid'] }, { f: 'idle2', ms: 900 }];
      }
      return;
    }
    if (st.perch && st.perch.home) {
      // at home he comes to the door, to see what it was
      if (st.mode === 'perch' && animSpeed > 0 && !st.leaving && st.nest && st.nest.to === 'in') {
        st.queue = [{ f: 'idle2', ms: 300, nest: ['door'] }, { f: 'idle2', ms: 900 }, ...blinkFront(), { f: 'idle2', ms: 450, nest: ['in'] }, { f: 'idle2', ms: 900 }];
      }
      return;
    }
    if (st.mode !== 'perch' || animSpeed === 0 || (st.perch && st.perch.friend)) return;
    st.queue = seq(['flap2', 'flap3', 'flap4', 'flap3', 'flap5'], 80, i => ({ lift: [4, 10, 12, 8, 0][i] }));
    st.queue.push({ f: 'idle1', ms: 250 }, ...seq(['chirp2', 'chirp3', 'chirp2'], 120, i => (i === 1 ? { fx: 'note' } : {})), { f: 'idle1', ms: 700 });
    st.step = null; st.stepUntil = 0;
  });
  window.addEventListener('resize', () => {
    applyScale();
    if (st.mode !== 'perch' || !st.perch) return;
    if (st.perch.home) nestPlace(now());
    else if (st.perch.bowl && st.bw) bowlPlace(now());
    else { const p = perchPoint(st.perch); st.x = p.x; st.y = p.y; }
    place();
  });
  start();
  // for the page's own tests
  el.state = st;
}
