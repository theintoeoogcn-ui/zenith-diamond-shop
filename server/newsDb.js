const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'news.json');

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
}

function generateId(prefix) {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1000);
}

function listNews() {
  return readAll().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
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
    likes: 0,
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
  const clean = { ...list[idx] };
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

function likeNews(id) {
  const list = readAll();
  const idx = list.findIndex((n) => n.id === id);
  if (idx === -1) return null;
  list[idx].likes = (list[idx].likes || 0) + 1;
  writeAll(list);
  return list[idx];
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

module.exports = {
  listNews, createNews, updateNews, deleteNews, likeNews, addComment, deleteComment,
};
