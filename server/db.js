const fs = require('fs');
const path = require('path');
const { hydrate, sync } = require('./persistentStore');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'orders.json');
const SHEET_KEY = 'orders';

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

/* Every write is mirrored up to the persistent store. Without this the order
   history lives only on Render's ephemeral disk, so a redeploy would wipe it —
   and the running order number would restart at ZE-0001 and hand out codes
   that had already been issued. */
function writeAll(orders) {
  ensureFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(orders, null, 2), 'utf8');
  sync(SHEET_KEY, orders);
}

const CODE_PREFIX = 'ZE';

/* Order codes run in sequence from ZE-0001 rather than being drawn at random,
   so they read as a running order number. The next number is derived from the
   codes already on file, which keeps it correct even if the data file is
   restored from a backup part-way through. */
function nextCode(orders) {
  orders = orders || readAll();
  const re = new RegExp('^' + CODE_PREFIX + '-(\\d+)$');
  let highest = 0;
  orders.forEach((o) => {
    const m = re.exec(String(o.code || ''));
    if (m) highest = Math.max(highest, Number(m[1]));
  });
  return `${CODE_PREFIX}-${String(highest + 1).padStart(4, '0')}`;
}

/* How many diamonds a package is worth, read off its label: "343 diamonds"
   is 343, and a double pack like "250 + 250 diamonds" is 500. Anything with
   no number in it — the weekly pass — counts as zero. */
function diamondsInLabel(label) {
  const nums = String(label || '').match(/\d+/g);
  if (!nums) return 0;
  return nums.reduce((sum, n) => sum + Number(n), 0);
}

function createOrder({ gameId, serverId, ignName, packageLabel, amount, paymentMethod, senderNumber, hasScreenshot }) {
  const orders = readAll();
  const code = nextCode(orders);

  const order = {
    code,
    gameId,
    serverId,
    ignName: ignName || null,
    packageLabel,
    // Stored on the order so the tournament entry gate doesn't have to
    // re-parse the label every time it checks a code.
    diamonds: diamondsInLabel(packageLabel),
    amount,
    paymentMethod,
    senderNumber: senderNumber || null,
    hasScreenshot: !!hasScreenshot,
    status: 'pending', // pending -> notified -> confirmed | rejected
    createdAt: new Date().toISOString(),
    telegramMessageId: null, // kept for backward compat with old saved orders
    // Every chat the order notification was posted to (admin DM, and the
    // optional group — see GROUP_CHAT_ID in bot.js), so a Confirm/Reject tap
    // in any one of them can update all of them to stay in sync.
    telegramMessages: [],
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

// Older orders were saved before the diamond count was stored, so fall back
// to reading it off the label for those.
function orderDiamonds(order) {
  if (!order) return 0;
  if (Number.isFinite(Number(order.diamonds))) return Number(order.diamonds);
  return diamondsInLabel(order.packageLabel);
}

/* Pulls the last-saved order history back down before the server starts
   taking traffic, so the first order after a deploy continues the sequence
   instead of colliding with an existing code. */
const ready = hydrate(SHEET_KEY, DB_FILE);

module.exports = {
  createOrder, getOrder, updateOrder, orderDiamonds, diamondsInLabel,
  nextCode, ready,
};
