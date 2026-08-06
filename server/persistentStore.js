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

// Fire-and-forget push of the current full dataset up to Sheets. Called
// after every local write so Sheets always has the latest copy ready for
// the next deploy's hydrate().
function sync(key, data) {
  if (!sheetsStore.ENABLED) return;
  sheetsStore.setValue(key, data).catch(() => {});
}

module.exports = { hydrate, sync };
