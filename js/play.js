// ============================================================
// Play: the pond tricks in the top bar, the desk in "Off the bench"
// (hobbies and the microbes that followed me home) and the cup of coffee
// on the letter in the contact section. Everything talks through Bus, so a
// sneeze on the desk reaches the koi and a coffee reaches Polar.
// ============================================================

// ---------- sprites for the desk, the microbes and the coffees ----------
Object.assign(PX_PALETTE, {"A": "#CF7F5F", "B": "#3F6FC4", "C": "#6B4226", "D": "#8A5A3C", "E": "#A6D3B1", "F": "#FBF3E6", "G": "#DCE8EE", "H": "#F4ECDD", "K": "#EFE9DC", "L": "#A792DE", "M": "#C8966A", "N": "#CFC5B3", "O": "#E9853C", "R": "#B9443A", "S": "#62B07A", "T": "#D0503F", "Z": "#E0A030", "e": "#CDEBD3", "i": "#F4A3B4", "l": "#CDB9F2", "r": "#E8604F", "y": "#F7D774", "z": "#8F76CC"});
Object.assign(PX_SPRITES, {
  virus: ["rr....rrrr....rr", "rr.....RR.....rr", "..R..kkkkkk..R..", "...RkeeeeeekR...", "...keeeeeeeek...", "..keeeeeeeeeek..", "r.keeeeeeeeeek.r", "rRkeewxeewxeekRr", "rRkeexxeexxeEkRr", "r.keieeeeeeiEk.r", "..keeeexxeeEEk..", "...keeeeeeEEk...", "...RkeeeEEEkR...", "..R..kkkkkk..R..", "rr.....RR.....rr", "rr....rrrr....rr"],
  virusBlink: ["rr....rrrr....rr", "rr.....RR.....rr", "..R..kkkkkk..R..", "...RkeeeeeekR...", "...keeeeeeeek...", "..keeeeeeeeeek..", "r.keeeeeeeeeek.r", "rRkeeeeeeeeeekRr", "rRkeexxeexxeEkRr", "r.keieeeeeeiEk.r", "..keeeexxeeEEk..", "...keeeeeeEEk...", "...RkeeeEEEkR...", "..R..kkkkkk..R..", "rr.....RR.....rr", "rr....rrrr....rr"],
  virusHappy: ["rr....rrrr....rr", "rr.....RR.....rr", "..R..kkkkkk..R..", "...RkeeeeeekR...", "...keeeeeeeek...", "..keeeeeeeeeek..", "r.keeeeeeeeeek.r", "rRkeexeeeexeekRr", "rRkexexeexexEkRr", "r.keieeeeeeiEk.r", "..keeeexxeeEEk..", "...keeeeeeEEk...", "...RkeeeEEEkR...", "..R..kkkkkk..R..", "rr.....RR.....rr", "rr....rrrr....rr"],
  virusSneeze: ["rr....rrrr....rr", "rr.....RR.....rr", "..R..kkkkkk..R..", "...RkeeeeeekR...", "...keeeeeeeek...", "..keeeeeeeeeek..", "r.keeeeeeeeeek.r", "rRkeexeeeexeekRr", "rRkeeexeexeeEkRr", "r.keexeeeexeEk.r", "..keeeexxeeEEk..", "...keeexxeEEk...", "...RkeeeEEEkR...", "..R..kkkkkk..R..", "rr.....RR.....rr", "rr....rrrr....rr"],
  virusShock: ["rr....rrrr....rr", "rr.....RR.....rr", "..R..kkkkkk..R..", "...RkeeeeeekR...", "...keeeeeeeek...", "..keeeeeeeeeek..", "r.keeeeeeeeeek.r", "rRkeewxeewxeekRr", "rRkeexxeexxeEkRr", "r.keieeeeeeiEk.r", "..keeeeeeeeEEk..", "...keeexxeEEk...", "...RkeeeEEEkR...", "..R..kkkkkk..R..", "rr.....RR.....rr", "rr....rrrr....rr"],
  mac: ["......kkkkkkkkk........", "....kklllllllllkk......", "...kllllllllzzzllk.....", "..klllllllllzzzzllk....", "..kllllllllllzzzlllk...", ".klllllllllllllllllk...", ".kllxxllllllxxllllllk..", ".kllwxllllllwxllllllk..", ".kllxxllllllxxllllllk..", "kllilllllllllllillllk..", "klllllllxlllxllllllLk..", "kllllllllxxxllllllLLk..", ".klllllllllllllllLLLk..", ".kLllllllllllllllLLk...", "kLLLklllllllllllkLLLk..", "kLLLLkkLLLLLLLLkkLLLLk.", ".kkkk..kkkkkkkk..kkkk.."],
  macBlink: ["......kkkkkkkkk........", "....kklllllllllkk......", "...kllllllllzzzllk.....", "..klllllllllzzzzllk....", "..kllllllllllzzzlllk...", ".klllllllllllllllllk...", ".kllllllllllllllllllk..", ".kllllllllllllllllllk..", ".kllxxllllllxxllllllk..", "kllilllllllllllillllk..", "klllllllxlllxllllllLk..", "kllllllllxxxllllllLLk..", ".klllllllllllllllLLLk..", ".kLllllllllllllllLLk...", "kLLLklllllllllllkLLLk..", "kLLLLkkLLLLLLLLkkLLLLk.", ".kkkk..kkkkkkkk..kkkk.."],
  macOpen: ["......kkkkkkkkk........", "....kklllllllllkk......", "...kllllllllzzzllk.....", "..klllllllllzzzzllk....", "..kllllllllllzzzlllk...", ".klllllllllllllllllk...", ".kllxxllllllxxllllllk..", ".kllwxllllllwxllllllk..", ".kllxxllllllxxllllllk..", "kllilllllllllllillllk..", "klllllllxxxxxllllllLk..", "klllllllxiiixlllllLLk..", ".klllllllxxxlllllLLLk..", ".kLllllllllllllllLLk...", "kLLLklllllllllllkLLLk..", "kLLLLkkLLLLLLLLkkLLLLk.", ".kkkk..kkkkkkkk..kkkk.."],
  macHappy: ["......kkkkkkkkk........", "....kklllllllllkk......", "...kllllllllzzzllk.....", "..klllllllllzzzzllk....", "..kllllllllllzzzlllk...", ".klllllllllllllllllk...", ".kllllllllllllllllllk..", ".kllxlllllllxlllllllk..", ".klxlxlllllxlxllllllk..", "kllilllllllllllillllk..", "klllllllxlllxllllllLk..", "kllllllllxxxllllllLLk..", ".klllllllllllllllLLLk..", ".kLllllllllllllllLLk...", "kLLLklllllllllllkLLLk..", "kLLLLkkLLLLLLLLkkLLLLk.", ".kkkk..kkkkkkkk..kkkk.."],
  phage: ["....kkkkk....", "...kaaaaak...", "..kaaaaaaak..", ".kaawxaawxak.", ".kaaxxaaxxak.", ".kaiaaaaaiAk.", "..kaaaxaaAk..", "...kaaaaAk...", "....kkkkk....", ".....kbk.....", "....kbbbk....", ".....kpk.....", ".....kbk.....", ".....kpk.....", "....kkkkk....", "...k.k.k.k...", "..k..k.k..k..", ".k...k.k...k."],
  phageBlink: ["....kkkkk....", "...kaaaaak...", "..kaaaaaaak..", ".kaaaxaaaaak.", ".kaaxxaaxxak.", ".kaiaaaaaiAk.", "..kaaaxaaAk..", "...kaaaaAk...", "....kkkkk....", ".....kbk.....", "....kbbbk....", ".....kpk.....", ".....kbk.....", ".....kpk.....", "....kkkkk....", "...k.k.k.k...", "..k..k.k..k..", ".k...k.k...k."],
  phageCrouch: ["....kkkkk....", "...kaaaaak...", "..kaaaaaaak..", ".kaawxaawxak.", ".kaaxxaaxxak.", ".kaiaaaaaiAk.", "..kaaaxaaAk..", "...kaaaaAk...", "....kkkkk....", ".....kbk.....", "....kbbbk....", ".....kpk.....", ".....kbk.....", ".....kpk.....", "....kkkkk....", "..kk.k.k.kk..", ".k...k.k...k.", "............."],
  bacillusMask: ["....kkkkkkkkkkkk....", "...kqqqqqqqqqqqqk...", "..kqnnnnnnnnnnnnqk..", ".knnnnwxnnnnwxnnnjk.", ".knnnnxxnnnnxxnnnjk.", ".knnbbwwwwwwwwbbnjk.", "..kjjjjwwwwwwjjjjk..", "...kkkkkkkkkkkkkk..."],
  bacillusWorried: ["....kkkkkkkkkkkk....", "...kqqqqqqqqqqqqk...", "..kqnnnnnnnnnnnnqk..", ".knnnnxxnnnnxxnnnjk.", ".knnnnwxnnnnwxnnnjk.", ".knnnnnnnnnnnnnnnjk.", "..kjjjjjjoojjjjjjk..", "...kkkkkkkkkkkkkk..."],
  lamp: [".........kkkkk....", "........kTTTTTk...", ".......kTTTTTTTk..", "......kTTTTTTTTTk.", ".....kkkkkkkkkkkkk", "......kc....kyyyk.", ".....kc......kyk..", "....kc............", "...kc.............", "..kc..............", ".kcc..............", ".kcck.............", "..kcc.............", "...kcc............", "....kcc...........", ".....kcc..........", "......kcc.........", ".......kc.........", "....kkkkkkkk......", "...kccccccccck....", "...kkkkkkkkkkk...."],
  jar: ["..kkkkkk..", ".kTTTTTTk.", ".kkkkkkkk.", "kGGGGGGGGk", "kGnGGZGTGk", "kGGZGGnGGk", "kGTGGBGGZk", "kGGGnGGZGk", "kGBGGGTGGk", "kGGZGZGGnk", ".kkkkkkkk."],
  mug: [".kkkkkkk...", "kwCCCCCwk..", "kwwwwwwwkkk", "kwwTTTwwk.k", "kwTwwwTwk.k", "kwwTwTwwkkk", "kwwwTwwwk..", "kwwwwwwwk..", ".kkkkkkk..."],
  keycap: ["..kkkkkk..", ".kKOOwKKk.", ".kKwOOOKk.", "kKKKKKKKKk", "kNNNNNNNNk", ".kkkkkkkk."],
  miniVirus: ["r..rr..r", ".RkkkkR.", ".keeeek.", "rkexexkr", "rkeeeEkr", ".kexEEk.", ".RkkkkR.", "r..rr..r"],
  cafeConLeche: ["...kkkkkkkkkk...", "...kGFFFFFFGk...", "...kGMMMMMMGk...", "...kGMMMMMMGk...", "...kGMMMMMMGk...", "....kGMMMMGk....", "....kGMMMMGk....", "....kGMMMMGk....", ".....kGGGGk.....", ".kkkkkkkkkkkkkk.", "kwwwwwwwwwwwwwwk", ".kNNNNNNNNNNNNk.", "..kkkkkkkkkkkk.."],
  cappuccino: [".....kkkkkk.....", "...kkFFDFFFkk...", "..kFFFFFFDFFFk..", "..kFDFFFFFFFFk..", "..kwwwwwwwwwwkkk", "..kwwwwwwwwwwk.k", "..kwTTwwwwwwwk.k", "...kwwwwwwwwkkkk", "....kwwwwwwk....", ".kkkkkkkkkkkkkk.", "kwwwwwwwwwwwwwwk", ".kNNNNNNNNNNNNk.", "..kkkkkkkkkkkk.."],
  latte: ["..........Bk....", "....kkkkkkBkk...", "....kFFFFFBFk...", "....kFFFFFBFk...", "....kCCCCCBCk...", "....kCCCCCBCk...", "....kMMMMMBMk...", "....kMMMMMMMk...", "....kwwwwwwwk...", "....kwwwwwwwk...", "....kwwwwwwwk...", "....kGGGGGGGk...", "....kkkkkkkkk..."],
  horchata: ["..........kk....", ".........kgwk...", "....kkkkkgwgk...", "....kHHHkggkk...", "....kHHHgwgHk...", "....kHHHkggHk...", "....kHHHHHHHk...", "....kHHHHHHHk...", "....kHHHHHHHk...", "....kHHHHHHHk...", "....kHHHHHHHk...", "....kGGGGGGGk...", "....kkkkkkkkk..."],
  cutePhage: ["....kkkkk....", "...kaaaaak...", "..kaaaaaaak..", ".kaawxaawxak.", ".kaaxxaaxxak.", ".kaiaaaaaiAk.", "..kaaaxaaAk..", "...kaaaaAk...", "....kkkkk....", ".....kbk.....", "....kbbbk....", ".....kpk.....", ".....kbk.....", ".....kpk.....", "....kkkkk....", "...k.k.k.k...", "..k..k.k..k..", ".k...k.k...k."],
  lampOff: [".........kkkkk....", "........kTTTTTk...", ".......kTTTTTTTk..", "......kTTTTTTTTTk.", ".....kkkkkkkkkkkkk", "......kc....kpppk.", ".....kc......kpk..", "....kc............", "...kc.............", "..kc..............", ".kcc..............", ".kcck.............", "..kcc.............", "...kcc............", "....kcc...........", ".....kcc..........", "......kcc.........", ".......kc.........", "....kkkkkkkk......", "...kccccccccck....", "...kkkkkkkkkkk...."],
  mugEmpty: [".kkkkkkk...", "kwwwwwwwk..", "kwwwwwwwkkk", "kwwTTTwwk.k", "kwTwwwTwk.k", "kwwTwTwwkkk", "kwwwTwwwk..", "kwwwwwwwk..", ".kkkkkkk..."],
});

// The printer on the desk (a Bambu Lab X1C with its AMS on top) and the monitor
Object.assign(PX_PALETTE, {"8": "#17181B", "1": "#2F3136", "2": "#4B4E56", "4": "#3A4450", "5": "#8FD0F0", "6": "#16222E", "7": "#1A1A1D", "9": "#D5D9DE", "V": "#7A8089", "W": "#9AA0A8", "I": "#3B3D42", "J": "#62656C"});
Object.assign(PX_SPRITES, {
  x1cFrame: ["..888888888888888888888888888888..", "..822222222222222222222222222228..", "..814444444444444444444444444418..", "..8144TTTT44BBBB44ZZZZ44SSSS4418..", "..8144T77T44B77B44Z77Z44S77S4418..", "..8144TTTT44BBBB44ZZZZ44SSSS4418..", "..814444444444444444444444444418..", "..811111111111111111111111111118..", "..888888888888888888888888888888..", "8888888888888888888888888888888888", "8222222222222222222222222222222228", "8211111111111111111111111111111118", "8218888888888888888888888888888118", "8218..........................8118", "8218..........................8118", "8218..........................8118", "8218..........................8118", "8218..........................8118", "8218..........................8118", "8218..........................8118", "8218..........................8118", "8218..........................8118", "8218..........................8118", "8218..........................8118", "8218..........................8118", "8218..........................8118", "8218..........................8118", "8218..........................8118", "8218..........................8118", "8218..........................8118", "8218..........................8118", "8218..........................8118", "8218..........................8118", "8218..........................8118", "8218..........................8118", "8218..........................8118", "8218..........................8118", "8218888888888888888888888888888118", "8211111111111111111111111111111118", "82166666611111111111111111111y1118", "8216555561111111111111111111111118", "8216666661111111111111111111111118", "8888888888888888888888888888888888"],
  x1cBed: ["JIIJIIIJIIIIJIIIJIIIIJIIJI", "88888888888888888888888888", "....8V8............8V8...."],
  x1cHead: [".8888.", "899998", "89VV98", "899998", ".8VV8.", "..88.."],
  x1cRod: ["WWWWWWWWWWWWWWWWWWWWWWWWWW"],
  monitor: [".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.", "kcccccccccccccccccccccccccccccccccccccccccccccccccccccccccck", "kcccccccccccccccccccccccccccccccccccccccccccccccccccccccccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kccc....................................................ccck", "kcccccccccccccccccccccccccccccccccccccccccccccccccccccccccck", "kcccccccccccccccccccccccccccknccccccccccccccccccccccccccccck", "kcccccccccccccccccccccccccccccccccccccccccccccccccccccccccck", ".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.", "..........................kcccck............................", "..........................kcccck............................", "..........................kcccck............................", "..........................kcccck............................", "..........................kcccck............................", "..........................kcccck............................", ".................kkkkkkkkkkkkkkkkkkkkkkkkkk.................", "................kcccccccccccccccccccccccccck................", "................kkkkkkkkkkkkkkkkkkkkkkkkkkkk................"],
});

// A cache of sprite markup, one per sprite and scale
const spriteCache = new Map();
function sprite(name, scale) {
  const key = name + '@' + scale;
  if (!spriteCache.has(key)) spriteCache.set(key, spriteSVG(name, scale));
  return spriteCache.get(key);
}

// ---------- pond tricks in the top bar ----------
function initPondControls() {
  document.querySelectorAll('[data-pond]').forEach(b => b.addEventListener('click', () => {
    const what = b.dataset.pond;
    if (what === 'feed') Bus.emit('pond:feed', { x: innerWidth * (0.3 + Math.random() * 0.4), y: innerHeight * (0.35 + Math.random() * 0.3), n: 6 });
    else Bus.emit('pond:form', what);
  }));
  // a sneeze anywhere makes the little bacteria by the section titles shiver
  Bus.on('sneeze', () => {
    document.querySelectorAll('.px-bug').forEach(b => { b.classList.remove('brr'); void b.offsetWidth; b.classList.add('brr'); });
  });
}

// ---------- the desk ----------
const KB_LAYOUT = [
  [['escape', 1, 'koi'], ['1'], ['2'], ['3'], ['4'], ['5'], ['6'], ['7'], ['8'], ['9'], ['0'], ['backspace', 2, 'mod']],
  [['tab', 1.5, 'mod'], ['q'], ['w'], ['e'], ['r'], ['t', 1, 'terra'], ['y'], ['u'], ['i'], ['o'], ['p'], ['\\', 1.5, 'mod']],
  [['capslock', 1.75, 'mod'], ['a', 1, 'sage'], ['s'], ['d'], ['f'], ['g', 1, 'ochre'], ['h'], ['j'], ['k'], ['l'], ['enter', 2.25, 'terra']],
  [['shift', 2.25, 'mod'], ['z'], ['x'], ['c', 1, 'blue'], ['v'], ['b'], ['n'], ['m'], ['shiftright', 3.75, 'mod']],
  [['control', 1.25, 'mod'], ['meta', 1.25, 'mod'], ['alt', 1.25, 'mod'], [' ', 6.25, 'space'], ['altright', 1.25, 'mod'], ['controlright', 1.75, 'mod']],
];
// A 60% keyboard, key by key, so each can go down when its letter is typed;
// A, T, C and G wear the nucleotide colours and Esc is a koi artisan cap.
function keyboardSVG() {
  const U = 4, W = 13 * U - 1 + 4, H = 5 * U - 1 + 5;
  const caps = [];
  KB_LAYOUT.forEach((row, r) => {
    let x = 2;
    row.forEach(([k, u = 1, kind = '']) => {
      const w = u * U - 1, y = 2 + r * U;
      let top = '#EFE9DC', front = '#CFC5B3';
      if (kind === 'mod') { top = '#A9B0BA'; front = '#7F8893'; }
      else if (kind === 'space') { top = '#D8D2C2'; front = '#B7AF9C'; }
      else if (['sage', 'terra', 'blue', 'ochre'].includes(kind)) { top = `var(--${kind})`; front = `var(--${kind}-ink)`; }
      const koi = kind === 'koi' ? `<rect x="${x + 1}" y="${y}" width="1" height="1" fill="#FFFDF7"/><rect x="${x}" y="${y + 1}" width="2" height="1" fill="#E9853C"/>` : '';
      caps.push(`<g class="key" data-k="${k}"><rect x="${x}" y="${y}" width="${w}" height="2" fill="${kind === 'koi' ? '#E9853C' : top}"/><rect x="${x}" y="${y + 2}" width="${w}" height="1" fill="${kind === 'koi' ? '#B35F22' : front}"/>${koi}</g>`);
      x += u * U;
    });
  });
  return `<svg class="kb" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">
    <rect x="0" y="0" width="${W}" height="${H}" rx="1" fill="#2E2925"/><rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="#3F4B5E"/>
    <rect x="1" y="${H - 2}" width="${W - 2}" height="1" fill="#2B3444"/>${caps.join('')}</svg>`;
}

const CRITTER_TYPES = {
  bacillus: { w: 20, h: 8, v: 0.4, label: 'The tuberculosis bacillus, the mascot. Press it for a fact.',
    faces: { idle: 'bacillus', blink: 'bacillusBlink', happy: 'bacillusHappy', mask: 'bacillusMask', worried: 'bacillusWorried', step: 'bacillus2' } },
  virus: { w: 16, h: 16, v: 0.55, label: 'SARS-CoV-2. Press it and stand back.',
    faces: { idle: 'virus', blink: 'virusBlink', happy: 'virusHappy', sneeze: 'virusSneeze', shock: 'virusShock' } },
  phage: { w: 13, h: 18, v: 0.45, label: 'A bacteriophage. Press it to make it jump.',
    faces: { idle: 'phage', blink: 'phageBlink', crouch: 'phageCrouch' } },
  mac: { w: 23, h: 17, v: 0.28, label: 'A macrophage. Press it: it is always hungry.',
    faces: { idle: 'mac', blink: 'macBlink', open: 'macOpen', happy: 'macHappy' } },
  virion: { w: 8, h: 8, v: 0.9, label: 'A brand new virion',
    faces: { idle: 'miniVirus' } },
};
const BACILLUS_FACTS = [
  'Mycobacterium tuberculosis. I divide once a day, no rush.',
  'Lineage 4, Euro-American. Nice to meet you.',
  'My cell wall is waxy. Very, very waxy.',
  'Polar is my best friend.',
  'Inside a macrophage? I can live with that.',
  'Nine lineages of us, and counting.',
];
const PRINTS = [
  { name: 'miniVirus', what: 'a tiny SARS-CoV-2', alive: true },
  { name: 'keycap', what: 'a koi keycap for the next keyboard', shelf: true },
];

function initBench() {
  const bench = document.getElementById('bench');
  if (!bench) return;
  const cast = document.getElementById('critters');
  const live = document.getElementById('benchLive');
  const shelf = document.getElementById('shelfItems');
  const kb = bench.querySelector('.thing--keyboard');
  const lamp = bench.querySelector('.thing--lamp');
  const mug = bench.querySelector('.thing--mug');
  const printer = bench.querySelector('.thing--printer');
  const jar = bench.querySelector('.thing--jar');
  const out = document.getElementById('termOut');
  const input = document.getElementById('termInput');
  const form = document.getElementById('termForm');
  let scale = innerWidth < 640 ? 2 : 4;
  let boost = 0, visible = false, last = 0, printing = false, printIdx = 0, shelfCount = 0;
  const critters = [];
  const tell = (text) => { live.textContent = text; };
  const now = () => performance.now();

  // the objects draw themselves
  const paint = () => {
    const ms = Math.max(3, scale);       // the monitor stays readable on a phone
    bench.style.setProperty('--px', scale + 'px');
    bench.style.setProperty('--mpx', ms + 'px');
    lamp.querySelector('.thing-sprite').innerHTML = sprite(isDark() ? 'lampOff' : 'lamp', scale);
    mug.querySelector('.thing-sprite').innerHTML = sprite(mug.classList.contains('empty') ? 'mugEmpty' : 'mug', scale);
    jar.querySelector('.thing-sprite').innerHTML = sprite('jar', scale);
    printer.querySelector('.printer-frame').innerHTML = sprite('x1cFrame', scale);
    printer.querySelector('.x1c-rod').innerHTML = sprite('x1cRod', scale);
    printer.querySelector('.printer-head').innerHTML = sprite('x1cHead', scale);
    printer.querySelector('.x1c-bed-plate').innerHTML = sprite('x1cBed', scale);
    bench.querySelector('.thing--monitor .thing-sprite').innerHTML = sprite('monitor', ms);
    kb.querySelector('.thing-sprite').innerHTML = keyboardSVG();
    critters.forEach(c => setFace(c, c.face, true));
    shelf.querySelectorAll('[data-shelf]').forEach(s => { s.innerHTML = sprite(s.dataset.shelf, scale); });
  };

  // ---- the microbes ----
  function setFace(c, face, force) {
    if (!force && c.face === face) return;
    c.face = face;
    c.sprite.innerHTML = sprite(c.t.faces[face] || c.t.faces.idle, c.type === 'virion' ? Math.max(2, scale - 1) : scale);
  }
  function bubble(c, text, ms = 2200) {
    c.bubble.textContent = text;
    c.bubble.hidden = false;
    clearTimeout(c.bubbleTimer);
    c.bubbleTimer = setTimeout(() => { c.bubble.hidden = true; }, ms);
  }
  function heart(c) {
    const h = document.createElement('span');
    h.className = 'bench-fx bench-fx--heart';
    h.innerHTML = typeof polarFxSVG === 'function' ? polarFxSVG('heart', 3) : '';
    h.style.left = `${c.x + c.t.w * scale / 2}px`;
    h.style.bottom = `${40 + c.lift + c.t.h * scale}px`;
    bench.appendChild(h);
    setTimeout(() => h.remove(), 1500);
  }
  function spawn(type, x, extra = {}) {
    const t = CRITTER_TYPES[type];
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `critter critter--${type}`;
    el.setAttribute('aria-label', t.label);
    el.innerHTML = '<span class="critter-sprite" aria-hidden="true"></span><span class="say" hidden></span>';
    cast.appendChild(el);
    const c = { type, t, el, sprite: el.firstChild, bubble: el.lastChild, x, dir: Math.random() < 0.5 ? -1 : 1,
      v: t.v * (0.8 + Math.random() * 0.4), mode: 'walk', until: now() + 1500 + Math.random() * 3000, face: '',
      faceBack: 0, lift: 0, vy: 0, blinkAt: now() + 1500 + Math.random() * 3000, born: now(), ...extra };
    setFace(c, 'idle', true);
    el.addEventListener('click', e => { e.stopPropagation(); poke(c); });
    critters.push(c);
    return c;
  }
  const find = (type) => critters.find(c => c.type === type);
  const width = () => bench.clientWidth;
  const cw = (c) => c.t.w * (c.type === 'virion' ? Math.max(2, scale - 1) : scale);
  const centre = (c) => c.x + cw(c) / 2;
  const hop = (c, v = 5) => { if (c.lift <= 0) c.vy = v; };
  const faceFor = (c, face, ms) => { setFace(c, face); c.faceBack = now() + ms; };
  const thingX = (el) => { const b = bench.getBoundingClientRect(), r = el.getBoundingClientRect(); return r.left - b.left + r.width / 2; };

  function sneeze(v) {
    faceFor(v, 'sneeze', 700);
    v.el.classList.add('puff');
    setTimeout(() => {
      v.el.classList.remove('puff');
      bubble(v, 'achoo!', 1400);
      // droplets and a brand new virion, off in the direction it faces
      for (let i = 0; i < 7; i++) {
        const d = document.createElement('span');
        d.className = 'bench-fx bench-fx--drop';
        d.style.left = `${centre(v) + v.dir * cw(v) / 2}px`;
        d.style.bottom = `${40 + v.lift + cw(v) * 0.4}px`;
        d.style.setProperty('--dx', `${v.dir * (30 + Math.random() * 70)}px`);
        d.style.setProperty('--dy', `${-20 + Math.random() * 50}px`);
        bench.appendChild(d);
        setTimeout(() => d.remove(), 900);
      }
      if (critters.filter(c => c.type === 'virion').length < 4) {
        const n = spawn('virion', centre(v), { dir: v.dir, mode: 'walk', expire: now() + 12000 });
        hop(n, 7);
      }
      Bus.emit('sneeze', { x: centre(v) });
      tell('SARS-CoV-2 sneezed out a new virion.');
    }, 650);
  }
  function engulf(m, prey) {
    faceFor(m, 'open', 500);
    m.el.classList.add('gulp');
    setTimeout(() => m.el.classList.remove('gulp'), 500);
    if (prey.type === 'virion') {
      prey.el.remove();
      critters.splice(critters.indexOf(prey), 1);
      setTimeout(() => { faceFor(m, 'happy', 1600); bubble(m, 'burp', 1200); }, 500);
      tell('The macrophage ate a virion.');
      return;
    }
    // the bacillus survives inside, as it does in the lung
    prey.mode = 'inside'; prey.host = m;
    prey.el.classList.add('inside');
    faceFor(prey, 'happy', 4000);
    setTimeout(() => bubble(prey, 'still alive in here!', 2200), 600);
    faceFor(m, 'happy', 4000);
    Bus.emit('bacillus:engulfed');
    tell('The macrophage swallowed the bacillus, and the bacillus is fine in there. Tuberculosis does that.');
    setTimeout(() => {
      m.el.classList.add('cough');
      setTimeout(() => m.el.classList.remove('cough'), 500);
      prey.mode = 'walk'; prey.host = null; prey.dir = m.dir; prey.x = centre(m) + m.dir * cw(m) * 0.4;
      prey.el.classList.remove('inside');
      hop(prey, 6);
      bubble(m, 'bleh', 1000);
    }, 4200);
  }

  // what each one does when pressed
  function poke(c) {
    if (c.mode === 'inside') { bubble(c, 'hi from in here!'); return; }
    if (c.type === 'virus') sneeze(c);
    else if (c.type === 'bacillus') {
      hop(c, 5); faceFor(c, 'happy', 1600);
      bubble(c, BACILLUS_FACTS[(c.fact = ((c.fact ?? -1) + 1) % BACILLUS_FACTS.length)], 3000);
      tell(BACILLUS_FACTS[c.fact]);
      // the macrophage takes an interest
      const m = find('mac');
      if (m && Math.random() < 0.5 && m.mode !== 'chase') { m.mode = 'chase'; m.prey = c; m.until = now() + 6000; bubble(m, '!', 900); }
    } else if (c.type === 'phage') {
      faceFor(c, 'crouch', 250);
      setTimeout(() => {
        hop(c, 11);
        // land on the bacillus if it is close by, and ride along
        const b = find('bacillus');
        if (b && b.mode !== 'inside' && Math.abs(centre(b) - centre(c)) < 220) { c.mode = 'jumpTo'; c.target = b; }
        bubble(c, 'boing', 900);
      }, 250);
    } else if (c.type === 'mac') {
      const prey = critters.filter(o => o.type === 'virion')[0] || critters.find(o => o.type === 'bacillus' && o.mode !== 'inside');
      if (prey) { c.mode = 'chase'; c.prey = prey; c.until = now() + 7000; faceFor(c, 'open', 600); bubble(c, 'nom?', 1200); }
      else { faceFor(c, 'open', 800); bubble(c, 'hungry', 1200); }
    } else if (c.type === 'virion') {
      hop(c, 6); bubble(c, 'hi', 700);
    }
  }

  // ---- the loop ----
  function step(dt, ts) {
    const k = animSpeed * 2 * (boost > ts ? 2.4 : 1);
    const W = width();
    critters.slice().forEach(c => {
      // gravity for hops
      if (c.lift > 0 || c.vy) {
        c.lift += c.vy * dt; c.vy -= 0.55 * dt;
        if (c.lift <= 0) {
          c.lift = 0; c.vy = 0;
          if (c.mode === 'jumpTo') {
            const b = c.target;
            if (b && Math.abs(centre(b) - centre(c)) < cw(b) * 0.7) { c.mode = 'ride'; c.until = ts + 3500; bubble(b, 'hey!', 1000); faceFor(b, 'worried', 1200); }
            else c.mode = 'walk';
          }
          if (c.type === 'phage' && c.mode !== 'ride') critters.forEach(o => { if (o !== c && o.mode === 'walk' && Math.abs(centre(o) - centre(c)) < 120) hop(o, 3); });
        }
      }
      if (c.faceBack && ts > c.faceBack) { c.faceBack = 0; setFace(c, c.maskUntil > ts ? 'mask' : 'idle'); }
      if (c.face === 'idle' && ts > c.blinkAt && c.t.faces.blink) { faceFor(c, 'blink', 140); c.blinkAt = ts + 2500 + Math.random() * 3500; }
      if (c.expire && ts > c.expire) { c.el.remove(); critters.splice(critters.indexOf(c), 1); return; }
      if (k === 0) return;
      if (c.mode === 'inside') { c.x = centre(c.host) - cw(c) / 2; c.lift = cw(c.host) * 0.12; return; }
      if (c.mode === 'ride') {
        const b = c.target;
        c.x = centre(b) - cw(c) / 2; c.lift = b.t.h * scale - 2;
        if (ts > c.until || !b || b.mode === 'inside') { c.mode = 'walk'; hop(c, 5); c.lift = Math.max(c.lift, 1); }
        return;
      }
      if (c.mode === 'jumpTo' && c.target) { const d = centre(c.target) - centre(c); c.x += Math.sign(d) * Math.min(Math.abs(d), 3.2 * dt); c.dir = Math.sign(d) || c.dir; return; }
      if (c.mode === 'chase') {
        const p = c.prey;
        if (!p || !critters.includes(p) || p.mode === 'inside' || ts > c.until) { c.mode = 'walk'; return; }
        const d = centre(p) - centre(c);
        c.dir = Math.sign(d) || c.dir;
        if (Math.abs(d) < cw(c) * 0.45) { c.mode = 'walk'; engulf(c, p); return; }
        c.x += c.dir * c.v * 2.2 * k * dt;
      } else if (c.mode === 'watch') {
        const d = c.watchX - centre(c);
        if (Math.abs(d) > 8) { c.dir = Math.sign(d); c.x += c.dir * c.v * 1.6 * k * dt; }
        else { c.dir = Math.sign(thingX(printer) - centre(c)) || c.dir; }
      } else if (c.mode === 'walk') {
        c.x += c.dir * c.v * k * dt;
        if (c.type === 'virion' && c.lift === 0 && Math.random() < 0.02 * dt) hop(c, 4 + Math.random() * 3);
        if (ts > c.until) { c.mode = 'idle'; c.until = ts + 900 + Math.random() * 2200; }
      } else if (c.mode === 'idle' && ts > c.until) {
        c.mode = 'walk'; c.until = ts + 2000 + Math.random() * 4000;
        if (Math.random() < 0.5) c.dir *= -1;
      }
      const max = W - cw(c);
      if (c.x < 0) { c.x = 0; c.dir = 1; } else if (c.x > max) { c.x = max; c.dir = -1; }
      // a step every few frames for the bacillus
      if (c.type === 'bacillus' && c.mode === 'walk' && c.face === 'idle' && Math.floor(ts / 260) % 2) setFace(c, 'step');
      else if (c.type === 'bacillus' && c.face === 'step' && (c.mode !== 'walk' || !(Math.floor(ts / 260) % 2))) setFace(c, 'idle');
    });
  }
  function render() {
    critters.forEach(c => {
      c.el.style.transform = `translate(${Math.round(c.x)}px, ${-Math.round(c.lift)}px)`;
      c.sprite.style.transform = c.dir < 0 ? 'scaleX(-1)' : '';
    });
  }
  function frame(ts) {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) { last = ts; return; }
    if (ts - last < 30) return;
    const dt = last ? Math.min((ts - last) / 16.667, 3) : 1;
    last = ts;
    step(dt, ts);
    render();
  }

  // ---- the things on the desk ----
  lamp.addEventListener('click', () => {
    document.getElementById('darkToggle')?.click();
    tell(isDark() ? 'Lamp off: night mode.' : 'Lamp on: day mode.');
  });
  mug.addEventListener('click', () => {
    if (mug.classList.contains('empty')) { tell('The mug is empty. It refills itself in a moment.'); return; }
    mug.classList.add('sip', 'empty');
    setTimeout(() => mug.classList.remove('sip'), 1600);
    paint();
    Bus.emit('caffeine', 6000);
    tell('Coffee for everyone: the microbes, the koi and Polar speed up for a while.');
    setTimeout(() => { mug.classList.remove('empty'); paint(); }, 15000);
  });
  jar.addEventListener('click', () => {
    jar.classList.remove('shake'); void jar.offsetWidth; jar.classList.add('shake');
    const r = jar.getBoundingClientRect();
    Bus.emit('pond:feed', { x: r.left + r.width / 2, y: Math.max(120, r.top - 30), n: 6 });
    tell('A pinch of nucleotides for the koi.');
  });
  printer.addEventListener('click', () => {
    if (printing) { tell('The printer is busy. Patience: layer by layer.'); return; }
    const job = PRINTS[printIdx++ % PRINTS.length];
    printing = true;
    const bed = printer.querySelector('.printer-print');
    bed.innerHTML = sprite(job.name, scale);
    printer.classList.add('printing');
    tell(`Printing ${job.what}.`);
    // everyone comes to watch
    critters.forEach((c, i) => { if (c.mode === 'walk' || c.mode === 'idle') { c.mode = 'watch'; c.watchX = thingX(printer) + (i - 1.5) * 34; } });
    setTimeout(() => {
      printer.classList.remove('printing');
      printer.classList.add('done');
      critters.forEach(c => { if (c.mode === 'watch') { c.mode = 'walk'; faceFor(c, 'happy', 1200); } });
      setTimeout(() => {
        printer.classList.remove('done');
        bed.innerHTML = '';
        if (job.alive) {
          const v = spawn('virion', thingX(printer) - 8, { mode: 'walk', expire: now() + 15000 });
          hop(v, 8); bubble(v, 'alive!', 1200);
          tell('The tiny SARS-CoV-2 came alive and hopped off the printer.');
        } else if (shelfCount < 6) {
          const s = document.createElement('span');
          s.className = 'shelf-item'; s.dataset.shelf = job.name; s.innerHTML = sprite(job.name, scale);
          shelf.appendChild(s); shelfCount++;
          tell('The koi keycap went on the shelf.');
        }
        printing = false;
      }, 900);
    }, 4600);
  });

  // ---- the console under the desk, and the monitor ----
  const print = (line, cls = '') => {
    const li = document.createElement('li');
    if (cls) li.className = cls;
    li.textContent = line;
    out.appendChild(li);
    while (out.children.length > 6) out.firstChild.remove();
  };
  // the monitor shows a sequencer read scrolling past, and each answer, big
  const screen = bench.querySelector('.screen');
  const seqBox = screen.querySelector('.screen-seq');
  const sayBox = screen.querySelector('.screen-say');
  const seqLine = () => {
    const span = document.createElement('span');
    let html = '';
    for (let i = 0; i < 22; i++) { const b = 'ACGT'[Math.floor(Math.random() * 4)]; html += `<b class="${b}">${b}</b>`; }
    span.innerHTML = html;
    return span;
  };
  for (let i = 0; i < 9; i++) seqBox.appendChild(seqLine());
  setInterval(() => {
    if (animSpeed === 0 || document.hidden || !visible) return;
    seqBox.appendChild(seqLine());
    while (seqBox.children.length > 9) seqBox.firstChild.remove();
  }, 380);
  let sayTimer = 0;
  const say = (cmd, reply) => {
    sayBox.innerHTML = '';
    const c = document.createElement('small'); c.textContent = '$ ' + cmd;
    const r = document.createElement('span'); r.textContent = reply;
    sayBox.append(c, r);
    screen.classList.add('saying');
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => screen.classList.remove('saying'), 4200);
  };
  const press = (key) => {
    const k = kb.querySelector(`.key[data-k="${CSS.escape(key)}"]`);
    if (!k) return;
    k.classList.add('down');
    setTimeout(() => k.classList.remove('down'), 120);
  };
  const COMMANDS = {
    help: () => 'feed dna bacillus virus plasmid coffee print sneeze polar lamp ls whoami clear',
    dna: () => { Bus.emit('pond:form', 'dna'); return 'the koi are on it'; },
    bacillus: () => { Bus.emit('pond:form', 'bacillus'); return 'one tubercle bacillus, in koi'; },
    virus: () => { Bus.emit('pond:form', 'virus'); return 'SARS-CoV-2, spikes and all'; },
    plasmid: () => { Bus.emit('pond:form', 'plasmid'); return 'a plasmid, coming up'; },
    feed: () => { Bus.emit('pond:feed', {}); return 'nucleotides on the water'; },
    coffee: () => { mug.click(); return 'brewing'; },
    print: () => { printer.click(); return 'sending to the printer'; },
    sneeze: () => { const v = find('virus'); if (v) sneeze(v); return 'bless you'; },
    polar: () => { Bus.emit('polar:come', '.thing--monitor'); return 'chirp!'; },
    lamp: () => { lamp.click(); return isDark() ? 'lights on' : 'lights off'; },
    ls: () => 'papers/  tools/  drawings/  koi/  polar/',
    whoami: () => 'paula: bioinformatician, keyboard builder, koi feeder',
    clear: () => { out.innerHTML = ''; return null; },
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const cmd = input.value.trim();
    input.value = '';
    if (!cmd) return;
    print('$ ' + cmd, 'cmd');
    const word = cmd.toLowerCase().split(/\s+/)[0];
    let reply;
    if (word === 'sudo') reply = 'nice try';
    else if (COMMANDS[word]) reply = COMMANDS[word]();
    else reply = `command not found: ${word} (try help)`;
    if (reply) { print(reply); say(cmd, reply); }
  });
  input.addEventListener('keydown', (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase();
    press(key === ' ' ? ' ' : key);
  });
  input.addEventListener('focus', () => kb.classList.add('lit'));
  input.addEventListener('blur', () => kb.classList.remove('lit'));
  kb.addEventListener('click', () => { input.focus(); press('enter'); });
  bench.querySelector('.thing--monitor').addEventListener('click', () => input.focus());

  // ---- what the rest of the page does to the desk ----
  Bus.on('sneeze', () => {
    const b = find('bacillus');
    if (b && b.mode !== 'inside') { b.maskUntil = now() + 6000; faceFor(b, 'mask', 6000); bubble(b, '!', 900); }
    const p = find('phage'), v = find('virus');
    if (p && v && p.mode === 'walk') { p.dir = Math.sign(centre(p) - centre(v)) || 1; hop(p, 6); }
    const m = find('mac'), n = critters.find(c => c.type === 'virion');
    if (m && n && m.mode !== 'chase') { m.mode = 'chase'; m.prey = n; m.until = now() + 7000; bubble(m, 'ooh', 900); }
  });
  Bus.on('caffeine', (ms) => {
    boost = now() + (ms || 6000);
    critters.forEach((c, i) => { faceFor(c, 'happy', 1500); if (i === 0) bubble(c, 'coffee!', 1200); });
  });
  Bus.on('polar:landed', ({ el }) => {
    if (!el || !bench.contains(el)) return;
    const b = find('bacillus');
    if (b) { bubble(b, 'hi Polar!', 1600); heart(b); faceFor(b, 'happy', 1600); }
  });
  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.addEventListener('resize', () => {
    const s = innerWidth < 640 ? 2 : 4;
    if (s !== scale) { scale = s; paint(); }
  });
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es.some(e => e.isIntersecting); }).observe(bench);
  else visible = true;

  // the cast
  const W = width() || 900;
  spawn('bacillus', W * 0.18);
  spawn('virus', W * 0.42);
  spawn('phage', W * 0.62);
  spawn('mac', W * 0.8);
  paint();
  print('type help, then press enter');
  requestAnimationFrame(frame);
  // for the page's own tests
  bench.cast = critters;
}

// ---------- a coffee on the letter ----------
// A café con leche left on the letter: each sip wakes everyone up a little,
// and after a few the cup comes back with another drink.
const DRINKS = [['cafeConLeche', 'café con leche'], ['cappuccino', 'cappuccino'], ['latte', 'latte'], ['horchata', 'horchata']];
function initLetterCup() {
  const cup = document.getElementById('letterCup');
  if (!cup) return;
  const art = cup.querySelector('.cup-sprite');
  let drink = 0, sips = 0;
  const show = () => {
    art.innerHTML = sprite(DRINKS[drink][0], 3);
    cup.setAttribute('aria-label', `A ${DRINKS[drink][1]} on the letter. Take a sip`);
  };
  cup.addEventListener('click', () => {
    cup.classList.remove('sip'); void cup.offsetWidth; cup.classList.add('sip');
    Bus.emit('caffeine', 3000);
    if (++sips >= 3) { sips = 0; drink = (drink + 1) % DRINKS.length; setTimeout(show, 500); }
  });
  show();
}
