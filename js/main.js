// ============================================================
// Behaviour and live data: ORCID, Semantic Scholar, GitHub and
// Bioconda download counts. Content lives in content.js and the
// drawings in art.js.
// ============================================================

const ORCID_API = `https://pub.orcid.org/v3.0/${SITE.orcid}/works`;
const S2_API = 'https://api.semanticscholar.org/graph/v1/paper/DOI:';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 1 day

// ==================== CACHE HELPERS ====================
function cacheGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(key); return null; }
    return data;
  } catch { return null; }
}
function cacheSet(key, data) {
  try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch {}
}
function cacheTimestamp(key) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw).ts : null; } catch { return null; }
}
function cacheInvalidate(...keys) { keys.forEach(k => { try { localStorage.removeItem(k); } catch {} }); }

function showCacheInfo(elementId, cacheKeys, refreshCallback) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const ts = cacheTimestamp(cacheKeys[0]);
  if (!ts) { el.innerHTML = '<i class="fas fa-cloud-arrow-down" aria-hidden="true"></i> fetched just now'; return; }
  const date = new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const hours = Math.max(1, Math.ceil((ts + CACHE_TTL - Date.now()) / 3600000));
  el.innerHTML = `<i class="fas fa-floppy-disk" aria-hidden="true"></i> saved ${date}, refreshes in ${hours}h <button type="button" class="refresh-btn" id="refresh_${elementId}">refresh</button>`;
  document.getElementById(`refresh_${elementId}`).addEventListener('click', () => {
    cacheInvalidate(...cacheKeys);
    el.textContent = 'refreshing...';
    refreshCallback();
  });
}

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function animateNumber(elementId, target, format = n => n.toLocaleString('en-US')) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (PREFERS_REDUCED_MOTION) { el.textContent = format(target); return; }
  const start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / 1400, 1);
    el.textContent = format(Math.round(target * (1 - Math.pow(1 - t, 4))));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ==================== INIT ====================
// Each part of the page starts on its own, so one that fails (an old
// browser, or a file a cache kept from an older version) cannot stop
// the ones after it, Polar among them
const PAGE_PARTS = [
  'injectSvgDefs', 'fillSprites', 'renderSelectedWork', 'renderFeaturedTools',
  'renderBlogPosts', 'renderCareerChromosome', 'renderTopicTree',
  'initNavigation', 'initDarkMode', 'initSpeedControl', 'initExpandableCards',
  'initKoiPond', 'initPondControls', 'initBench', 'initLetterCup', 'initPolar',
  'initHelices', 'initGenomeRuler', 'scatterBugs', 'initStatBubbles',
  'initPubFilters', 'fetchPublications', 'fetchGitHubRepos',
  'fetchToolDownloads',
];

document.addEventListener('DOMContentLoaded', () => {
  PAGE_PARTS.forEach(name => {
    try { window[name](); } catch (err) { console.error(`${name} did not start:`, err); }
  });
});

// ==================== NAVIGATION ====================
// One page: anchors scroll natively (smooth, below the fixed header). The
// highlighted section follows the scroll. Content that loads later can push
// a #target down, so the page scrolls to it again unless the reader already
// moved on.
let readerScrolled = false;

function rescrollToHash() {
  if (readerScrolled || !location.hash) return;
  const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (el) el.scrollIntoView({ block: 'start' });
}

function initNavigation() {
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navLinks');
  const links = [...document.querySelectorAll('.nav-link')];
  const sections = [...document.querySelectorAll('main > section[id]')];

  const closeMenu = () => {
    navMenu.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  };
  navToggle.addEventListener('click', () => {
    const open = !navMenu.classList.contains('open');
    navMenu.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', (e) => {
    if (e.target.closest('.nav-link')) closeMenu();
    else if (!e.target.closest('.topbar')) closeMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('open')) { closeMenu(); navToggle.focus(); }
  });

  ['wheel', 'touchmove', 'keydown', 'mousedown'].forEach(ev =>
    window.addEventListener(ev, () => { readerScrolled = true; }, { passive: true, once: true }));
  window.addEventListener('hashchange', () => { readerScrolled = true; });
  window.addEventListener('load', rescrollToHash);

  let ticking = false;
  const spy = () => {
    ticking = false;
    const probe = window.scrollY + window.innerHeight * 0.33;
    let current = sections[0];
    for (const s of sections) if (s.offsetTop <= probe) current = s;
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = sections[sections.length - 1];
    links.forEach(l => {
      const on = l.getAttribute('href') === '#' + current.id;
      l.classList.toggle('active', on);
      if (on) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
    });
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
  spy();
}

// ==================== DARK MODE ====================
// Follows the system until the reader picks one with the button.
function initDarkMode() {
  const toggle = document.getElementById('darkToggle');
  if (!toggle) return;
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch {}
  const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  // A page embedded somewhere that already set a theme keeps it
  const stamped = document.documentElement.getAttribute('data-theme');
  const apply = (dark) => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    toggle.querySelector('i').className = dark ? 'fas fa-sun' : 'fas fa-moon';
    toggle.setAttribute('aria-pressed', dark ? 'true' : 'false');
  };
  apply(saved ? saved === 'dark' : stamped ? stamped === 'dark' : systemDark);
  toggle.addEventListener('click', () => {
    const dark = document.documentElement.getAttribute('data-theme') !== 'dark';
    apply(dark);
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch {}
  });
}

// ==================== ANIMATION SPEED ====================
function initSpeedControl() {
  const control = document.getElementById('speedControl');
  const toggle = document.getElementById('speedToggle');
  const slider = document.getElementById('speedSlider');
  const label = document.getElementById('speedLabel');
  if (!control || !toggle || !slider) return;

  // CSS animations (the scattered bacteria) pause with the class
  const show = () => {
    label.textContent = animSpeed === 0 ? 'off' : animSpeed.toFixed(1) + 'x';
    document.documentElement.classList.toggle('anim-off', animSpeed === 0);
  };
  slider.value = Math.round(animSpeed * 100);
  tickerState.speed = 0.5 * animSpeed;
  show();

  const setOpen = (open) => {
    control.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  toggle.addEventListener('click', () => setOpen(!control.classList.contains('open')));
  document.addEventListener('click', (e) => { if (!e.target.closest('.speed-control')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && control.classList.contains('open')) { setOpen(false); toggle.focus(); }
  });
  slider.addEventListener('input', () => {
    animSpeed = parseInt(slider.value, 10) / 100;
    tickerState.speed = 0.5 * animSpeed;
    show();
  });
}

// ==================== EXPANDABLE HELIX CARDS ====================
function initExpandableCards() {
  document.querySelectorAll('[data-expandable]').forEach(card => {
    const btn = card.querySelector('.helix-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const open = !card.classList.contains('expanded');
      card.classList.toggle('expanded', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', btn.getAttribute('aria-label').replace(open ? 'Expand' : 'Collapse', open ? 'Collapse' : 'Expand'));
    });
  });
}

// ==================== SELECTED WORK ====================
const PUB_ROLES = Object.fromEntries(SELECTED_WORK.map(w => [w.doi.toLowerCase(), w.role]));
const PUB_PATHOGEN = Object.fromEntries(SELECTED_WORK.map(w => [w.doi.toLowerCase(), w.pathogen]));
const PREPRINT_SERVERS = Object.fromEntries(SELECTED_WORK.filter(w => w.server).map(w => [w.doi.toLowerCase(), w.server]));
const pubRole = (doi) => (doi ? PUB_ROLES[doi.toLowerCase()] || null : null);
const preprintServer = (doi) => (doi && PREPRINT_SERVERS[doi.toLowerCase()]) || '';

function renderSelectedWork() {
  const list = document.getElementById('selectedList');
  if (!list) return;
  list.innerHTML = SELECTED_WORK.map(w => {
    const color = w.pathogen === 'cov' ? 'var(--sage)' : 'var(--terra)';
    const links = [
      `<a class="chip" style="--c:${color}" href="https://doi.org/${w.doi}" target="_blank" rel="noopener"><i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i> ${w.preprint ? 'preprint' : 'paper'}</a>`,
      ...(w.links || []).map(l => `<a class="chip" style="--c:${color}" href="${l.url}" target="_blank" rel="noopener"><i class="${l.icon}" aria-hidden="true"></i> ${l.label.toLowerCase()}</a>`),
    ].join('');
    return `
      <li class="entry">
        <span class="entry-year">${w.year}</span>
        <div>
          <p class="entry-venue">${w.venue}</p>
          <h4>${w.title}</h4>
          <p class="entry-summary">${w.summary}</p>
          <div class="chips">${links}</div>
        </div>
        <span class="stamp">${w.role}</span>
      </li>`;
  }).join('');
}

// ==================== FEATURED TOOLS ====================
const LANG_COLORS = {
  Python: '#3572A5', R: '#198CE7', HTML: '#E34C26', JavaScript: '#C9A227', Shell: '#5FA83F',
  Jupyter: '#DA5B0B', Nextflow: '#3AA876', Perl: '#0298c3', CSS: '#563d7c', Dockerfile: '#384d54',
  Makefile: '#427819', TypeScript: '#3178c6', Rust: '#C7825A',
};
const TOOL_DL_CACHE_KEY = 'tool_downloads_v1';
let toolDownloads = {};

function renderFeaturedTools() {
  const grid = document.getElementById('toolGrid');
  if (!grid) return;
  grid.innerHTML = FEATURED_TOOLS.map(t => {
    const color = LANG_COLORS[t.lang] || '#8b8b8b';
    const links = [];
    if (t.bioconda) links.push(`<a class="tool-link" href="https://anaconda.org/bioconda/${t.bioconda}" target="_blank" rel="noopener" title="conda install -c bioconda ${t.bioconda}"><i class="fas fa-box" aria-hidden="true"></i> Bioconda</a>`);
    if (t.cran) links.push(`<a class="tool-link" href="https://cran.r-project.org/package=${t.cran}" target="_blank" rel="noopener" title="install.packages(&quot;${t.cran}&quot;)"><i class="fab fa-r-project" aria-hidden="true"></i> CRAN</a>`);
    if (t.docs) links.push(`<a class="tool-link" href="${t.docs}" target="_blank" rel="noopener"><i class="fas fa-book" aria-hidden="true"></i> Docs</a>`);
    if (t.repo) links.push(`<a class="tool-link" href="${t.repo}" target="_blank" rel="noopener"><i class="fab fa-github" aria-hidden="true"></i> Code</a>`);
    return `
      <article class="tool-card">
        <div class="tool-head">
          <h4 class="tool-name">${t.name}</h4>
          <span class="tool-head-meta">
            ${t.bioconda ? `<span class="tool-dl" data-pkg="${t.bioconda}"></span>` : ''}
            <span class="tool-lang"><span class="lang-dot" style="background:${color}"></span>${t.lang}</span>
          </span>
        </div>
        <span class="tool-tag">${t.tag}</span>
        <p class="tool-desc">${t.desc}</p>
        <div class="tool-foot">${links.join('')}</div>
      </article>`;
  }).join('');
}

// Shields.io serves Bioconda download counts as CORS-enabled JSON ("3.7k").
function parseCompactCount(s) {
  const m = /^(\d+(?:\.\d+)?)([kMG]?)$/.exec(String(s || '').trim());
  if (!m) return null;
  return parseFloat(m[1]) * { '': 1, k: 1e3, M: 1e6, G: 1e9 }[m[2]];
}

async function fetchToolDownloads() {
  const pkgs = FEATURED_TOOLS.filter(t => t.bioconda).map(t => t.bioconda);
  let data = cacheGet(TOOL_DL_CACHE_KEY);
  if (!data) {
    data = {};
    await Promise.all(pkgs.map(async pkg => {
      try {
        const res = await fetch(`https://img.shields.io/conda/dn/bioconda/${pkg}.json`);
        if (!res.ok) return;
        const j = await res.json();
        const value = j.value || j.message;
        if (parseCompactCount(value) !== null) data[pkg] = value;
      } catch { /* leave the badge without a number */ }
    }));
    if (Object.keys(data).length === pkgs.length) cacheSet(TOOL_DL_CACHE_KEY, data);
  }
  toolDownloads = data;

  let total = 0;
  pkgs.forEach(pkg => {
    if (!data[pkg]) return;
    total += parseCompactCount(data[pkg]);
    const el = document.querySelector(`.tool-dl[data-pkg="${pkg}"]`);
    if (el) {
      el.innerHTML = `${spriteSVG('download', 2)}${data[pkg]}`;
      el.title = `${data[pkg]} downloads from Bioconda`;
      el.setAttribute('aria-label', `${data[pkg]} downloads from Bioconda`);
    }
  });

  // Only claim a total when every package answered; otherwise the text
  // written in the HTML stays.
  if (Object.keys(data).length === pkgs.length && total > 0) {
    const approx = Math.round(total / 100) * 100;
    const words = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
    const focus = document.getElementById('focusDownloads');
    if (focus) focus.textContent = `about ${approx.toLocaleString('en-US')}`;
    const summary = document.getElementById('toolsSummary');
    if (summary) summary.innerHTML = `${words[pkgs.length] || pkgs.length} tools on <a href="https://bioconda.github.io/" target="_blank" rel="noopener">Bioconda</a>, downloaded about ${approx.toLocaleString('en-US')} times, and one R package on <a href="https://cran.r-project.org/package=mycolorsTB" target="_blank" rel="noopener">CRAN</a>.`;
    statData.downloads = approx;
    // same compact style as the per-tool counts from shields ("3.7k")
    animateNumber('statDownloads', approx, n => (n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)));
  } else {
    statData.downloadsFailed = true;
  }
}

// ==================== NEWS ====================
const NEWS_COLORS = { Paper: ['var(--sage)', 'var(--sage-ink)'], Preprint: ['var(--blue)', 'var(--blue-ink)'], Update: ['var(--ochre)', 'var(--ochre-ink)'] };

function renderBlogPosts() {
  const container = document.getElementById('blogList');
  if (!container) return;
  container.innerHTML = BLOG_POSTS.map(post => {
    const d = new Date(post.date + 'T00:00:00');
    const date = d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    const [c, ink] = NEWS_COLORS[post.category] || ['var(--terra)', 'var(--terra-ink)'];
    const links = (post.links || []).map(l =>
      `<a class="chip" style="--c:${c}" href="${l.url}" target="_blank" rel="noopener"><i class="${l.icon}" aria-hidden="true"></i> ${l.label}</a>`).join('');
    return `
      <article class="diary-entry" style="--c:${c};--c-ink:${ink}">
        <div class="diary-top">
          <time class="diary-date" datetime="${post.date}">${date}</time>
          <span class="diary-cat">${post.category}</span>
        </div>
        <h3>${post.title}</h3>
        <p>${post.body}</p>
        ${links ? `<div class="chips">${links}</div>` : ''}
      </article>`;
  }).join('');
}

// ==================== STAT BUBBLES ====================
let statData = { pubs: 0, citations: 0, pathogens: [], langs: [], downloads: 0 };
let pubLoadFailed = false;
let ghLoadFailed = false;
let activeBubble = null;

const PATHOGEN_ICONS = {
  'SARS-CoV-2': 'fa-virus', 'M. tuberculosis': 'fa-bacterium', 'M. africanum': 'fa-bacterium', 'M. bovis': 'fa-bacterium',
  'Mycobacterium spp.': 'fa-bacterium', 'P. algeriensis': 'fa-bacterium', 'M. brumae': 'fa-bacterium',
};
const bubbleWaiting = (failed, source) => `<div class="stat-bubble-sub">${failed ? `${source} is not answering right now. Try again later.` : 'loading...'}</div>`;

function buildBubbleHTML(type) {
  const title = (icon, text) => `<div class="stat-bubble-title"><i class="fas ${icon}" aria-hidden="true"></i> ${text}</div>`;
  if (type === 'pubs') return title('fa-file-lines', 'publications') + `<div class="stat-bubble-big">${statData.pubs || '--'}</div><div class="stat-bubble-sub">works on ORCID, ${SELECTED_WORK.length} led by me</div>`;
  if (type === 'citations') return title('fa-quote-right', 'citations') + `<div class="stat-bubble-big">${statData.citations || '--'}</div><div class="stat-bubble-sub">counted by Semantic Scholar</div>`;
  if (type === 'downloads') {
    const rows = FEATURED_TOOLS.filter(t => t.bioconda && toolDownloads[t.bioconda]).map(t => `<span>${t.name}</span><span>${toolDownloads[t.bioconda]}</span>`).join('');
    return title('fa-download', 'Bioconda downloads') + (rows ? `<div class="stat-bubble-rows">${rows}</div>` : bubbleWaiting(statData.downloadsFailed, 'Bioconda'));
  }
  if (type === 'pathogens') {
    const tags = statData.pathogens.length
      ? statData.pathogens.map(p => `<span class="stat-bubble-tag"><i class="fas ${PATHOGEN_ICONS[p] || 'fa-disease'}" aria-hidden="true"></i> ${p}</span>`).join('')
      : bubbleWaiting(pubLoadFailed, 'ORCID');
    return title('fa-virus', 'pathogens in my papers') + `<div class="stat-bubble-tags">${tags}</div>`;
  }
  if (type === 'langs') {
    const tags = statData.langs.length
      ? statData.langs.map(l => `<span class="stat-bubble-tag"><span class="stat-bubble-dot" style="background:${LANG_COLORS[l] || '#8b8b8b'}"></span> ${l}</span>`).join('')
      : bubbleWaiting(ghLoadFailed, 'GitHub');
    return title('fa-code', 'languages in my repos') + `<div class="stat-bubble-tags">${tags}</div>`;
  }
  return '';
}

function closeBubble() {
  if (!activeBubble) return;
  const b = activeBubble;
  activeBubble = null;
  b.classList.remove('visible');
  setTimeout(() => b.remove(), 250);
}

function openBubble(card) {
  const bubble = document.createElement('div');
  bubble.className = 'stat-bubble';
  bubble.dataset.stat = card.dataset.stat;
  bubble.setAttribute('role', 'status');
  bubble.innerHTML = buildBubbleHTML(card.dataset.stat);
  bubble.addEventListener('click', e => e.stopPropagation());
  document.body.appendChild(bubble);
  const r = card.getBoundingClientRect();
  const half = bubble.offsetWidth / 2;
  bubble.style.left = Math.min(Math.max(r.left + r.width / 2, half + 8), window.innerWidth - half - 8) + 'px';
  bubble.style.top = r.top + 'px';
  activeBubble = bubble;
  requestAnimationFrame(() => requestAnimationFrame(() => bubble.classList.add('visible')));
}

function initStatBubbles() {
  document.querySelectorAll('.stat[data-stat]').forEach(card => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasOpen = activeBubble && activeBubble.dataset.stat === card.dataset.stat;
      closeBubble();
      if (!wasOpen) openBubble(card);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });
  document.addEventListener('click', () => closeBubble());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeBubble(); });
  window.addEventListener('scroll', () => closeBubble(), { passive: true });
}

// ==================== PATHOGENS & TOPICS ====================
const PATHOGEN_PATTERNS = [
  { pattern: /sars.?cov.?2|covid.?19|coronavirus/i, name: 'SARS-CoV-2' },
  { pattern: /mycobacterium\s+tuberculosis|m\.\s*tuberculosis|\bMTB\b|\btb\b/i, name: 'M. tuberculosis' },
  { pattern: /mycobacterium\s+africanum|m\.\s*africanum/i, name: 'M. africanum' },
  { pattern: /mycobacterium\s+bovis|m\.\s*bovis/i, name: 'M. bovis' },
  { pattern: /mycobacterium\s+brumae|m\.\s*brumae/i, name: 'M. brumae' },
  { pattern: /mycobacterium(?!\s+(tuberculosis|africanum|bovis|brumae))/i, name: 'Mycobacterium spp.' },
  { pattern: /influenza/i, name: 'Influenza' },
  { pattern: /hepatitis/i, name: 'Hepatitis' },
  { pattern: /salmonella/i, name: 'Salmonella' },
  { pattern: /escherichia|e\.\s*coli/i, name: 'E. coli' },
  { pattern: /staphylococcus|s\.\s*aureus|mrsa/i, name: 'S. aureus' },
  { pattern: /plasmodium|malaria/i, name: 'Plasmodium' },
  { pattern: /hiv|human\s+immunodeficiency/i, name: 'HIV' },
  { pattern: /dengue/i, name: 'Dengue' },
  { pattern: /zika/i, name: 'Zika' },
  { pattern: /ebola/i, name: 'Ebola' },
  { pattern: /legionella/i, name: 'Legionella' },
  { pattern: /pseudochrobactrum|p\.\s*algeriensis/i, name: 'P. algeriensis' },
];
function detectPathogens(pubs) {
  const found = new Set();
  for (const pub of pubs) {
    const text = `${pub.title} ${pub.journal}`;
    for (const { pattern, name } of PATHOGEN_PATTERNS) if (pattern.test(text)) found.add(name);
  }
  return found;
}
// Colour of a paper in the track: the pathogen it is about
function pathogenOf(pub) {
  const known = pub.doi && PUB_PATHOGEN[pub.doi.toLowerCase()];
  if (known) return known;
  const text = `${pub.title} ${pub.journal}`;
  if (/sars.?cov.?2|covid|coronavirus/i.test(text)) return 'cov';
  if (/tuberculosis|mycobacter|\bMTBC?\b/i.test(text)) return 'tb';
  return 'other';
}

const KEYWORD_PATTERNS = [
  { pattern: /sars.?cov.?2|covid.?19/i, label: 'SARS-CoV-2', icon: 'fa-virus', color: 'var(--sage)' },
  { pattern: /tuberculosis|\bMTB\b|\btb\b/i, label: 'Tuberculosis', icon: 'fa-bacterium', color: 'var(--terra)' },
  { pattern: /mycobacterium/i, label: 'Mycobacterium', icon: 'fa-bacterium', color: 'var(--terra-soft)' },
  { pattern: /phylogen/i, label: 'Phylogenetics', icon: 'fa-sitemap', color: 'var(--blue)' },
  { pattern: /genom/i, label: 'Genomics', icon: 'fa-dna', color: 'var(--ochre)' },
  { pattern: /epidemiol|surveillance/i, label: 'Epidemiology', icon: 'fa-chart-line', color: 'var(--plum)' },
  { pattern: /bioinformatics|pipeline|workflow/i, label: 'Bioinformatics', icon: 'fa-laptop-code', color: 'var(--blue-soft)' },
  { pattern: /variant|mutation|lineage/i, label: 'Variants', icon: 'fa-code-branch', color: 'var(--sage-soft)' },
  { pattern: /resistance|antimicrobial|antibiotic/i, label: 'AMR', icon: 'fa-shield-halved', color: 'var(--terra)' },
  { pattern: /sequenc/i, label: 'Sequencing', icon: 'fa-microscope', color: 'var(--ochre-soft)' },
];
function extractKeywords(pub) {
  const text = `${pub.title} ${pub.journal}`;
  const kws = [];
  for (const { pattern, label } of KEYWORD_PATTERNS) if (pattern.test(text) && !kws.includes(label)) kws.push(label);
  return kws;
}

// ==================== PUBLICATIONS ====================
let pubFilterState = { year: 'all', keyword: 'all', search: '', led: false };
let pubStaticFiltersBound = false;
let pubData = { pubs: [], keywords: [] };

function pubMatches(i, ignore = '') {
  const { year, keyword, search, led } = pubFilterState;
  const pub = pubData.pubs[i];
  const q = search.toLowerCase().trim();
  if (ignore !== 'year' && year !== 'all' && String(pub.year) !== year) return false;
  if (ignore !== 'keyword' && keyword !== 'all' && !pubData.keywords[i].includes(keyword)) return false;
  if (led && !pubRole(pub.doi)) return false;
  if (q) {
    const text = `${pub.title} ${pub.journal} ${preprintServer(pub.doi)} ${pubRole(pub.doi) || ''}`.toLowerCase();
    if (!text.includes(q)) return false;
  }
  return true;
}

function applyPubFilters() {
  let visible = 0;
  document.querySelectorAll('.pub-item').forEach(item => {
    const show = pubMatches(+item.dataset.idx);
    item.hidden = !show;
    if (show) visible++;
  });
  const none = document.getElementById('pubNoResults');
  if (none) none.style.display = visible === 0 && pubData.pubs.length ? 'block' : 'none';
  updatePubStatus(visible);
  updateTrack();
  updateTopicChart();
}

// What is filtered, and one button to undo it all
function updatePubStatus(visible) {
  const el = document.getElementById('pubStatus');
  if (!el) return;
  const { year, keyword, search, led } = pubFilterState;
  const active = [
    year !== 'all' ? year : '',
    keyword !== 'all' ? keyword : '',
    led ? 'first author' : '',
    search.trim() ? `"${search.trim()}"` : '',
  ].filter(Boolean);
  el.hidden = !active.length;
  if (!active.length) { el.innerHTML = ''; return; }
  // spaces between the pieces so a screen reader does not run "16" and "2021" together
  el.innerHTML = `<span>showing <b>${visible}</b> of ${pubData.pubs.length}</span> <span class="sr-only">papers, filtered by</span> ` +
    active.map(a => `<span class="pub-token">${escapeHtml(a)}</span>`).join(' ') +
    ' <button type="button" class="refresh-btn" data-clear><i class="fas fa-xmark" aria-hidden="true"></i> clear filters</button>';
}

function clearPubFilters() {
  pubFilterState = { year: 'all', keyword: 'all', search: '', led: false };
  const search = document.getElementById('pubSearch');
  if (search) search.value = '';
  document.getElementById('pubLedToggle')?.setAttribute('aria-pressed', 'false');
  applyPubFilters();
}

function setYear(y) { pubFilterState.year = pubFilterState.year === y ? 'all' : y; applyPubFilters(); }
function setKeyword(k) { pubFilterState.keyword = pubFilterState.keyword === k ? 'all' : k; applyPubFilters(); }

function initPubFilters() {
  if (pubStaticFiltersBound) return;
  pubStaticFiltersBound = true;
  const search = document.getElementById('pubSearch');
  if (search) {
    let t;
    search.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => { pubFilterState.search = search.value; applyPubFilters(); }, 180);
    });
  }
  const led = document.getElementById('pubLedToggle');
  if (led) led.addEventListener('click', () => {
    pubFilterState.led = !pubFilterState.led;
    led.setAttribute('aria-pressed', pubFilterState.led ? 'true' : 'false');
    applyPubFilters();
  });
  document.getElementById('pubStatus')?.addEventListener('click', e => {
    if (!e.target.closest('[data-clear]')) return;
    clearPubFilters();
    document.getElementById('pubSearch')?.focus();
  });
}

// Papers as a genome-browser track: one block per paper, stacked by year,
// coloured by pathogen and filled when I led it.
function renderPapersTrack() {
  const track = document.getElementById('papersTrack');
  if (!track) return;
  const pubs = pubData.pubs;
  const years = pubs.map(p => +p.year).filter(Boolean);
  if (!years.length) return;
  const y0 = Math.min(...years), y1 = Math.max(...years);
  const cols = [];
  for (let y = y0; y <= y1; y++) {
    const idx = pubs.map((p, i) => (+p.year === y ? i : -1)).filter(i => i >= 0);
    const blocks = idx.map(i => {
      const p = pubs[i];
      const role = pubRole(p.doi);
      const venue = p.journal || preprintServer(p.doi) || 'preprint';
      return `<button type="button" class="ptrack-block ${pathogenOf(p)}${role ? ' is-led' : ''}" data-idx="${i}" aria-label="${escapeHtml(`${y}, ${venue}: ${p.title}${role ? `, ${role.toLowerCase()}` : ''}`)}"></button>`;
    }).join('');
    cols.push(`<div class="ptrack-col" data-year="${y}"><span class="ptrack-count"></span>${blocks}<button type="button" class="ptrack-year" data-year="${y}" aria-pressed="false" aria-label="Show only ${y}">${y}</button></div>`);
  }
  track.style.setProperty('--years', y1 - y0 + 1);
  track.innerHTML = cols.join('');
  if (!document.querySelector('.ptrack-legend')) {
    track.parentElement.insertAdjacentHTML('afterend', `<div class="ptrack-legend" aria-hidden="true">
      <span><i style="--c:var(--terra)"></i>mycobacteria</span><span><i style="--c:var(--sage)"></i>SARS-CoV-2</span><span><i style="--c:var(--ochre)"></i>other</span><span><i class="fill" style="--c:var(--muted)"></i>led by me</span>
      <span class="ptrack-hint">pick a year or a topic to filter</span></div>`);
  }
  track.addEventListener('click', e => {
    const yb = e.target.closest('.ptrack-year');
    if (yb) { setYear(yb.dataset.year); return; }
    const b = e.target.closest('.ptrack-block');
    if (!b) return;
    const item = document.querySelector(`.pub-item[data-idx="${b.dataset.idx}"]`);
    if (!item) return;
    if (item.hidden) clearPubFilters();
    item.scrollIntoView({ behavior: PREFERS_REDUCED_MOTION ? 'auto' : 'smooth', block: 'center' });
    item.classList.remove('flash'); void item.offsetWidth; item.classList.add('flash');
    hideNoteTip();
  });
  track.addEventListener('mouseover', e => {
    const b = e.target.closest('.ptrack-block');
    if (!b) return;
    const p = pubs[+b.dataset.idx];
    const r = b.getBoundingClientRect();
    const role = pubRole(p.doi);
    showNoteTip(r.left + r.width / 2, r.top, { title: p.title, year: `${p.year} · ${p.journal || preprintServer(p.doi) || 'preprint'}`, detail: role ? `${role}. Click to find it in the list.` : 'Click to find it in the list.' },
      pathogenOf(p) === 'cov' ? cssVar('--sage') : pathogenOf(p) === 'tb' ? cssVar('--terra') : cssVar('--ochre'));
  });
  track.addEventListener('mouseleave', hideNoteTip);
  updateTrack();
}

function updateTrack() {
  document.querySelectorAll('.ptrack-col').forEach(col => {
    let n = 0;
    col.querySelectorAll('.ptrack-block').forEach(b => {
      const on = pubMatches(+b.dataset.idx, 'year');
      b.classList.toggle('dim', !on);
      if (on) n++;
    });
    col.querySelector('.ptrack-count').textContent = n || '';
    const yb = col.querySelector('.ptrack-year');
    yb.setAttribute('aria-pressed', pubFilterState.year === col.dataset.year ? 'true' : 'false');
  });
}

function updateTopicChart() {
  const container = document.getElementById('chartTopicBars');
  if (!container || !pubData.pubs.length) return;
  const counts = {};
  pubData.pubs.forEach((p, i) => { if (pubMatches(i, 'keyword')) pubData.keywords[i].forEach(k => { counts[k] = (counts[k] || 0) + 1; }); });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...sorted.map(e => e[1]), 1);
  const active = pubFilterState.keyword;
  container.innerHTML = sorted.map(([label, count]) => {
    const kp = KEYWORD_PATTERNS.find(p => p.label === label) || {};
    const dim = active !== 'all' && active !== label;
    return `<div class="bar-row${active === label ? ' active' : ''}" role="button" tabindex="0" data-topic="${label}" aria-pressed="${active === label}" aria-label="${label}, ${count} papers">
      <span class="bar-icon"><i class="fas ${kp.icon || 'fa-tag'}" aria-hidden="true"></i></span>
      <span class="bar-label">${label}</span>
      <span class="bar-track"><span class="bar-fill${dim ? ' dimmed' : ''}" style="display:block;width:${(count / max) * 100}%;--bc:${kp.color || 'var(--terra)'}"></span></span>
      <span class="bar-count">${count}</span></div>`;
  }).join('');
  container.querySelectorAll('.bar-row').forEach(row => {
    row.addEventListener('click', () => setKeyword(row.dataset.topic));
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setKeyword(row.dataset.topic); } });
  });
}

function parseOrcidWorks(groups) {
  const pubs = groups.map(g => {
    const s = g['work-summary'][0];
    const extIds = s['external-ids']?.['external-id'] || [];
    return {
      title: s.title?.title?.value || 'Untitled',
      journal: s['journal-title']?.value || '',
      year: s['publication-date']?.year?.value || '',
      month: s['publication-date']?.month?.value || '',
      doi: extIds.find(e => e['external-id-type'] === 'doi')?.['external-id-value'] || null,
      type: s.type || '',
    };
  });
  pubs.sort((a, b) => (b.year !== a.year ? b.year - a.year : (b.month || 0) - (a.month || 0)));
  return pubs;
}

function renderPublications(pubs, citations) {
  pubData = { pubs, keywords: pubs.map(extractKeywords) };
  statData.pubs = pubs.length;
  animateNumber('statPubs', pubs.length);
  document.querySelector('#pubCountBadge b').textContent = pubs.length;

  const pathogens = detectPathogens(pubs);
  statData.pathogens = [...pathogens];
  animateNumber('statPathogens', pathogens.size);
  tickerPathogens = [...pathogens];
  updateTicker();


  document.getElementById('pubList').innerHTML = pubs.map((pub, i) => {
    const role = pubRole(pub.doi);
    const isPreprint = pub.type === 'preprint';
    const venue = pub.journal || (isPreprint ? preprintServer(pub.doi) : '');
    const cit = citations && pub.doi && citations[pub.doi] !== undefined ? citations[pub.doi] : null;
    const citHTML = pub.doi
      ? `<span class="citation-badge" data-doi="${escapeHtml(pub.doi)}" title="Citations (Semantic Scholar)"><i class="fas fa-quote-right" aria-hidden="true"></i> ${cit !== null ? cit : '...'}</span>`
      : '';
    const badges = [
      role ? `<span class="role-badge">${role}</span>` : '',
      isPreprint ? '<span class="preprint-badge">preprint</span>' : '',
    ].join('');
    return `
      <li class="pub-item ${pathogenOf(pub)}${role ? ' pub-item--led' : ''}" data-idx="${i}" id="pub-${i}">
        <span class="pub-year">${pub.year || '?'}</span>
        <div class="pub-content">
          ${badges ? `<div class="pub-badges">${badges}</div>` : ''}
          <h3>${pub.title}</h3>
          ${venue ? `<p class="pub-journal">${venue}</p>` : ''}
          <div class="pub-meta">
            ${pub.doi ? `<a href="https://doi.org/${pub.doi}" target="_blank" rel="noopener" class="btn-doi"><i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i> DOI</a>` : ''}
            ${citHTML}
          </div>
        </div>
      </li>`;
  }).join('');

  document.getElementById('pubLoading').hidden = true;
  document.getElementById('pubLayout').hidden = false;
  renderPapersTrack();
  applyPubFilters();
  if (citations) setCitationTotal(Object.values(citations).reduce((s, c) => s + (c || 0), 0));
  rescrollToHash();
}

function setCitationTotal(total) {
  statData.citations = total;
  animateNumber('statCitations', total);
  document.querySelector('#citCountBadge b').textContent = total.toLocaleString('en-US');
}

async function fetchPublications() {
  const cachedCitations = cacheGet('s2_citations');
  try {
    const res = await fetch(ORCID_API, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`ORCID answered ${res.status}`);
    const data = await res.json();
    const pubs = parseOrcidWorks(data.group || []);
    renderPublications(pubs, cachedCitations);
    if (!cachedCitations) {
      fetchAllCitations(pubs.filter(p => p.doi));
    } else {
      showCacheInfo('pubCacheInfo', ['s2_citations'], () => fetchAllCitations(pubs.filter(p => p.doi)));
    }
  } catch (err) {
    console.error('ORCID fetch error:', err);
    pubLoadFailed = true;
    document.getElementById('pubLoading').innerHTML = `<p>ORCID did not answer, so the list could not load. <a href="https://orcid.org/${SITE.orcid}" target="_blank" rel="noopener">See it on ORCID</a>, or check the papers I led above.</p>`;
  }
}

async function fetchAllCitations(pubs) {
  const citations = {};
  let total = 0;
  for (const pub of pubs) {
    const badge = document.querySelector(`.citation-badge[data-doi="${CSS.escape(pub.doi)}"]`);
    try {
      await new Promise(r => setTimeout(r, 150));
      const res = await fetch(`${S2_API}${pub.doi}?fields=citationCount`);
      const count = res.ok ? ((await res.json()).citationCount || 0) : 0;
      citations[pub.doi] = count;
      total += count;
      if (badge) badge.innerHTML = `<i class="fas fa-quote-right" aria-hidden="true"></i> ${count}`;
    } catch {
      citations[pub.doi] = 0;
      if (badge) badge.innerHTML = '<i class="fas fa-quote-right" aria-hidden="true"></i> --';
    }
  }
  cacheSet('s2_citations', citations);
  setCitationTotal(total);
  showCacheInfo('pubCacheInfo', ['s2_citations'], () => fetchAllCitations(pubs));
}

// ==================== TICKER (washi tape) ====================
let tickerPathogens = [];
let tickerLangs = [];
let tickerState = { x: 0, speed: 0.25, dragging: false, startX: 0, startScroll: 0, velocity: 0, lastX: 0, lastTime: 0, halfWidth: 0, raf: null, bound: false };

function updateTicker() {
  const track = document.getElementById('tickerTrack');
  if (!track) return;
  const items = [
    ...tickerPathogens.map(name => ({ label: name, icon: 'fas ' + (PATHOGEN_ICONS[name] || 'fa-disease'), href: '#publications' })),
    ...tickerLangs.map(name => ({ label: name, icon: 'fas fa-code', href: '#tools' })),
  ];
  if (!items.length) return;
  const set = items.map(it => `<a class="ticker-item" href="${it.href}" tabindex="-1"><i class="${it.icon}" aria-hidden="true"></i> ${it.label}</a><span class="ticker-sep"></span>`).join('');
  let html = '';
  for (let i = 0; i < Math.max(4, Math.ceil(20 / items.length)); i++) html += set;
  track.innerHTML = html + html;
  requestAnimationFrame(() => {
    tickerState.halfWidth = track.scrollWidth / 2;
    if (!tickerState.raf) tickerAnimate();
  });
  if (!tickerState.bound) { initTickerDrag(track); tickerState.bound = true; }
}

function tickerAnimate() {
  const track = document.getElementById('tickerTrack');
  if (!track || tickerState.halfWidth === 0) return;
  const s = tickerState;
  if (!s.dragging) {
    if (Math.abs(s.velocity) > 0.1) { s.x -= s.velocity; s.velocity *= 0.95; }
    else { s.velocity = 0; s.x -= s.speed; }
  }
  if (s.x <= -s.halfWidth) s.x += s.halfWidth;
  if (s.x > 0) s.x -= s.halfWidth;
  track.style.transform = `translateX(${s.x}px)`;
  s.raf = requestAnimationFrame(tickerAnimate);
}

function initTickerDrag(track) {
  const s = tickerState;
  let moved = false;
  const down = (x) => { s.dragging = true; moved = false; s.startX = s.lastX = x; s.startScroll = s.x; s.velocity = 0; s.lastTime = performance.now(); track.classList.add('dragging'); };
  const move = (x) => {
    if (!s.dragging) return;
    if (Math.abs(x - s.startX) > 3) moved = true;
    s.x = s.startScroll + (x - s.startX);
    const now = performance.now(), dt = now - s.lastTime;
    if (dt > 0) s.velocity = -(x - s.lastX) / dt * 16;
    s.lastX = x; s.lastTime = now;
  };
  const up = () => { if (!s.dragging) return; s.dragging = false; track.classList.remove('dragging'); };
  track.addEventListener('mousedown', e => { e.preventDefault(); down(e.clientX); });
  document.addEventListener('mousemove', e => move(e.clientX));
  document.addEventListener('mouseup', up);
  track.addEventListener('touchstart', e => down(e.touches[0].clientX), { passive: true });
  document.addEventListener('touchmove', e => { if (s.dragging) move(e.touches[0].clientX); }, { passive: true });
  document.addEventListener('touchend', up);
  // a drag must not also follow the link under the pointer
  track.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
}

// ==================== GITHUB REPOS ====================
const GH_LAB_API = `https://api.github.com/orgs/${SITE.githubLab}/repos?sort=updated&per_page=100`;
const GH_USER_API = `https://api.github.com/users/${SITE.githubUser}/repos?sort=updated&per_page=100`;
const GH_EXCLUDE = ['paururo.github.io'];
const GH_CACHE_KEY = 'gh_paururo_repos_v2';
let ghAllRepos = [];
let ghFilterLang = 'all';

function renderGitHubRepos(repos) {
  ghAllRepos = repos;
  const langs = new Set(repos.map(r => r.language).filter(Boolean));
  statData.langs = [...langs];
  animateNumber('statLangs', langs.size);
  tickerLangs = [...langs];
  updateTicker();

  const langCounts = {};
  repos.forEach(r => { const l = r.language || 'Other'; langCounts[l] = (langCounts[l] || 0) + 1; });
  const sorted = Object.entries(langCounts).sort((a, b) => b[1] - a[1]);
  const filters = document.getElementById('ghFilters');
  if (sorted.length > 1) {
    filters.innerHTML = `<button type="button" class="gh-filter-btn active" data-lang="all">all <span class="gh-filter-count">${repos.length}</span></button>` +
      sorted.map(([lang, n]) => `<button type="button" class="gh-filter-btn" data-lang="${lang}"><span class="gh-filter-dot" style="background:${LANG_COLORS[lang] || '#8b8b8b'}"></span> ${lang} <span class="gh-filter-count">${n}</span></button>`).join('');
    filters.hidden = false;
    filters.onclick = (e) => {
      const b = e.target.closest('.gh-filter-btn');
      if (!b) return;
      ghFilterLang = b.dataset.lang;
      applyGhFilter();
    };
  }
  renderTechChart(langCounts);
  renderGhCards(repos);
  document.getElementById('ghLoading').hidden = true;
  document.getElementById('ghLayout').hidden = false;
  rescrollToHash();
}

function renderTechChart(langCounts) {
  const container = document.getElementById('chartTechBars');
  if (!container) return;
  const sorted = Object.entries(langCounts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...sorted.map(e => e[1]), 1);
  container.innerHTML = sorted.map(([lang, count]) => `
    <div class="bar-row${ghFilterLang === lang ? ' active' : ''}" role="button" tabindex="0" data-lang="${lang}" aria-pressed="${ghFilterLang === lang}" aria-label="${lang}, ${count} repositories">
      <span class="bar-icon"><span class="lang-dot" style="display:inline-block;background:${LANG_COLORS[lang] || '#8b8b8b'}"></span></span>
      <span class="bar-label">${lang}</span>
      <span class="bar-track"><span class="bar-fill${ghFilterLang !== 'all' && ghFilterLang !== lang ? ' dimmed' : ''}" style="display:block;width:${(count / max) * 100}%;--bc:${LANG_COLORS[lang] || '#8b8b8b'}"></span></span>
      <span class="bar-count">${count}</span></div>`).join('');
  container.querySelectorAll('.bar-row').forEach(row => {
    const pick = () => { ghFilterLang = ghFilterLang === row.dataset.lang ? 'all' : row.dataset.lang; applyGhFilter(); };
    row.addEventListener('click', pick);
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  });
}

// GitHub shortcodes such as :shipit: only render on GitHub itself
const cleanDescription = (s) => String(s || '').replace(/(^|\s):[a-z0-9_+-]+:(?=\s|$)/g, '$1').replace(/\s{2,}/g, ' ').trim();

function renderGhCards(repos) {
  document.getElementById('ghGrid').innerHTML = repos.map(repo => {
    const lang = repo.language || 'Other';
    const desc = cleanDescription(repo.description);
    const updated = new Date(repo.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    return `
      <a href="${repo.html_url}" target="_blank" rel="noopener" class="gh-card" data-lang="${lang}">
        <span class="gh-card-header"><i class="fab fa-github" aria-hidden="true"></i><span class="gh-repo-name">${escapeHtml(repo.name)}</span></span>
        <span class="gh-desc">${desc ? escapeHtml(desc) : 'No description yet.'}</span>
        <span class="gh-card-footer">
          <span><span class="lang-dot" style="display:inline-block;background:${LANG_COLORS[lang] || '#8b8b8b'}"></span> ${lang}</span>
          <span><i class="fas fa-star" aria-hidden="true"></i> ${repo.stargazers_count}</span>
          <span><i class="fas fa-code-branch" aria-hidden="true"></i> ${repo.forks_count}</span>
          <span class="gh-updated">${updated}</span>
        </span>
      </a>`;
  }).join('');
}

function applyGhFilter() {
  renderGhCards(ghFilterLang === 'all' ? ghAllRepos : ghAllRepos.filter(r => (r.language || 'Other') === ghFilterLang));
  document.querySelectorAll('.gh-filter-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === ghFilterLang));
  const counts = {};
  ghAllRepos.forEach(r => { const l = r.language || 'Other'; counts[l] = (counts[l] || 0) + 1; });
  renderTechChart(counts);
}

async function fetchGitHubRepos() {
  const loading = document.getElementById('ghLoading');
  cacheInvalidate('gh_repos', 'gh_lab_repos', 'gh_paururo_repos');
  const refresh = () => {
    cacheInvalidate(GH_CACHE_KEY);
    loading.hidden = false;
    document.getElementById('ghLayout').hidden = true;
    fetchGitHubRepos();
  };
  const cached = cacheGet(GH_CACHE_KEY);
  if (cached) {
    renderGitHubRepos(cached);
    showCacheInfo('ghCacheInfo', [GH_CACHE_KEY], refresh);
    return;
  }

  try {
    const excludeSet = new Set(GH_EXCLUDE.map(n => n.toLowerCase()));
    const userLower = SITE.githubUser.toLowerCase();
    let labRepos = [];
    let userRepos = [];
    let rateLimited = false;

    // 1. Every public repository in the lab organisation
    try {
      const res = await fetch(GH_LAB_API);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) labRepos = data.filter(r => !r.fork && !r.archived);
      } else {
        rateLimited = true;
      }
    } catch { rateLimited = true; }

    // 2. Keep the ones I contributed to. A few requests at a time instead of
    //    one after another: the same number of calls, but the grid appears in
    //    a couple of seconds. If GitHub's anonymous limit (60 calls an hour)
    //    cuts the checks short, fall back to the featured tools and do not
    //    cache the result, so a partial list is not kept for a whole day.
    const featuredNames = new Set(FEATURED_TOOLS.map(t => t.name.toLowerCase()));
    const mine = new Array(labRepos.length).fill(false);
    let next = 0;
    async function worker() {
      while (next < labRepos.length && !rateLimited) {
        const i = next++;
        try {
          const res = await fetch(`https://api.github.com/repos/${SITE.githubLab}/${labRepos[i].name}/contributors?per_page=30`);
          if (res.status === 403 || res.status === 429) { rateLimited = true; break; }
          if (res.ok) {
            const contribs = await res.json();
            mine[i] = Array.isArray(contribs) && contribs.some(c => c.login.toLowerCase() === userLower);
          }
        } catch { /* skip this repository */ }
      }
    }
    await Promise.all(Array.from({ length: 6 }, worker));
    const myLabRepos = labRepos.filter((repo, i) => mine[i] || (rateLimited && featuredNames.has(repo.name.toLowerCase())));

    // 3. My personal repositories
    try {
      const res = await fetch(GH_USER_API);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) userRepos = data.filter(r => !r.fork && !r.archived && !excludeSet.has(r.name.toLowerCase()));
      }
    } catch { /* ignore */ }

    const seen = new Set();
    const repos = [];
    for (const r of [...myLabRepos, ...userRepos]) {
      const key = r.full_name.toLowerCase();
      if (!seen.has(key)) { seen.add(key); repos.push(r); }
    }
    if (repos.length === 0) throw new Error('No repos loaded');

    const sorted = repos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    if (!rateLimited) cacheSet(GH_CACHE_KEY, sorted);
    renderGitHubRepos(sorted);
    showCacheInfo('ghCacheInfo', [GH_CACHE_KEY], refresh);
  } catch (err) {
    console.error('GitHub fetch error:', err);
    ghLoadFailed = true;
    loading.innerHTML = `<p>GitHub did not answer (its anonymous API allows 60 requests an hour). The featured tools above are always here. <a href="https://github.com/${SITE.githubLab}" target="_blank" rel="noopener">Browse PathoGenOmics-Lab on GitHub</a></p>`;
  }
}
