require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
// Raised for base64 payloads: payment screenshots, and the "Manage Ads"
// panel's PUT /api/ads, which re-sends the WHOLE ad list (up to 12 ads,
// each media file up to 3MB for images or 6MB for video — see adsDb.js) in
// a single request every time any one ad is added or edited.
app.use(express.json({ limit: '40mb' }));

// Clean URLs: zenithwbf.com/news instead of zenithwbf.com/news.html.
// Two things happen here, both ahead of express.static:
//  1. A request that still explicitly ends in ".html" (an old bookmark, a
//     search-engine result, someone typing it manually) gets a permanent
//     redirect to the extension-less form, so the address bar — and every
//     link Google indexes — settles on one clean URL per page instead of
//     both versions existing side by side.
//  2. A request for an extension-less path (e.g. "/news") quietly gets
//     served the matching "news.html" file from disk. express.static only
//     matches exact filenames, so without this "/news" would 404.
// "/" itself is untouched — express.static already serves index.html for
// that by default.
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const fs = require('fs');

app.get(/^\/([\w-]+)\.html$/, (req, res) => {
  const qs = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
  const name = req.params[0];
  res.redirect(301, (name === 'index' ? '/' : '/' + name) + qs);
});

app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (req.path.startsWith('/api/')) return next();
  if (path.extname(req.path)) return next(); // already has an extension — let express.static handle it (or 404)
  const candidate = path.join(PUBLIC_DIR, req.path + '.html');
  fs.access(candidate, fs.constants.F_OK, (err) => {
    if (err) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(candidate);
  });
});

// Serve the storefront (public/diamond-plan.html and friends).
// no-cache (not no-store) so browsers still keep a local copy for speed, but
// must revalidate with the server on every load instead of trusting a stale
// copy — this is what was making phones/browsers show an old layout (missing
// icons, old bracket columns, etc.) for a few minutes/hours after a deploy.
app.use(express.static(PUBLIC_DIR, {
  setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache'),
}));

// This import starts the Telegram bot (polling) — done after dotenv loads.
const orderRoutes = require('./routes/orders');
app.use('/api/orders', orderRoutes);

// Mobile Legends in-game name lookup (Game ID + Server -> nickname)
const ignRoutes = require('./routes/ign');
app.use('/api/ign', ignRoutes);

// Tournament list — public to read, admin-passcode-protected to create/edit/delete
const tournamentRoutes = require('./routes/tournaments');
app.use('/api/tournaments', tournamentRoutes);

// Tournament detail (teams, match schedule, group standings, bracket) —
// public to read, admin-passcode-protected to edit
const tournamentDetailsRoutes = require('./routes/tournament-details');
app.use('/api/tournament-details', tournamentDetailsRoutes);

// Team registration for upcoming tournaments — public to submit and to read
// the confirmed-team list, admin-passcode-protected to review entries (those
// carry players' phone numbers and Telegram/Viber handles).
const registrationRoutes = require('./routes/registrations');
app.use('/api/registrations', registrationRoutes);

// Diamond package pricing — public to read, admin-passcode-protected to edit
const diamondPricingRoutes = require('./routes/diamond-pricing');
app.use('/api/diamond-pricing', diamondPricingRoutes);

// Home page stat cards — public to read, admin-passcode-protected to edit
const homeStatsRoutes = require('./routes/home-stats');
app.use('/api/home-stats', homeStatsRoutes);

// Home page ad creatives (sidebar/sticky/stacked desktop widget, mobile
// placements) — public to read, admin-passcode-protected to edit
const adsRoutes = require('./routes/ads');
app.use('/api/ads', adsRoutes);

// News posts — public to read/like/comment, admin-passcode-protected to create/edit/delete/moderate
const newsRoutes = require('./routes/news');
app.use('/api/news', newsRoutes);

// YouTube live-status check — used by the News page to auto-show/hide the
// "Live Now" badge on video posts, no admin action needed.
const youtubeLiveRoutes = require('./routes/youtube-live');
app.use('/api/youtube-live', youtubeLiveRoutes);

// Match-screenshot hero-pick extraction (Match Schedule "+ Add Game") —
// admin-passcode-protected, proxies to Google Gemini's free-tier vision API
// using a server-side key so it's never exposed to the browser. Disabled
// (503) until GEMINI_API_KEY is set — see routes/vision.js.
const visionRoutes = require('./routes/vision');
app.use('/api/vision', visionRoutes);

// Hero/item icon library for the Match Schedule hero-pick view — public to
// read, admin-passcode-protected to upload. Self-hosted instead of relying
// on a third-party MLBB data API (the one used at first went dark).
const iconsRoutes = require('./routes/icons');
app.use('/api/icons', iconsRoutes);

if (!process.env.ADMIN_PASSCODE) {
  console.warn('⚠️  ADMIN_PASSCODE is not set — the "Create Tournament" admin panel is disabled until you set one in server/.env.');
}

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;

// Wait for orders/tournaments/pricing/home-stats/news to finish restoring
// their last-saved state from Google Sheets (if configured) before opening
// the server up to traffic — otherwise the very first requests after a deploy
// could briefly see stale/default data instead of what was actually saved.
const ordersDb = require('./db');
const tournamentsDb = require('./tournamentsDb');
const tournamentDetailsDb = require('./tournamentDetailsDb');
const diamondPricingDb = require('./diamondPricingDb');
const homeStatsDb = require('./homeStatsDb');
const newsDb = require('./newsDb');
const registrationsDb = require('./registrationsDb');
const adsDb = require('./adsDb');
const iconsDb = require('./iconsDb');

Promise.all([
  ordersDb.ready,
  tournamentsDb.ready, tournamentDetailsDb.ready, diamondPricingDb.ready,
  homeStatsDb.ready, newsDb.ready, registrationsDb.ready, adsDb.ready, iconsDb.ready,
])
  .catch((e) => console.error('Error while restoring saved data on boot:', e.message))
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Zenith diamond server running on http://localhost:${PORT}`);
    });
  });
