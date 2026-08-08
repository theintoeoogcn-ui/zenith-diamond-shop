const fs = require('fs');
const path = require('path');
const { hydrate, sync } = require('./persistentStore');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'registrations.json');
const SHEET_KEY = 'registrations';

// Roster shape: five starters, two optional subs, one optional coach.
// The starters are the only slots a team must fill to enter.
const ROSTER_SLOTS = [
  { key: 'exp',    label: 'Exp',     required: true  },
  { key: 'jungle', label: 'Jungle',  required: true  },
  { key: 'mid',    label: 'Mid',     required: true  },
  { key: 'gold',   label: 'Gold',    required: true  },
  { key: 'roam',   label: 'Roam',    required: true  },
  { key: 'sub1',   label: 'Sub 1',   required: false },
  { key: 'sub2',   label: 'Sub 2',   required: false },
  { key: 'coach',  label: 'Coach',   required: false },
];
const ROLE_OPTIONS = ['Exp', 'Jungle', 'Mid', 'Gold', 'Roam', 'Sub', 'Coach'];
const CONTACT_TYPES = ['telegram', 'viber'];
// Which regional bracket the team plays in.
const REGIONS = [
  { value: 'MM', label: 'Myanmar Region' },
  { value: 'TH', label: 'Thailand Region' },
];
const REGION_VALUES = REGIONS.map((r) => r.value);

function ensureFile() {
  if (!fs.existsSync(path.dirname(DB_FILE))) fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '{}', 'utf8');
}

function readAll() {
  ensureFile();
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) || {}; }
  catch (e) { return {}; }
}

function writeAll(map) {
  ensureFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(map, null, 2), 'utf8');
  sync(SHEET_KEY, map);
}

function genId() {
  return 'R' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

function cleanPlayer(p, slot) {
  p = p || {};
  return {
    slot: slot.key,
    role: ROLE_OPTIONS.includes(p.role) ? p.role : slot.label.replace(/ \d$/, ''),
    name: str(p.name, 60),
    phone: str(p.phone, 30),
    contactType: CONTACT_TYPES.includes(p.contactType) ? p.contactType : 'telegram',
    contact: str(p.contact, 80),
  };
}

/* Returns a list of human-readable problems; empty means the entry is valid.
   Validation lives here rather than only in the browser so a crafted request
   can't slip past the required fields. */
function validate(payload) {
  const errors = [];
  if (!payload.teamLogo) errors.push('Team logo is required.');
  if (!str(payload.teamName, 60)) errors.push('Team name is required.');
  if (!str(payload.teamTag, 10)) errors.push('Team tag is required.');
  if (!str(payload.leaderName, 60)) errors.push('Leader or manager name is required.');
  if (!REGION_VALUES.includes(payload.region)) errors.push('Region is required.');
  if (!str(payload.orderCode, 20)) errors.push('Order code is required.');

  const players = Array.isArray(payload.players) ? payload.players : [];
  ROSTER_SLOTS.forEach((slot, i) => {
    const p = players[i] || {};
    const filled = str(p.name, 60) || str(p.phone, 30) || str(p.contact, 80);
    // Optional slots are all-or-nothing: leave one blank, or complete it.
    if (!slot.required && !filled) return;
    const who = slot.label;
    if (!str(p.name, 60)) errors.push(`${who}: player name is required.`);
    if (!str(p.phone, 30)) errors.push(`${who}: phone number is required.`);
    if (!str(p.contact, 80)) errors.push(`${who}: Telegram or Viber is required.`);
  });
  return errors;
}

function listRegistrations(tournamentId) {
  return (readAll()[tournamentId] || []).slice().sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
}

// True when this order code has already been spent on any registration, for
// any tournament — one purchase, one entry.
function isCodeUsed(orderCode) {
  const code = str(orderCode, 20).toUpperCase();
  const all = readAll();
  return Object.keys(all).some((tid) =>
    (all[tid] || []).some((r) => String(r.orderCode || '').toUpperCase() === code));
}

function createRegistration(tournamentId, payload) {
  const map = readAll();
  const list = map[tournamentId] || [];
  const entry = {
    id: genId(),
    tournamentId,
    teamLogo: payload.teamLogo ? String(payload.teamLogo) : '',
    teamName: str(payload.teamName, 60),
    teamTag: str(payload.teamTag, 10),
    leaderName: str(payload.leaderName, 60),
    region: REGION_VALUES.includes(payload.region) ? payload.region : 'MM',
    orderCode: str(payload.orderCode, 20).toUpperCase(),
    players: ROSTER_SLOTS.map((slot, i) => cleanPlayer((payload.players || [])[i], slot))
      .filter((p, i) => ROSTER_SLOTS[i].required || p.name),
    status: 'pending', // pending -> approved | rejected
    createdAt: new Date().toISOString(),
  };
  list.push(entry);
  map[tournamentId] = list;
  writeAll(map);
  return entry;
}

/* Public view of the approved teams. Deliberately drops phone numbers and
   contact handles — only the team, its players and its region are public. */
function listApproved(tournamentId) {
  return listRegistrations(tournamentId)
    .filter((r) => r.status === 'approved')
    .map((r) => ({
      id: r.id,
      teamName: r.teamName,
      teamTag: r.teamTag,
      teamLogo: r.teamLogo,
      region: r.region || 'MM',
      players: (r.players || []).map((p) => ({ role: p.role, name: p.name, slot: p.slot })),
    }));
}

function updateRegistration(tournamentId, id, patch) {
  const map = readAll();
  const list = map[tournamentId] || [];
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  if (['pending', 'approved', 'rejected'].includes(patch.status)) {
    list[idx] = { ...list[idx], status: patch.status };
  }
  map[tournamentId] = list;
  writeAll(map);
  return list[idx];
}

function deleteRegistration(tournamentId, id) {
  const map = readAll();
  const list = map[tournamentId] || [];
  const next = list.filter((r) => r.id !== id);
  if (next.length === list.length) return false;
  map[tournamentId] = next;
  writeAll(map);
  return true;
}

const ready = hydrate(SHEET_KEY, DB_FILE);

module.exports = {
  listRegistrations, listApproved, createRegistration, updateRegistration, deleteRegistration,
  validate, isCodeUsed,
  ROSTER_SLOTS, ROLE_OPTIONS, CONTACT_TYPES, REGIONS, ready,
};
