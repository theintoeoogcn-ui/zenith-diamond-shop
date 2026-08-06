const fs = require('fs');
const path = require('path');
const { hydrate, sync } = require('./persistentStore');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'tournament-details.json');
const SHEET_KEY = 'tournamentDetails';

// Stored as a map: { [tournamentId]: { teams: [...], matches: [...] } }

function ensureFile() {
  if (!fs.existsSync(path.dirname(DB_FILE))) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, '{}', 'utf8');
  }
}

function readAll() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

function writeAll(map) {
  ensureFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(map, null, 2), 'utf8');
  sync(SHEET_KEY, map);
}

function emptyDetail() {
  return { teams: [], matches: [] };
}

function cleanTeam(t) {
  return {
    id: t.id || ('T-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1000)),
    name: String(t.name || '').trim().slice(0, 60),
    tag: String(t.tag || '').trim().slice(0, 10),
    players: String(t.players || '').trim().slice(0, 400),
  };
}

function cleanMatch(m) {
  return {
    id: m.id || ('M-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1000)),
    stage: m.stage === 'bracket' ? 'bracket' : 'group', // 'group' or 'bracket'
    group: m.group === 'B' ? 'B' : (m.group === 'A' ? 'A' : ''), // group stage only
    bracketSide: m.bracketSide === 'lower' ? 'lower' : (m.bracketSide === 'upper' ? 'upper' : ''), // bracket only
    round: String(m.round || '').trim().slice(0, 40), // e.g. "Round 1", "Grand Final"
    teamAId: m.teamAId || '',
    teamBId: m.teamBId || '',
    scoreA: Number.isFinite(Number(m.scoreA)) ? Number(m.scoreA) : null,
    scoreB: Number.isFinite(Number(m.scoreB)) ? Number(m.scoreB) : null,
    scheduledAt: String(m.scheduledAt || '').trim(),
    status: ['upcoming', 'live', 'completed'].includes(m.status) ? m.status : 'upcoming',
  };
}

function getDetail(tournamentId) {
  const all = readAll();
  return all[tournamentId] || emptyDetail();
}

function saveDetail(tournamentId, data) {
  const all = readAll();
  const clean = {
    teams: Array.isArray(data.teams) ? data.teams.map(cleanTeam) : [],
    matches: Array.isArray(data.matches) ? data.matches.map(cleanMatch) : [],
  };
  all[tournamentId] = clean;
  writeAll(all);
  return clean;
}

function deleteDetail(tournamentId) {
  const all = readAll();
  if (!(tournamentId in all)) return false;
  delete all[tournamentId];
  writeAll(all);
  return true;
}

// Derives Group A / Group B standings from completed group-stage matches —
// admins enter match results, not standings directly, so this can never
// drift out of sync with the actual scores.
function computeStandings(detail) {
  const table = { A: {}, B: {} };
  const teamsById = {};
  detail.teams.forEach((t) => { teamsById[t.id] = t; });

  detail.matches
    .filter((m) => m.stage === 'group' && (m.group === 'A' || m.group === 'B') && m.status === 'completed'
      && m.scoreA !== null && m.scoreB !== null && m.teamAId && m.teamBId)
    .forEach((m) => {
      const g = m.group;
      if (!table[g][m.teamAId]) table[g][m.teamAId] = { wins: 0, losses: 0, points: 0 };
      if (!table[g][m.teamBId]) table[g][m.teamBId] = { wins: 0, losses: 0, points: 0 };
      if (m.scoreA > m.scoreB) {
        table[g][m.teamAId].wins++; table[g][m.teamAId].points += 3;
        table[g][m.teamBId].losses++;
      } else if (m.scoreB > m.scoreA) {
        table[g][m.teamBId].wins++; table[g][m.teamBId].points += 3;
        table[g][m.teamAId].losses++;
      }
    });

  const result = { A: [], B: [] };
  ['A', 'B'].forEach((g) => {
    result[g] = Object.keys(table[g])
      .map((teamId) => ({
        team: teamsById[teamId] || { id: teamId, name: 'Unknown', tag: '' },
        wins: table[g][teamId].wins,
        losses: table[g][teamId].losses,
        points: table[g][teamId].points,
      }))
      .sort((a, b) => b.points - a.points || b.wins - a.wins);
  });
  return result;
}

const ready = hydrate(SHEET_KEY, DB_FILE);

module.exports = { getDetail, saveDetail, deleteDetail, computeStandings, ready };
