const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'orders.json');

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
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function writeAll(orders) {
  ensureFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(orders, null, 2), 'utf8');
}

function generateCode() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `ZE-${n}`;
}

function createOrder({ gameId, serverId, ignName, packageLabel, amount, paymentMethod, senderNumber, hasScreenshot }) {
  const orders = readAll();
  let code;
  do {
    code = generateCode();
  } while (orders.some((o) => o.code === code));

  const order = {
    code,
    gameId,
    serverId,
    ignName: ignName || null,
    packageLabel,
    amount,
    paymentMethod,
    senderNumber: senderNumber || null,
    hasScreenshot: !!hasScreenshot,
    status: 'pending', // pending -> notified -> confirmed | rejected
    createdAt: new Date().toISOString(),
    telegramMessageId: null,
  };
  orders.push(order);
  writeAll(orders);
  return order;
}

function getOrder(code) {
  return readAll().find((o) => o.code === code) || null;
}

function updateOrder(code, patch) {
  const orders = readAll();
  const idx = orders.findIndex((o) => o.code === code);
  if (idx === -1) return null;
  orders[idx] = { ...orders[idx], ...patch };
  writeAll(orders);
  return orders[idx];
}

module.exports = { createOrder, getOrder, updateOrder };
