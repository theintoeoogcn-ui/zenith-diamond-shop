let google = null;
try {
  // eslint-disable-next-line global-require
  google = require('googleapis').google;
} catch (e) {
  // Package not installed (e.g. npm install wasn't re-run after this
  // feature was added). Don't crash the whole server over an optional
  // feature — just disable Google Sheets logging below.
  console.warn('⚠️  "googleapis" package not installed — Google Sheets order history is disabled. Run `npm install` in server/ to enable it.');
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
// Render (and most hosts) store multi-line env vars with literal "\n" —
// convert those back into real newlines for the PEM key to parse.
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
  ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : '';

const SHEETS_ENABLED = !!google && !!SHEET_ID && !!CLIENT_EMAIL && !!PRIVATE_KEY;

if (google && !SHEETS_ENABLED) {
  console.warn('⚠️  Google Sheets order history is disabled — set GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY in server/.env to enable it.');
}

let sheetsClient = null;
function getClient() {
  if (!SHEETS_ENABLED) return null;
  if (sheetsClient) return sheetsClient;
  const auth = new google.auth.JWT(CLIENT_EMAIL, null, PRIVATE_KEY, ['https://www.googleapis.com/auth/spreadsheets']);
  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

const HEADER_ROW = [
  'Order Code', 'Ordered At', 'Package', 'Amount (Ks)', 'Payment Method',
  'Sender Number', 'Game ID', 'Server', 'IGN', 'Status', 'Confirmed At',
];

async function ensureHeaderRow(sheets) {
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'A1:K1' });
    if (!res.data.values || res.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: 'A1:K1',
        valueInputOption: 'RAW',
        requestBody: { values: [HEADER_ROW] },
      });
    }
  } catch (e) {
    // Best-effort — if this fails we still try to append the data row below,
    // it'll just land without a header the first time.
    console.error('Could not verify/create the Google Sheet header row:', e.message);
  }
}

// Appends one row per confirmed order. Never throws — a Sheets outage
// should never block the Telegram confirm flow or crash the bot.
async function appendOrderRow(order) {
  if (!SHEETS_ENABLED) {
    console.log(`[sheets disabled] Would have logged order ${order.code} to Google Sheets.`);
    return;
  }
  try {
    const sheets = getClient();
    await ensureHeaderRow(sheets);
    const row = [
      order.code,
      order.createdAt ? new Date(order.createdAt).toLocaleString() : '',
      order.packageLabel,
      order.amount,
      order.paymentMethod,
      order.senderNumber || '',
      order.gameId,
      order.serverId,
      order.ignName || '',
      order.status,
      new Date().toLocaleString(),
    ];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'A:K',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });
  } catch (e) {
    console.error(`Failed to log order ${order.code} to Google Sheets:`, e.message);
  }
}

module.exports = { appendOrderRow, SHEETS_ENABLED };
