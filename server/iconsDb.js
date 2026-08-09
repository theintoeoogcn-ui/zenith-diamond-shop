const fs = require('fs');
const path = require('path');
const { hydrate, sync } = require('./persistentStore');

// Hero & item icon library for the Match Schedule "hero pick" view.
//
// The obvious first choice — pulling portraits live from a public MLBB data
// API — turned out to be unreliable (the endpoint used during development
// went dark), and no third-party source reliably covers items too. Rather
// than depend on someone else's uptime for something this visible, icons
// here are admin-uploaded once per hero/item name and then reused on every
// match that references that name — same trust model as team logos and ad
// creatives elsewhere in this app, and it never breaks because a third
// party changed or removed an endpoint.
//
// Storage note: same Google Sheets persistence layer as ads.js (see that
// file's comment) — icons are kept small (MAX_MEDIA_BYTES) specifically so
// a library of a few hundred hero/item icons doesn't blow up the size of
// every save.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'icons.json');
const SHEET_KEY = 'icons';

const MAX_MEDIA_BYTES = 300 * 1024; // ~300KB decoded — plenty for a small square icon
const MAX_ENTRIES_PER_KIND = 400; // generous headroom over MLBB's actual hero/item roster

function ensureFile() {
  if (!fs.existsSync(path.dirname(DB_FILE))) fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ heroes: {}, items: {} }), 'utf8');
}

function readAll() {
  ensureFile();
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return {
      heroes: (data && typeof data.heroes === 'object' && data.heroes) || {},
      items: (data && typeof data.items === 'object' && data.items) || {},
    };
  } catch (e) {
    return { heroes: {}, items: {} };
  }
}

function writeAll(data) {
  ensureFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  sync(SHEET_KEY, data);
}

// Matching key: lowercase + trimmed, so "Valir", " valir ", "VALIR" all hit
// the same uploaded icon regardless of how the vision model capitalized it.
function normalizeName(name) {
  return String(name || '').trim().toLowerCase().slice(0, 60);
}

// Only a data:image/* URL is ever accepted — never an arbitrary remote URL —
// so a stored icon can't be used to point <img> at something that isn't
// actually an image, and can't smuggle markup through the src.
function cleanMedia(v) {
  const s = String(v || '');
  if (!/^data:image\/(png|jpeg|jpg|gif|webp);base64,/.test(s)) return '';
  if (s.length * 0.75 > MAX_MEDIA_BYTES) return '';
  return s;
}

function kindKey(kind) {
  return kind === 'hero' ? 'heroes' : kind === 'item' ? 'items' : null;
}

function getIcons() {
  return readAll();
}

// Upserts a single hero/item icon by display name. Returns the updated
// {heroes, items} map, or null if the input was invalid (caller responds
// with 400 in that case).
function setIcon(kind, displayName, mediaValue) {
  const key = kindKey(kind);
  if (!key) return null;
  const norm = normalizeName(displayName);
  const media = cleanMedia(mediaValue);
  if (!norm || !media) return null;
  const data = readAll();
  const isNew = !data[key][norm];
  if (isNew && Object.keys(data[key]).length >= MAX_ENTRIES_PER_KIND) return null;
  data[key][norm] = { name: String(displayName).trim().slice(0, 60), media };
  writeAll(data);
  return data;
}

function removeIcon(kind, displayName) {
  const key = kindKey(kind);
  if (!key) return null;
  const norm = normalizeName(displayName);
  const data = readAll();
  if (data[key][norm]) {
    delete data[key][norm];
    writeAll(data);
  }
  return data;
}

const ready = hydrate(SHEET_KEY, DB_FILE);

module.exports = { getIcons, setIcon, removeIcon, normalizeName, ready, MAX_MEDIA_BYTES, MAX_ENTRIES_PER_KIND };
