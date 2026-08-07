const express = require('express');
const router = express.Router();
const { getDetail, saveDetail, deleteDetail, computeStandings, vote, getBracketOutcome, BRACKET_SLOTS } = require('../tournamentDetailsDb');

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || '';

function isAdmin(req) {
  const supplied = req.get('x-admin-passcode') || (req.body && req.body.passcode) || '';
  return !!ADMIN_PASSCODE && supplied === ADMIN_PASSCODE;
}

// Public — anyone viewing a tournament page can see its lineup/schedule/bracket.
// Also includes computed standings and, for each bracket slot, the
// winner/loser carried over from the previous match (used by the admin UI
// to pre-fill the next slot's teams — nothing here needs auth since it's
// all derived from data that's already public).
router.get('/:tournamentId', (req, res) => {
  const detail = getDetail(req.params.tournamentId);
  const bracketOutcomes = {};
  BRACKET_SLOTS.forEach((slot) => { bracketOutcomes[slot] = getBracketOutcome(detail, slot); });
  res.json({ ...detail, standings: computeStandings(detail), bracketOutcomes });
});

// Admin-only — replaces the whole teams+matches set for this tournament
// (simplest to keep in sync with the admin UI, which edits everything
// client-side before saving).
router.put('/:tournamentId', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Invalid admin passcode.' });
  const detail = saveDetail(req.params.tournamentId, req.body || {});
  res.json({ ...detail, standings: computeStandings(detail) });
});

router.delete('/:tournamentId', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Invalid admin passcode.' });
  deleteDetail(req.params.tournamentId);
  res.json({ ok: true });
});

// Public — anyone can vote for who they think will win a group-stage
// match. No login; the frontend de-dupes per browser via localStorage.
router.post('/:tournamentId/vote/:matchId', (req, res) => {
  const { side } = req.body || {};
  if (side !== 'a' && side !== 'b') return res.status(400).json({ error: 'side must be "a" or "b".' });
  const votes = vote(req.params.tournamentId, req.params.matchId, side);
  if (!votes) return res.status(404).json({ error: 'Match not found.' });
  res.json({ votes });
});

module.exports = router;
