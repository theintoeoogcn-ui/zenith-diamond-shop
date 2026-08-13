const express = require('express');
const router = express.Router();
const { getSocials, saveSocials } = require('../socialsDb');

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || '';

function isAdmin(req) {
  const supplied = req.get('x-admin-passcode') || (req.body && req.body.passcode) || '';
  return !!ADMIN_PASSCODE && supplied === ADMIN_PASSCODE;
}

// Public — the home page reads these to build the "Follow Zenith" row.
router.get('/', (req, res) => {
  res.json(getSocials());
});

// Admin-only — replaces the whole set (four fields, edited together in one
// modal), mirroring how /api/home-stats saves.
router.put('/', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Invalid admin passcode.' });
  res.json(saveSocials(req.body || {}));
});

module.exports = router;
