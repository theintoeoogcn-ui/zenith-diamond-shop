const express = require('express');
const router = express.Router();
const { getPricing, savePricing } = require('../diamondPricingDb');

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || '';

function isAdmin(req) {
  const supplied = req.get('x-admin-passcode') || (req.body && req.body.passcode) || '';
  return !!ADMIN_PASSCODE && supplied === ADMIN_PASSCODE;
}

// Public — the storefront needs this to render the package grid.
router.get('/', (req, res) => {
  res.json(getPricing());
});

// Admin-only — replaces the whole pricing document at once (simplest to
// keep in sync with the admin UI, which edits the full list client-side
// before saving).
router.put('/', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Invalid admin passcode.' });
  const saved = savePricing(req.body || {});
  res.json(saved);
});

module.exports = router;
