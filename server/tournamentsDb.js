const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'tournaments.json');

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

function writeAll(list) {
  ensureFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2), 'utf8');
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

function createTournament(data) {
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
    icon: data.icon ? String(data.icon).trim() : '🏆',
    createdAt: new Date().toISOString(),
  };
  list.push(item);
  writeAll(list);
  return item;
}

function updateTournament(id, patch) {
  const list = readAll();
  const idx = list.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  const clean = { ...list[idx] };
  const fields = ['title', 'status', 'date', 'prize', 'format', 'slots', 'description', 'icon'];
  fields.forEach((f) => {
    if (patch[f] !== undefined) {
      clean[f] = f === 'status'
        ? (patch.status === 'past' ? 'past' : 'upcoming')
        : String(patch[f]).trim();
    }
  });
  list[idx] = clean;
  writeAll(list);
  return list[idx];
}

function deleteTournament(id) {
  const list = readAll();
  const next = list.filter((t) => t.id !== id);
  if (next.length === list.length) return false;
  writeAll(next);
  return true;
}

module.exports = { listTournaments, createTournament, updateTournament, deleteTournament };
