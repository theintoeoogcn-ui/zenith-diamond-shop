const fs = require('fs');
const path = require('path');
const { hydrate, sync } = require('./persistentStore');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'news.json');
const SHEET_KEY = 'news';

const REACTION_TYPES = ['like', 'love', 'haha', 'wow', 'sad'];
function emptyReactions() {
  return { like: 0, love: 0, haha: 0, wow: 0, sad: 0 };
}

function ensureFile() {
  if (!fs.existsSync(path.dirname(DB_FILE))) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, '[]', 'utf8');
  }
}

function readAll() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeAll(list) {
  ensureFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2), 'utf8');
  sync(SHEET_KEY, list);
}

function generateId(prefix) {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1000);
}

// Old posts saved before multi-reactions existed only have a `likes` number
// — fold that into the new shape the first time we touch a post so nothing
// gets lost.
function normalize(item) {
  if (!item.reactions) {
    item.reactions = emptyReactions();
    if (item.likes) item.reactions.like = item.likes;
  }
  delete item.likes;
  return item;
}

function listNews() {
  return readAll().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).map(normalize);
}

function createNews(data) {
  const list = readAll();
  const item = {
    id: generateId('N'),
    title: String(data.title || '').trim(),
    body: data.body ? String(data.body).trim() : '',
    link: data.link ? String(data.link).trim() : '',
    media: data.media ? String(data.media) : '', // image data URL, or a video URL (YouTube/Facebook/mp4)
    mediaType: data.mediaType === 'video' ? 'video' : (data.media ? 'image' : ''),
    isLive: !!data.isLive,
    reactions: emptyReactions(),
    comments: [],
    createdAt: new Date().toISOString(),
  };
  list.push(item);
  writeAll(list);
  return item;
}

function updateNews(id, patch) {
  const list = readAll();
  const idx = list.findIndex((n) => n.id === id);
  if (idx === -1) return null;
  const clean = normalize({ ...list[idx] });
  if (patch.title !== undefined) clean.title = String(patch.title).trim();
  if (patch.body !== undefined) clean.body = String(patch.body).trim();
  if (patch.link !== undefined) clean.link = String(patch.link).trim();
  if (patch.media !== undefined) {
    clean.media = String(patch.media);
    clean.mediaType = patch.mediaType === 'video' ? 'video' : (clean.media ? 'image' : '');
  }
  if (patch.isLive !== undefined) clean.isLive = !!patch.isLive;
  list[idx] = clean;
  writeAll(list);
  return list[idx];
}

function deleteNews(id) {
  const list = readAll();
  const next = list.filter((n) => n.id !== id);
  if (next.length === list.length) return false;
  writeAll(next);
  return true;
}

// Facebook-style reactions: a visitor can pick one of several reaction
// types (no account needed). `previousType` is whatever the browser
// remembers it picked last (via localStorage) so we can move the count
// from the old type to the new one, or clear it entirely if they tap the
// same reaction again to remove it.
function reactNews(id, { type, previousType }) {
  const list = readAll();
  const idx = list.findIndex((n) => n.id === id);
  if (idx === -1) return null;
  const item = normalize(list[idx]);

  if (previousType && REACTION_TYPES.includes(previousType) && item.reactions[previousType] > 0) {
    item.reactions[previousType]--;
  }
  if (type && REACTION_TYPES.includes(type) && type !== previousType) {
    item.reactions[type] = (item.reactions[type] || 0) + 1;
  }

  list[idx] = item;
  writeAll(list);
  return item;
}

function addComment(id, { name, text }) {
  const list = readAll();
  const idx = list.findIndex((n) => n.id === id);
  if (idx === -1) return null;
  const comment = {
    id: generateId('C'),
    name: String(name || 'Guest').trim().slice(0, 40) || 'Guest',
    text: String(text || '').trim().slice(0, 500),
    createdAt: new Date().toISOString(),
  };
  if (!comment.text) return null;
  list[idx].comments = list[idx].comments || [];
  list[idx].comments.push(comment);
  writeAll(list);
  return list[idx];
}

function deleteComment(id, commentId) {
  const list = readAll();
  const idx = list.findIndex((n) => n.id === id);
  if (idx === -1) return false;
  const before = (list[idx].comments || []).length;
  list[idx].comments = (list[idx].comments || []).filter((c) => c.id !== commentId);
  if (list[idx].comments.length === before) return false;
  writeAll(list);
  return true;
}

const ready = hydrate(SHEET_KEY, DB_FILE);

module.exports = {
  listNews, createNews, updateNews, deleteNews, reactNews, addComment, deleteComment, ready, REACTION_TYPES,
};
