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
// Hard cap on how many teams a single tournament will take.
const MAX_TEAMS = 128;
/* Every accepted team gets a running entry number of its own — S3-0001,
   S3-0002 and so on — separate from the diamond order code it registered
   with. The prefix is the season, and can be moved on per deployment. */
const TEAM_CODE_PREFIX = process.env.TEAM_CODE_PREFIX || 'S3';
// A tournament entry has to be backed by a diamond purchase of at least this
// size; smaller packs don't qualify a team.
const MIN_REGISTER_DIAMONDS = 343;
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

/* The next team code for a tournament, continuing from the highest already
   issued there rather than from the number of entries — so deleting a team
   never hands its number to somebody else. */
function nextTeamCode(list) {
  const re = new RegExp('^' + TEAM_CODE_PREFIX + '-(\\d+)$');
  let highest = 0;
  (list || []).forEach((r) => {
    const m = re.exec(String(r.teamCode || ''));
    if (m) highest = Math.max(highest, Number(m[1]));
  });
  return `${TEAM_CODE_PREFIX}-${String(highest + 1).padStart(4, '0')}`;
}

function genId() {
  return 'R' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

/* Players carry an in-game name only. The phone number and Telegram/Viber
   handle are held once at team level — we contact the leader, not each
   player individually. */
function cleanPlayer(p, slot) {
  p = p || {};
  return {
    slot: slot.key,
    role: ROLE_OPTIONS.includes(p.role) ? p.role : slot.label.replace(/ \d$/, ''),
    name: str(p.name, 60),
    // In-game ID, so admins can confirm a roster entry against the actual
    // Mobile Legends account rather than the in-game name alone.
    gameId: str(p.gameId, 30),
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
  if (!str(payload.teamPhone, 30)) errors.push('Team phone number is required.');
  if (!str(payload.teamContact, 80)) errors.push('Team Telegram or Viber account is required.');
  if (!str(payload.orderCode, 20)) errors.push('Order code is required.');

  const players = Array.isArray(payload.players) ? payload.players : [];
  ROSTER_SLOTS.forEach((slot, i) => {
    const p = players[i] || {};
    // Optional slots may simply be left empty; a starter needs a name.
    if (!slot.required) return;
    if (!str(p.name, 60)) errors.push(`${slot.label}: player name is required.`);
    if (!str(p.gameId, 30)) errors.push(`${slot.label}: player Game ID is required.`);
  });
  return errors;
}

// How many slots this tournament has left. Rejected entries free their slot
// back up; pending and approved ones both hold one.
function countTeams(tournamentId) {
  return listRegistrations(tournamentId).filter((r) => r.status !== 'rejected').length;
}
function isFull(tournamentId) {
  return countTeams(tournamentId) >= MAX_TEAMS;
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
    teamCode: nextTeamCode(list),
    tournamentId,
    teamLogo: payload.teamLogo ? String(payload.teamLogo) : '',
    teamName: str(payload.teamName, 60),
    teamTag: str(payload.teamTag, 10),
    leaderName: str(payload.leaderName, 60),
    region: REGION_VALUES.includes(payload.region) ? payload.region : 'MM',
    // One contact for the whole team, reachable via the leader.
    teamPhone: str(payload.teamPhone, 30),
    teamContactType: CONTACT_TYPES.includes(payload.teamContactType) ? payload.teamContactType : 'telegram',
    teamContact: str(payload.teamContact, 80),
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
      teamCode: r.teamCode || '',
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

/* Teams that registered before entry numbers existed have no code, which left
   the confirmed list showing a mix of "1", "2" and "S3-0001". This gives every
   one of them a number, in the order they entered, so the column is uniform.
   Runs once on boot and is a no-op from then on. */
function backfillTeamCodes() {
  const map = readAll();
  let touched = false;
  Object.keys(map).forEach((tid) => {
    const list = (map[tid] || []).slice()
      .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
    list.forEach((r) => {
      if (r.teamCode) return;
      r.teamCode = nextTeamCode(list);
      touched = true;
    });
  });
  if (touched) writeAll(map);
  return touched;
}

const ready = hydrate(SHEET_KEY, DB_FILE).then(() => { backfillTeamCodes(); });

module.exports = {
  listRegistrations, listApproved, createRegistration, updateRegistration, deleteRegistration,
  validate, isCodeUsed, countTeams, isFull, backfillTeamCodes,
  ROSTER_SLOTS, ROLE_OPTIONS, CONTACT_TYPES, REGIONS, MAX_TEAMS,
  TEAM_CODE_PREFIX, MIN_REGISTER_DIAMONDS, ready,
};
