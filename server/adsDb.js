const fs = require('fs');
const path = require('path');
const { hydrate, sync } = require('./persistentStore');

// Home page ad creatives — a small admin-managed list, each rendered as a
// rotating card in the desktop sidebar widget and/or the mobile placements.
//
// Storage note: creatives are kept as data: URLs directly in this JSON file
// (same pattern as team logos elsewhere), which then rides through the
// Google Sheets persistence layer that chunks values into ~40k-character
// cells and rewrites the *whole* AppData tab on every save (see
// sheetsStore.js). That's fine for a handful of compressed images/GIFs, but
// it's not built for many large files — MAX_MEDIA_BYTES and MAX_ADS below
// keep this feature from quietly turning every admin save (on ANY page)
// into a multi-megabyte round trip to Sheets.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'ads.json');
const SHEET_KEY = 'ads';

const TRANSITIONS = ['fade', 'slide', 'zoom', 'flip', 'random'];
// Which surface an ad is eligible to appear on.
const PLACEMENTS = ['desktop', 'mobile', 'both'];
const MAX_ADS = 12;
const MAX_MEDIA_BYTES = 1.5 * 1024 * 1024; // ~1.5MB decoded

function ensureFile() {
  if (!fs.existsSync(path.dirname(DB_FILE))) fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]', 'utf8');
}

function readAll() {
  ensureFile();
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function writeAll(list) {
  ensureFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2), 'utf8');
  sync(SHEET_KEY, list);
}

function genId() {
  return 'AD-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1000);
}

// Only a data:image/* URL is ever accepted — never an arbitrary remote URL —
// so a stored ad can't be used to point <img>/background-image at something
// that isn't actually an image, and can't smuggle markup through the src.
function cleanMedia(v) {
  const s = String(v || '');
  if (!/^data:image\/(png|jpeg|jpg|gif|webp);base64,/.test(s)) return '';
  if (s.length * 0.75 > MAX_MEDIA_BYTES) return '';
  return s;
}

// Only http(s), or a same-site relative path/filename with no scheme at
// all — blocks javascript:, data:, and any other script-executing URI
// scheme from a stored admin field that later gets rendered straight into
// an href attribute. Protocol-relative ("//host/…") is rejected too, since
// it's an easy way to silently point off-site.
function cleanLink(v) {
  const s = String(v || '').trim().slice(0, 300);
  if (!s) return '';
  if (/^\/\//.test(s)) return '';
  const hasScheme = s.indexOf(':') !== -1;
  if (hasScheme && !/^https?:\/\//i.test(s)) return '';
  return s;
}

function cleanAd(a) {
  if (!a || typeof a !== 'object') return null;
  const media = cleanMedia(a.media);
  if (!media) return null; // an ad with no valid creative isn't worth keeping
  return {
    id: a.id || genId(),
    media,
    headline: String(a.headline || '').trim().slice(0, 60),
    subtext: String(a.subtext || '').trim().slice(0, 80),
    badge: String(a.badge || '').trim().slice(0, 30),
    ctaText: String(a.ctaText || '').trim().slice(0, 24),
    ctaLink: cleanLink(a.ctaLink),
    transition: TRANSITIONS.includes(a.transition) ? a.transition : 'fade',
    placement: PLACEMENTS.includes(a.placement) ? a.placement : 'both',
    active: a.active !== false,
    order: Number.isFinite(Number(a.order)) ? Number(a.order) : 0,
  };
}

function getAds() {
  return readAll();
}

function saveAds(list) {
  const clean = (Array.isArray(list) ? list : [])
    .map(cleanAd)
    .filter(Boolean)
    .slice(0, MAX_ADS);
  writeAll(clean);
  return clean;
}

const ready = hydrate(SHEET_KEY, DB_FILE);

module.exports = { getAds, saveAds, ready, TRANSITIONS, PLACEMENTS, MAX_ADS, MAX_MEDIA_BYTES };
