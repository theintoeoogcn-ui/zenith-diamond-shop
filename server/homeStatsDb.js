const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'home-stats.json');

const DEFAULTS = {
  tournaments: '2+',
  diamondSold: '3,000+',
  players: '700+',
  rating: '4.9 / 5',
};

function ensureFile() {
  if (!fs.existsSync(path.dirname(DB_FILE))) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULTS, null, 2), 'utf8');
  }
}

function getStats() {
  ensureFile();
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return {
      tournaments: data.tournaments || DEFAULTS.tournaments,
      diamondSold: data.diamondSold || DEFAULTS.diamondSold,
      players: data.players || DEFAULTS.players,
      rating: data.rating || DEFAULTS.rating,
    };
  } catch (e) {
    return DEFAULTS;
  }
}

function saveStats(data) {
  ensureFile();
  const clean = {
    tournaments: String(data.tournaments || DEFAULTS.tournaments).trim().slice(0, 20),
    diamondSold: String(data.diamondSold || DEFAULTS.diamondSold).trim().slice(0, 20),
    players: String(data.players || DEFAULTS.players).trim().slice(0, 20),
    rating: String(data.rating || DEFAULTS.rating).trim().slice(0, 20),
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(clean, null, 2), 'utf8');
  return clean;
}

module.exports = { getStats, saveStats };
