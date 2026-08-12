const express = require('express');
const router = express.Router();
const {
  listTournaments, createTournament, updateTournament, deleteTournament,
} = require('../tournamentsDb');

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || '';

// Everyone can read the tournament list — no passcode needed.
router.get('/', (req, res) => {
  res.json(listTournaments());
});

function isAdmin(req) {
  const supplied = req.get('x-admin-passcode') || (req.body && req.body.passcode) || '';
  // If no ADMIN_PASSCODE is configured on the server, admin actions are
  // disabled entirely (fails closed, not open) — set ADMIN_PASSCODE in
  // server/.env to turn the "Create Tournament" feature on.
  return !!ADMIN_PASSCODE && supplied === ADMIN_PASSCODE;
}

// Used by the frontend to check a passcode and unlock admin controls in the
// UI without creating/editing anything yet.
router.post('/verify', (req, res) => {
  res.json({ ok: isAdmin(req) });
});

router.post('/', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Invalid admin passcode.' });
  const { title } = req.body || {};
  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Title is required.' });
  }
  const item = await createTournament(req.body);
  res.status(201).json(item);
});

router.put('/:id', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Invalid admin passcode.' });
  const item = await updateTournament(req.params.id, req.body || {});
  if (!item) return res.status(404).json({ error: 'Tournament not found.' });
  res.json(item);
});

router.delete('/:id', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Invalid admin passcode.' });
  const ok = await deleteTournament(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Tournament not found.' });
  res.json({ ok: true });
});

module.exports = router;
