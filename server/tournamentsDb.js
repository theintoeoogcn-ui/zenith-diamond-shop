const fs = require('fs');
const path = require('path');
const { hydrate, sync } = require('./persistentStore');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'tournaments.json');
const SHEET_KEY = 'tournaments';

function ensureFile() {
  if (!fs.existsSync(path.dirname(DB_FILE))) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, '[]', 'utf8');
  }
}

function readAll() {
  ensureFile();
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

// Writes the local file immediately (so reads are never blocked on the
// network), then awaits the Sheets backup so callers can tell the admin if
// this save didn't durably persist — a tournament created here but not yet
// backed up to Sheets is the exact state that used to get silently rolled
// back on the next server restart.
async function writeAll(list) {
  ensureFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2), 'utf8');
  const result = await sync(SHEET_KEY, list);
  return result;
}

function generateId() {
  return 'T-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1000);
}

// Upcoming tournaments first (soonest date-added last-in shown first within
// each status group is handled on the frontend); here we just keep newest
// first so a fresh "Create Tournament" appears at the top of its section.
function listTournaments() {
  return readAll().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

async function createTournament(data) {
  const list = readAll();
  const item = {
    id: generateId(),
    title: String(data.title || '').trim(),
    status: data.status === 'past' ? 'past' : 'upcoming',
    date: data.date ? String(data.date).trim() : '',
    prize: data.prize ? String(data.prize).trim() : '',
    format: data.format ? String(data.format).trim() : '',
    slots: data.slots ? String(data.slots).trim() : '',
    description: data.description ? String(data.description).trim() : '',
    // Shown in the must-read Rules & Regulations popup before a visitor can
    // reach the registration form. Empty means the frontend falls back to a
    // generic default rule set instead of leaving the popup blank.
    rules: data.rules ? String(data.rules).trim() : '',
    icon: data.icon ? String(data.icon).trim() : '🏆',
    coverImage: data.coverImage ? String(data.coverImage) : '',
    watchLink: data.watchLink ? String(data.watchLink).trim() : '',
    // Registration now happens on the site (register.html) rather than via an
    // external form link, so this is a switch rather than a URL.
    registrationOpen: data.registrationOpen === undefined ? true : !!data.registrationOpen,
    createdAt: new Date().toISOString(),
  };
  list.push(item);
  const syncResult = await writeAll(list);
  // Spread copy for the API response only — the persisted item itself never
  // carries this flag, so it can't leak into a later re-save.
  return { ...item, _syncOk: syncResult.ok };
}

async function updateTournament(id, patch) {
  const list = readAll();
  const idx = list.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  const clean = { ...list[idx] };
  const fields = ['title', 'status', 'date', 'prize', 'format', 'slots', 'description', 'rules', 'icon', 'watchLink'];
  fields.forEach((f) => {
    if (patch[f] !== undefined) {
      clean[f] = f === 'status'
        ? (patch.status === 'past' ? 'past' : 'upcoming')
        : String(patch[f]).trim();
    }
  });
  if (patch.coverImage !== undefined) {
    clean.coverImage = String(patch.coverImage);
  }
  if (patch.registrationOpen !== undefined) {
    clean.registrationOpen = !!patch.registrationOpen;
  }
  // Older records may still carry the retired external link field.
  delete clean.registerLink;
  list[idx] = clean;
  const syncResult = await writeAll(list);
  return { ...list[idx], _syncOk: syncResult.ok };
}

async function deleteTournament(id) {
  const list = readAll();
  const next = list.filter((t) => t.id !== id);
  if (next.length === list.length) return false;
  await writeAll(next);
  return true;
}

const ready = hydrate(SHEET_KEY, DB_FILE);

module.exports = { listTournaments, createTournament, updateTournament, deleteTournament, ready };
