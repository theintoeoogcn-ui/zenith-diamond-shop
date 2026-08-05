const express = require('express');
const router = express.Router();
const { getStats, saveStats } = require('../homeStatsDb');

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || '';

function isAdmin(req) {
  const supplied = req.get('x-admin-passcode') || (req.body && req.body.passcode) || '';
  return !!ADMIN_PASSCODE && supplied === ADMIN_PASSCODE;
}

router.get('/', (req, res) => {
  res.json(getStats());
});

router.put('/', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Invalid admin passcode.' });
  res.json(saveStats(req.body || {}));
});

module.exports = router;
