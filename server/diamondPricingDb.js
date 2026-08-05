const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'diamond-pricing.json');

// These match the prices the site shipped with — used the first time the
// server runs (before an admin has ever saved anything) and as a fallback
// if the data file is ever missing or corrupted.
const DEFAULTS = {
  diamondPacks: [
    { amt: '86', price: 5500 }, { amt: '172', price: 11000 }, { amt: '257', price: 15500 },
    { amt: '343', price: 20700 }, { amt: '429', price: 25800 }, { amt: '514', price: 31000 },
    { amt: '600', price: 36000 }, { amt: '706', price: 41200 }, { amt: '792', price: 46350 },
    { amt: '878', price: 51500 }, { amt: '963', price: 56650 }, { amt: '1049', price: 62000 },
  ],
  doublePacks: [
    { amt: '50 + 50', price: 3500 }, { amt: '150 + 150', price: 10500 },
    { amt: '250 + 250', price: 17500 }, { amt: '500 + 500', price: 35000 },
  ],
  weeklyPassPrice: 35000,
};

function ensureFile() {
  if (!fs.existsSync(path.dirname(DB_FILE))) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULTS, null, 2), 'utf8');
  }
}

function getPricing() {
  ensureFile();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const data = JSON.parse(raw);
    return {
      diamondPacks: Array.isArray(data.diamondPacks) ? data.diamondPacks : DEFAULTS.diamondPacks,
      doublePacks: Array.isArray(data.doublePacks) ? data.doublePacks : DEFAULTS.doublePacks,
      weeklyPassPrice: typeof data.weeklyPassPrice === 'number' ? data.weeklyPassPrice : DEFAULTS.weeklyPassPrice,
    };
  } catch (e) {
    return DEFAULTS;
  }
}

function cleanPacks(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((p) => ({
      amt: String(p && p.amt !== undefined ? p.amt : '').trim(),
      price: Number(p && p.price),
    }))
    .filter((p) => p.amt && Number.isFinite(p.price) && p.price > 0);
}

function savePricing(data) {
  ensureFile();
  const clean = {
    diamondPacks: cleanPacks(data.diamondPacks),
    doublePacks: cleanPacks(data.doublePacks),
    weeklyPassPrice: Number.isFinite(Number(data.weeklyPassPrice)) && Number(data.weeklyPassPrice) > 0
      ? Number(data.weeklyPassPrice)
      : DEFAULTS.weeklyPassPrice,
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(clean, null, 2), 'utf8');
  return clean;
}

module.exports = { getPricing, savePricing };
