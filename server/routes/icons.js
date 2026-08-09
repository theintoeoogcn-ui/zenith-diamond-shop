const express = require('express');
const router = express.Router();
const { getIcons, setIcon, removeIcon } = require('../iconsDb');

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || '';
function isAdmin(req) {
  const supplied = req.get('x-admin-passcode') || '';
  return !!ADMIN_PASSCODE && supplied === ADMIN_PASSCODE;
}

function validKind(kind) {
  return kind === 'hero' || kind === 'item';
}

// Public — the match-view modal needs this to render hero/item icons for
// every visitor, not just admins.
router.get('/', (req, res) => {
  res.json(getIcons());
});

// Admin-only — upload/replace one hero or item's icon by name. Kept as a
// single-entry upsert (rather than replacing the whole library like Ads
// does) because icons get added one at a time, in the flow of reviewing a
// match, not edited in bulk.
router.put('/:kind', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Invalid admin passcode.' });
  if (!validKind(req.params.kind)) return res.status(400).json({ error: 'kind must be "hero" or "item".' });
  const { name, image } = req.body || {};
  if (!name || typeof name !== 'string') return res.status(400).json({ error: 'name is required.' });
  const result = setIcon(req.params.kind, name, image);
  if (!result) return res.status(400).json({ error: 'Invalid icon image, or the library is full.' });
  res.json(result);
});

router.delete('/:kind/:name', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Invalid admin passcode.' });
  if (!validKind(req.params.kind)) return res.status(400).json({ error: 'kind must be "hero" or "item".' });
  const result = removeIcon(req.params.kind, decodeURIComponent(req.params.name));
  if (!result) return res.status(400).json({ error: 'Invalid request.' });
  res.json(result);
});

module.exports = router;
