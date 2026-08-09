const express = require('express');
const router = express.Router();
const { getAds, saveAds } = require('../adsDb');

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || '';
function isAdmin(req) {
  const supplied = req.get('x-admin-passcode') || '';
  return !!ADMIN_PASSCODE && supplied === ADMIN_PASSCODE;
}

// Public — the home page's ad widgets need this to render, no login.
router.get('/', (req, res) => {
  res.json(getAds());
});

// Admin-only — replaces the whole ad list (simplest to keep in sync with
// the "Manage Ads" panel, which edits everything client-side before saving).
router.put('/', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Invalid admin passcode.' });
  const list = saveAds(req.body && req.body.ads);
  res.json(list);
});

module.exports = router;
