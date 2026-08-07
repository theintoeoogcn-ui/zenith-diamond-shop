const fs = require('fs');
const path = require('path');
const { hydrate, sync } = require('./persistentStore');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'tournament-details.json');
const SHEET_KEY = 'tournamentDetails';

// Stored as a map: { [tournamentId]: { teams: [...], matches: [...] } }

const ROLES = ['Exp', 'Jungle', 'Mid', 'Gold', 'Roam', 'Coach', 'Manager', 'Sub'];
const TEAM_STATUSES = ['invited', 'qualified', 'open_qualifier'];
// The six fixed slots of a 4-team double-elimination bracket.
const BRACKET_SLOTS = ['ubsf1', 'ubsf2', 'lbr1', 'ubf', 'lbf', 'gf'];

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

function genId(prefix) {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1000);
}

function cleanPlayer(p) {
  return {
    id: p.id || genId('P'),
    name: String(p.name || '').trim().slice(0, 40),
    role: ROLES.includes(p.role) ? p.role : 'Sub',
    photo: p.photo ? String(p.photo) : '', // data URL, optional
  };
}

function cleanTeam(t) {
  return {
    id: t.id || genId('T'),
    name: String(t.name || '').trim().slice(0, 60),
    tag: String(t.tag || '').trim().slice(0, 10),
    logo: t.logo ? String(t.logo) : '', // data URL, optional
    status: TEAM_STATUSES.includes(t.status) ? t.status : 'invited',
    players: Array.isArray(t.players) ? t.players.map(cleanPlayer) : [],
  };
}

function cleanMatch(m) {
  const stage = m.stage === 'bracket' ? 'bracket' : 'group';
  const base = {
    id: m.id || genId('M'),
    stage,
    teamAId: m.teamAId || '',
    teamBId: m.teamBId || '',
    scoreA: Number.isFinite(Number(m.scoreA)) ? Number(m.scoreA) : null,
    scoreB: Number.isFinite(Number(m.scoreB)) ? Number(m.scoreB) : null,
    status: ['upcoming', 'live', 'completed'].includes(m.status) ? m.status : 'upcoming',
    scheduledAt: String(m.scheduledAt || '').trim(),
    votes: { a: Number(m.votes && m.votes.a) || 0, b: Number(m.votes && m.votes.b) || 0 },
  };
  if (stage === 'group') {
    return {
      ...base,
      group: m.group === 'B' ? 'B' : 'A',
      day: String(m.day || 'Day 1').trim().slice(0, 30),
    };
  }
  return {
    ...base,
    bracketSlot: BRACKET_SLOTS.includes(m.bracketSlot) ? m.bracketSlot : 'ubsf1',
  };
}

function getDetail(tournamentId) {
  const all = readAll();
  return all[tournamentId] || emptyDetail();
}

function saveDetail(tournamentId, data) {
  const all = readAll();
  // Bracket matches are keyed by slot — only one match per slot allowed.
  const bracketSeen = new Set();
  const cleanMatches = (Array.isArray(data.matches) ? data.matches : [])
    .map(cleanMatch)
    .filter((m) => {
      if (m.stage !== 'bracket') return true;
      if (bracketSeen.has(m.bracketSlot)) return false;
      bracketSeen.add(m.bracketSlot);
      return true;
    });
  const clean = {
    teams: Array.isArray(data.teams) ? data.teams.map(cleanTeam) : [],
    matches: cleanMatches,
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

function vote(tournamentId, matchId, side) {
  const all = readAll();
  const detail = all[tournamentId];
  if (!detail) return null;
  const m = detail.matches.find((x) => x.id === matchId);
  if (!m) return null;
  if (!m.votes) m.votes = { a: 0, b: 0 };
  if (side === 'a') m.votes.a++;
  else if (side === 'b') m.votes.b++;
  else return null;
  writeAll(all);
  return m.votes;
}

// Derives Group A / Group B standings from completed group-stage matches —
// admins enter match results, never standings directly, so this can never
// drift out of sync with the actual scores. Sort order matches typical
// esports group tiebreakers: match points, then net game win, then game wins.
function computeStandings(detail) {
  const table = { A: {}, B: {} };
  const teamsById = {};
  detail.teams.forEach((tm) => { teamsById[tm.id] = tm; });

  function ensureRow(g, teamId) {
    if (!table[g][teamId]) {
      table[g][teamId] = { matchWins: 0, matchLosses: 0, gameWins: 0, gameLosses: 0 };
    }
    return table[g][teamId];
  }

  detail.matches
    .filter((m) => m.stage === 'group' && (m.group === 'A' || m.group === 'B') && m.status === 'completed'
      && m.scoreA !== null && m.scoreB !== null && m.teamAId && m.teamBId)
    .forEach((m) => {
      const g = m.group;
      const rowA = ensureRow(g, m.teamAId);
      const rowB = ensureRow(g, m.teamBId);
      rowA.gameWins += m.scoreA; rowA.gameLosses += m.scoreB;
      rowB.gameWins += m.scoreB; rowB.gameLosses += m.scoreA;
      if (m.scoreA > m.scoreB) { rowA.matchWins++; rowB.matchLosses++; }
      else if (m.scoreB > m.scoreA) { rowB.matchWins++; rowA.matchLosses++; }
    });

  const result = { A: [], B: [] };
  ['A', 'B'].forEach((g) => {
    result[g] = Object.keys(table[g])
      .map((teamId) => {
        const r = table[g][teamId];
        return {
          team: teamsById[teamId] || { id: teamId, name: 'Unknown', tag: '' },
          matchWins: r.matchWins,
          matchLosses: r.matchLosses,
          matchPoints: r.matchWins,
          gameWins: r.gameWins,
          gameLosses: r.gameLosses,
          netGameWin: r.gameWins - r.gameLosses,
        };
      })
      .sort((a, b) => b.matchPoints - a.matchPoints || b.netGameWin - a.netGameWin || b.gameWins - a.gameWins);
  });
  return result;
}

// For bracket UX: figure out the winner/loser team of a given slot (if that
// match has been played), so the next slot's team dropdowns can be
// pre-filled automatically instead of the admin re-picking from scratch.
function getBracketOutcome(detail, slot) {
  const m = detail.matches.find((x) => x.stage === 'bracket' && x.bracketSlot === slot);
  if (!m || m.scoreA === null || m.scoreB === null || m.scoreA === m.scoreB) return { winner: null, loser: null };
  return m.scoreA > m.scoreB
    ? { winner: m.teamAId, loser: m.teamBId }
    : { winner: m.teamBId, loser: m.teamAId };
}

const ready = hydrate(SHEET_KEY, DB_FILE);

module.exports = {
  getDetail, saveDetail, deleteDetail, computeStandings, vote, getBracketOutcome,
  ROLES, TEAM_STATUSES, BRACKET_SLOTS, ready,
};
