const fs = require('fs');
const path = require('path');
const { hydrate, sync } = require('./persistentStore');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'socials.json');
const SHEET_KEY = 'socials';

// The four networks rendered under "Follow Zenith" on the home page. The
// keys are fixed (the markup and icons are per-network); only the URLs are
// admin-editable. An empty string means "not set yet" — the front end
// renders that icon as an inert placeholder rather than a dead link.
const PLATFORMS = ['tiktok', 'facebook', 'youtube', 'telegram'];

const DEFAULTS = {
  tiktok: '',
  facebook: '',
  youtube: '',
  telegram: 'https://t.me/Zenithdiamond2026',
};

function ensureFile() {
  if (!fs.existsSync(path.dirname(DB_FILE))) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULTS, null, 2), 'utf8');
  }
}

// Same rule the ad creatives use: block "javascript:" and friends from ever
// reaching an href, and reject protocol-relative "//host/…" URLs which are an
// easy way to silently point off-site. A bare "example.com/x" is left alone
// and normalised to https:// below so admins don't have to remember the scheme.
function cleanLink(v) {
  const s = String(v || '').trim().slice(0, 300);
  if (!s) return '';
  if (/^\/\//.test(s)) return '';
  const hasScheme = s.indexOf(':') !== -1;
  if (hasScheme && !/^https?:\/\//i.test(s)) return '';
  if (!hasScheme) return 'https://' + s;
  return s;
}

function getSocials() {
  ensureFile();
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    const out = {};
    PLATFORMS.forEach((k) => {
      out[k] = typeof data[k] === 'string' ? data[k] : DEFAULTS[k];
    });
    return out;
  } catch (e) {
    return { ...DEFAULTS };
  }
}

function saveSocials(data) {
  ensureFile();
  const clean = {};
  PLATFORMS.forEach((k) => {
    clean[k] = cleanLink(data && data[k]);
  });
  fs.writeFileSync(DB_FILE, JSON.stringify(clean, null, 2), 'utf8');
  sync(SHEET_KEY, clean);
  return clean;
}

const ready = hydrate(SHEET_KEY, DB_FILE);

module.exports = { getSocials, saveSocials, PLATFORMS, ready };
