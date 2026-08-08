const express = require('express');
const router = express.Router();
const regDb = require('../registrationsDb');
const orderDb = require('../db');

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || '';

function isAdmin(req) {
  const supplied = req.get('x-admin-passcode') || (req.body && req.body.passcode) || '';
  return !!ADMIN_PASSCODE && supplied === ADMIN_PASSCODE;
}

/* An order code is only good enough to register with when it is a real
   diamond purchase that we actually confirmed, and hasn't already been spent
   on another team. Returns { ok } or { ok:false, reason }. */
function checkOrderCode(rawCode) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) return { ok: false, reason: 'Enter the order code from your diamond purchase.' };

  const order = orderDb.getOrder(code);
  if (!order) return { ok: false, reason: 'That order code was not found. Check it and try again.' };
  if (order.status !== 'confirmed') {
    return { ok: false, reason: 'That order is not confirmed yet. Wait for confirmation, then register.' };
  }
  if (regDb.isCodeUsed(code)) {
    return { ok: false, reason: 'That order code has already been used to register a team.' };
  }
  return { ok: true, order };
}

// Public — lets the form tell the user their code is good (or why it isn't)
// before they fill in eight players and hit submit.
router.get('/verify-code/:code', (req, res) => {
  const result = checkOrderCode(req.params.code);
  res.json({ ok: result.ok, reason: result.reason || null });
});

// Public — the roster shape, so the form is driven by the server's definition
// of which slots exist and which are required.
router.get('/schema', (req, res) => {
  res.json({
    slots: regDb.ROSTER_SLOTS,
    roles: regDb.ROLE_OPTIONS,
    contactTypes: regDb.CONTACT_TYPES,
    regions: regDb.REGIONS,
  });
});

// Admin — full list for a tournament, including contact details.
router.get('/:tournamentId', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Invalid admin passcode.' });
  res.json({ registrations: regDb.listRegistrations(req.params.tournamentId) });
});

// Public — the approved teams, with contact details stripped out. This is what
// the "Confirmed Teams" view reads, so anyone can see who's in without any of
// the entrants' phone numbers being exposed.
router.get('/:tournamentId/approved', (req, res) => {
  res.json({ teams: regDb.listApproved(req.params.tournamentId) });
});

// Public — how many teams have entered so far. Deliberately just a count, so
// the roster and phone numbers of other teams aren't exposed.
router.get('/:tournamentId/count', (req, res) => {
  const list = regDb.listRegistrations(req.params.tournamentId);
  res.json({ total: list.length, approved: list.filter((r) => r.status === 'approved').length });
});

// Public — submit a team.
router.post('/:tournamentId', (req, res) => {
  const payload = req.body || {};

  const errors = regDb.validate(payload);
  if (errors.length) return res.status(400).json({ error: errors[0], errors });

  const codeCheck = checkOrderCode(payload.orderCode);
  if (!codeCheck.ok) return res.status(400).json({ error: codeCheck.reason });

  const entry = regDb.createRegistration(req.params.tournamentId, payload);
  res.json({ registration: entry });
});

router.patch('/:tournamentId/:id', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Invalid admin passcode.' });
  const updated = regDb.updateRegistration(req.params.tournamentId, req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'Registration not found.' });
  res.json({ registration: updated });
});

router.delete('/:tournamentId/:id', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Invalid admin passcode.' });
  if (!regDb.deleteRegistration(req.params.tournamentId, req.params.id)) {
    return res.status(404).json({ error: 'Registration not found.' });
  }
  res.json({ ok: true });
});

module.exports = router;
