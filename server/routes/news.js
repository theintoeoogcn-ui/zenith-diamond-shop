const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const {
  listNews, getNewsMedia, createNews, updateNews, deleteNews, reactNews, addComment, deleteComment, viewNews,
} = require('../newsDb');

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || '';

function isAdmin(req) {
  const supplied = req.get('x-admin-passcode') || (req.body && req.body.passcode) || '';
  return !!ADMIN_PASSCODE && supplied === ADMIN_PASSCODE;
}

// Public — anyone can read the news feed. Admins (passcode verified) also
// see posts still scheduled for the future so they can manage them ahead
// of time; everyone else only sees what's actually published.
router.get('/', (req, res) => {
  res.json(listNews(isAdmin(req)));
});

// Public — serves one post's uploaded photo as real binary image bytes.
// The feed JSON deliberately omits the base64 (see stripHeavyMedia in
// newsDb.js); the browser pulls each photo through here instead, so images
// load lazily and in parallel and can actually be cached, rather than every
// byte having to arrive before a single post can render.
router.get('/:id/media', (req, res) => {
  const media = getNewsMedia(req.params.id);
  const match = /^data:([\w.+-]+\/[\w.+-]+);base64,(.*)$/s.exec(media || '');
  if (!match) return res.status(404).end();

  const [, mime, b64] = match;
  const buf = Buffer.from(b64, 'base64');
  // Content-derived ETag: editing a post's photo changes the bytes and so
  // changes the tag, which is what lets the response be cached hard while
  // still updating immediately when the admin swaps the image.
  const etag = '"' + crypto.createHash('sha1').update(buf).digest('base64') + '"';

  res.set('Content-Type', mime);
  res.set('Cache-Control', 'public, max-age=86400');
  res.set('ETag', etag);
  if (req.get('If-None-Match') === etag) return res.status(304).end();
  res.send(buf);
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

// Public — bumps the view count. The frontend only calls this once per
// visitor per post (tracked client-side via sessionStorage) so a single
// visitor scrolling past a post repeatedly doesn't inflate the count.
router.post('/:id/view', (req, res) => {
  const item = viewNews(req.params.id);
  if (!item) return res.status(404).json({ error: 'Post not found.' });
  res.json({ views: item.views });
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
