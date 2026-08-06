// Render's free-tier filesystem is ephemeral: every deploy/restart wipes
// anything written to local disk (server/data/*.json). That's why admin
// edits (news posts, tournaments, prices, home stats) used to vanish after
// every deploy. This module gives those *Db.js files a durable backup: on
// boot they "hydrate" their local JSON file from this sheet, and on every
// write they push the fresh copy back up here — so a redeploy just reloads
// whatever was last saved instead of resetting to defaults.
//
// Storage shape: a dedicated "AppData" tab in the same spreadsheet used for
// order history. Each key's JSON is split into <=40,000-character chunks
// (Sheets has a ~50,000-character-per-cell limit) stored as rows
// [key, chunkIndex, chunkText]. Reading a key means concatenating all its
// chunk rows in order; writing a key means replacing all its chunk rows.

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
const TAB_NAME = 'AppData';
const CHUNK_SIZE = 40000;

if (!ENABLED) {
  console.warn('⚠️  Persistent storage (Google Sheets) is not configured — News posts, tournaments, prices, and home stats will reset to defaults every time this server redeploys. Set GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY in server/.env to fix this permanently.');
}

let sheetsClient = null;
function getClient() {
  if (!ENABLED) return null;
  if (sheetsClient) return sheetsClient;
  const auth = new google.auth.JWT(CLIENT_EMAIL, null, PRIVATE_KEY, ['https://www.googleapis.com/auth/spreadsheets']);
  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

let tabEnsured = false;
async function ensureTab(sheets) {
  if (tabEnsured) return;
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const exists = (meta.data.sheets || []).some((s) => s.properties.title === TAB_NAME);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: TAB_NAME } } }] },
    });
  }
  tabEnsured = true;
}

// Returns `fallback` if Sheets isn't configured, the key has never been
// saved, or anything goes wrong — callers should always have a sane default
// ready (their existing local JSON file / hardcoded defaults).
async function getValue(key, fallback) {
  if (!ENABLED) return fallback;
  await writeQueue.catch(() => {}); // don't read while a write is in-flight
  try {
    const sheets = getClient();
    await ensureTab(sheets);
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${TAB_NAME}!A:C` });
    const rows = res.data.values || [];
    const chunks = rows
      .filter((r) => r[0] === key)
      .sort((a, b) => Number(a[1]) - Number(b[1]))
      .map((r) => r[2] || '');
    if (!chunks.length) return fallback;
    return JSON.parse(chunks.join(''));
  } catch (e) {
    console.error(`sheetsStore: failed to load "${key}":`, e.message);
    return fallback;
  }
}

// Fire-and-forget friendly — always resolves, never throws, so a Sheets
// hiccup never breaks the admin action that triggered the save (the local
// file write already happened by the time this runs).
//
// setValue does a full read-modify-write of the *entire* sheet (every
// key's rows, not just this one), so two setValue calls running at the
// same time can race: the second one can read stale data (missing what
// the first just wrote) and then overwrite it. Routing every call through
// this single chained queue makes them run strictly one after another so
// that can't happen, no matter which keys are involved.
let writeQueue = Promise.resolve();
function setValue(key, value) {
  const run = writeQueue.then(() => doSetValue(key, value));
  writeQueue = run.catch(() => {}); // never let one failed write stall the queue
  return run;
}

async function doSetValue(key, value) {
  if (!ENABLED) return;
  try {
    const sheets = getClient();
    await ensureTab(sheets);
    const json = JSON.stringify(value);
    const chunks = [];
    for (let i = 0; i < json.length; i += CHUNK_SIZE) chunks.push(json.slice(i, i + CHUNK_SIZE));

    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${TAB_NAME}!A:C` });
    const rows = res.data.values || [];
    const keep = rows.filter((r) => r[0] !== key);
    const fresh = chunks.map((c, i) => [key, String(i), c]);
    const allRows = [...keep, ...fresh];

    await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: `${TAB_NAME}!A:C` });
    if (allRows.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${TAB_NAME}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: allRows },
      });
    }
  } catch (e) {
    console.error(`sheetsStore: failed to save "${key}":`, e.message);
  }
}

module.exports = { getValue, setValue, ENABLED };
