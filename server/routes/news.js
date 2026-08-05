const express = require('express');
const router = express.Router();
const {
  listNews, createNews, updateNews, deleteNews, likeNews, addComment, deleteComment,
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

// Public — anyone can like a post. No login, no de-dup tracking server-side
// (kept intentionally simple); the frontend remembers what a browser has
// already liked using localStorage so the same visitor can't spam +1s from
// the UI, but this is not a hard security guarantee.
router.post('/:id/like', (req, res) => {
  const item = likeNews(req.params.id);
  if (!item) return res.status(404).json({ error: 'Post not found.' });
  res.json({ likes: item.likes });
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
