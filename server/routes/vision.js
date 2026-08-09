const express = require('express');
const router = express.Router();

// ============================================================
// Match-screenshot vision extraction (hero picks / KDA / bans)
//
// Uses Google's Gemini API rather than a paid-only provider — Gemini has a
// genuine no-credit-card free tier (as of this writing: gemini-2.5-flash,
// ~250 requests/day, 10/minute) which comfortably covers this site's volume
// (4 Bo3 matches/day x up to 3 games x 2 screenshots ≈ 24 requests/day).
// If Google changes those limits later, GEMINI_VISION_MODEL below can point
// at a different model without a code change.
//
// SECURITY NOTE: an earlier prototype of this feature called the vision API
// directly from the browser with the API key typed into a page field. That
// means the key would sit in localStorage / page source on a public admin
// page — anyone with devtools open could lift it. This route exists
// specifically to avoid that: the API key lives only in this server's
// environment (GEMINI_API_KEY, set in the Render dashboard — never commit
// it, never send it to the client) and every call here is gated behind the
// same admin passcode the rest of the admin actions use.
// ============================================================

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const VISION_MODEL = process.env.GEMINI_VISION_MODEL || 'gemini-2.5-flash';

if (!GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY is not set — screenshot hero-pick extraction is disabled until you set one in server/.env. Get a free key (no credit card) at aistudio.google.com.');
}

function isAdmin(req) {
  const supplied = req.get('x-admin-passcode') || '';
  return !!ADMIN_PASSCODE && supplied === ADMIN_PASSCODE;
}

// A leaked passcode or a runaway client-side bug shouldn't be able to blow
// through the free-tier daily quota (or run up a bill if this ever moves to
// a paid model). This is a coarse per-process safety net, not precise rate
// limiting — good enough for a single small admin panel doing ~24/day.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 40;
let windowStart = Date.now();
let windowCount = 0;
function withinBudget() {
  const now = Date.now();
  if (now - windowStart > WINDOW_MS) { windowStart = now; windowCount = 0; }
  if (windowCount >= MAX_PER_WINDOW) return false;
  windowCount += 1;
  return true;
}

const RESULT_SYSTEM_PROMPT = `You are a precise data-extraction engine for a single Mobile Legends: Bang Bang (MLBB) post-match result screenshot (the Victory/Defeat screen showing both teams' hero picks and, if visible, per-player stats). Extract ONLY what is clearly legible. Never guess or hallucinate; omit a field (leave it null / empty) when it is unclear or not shown. left_team_players / right_team_players correspond to the team shown on the LEFT vs RIGHT side of the screenshot, in the order the heroes/players are displayed. If K/D/A or items are not visible in this particular screenshot, still include each player with hero_name filled in and the other fields null / empty array.`;

const BAN_SYSTEM_PROMPT = `You are a precise data-extraction engine for a single Mobile Legends: Bang Bang (MLBB) draft/pick-ban phase screenshot. Extract ONLY the banned heroes clearly visible. Never guess; use an empty array if unclear.`;

// Passed as generationConfig.responseSchema so Gemini's structured output
// mode does the shape-enforcement for us, instead of hoping the model
// returns clean JSON and stripping markdown fences ourselves.
const PLAYER_SCHEMA = {
  type: 'OBJECT',
  properties: {
    hero_name: { type: 'STRING' },
    player_name: { type: 'STRING', nullable: true },
    kills: { type: 'INTEGER', nullable: true },
    deaths: { type: 'INTEGER', nullable: true },
    assists: { type: 'INTEGER', nullable: true },
    items: { type: 'ARRAY', items: { type: 'STRING' } },
    mvp: { type: 'BOOLEAN', nullable: true },
  },
  required: ['hero_name'],
};
const RESULT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    left_team_result: { type: 'STRING', enum: ['Victory', 'Defeat'], nullable: true },
    right_team_result: { type: 'STRING', enum: ['Victory', 'Defeat'], nullable: true },
    duration_seconds: { type: 'INTEGER', nullable: true },
    duration_formatted: { type: 'STRING', nullable: true },
    left_team_players: { type: 'ARRAY', items: PLAYER_SCHEMA },
    right_team_players: { type: 'ARRAY', items: PLAYER_SCHEMA },
  },
};
const BAN_SCHEMA = {
  type: 'OBJECT',
  properties: {
    left_team_bans: { type: 'ARRAY', items: { type: 'STRING' } },
    right_team_bans: { type: 'ARRAY', items: { type: 'STRING' } },
  },
};

const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // ~6MB decoded, plenty for a phone screenshot
const ALLOWED_MEDIA_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

router.post('/extract', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Invalid admin passcode.' });
  if (!GEMINI_API_KEY) return res.status(503).json({ error: 'Screenshot extraction is not configured on the server yet.' });
  if (!withinBudget()) return res.status(429).json({ error: 'Extraction limit reached for now — try again in a bit.' });

  const { image, mediaType, kind } = req.body || {};
  if (typeof image !== 'string' || !image) return res.status(400).json({ error: 'image (base64) is required.' });
  if (!ALLOWED_MEDIA_TYPES.includes(mediaType)) return res.status(400).json({ error: 'Unsupported image type.' });
  if (kind !== 'result' && kind !== 'bans') return res.status(400).json({ error: 'kind must be "result" or "bans".' });
  // base64 is ~4/3 the size of the decoded bytes
  if (image.length * 0.75 > MAX_IMAGE_BYTES) return res.status(413).json({ error: 'Image is too large.' });

  const systemPrompt = kind === 'result' ? RESULT_SYSTEM_PROMPT : BAN_SYSTEM_PROMPT;
  const schema = kind === 'result' ? RESULT_SCHEMA : BAN_SCHEMA;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(VISION_MODEL)}:generateContent`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          // header form (not ?key=... in the URL) so the key never ends up
          // in server access logs or gets forwarded via a Referer header.
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{
            role: 'user',
            parts: [
              { inline_data: { mime_type: mediaType, data: image } },
              { text: 'Extract the data per your instructions.' },
            ],
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: schema,
            maxOutputTokens: 1536,
          },
        }),
      }
    );
    clearTimeout(timeout);

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      console.error('Vision extract upstream error:', upstream.status, errText.slice(0, 300));
      const friendly = upstream.status === 429
        ? 'Vision service is rate-limited right now — please wait a minute and try again.'
        : 'Vision service returned an error.';
      return res.status(502).json({ error: friendly });
    }

    const data = await upstream.json();
    const candidate = (data.candidates || [])[0];
    const text = candidate && candidate.content && candidate.content.parts
      ? candidate.content.parts.map((p) => p.text || '').join('')
      : '';
    if (!text) {
      console.error('Vision extract: empty response, finishReason=', candidate && candidate.finishReason);
      return res.status(502).json({ error: 'The vision service could not read that screenshot. Try a clearer image.' });
    }

    let parsed;
    try { parsed = JSON.parse(text); }
    catch (e) { return res.status(502).json({ error: 'Could not parse the extraction result.' }); }

    res.json(parsed);
  } catch (err) {
    console.error('Vision extract failed:', err.message);
    res.status(502).json({ error: 'Vision service unavailable. Please try again.' });
  }
});

module.exports = router;
