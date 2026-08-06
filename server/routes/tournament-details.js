const express = require('express');
const router = express.Router();
const { getDetail, saveDetail, deleteDetail, computeStandings } = require('../tournamentDetailsDb');

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || '';

function isAdmin(req) {
  const supplied = req.get('x-admin-passcode') || (req.body && req.body.passcode) || '';
  return !!ADMIN_PASSCODE && supplied === ADMIN_PASSCODE;
}

// Public — anyone viewing a tournament page can see its lineup/schedule/bracket.
router.get('/:tournamentId', (req, res) => {
  const detail = getDetail(req.params.tournamentId);
  res.json({ ...detail, standings: computeStandings(detail) });
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

module.exports = router;
