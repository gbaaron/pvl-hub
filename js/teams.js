/* ========================================
   PVL HUB — Team Registry & Art Resolver
   ----------------------------------------
   Single source of truth for the 12 PVL clubs.
   Every crest here is a real club mark already hosted on
   Aaron's Cloudinary. Pages must never hand-write a logo URL —
   ask Art for a plate and the crest comes with the club colour,
   the fallback, and the correct object-fit for free.
   ======================================== */

const CDN = 'https://res.cloudinary.com/djngpyv15/image/upload';

const TEAMS = {
  creamline: { name: 'Creamline',      full: 'Creamline Cool Smashers',     short: 'CRE', tint: '#e8456b', logo: `${CDN}/v1776369727/creamline_x3ooit.png` },
  choco:     { name: 'Choco Mucho',    full: 'Choco Mucho Flying Titans',   short: 'CHO', tint: '#6b3fa0', logo: `${CDN}/v1776369734/choco_o0dgvs.png` },
  pldt:      { name: 'PLDT',           full: 'PLDT High Speed Hitters',     short: 'PLD', tint: '#045397', logo: `${CDN}/v1776369727/PLDT-highspeed-logo_ifvs7z.png` },
  cignal:    { name: 'Cignal',         full: 'Cignal HD Spikers',           short: 'CIG', tint: '#0a3d91', logo: `${CDN}/v1776369727/Cignal_Super_Spikers_fw6lgj.png` },
  akari:     { name: 'Akari',          full: 'Akari Chargers',              short: 'AKA', tint: '#f39c12', logo: `${CDN}/v1776369735/web-akari_v20tkw.png` },
  farmfresh: { name: 'Farm Fresh',     full: 'Farm Fresh Foxies',           short: 'FFF', tint: '#e8622a', logo: `${CDN}/v1776369728/FarmFresh_200x200_cpqrbs.png` },
  nxled:     { name: 'NXLED',          full: 'NXLED Chameleons',            short: 'NXL', tint: '#22c55e', logo: `${CDN}/v1776369728/NXC_nkfrug.png` },
  capital1:  { name: 'Capital1',       full: 'Capital1 Solar Spikers',      short: 'CAP', tint: '#f6b816', logo: `${CDN}/v1776369728/Capital1SolarSpikers_Logo_HiRes_8Rays_osvrmh.png` },
  zus:       { name: 'ZUS',            full: 'ZUS Coffee Thunderbelles',    short: 'ZUS', tint: '#d4a843', logo: `${CDN}/v1776369727/0-02-06-0a67ed46d08fbcfa407da78ef2dff105c4258304deab09077148b6eedb98a651_9d271377f0f6eba6_x0clj4.png` },
  galeries:  { name: 'Galeries Tower', full: 'Galeries Tower Highrisers',   short: 'GTH', tint: '#1a6fc2', logo: `${CDN}/v1776369728/GTH_rur7sc.png` },
  // No club mark on the CDN yet — these fall back to an honest monogram plate.
  petrogazz: { name: 'Petro Gazz',     full: 'Petro Gazz Angels',           short: 'PET', tint: '#c8102e', logo: null },
  chery:     { name: 'Chery Tiggo',    full: 'Chery Tiggo Crossovers',      short: 'CHE', tint: '#cf2030', logo: null },
};

const TEAM_KEYS = Object.keys(TEAMS);

/* Players who show up in headlines without their club named. Real affiliations. */
const PLAYERS = {
  'alyssa valdez': 'creamline', 'tots carlos': 'creamline', 'michele gumabao': 'creamline',
  'almadro': 'creamline', 'jia de guzman': 'choco', 'sisi rondina': 'choco',
  'kat tolentino': 'choco', 'savi davison': 'pldt', 'mika reyes': 'pldt',
  'ces molina': 'cignal', 'rachel anne daquis': 'cignal', 'faith nisperos': 'akari',
  'eya laure': 'chery', 'grethcel soltones': 'petrogazz', 'myla pablo': 'petrogazz',
  'kianna dy': 'farmfresh',
};

/* Category words that make an honest typographic plate when no club is named. */
const NEUTRAL_TINTS = ['#ed1f24', '#045397', '#f6b816', '#8b5cf6', '#14b8a6', '#e8622a'];


const Art = {
  teams: TEAMS,
  keys: TEAM_KEYS,

  get(key) {
    return TEAMS[key] || null;
  },

  /** Resolve a club from free text — an article title, a product name, a video title. */
  match(text) {
    if (!text) return null;
    const t = String(text).toLowerCase();
    for (const key of TEAM_KEYS) {
      const team = TEAMS[key];
      if (t.includes(team.name.toLowerCase()) || t.includes(key)) return key;
    }
    // Nicknames that appear in copy without the club name attached.
    const nick = {
      'cool smashers': 'creamline', 'flying titans': 'choco', 'high speed hitters': 'pldt',
      'hd spikers': 'cignal', 'chargers': 'akari', 'foxies': 'farmfresh',
      'chameleons': 'nxled', 'solar spikers': 'capital1', 'thunderbelles': 'zus',
      'highrisers': 'galeries', 'angels': 'petrogazz', 'crossovers': 'chery',
    };
    for (const [k, v] of Object.entries(nick)) if (t.includes(k)) return v;
    for (const [k, v] of Object.entries(PLAYERS)) if (t.includes(k)) return v;
    return null;
  },

  /**
   * Best-available art, in order: real club mark → honest monogram plate.
   * `size` is 'sm' | 'md' | 'lg'; `label` adds the club name under the mark.
   */
  plate(key, opts = {}) {
    const team = TEAMS[key];
    if (!team) return '';
    const { size = 'md', label = false, className = '' } = opts;
    const inner = team.logo
      ? `<img src="${team.logo}" alt="${team.full}" loading="lazy" decoding="async">`
      : `<span class="crest-plate__mono">${team.short}</span>`;
    return `<div class="crest-plate crest-plate--${size} ${className}" style="--tint:${team.tint}">
      <div class="crest-plate__mark">${inner}</div>
      ${label ? `<span class="crest-plate__label">${team.name}</span>` : ''}
    </div>`;
  },

  /** A plate resolved straight from copy — used by the card thumbnails. */
  plateFor(text, opts = {}) {
    const key = this.match(text);
    if (key) return this.plate(key, opts);
    // No club named. Set the item's own category as a merch-style print rather
    // than repeating one neutral mark down the whole page.
    return this.wordPlate(opts.word || 'PVL', opts);
  },

  /**
   * Typographic plate — the item's own noun, set large in the display face.
   * Tint rotates so a grid of these doesn't read as one repeated tile.
   */
  wordPlate(word, opts = {}) {
    const { size = 'md', className = '', seed = 0 } = opts;
    const tint = NEUTRAL_TINTS[Math.abs(seed) % NEUTRAL_TINTS.length];
    const w = String(word).toUpperCase();
    return `<div class="crest-plate crest-plate--${size} crest-plate--word ${className}" style="--tint:${tint}">
      <span class="crest-plate__word">${w}</span>
    </div>`;
  },

  /** League-neutral plate for content that isn't about one club. */
  leaguePlate(opts = {}) {
    const { size = 'md', className = '' } = opts;
    return `<div class="crest-plate crest-plate--${size} crest-plate--league ${className}" style="--tint:var(--pvl-gold)">
      <div class="crest-plate__mark"><span class="crest-plate__mono">PVL</span></div>
    </div>`;
  },


  /**
   * Build the hero crest wall from the registry — never paste tiles, so a new
   * club in TEAMS lands on the wall with no second edit.
   */
  buildWall(el, count = 40) {
    const node = typeof el === 'string' ? document.querySelector(el) : el;
    if (!node) return;
    const grid = document.createElement('div');
    grid.className = 'artwall__grid';
    grid.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < count; i++) {
      const team = TEAMS[TEAM_KEYS[i % TEAM_KEYS.length]];
      const tile = document.createElement('div');
      tile.className = 'artwall__tile';
      tile.innerHTML = team.logo
        ? `<img src="${team.logo}" alt="" loading="lazy" decoding="async">`
        : `<span>${team.short}</span>`;
      grid.appendChild(tile);
    }
    node.appendChild(grid);
  },

  /** Marquee rail of all 12 clubs, duplicated for a seamless loop. */
  buildRail(el) {
    const node = typeof el === 'string' ? document.querySelector(el) : el;
    if (!node) return;
    const item = (t) => `<div class="crest-rail__item">${
      t.logo ? `<img src="${t.logo}" alt="${t.full}" loading="lazy" decoding="async">`
             : `<span class="mono">${t.short}</span>`
    }<span class="nm">${t.name}</span></div>`;
    const set = TEAM_KEYS.map((k) => item(TEAMS[k])).join('');
    const track = document.createElement('div');
    track.className = 'crest-rail__track';
    track.innerHTML = set + set;   // second copy makes the -50% loop seamless
    track.children.length && Array.from(track.children).slice(TEAM_KEYS.length)
      .forEach((c) => c.setAttribute('aria-hidden', 'true'));
    node.appendChild(track);
  },

  /** Fill every [data-crest] slot on the page. */
  hydrate(root = document) {
    root.querySelectorAll('[data-crest]').forEach((el, idx) => {
      if (el.dataset.crestDone) return;
      const key = el.dataset.crest;
      const size = el.dataset.crestSize || 'md';
      const label = el.dataset.crestLabel === 'true';
      const word = el.dataset.crestWord || 'PVL';
      const seed = idx;
      el.innerHTML = key === 'auto'
        ? this.plateFor(el.dataset.crestText || '', { size, label, word, seed })
        : (TEAMS[key] ? this.plate(key, { size, label }) : this.wordPlate(word, { size, seed }));
      el.dataset.crestDone = '1';
    });
  },
};

window.TEAMS = TEAMS;
window.Art = Art;

document.addEventListener('DOMContentLoaded', () => {
  Art.hydrate();
  Art.buildWall('#hero-artwall');
  Art.buildRail('#crest-rail');
});
