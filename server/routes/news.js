const express = require('express');
const router = express.Router();
const {
  listNews, createNews, updateNews, deleteNews, reactNews, addComment, deleteComment,
} = require('../newsDb');

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || '';

function isAdmin(req) {
  const supplied = req.get('x-admin-passcode') || (req.body && req.body.passcode) || '';
  return !!ADMIN_PASSCODE && supplied === ADMIN_PASSCODE;
}

// Public — anyone can read the news feed.
router.get('/', (req, res) => {
  res.json(listNews());
});

// Admin-only — create a post.
router.post('/', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Invalid admin passcode.' });
  const { title } = req.body || {};
  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Title is required.' });
  }
  res.status(201).json(createNews(req.body));
});

router.put('/:id', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Invalid admin passcode.' });
  const item = updateNews(req.params.id, req.body || {});
  if (!item) return res.status(404).json({ error: 'Post not found.' });
  res.json(item);
});

router.delete('/:id', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Invalid admin passcode.' });
  const ok = deleteNews(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Post not found.' });
  res.json({ ok: true });
});

// Public — anyone can react to a post with one of several reaction types
// (like Facebook). No login, no server-side de-dup tracking (kept
// intentionally simple); the frontend remembers what a browser last picked
// via localStorage and sends it along as `previousType` so the count moves
// from the old reaction to the new one instead of just piling up.
router.post('/:id/react', (req, res) => {
  const { type, previousType } = req.body || {};
  const item = reactNews(req.params.id, { type, previousType });
  if (!item) return res.status(404).json({ error: 'Post not found.' });
  res.json({ reactions: item.reactions });
});

// Public — anyone can comment, no account needed. Just a display name + text.
router.post('/:id/comments', (req, res) => {
  const { name, text } = req.body || {};
  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: 'Comment text is required.' });
  }
  const item = addComment(req.params.id, { name, text });
  if (!item) return res.status(404).json({ error: 'Post not found.' });
  res.status(201).json(item);
});

// Admin-only — moderate/remove a comment.
router.delete('/:id/comments/:commentId', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Invalid admin passcode.' });
  const ok = deleteComment(req.params.id, req.params.commentId);
  if (!ok) return res.status(404).json({ error: 'Comment not found.' });
  res.json({ ok: true });
});

module.exports = router;
