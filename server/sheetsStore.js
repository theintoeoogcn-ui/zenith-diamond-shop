// Render's free-tier filesystem is ephemeral: every deploy/restart wipes
// anything written to local disk (server/data/*.json). That's why admin
// edits (news posts, tournaments, prices, home stats) used to vanish after
// every deploy. This module gives those *Db.js files a durable backup: on
// boot they "hydrate" their local JSON file from this sheet, and on every
// write they push the fresh copy back up here — so a redeploy just reloads
// whatever was last saved instead of resetting to defaults.
//
// Storage shape (current): every key gets its own dedicated tab, named
// "Data_<key>" (e.g. "Data_tournaments", "Data_ads"). Each key's JSON is
// split into <=40,000-character chunks (Sheets has a ~50,000-character
// per-cell limit) stored as rows [chunkIndex, chunkText]. A save only ever
// touches its own tab.
//
// This replaced an earlier design where every key shared one "AppData" tab
// and every single save had to read-modify-write the *whole* tab — as more
// keys accumulated data (ad creatives and tournament cover images are both
// multi-hundred-KB base64 blobs), that shared rewrite got slow enough to
// occasionally fail outright, and a save that silently failed to sync would
// quietly vanish the next time the server restarted. Giving each key its
// own tab means a tournament save never has to read or rewrite the ads
// data (or vice versa) — the payload for any one save stays small no
// matter how much data other keys are holding.
//
// getValue() still falls back to reading the old shared "AppData" tab (by
// key, in column A) if a key's dedicated tab has nothing yet, so data
// saved before this change keeps loading normally. The first successful
// setValue() for that key afterward migrates it forward into its own tab.

let google = null;
try {
  google = require('googleapis').google;
} catch (e) {
  // googleapis not installed — handled by ENABLED check below, never throws.
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
  ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : '';

const ENABLED = !!google && !!SHEET_ID && !!CLIENT_EMAIL && !!PRIVATE_KEY;
const LEGACY_TAB_NAME = 'AppData';
const CHUNK_SIZE = 40000;

if (!ENABLED) {
  console.warn('⚠️  Persistent storage (Google Sheets) is not configured — orders, news posts, tournaments, prices, and home stats will reset every time this server redeploys, and order codes will restart from ZE-0001. Set GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY in server/.env to fix this permanently.');
}

// Sheet tab names can't contain : \ / ? * [ ] and top out around 100 chars.
// Our keys are simple identifiers, but sanitize anyway rather than trust it.
function tabNameFor(key) {
  const safe = String(key).replace(/[:\\/?*\[\]]/g, '_').slice(0, 90);
  return `Data_${safe}`;
}

let sheetsClient = null;
function getClient() {
  if (!ENABLED) return null;
  if (sheetsClient) return sheetsClient;
  const auth = new google.auth.JWT(CLIENT_EMAIL, null, PRIVATE_KEY, ['https://www.googleapis.com/auth/spreadsheets']);
  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

const ensuredTabs = new Set();
async function ensureTab(sheets, tabName) {
  if (ensuredTabs.has(tabName)) return;
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const exists = (meta.data.sheets || []).some((s) => s.properties.title === tabName);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] },
    });
  }
  ensuredTabs.add(tabName);
}

// Old shape only — reads the shared "AppData" tab, filtered to this key's
// rows. Used purely as a fallback for data saved before the per-key-tab
// change; never written to anymore.
async function getLegacyValue(sheets, key) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const exists = (meta.data.sheets || []).some((s) => s.properties.title === LEGACY_TAB_NAME);
  if (!exists) return undefined;
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${LEGACY_TAB_NAME}!A:C` });
  const rows = res.data.values || [];
  const chunks = rows
    .filter((r) => r[0] === key)
    .sort((a, b) => Number(a[1]) - Number(b[1]))
    .map((r) => r[2] || '');
  if (!chunks.length) return undefined;
  return chunks.join('');
}

// Returns `fallback` if Sheets isn't configured, the key has never been
// saved, or anything goes wrong — callers should always have a sane default
// ready (their existing local JSON file / hardcoded defaults).
async function getValue(key, fallback) {
  if (!ENABLED) return fallback;
  const tab = tabNameFor(key);
  await (writeQueues[key] || Promise.resolve()).catch(() => {}); // don't read while this key's write is in-flight
  try {
    const sheets = getClient();
    await ensureTab(sheets, tab);
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${tab}!A:B` });
    const rows = res.data.values || [];
    const chunks = rows
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map((r) => r[1] || '');
    let json = chunks.length ? chunks.join('') : undefined;
    if (json === undefined) json = await getLegacyValue(sheets, key);
    if (json === undefined) return fallback;
    return JSON.parse(json);
  } catch (e) {
    console.error(`sheetsStore: failed to load "${key}":`, e.message);
    return fallback;
  }
}

// Fire-and-forget friendly — always resolves, never throws, so a Sheets
// hiccup never breaks the admin action that triggered the save (the local
// file write already happened by the time this runs). Callers that need to
// know whether the backup actually succeeded can await the returned
// promise, which always resolves to { ok, error? } rather than rejecting.
//
// Each key writes only to its own dedicated tab, so concurrent saves to
// *different* keys no longer contend with each other. Saves to the *same*
// key are still queued one after another so a slow write can't be
// clobbered by a faster one that started later.
const writeQueues = {};
function setValue(key, value) {
  const prev = writeQueues[key] || Promise.resolve();
  const run = prev.then(() => doSetValue(key, value), () => doSetValue(key, value));
  writeQueues[key] = run;
  return run;
}

async function doSetValue(key, value) {
  if (!ENABLED) return { ok: true, skipped: true };
  const tab = tabNameFor(key);
  try {
    const sheets = getClient();
    await ensureTab(sheets, tab);
    const json = JSON.stringify(value);
    const chunks = [];
    for (let i = 0; i < json.length; i += CHUNK_SIZE) chunks.push(json.slice(i, i + CHUNK_SIZE));
    const rows = chunks.map((c, i) => [String(i), c]);

    await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: `${tab}!A:B` });
    if (rows.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${tab}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: rows },
      });
    }
    return { ok: true };
  } catch (e) {
    console.error(`sheetsStore: failed to save "${key}":`, e.message);
    return { ok: false, error: e.message };
  }
}

module.exports = { getValue, setValue, ENABLED };
