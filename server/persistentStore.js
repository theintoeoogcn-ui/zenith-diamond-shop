const fs = require('fs');
const path = require('path');
const sheetsStore = require('./sheetsStore');

// On boot: pull the last-saved copy down from Sheets and overwrite the local
// JSON file with it (if Sheets has anything saved). Local reads/writes stay
// fast and unchanged — this just makes sure a fresh deploy doesn't start
// from an empty/default file.
async function hydrate(key, dbFile) {
  if (!sheetsStore.ENABLED) return;
  const remote = await sheetsStore.getValue(key, null);
  if (remote !== null) {
    const dir = path.dirname(dbFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dbFile, JSON.stringify(remote, null, 2), 'utf8');
  }
}

// Push the current full dataset up to Sheets. Returns a promise that
// ALWAYS resolves — never rejects — with { ok, skipped?, error? }, so a
// Sheets hiccup never crashes the caller. Most callers can ignore the
// returned promise (fire-and-forget is fine for low-stakes data), but
// callers that want to warn the admin when a save didn't durably persist
// (e.g. tournaments, whose data has been lost to this before) should
// `await` it and check `.ok`.
function sync(key, data) {
  if (!sheetsStore.ENABLED) return Promise.resolve({ ok: true, skipped: true });
  return sheetsStore.setValue(key, data).catch((e) => ({ ok: false, error: e.message }));
}

module.exports = { hydrate, sync };
