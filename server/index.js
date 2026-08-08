require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // raised for base64 payment screenshots

// Serve the storefront (public/diamond-plan.html and friends)
app.use(express.static(path.join(__dirname, '..', 'public')));

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

// News posts — public to read/like/comment, admin-passcode-protected to create/edit/delete/moderate
const newsRoutes = require('./routes/news');
app.use('/api/news', newsRoutes);

// YouTube live-status check — used by the News page to auto-show/hide the
// "Live Now" badge on video posts, no admin action needed.
const youtubeLiveRoutes = require('./routes/youtube-live');
app.use('/api/youtube-live', youtubeLiveRoutes);

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

Promise.all([
  ordersDb.ready,
  tournamentsDb.ready, tournamentDetailsDb.ready, diamondPricingDb.ready,
  homeStatsDb.ready, newsDb.ready, registrationsDb.ready,
])
  .catch((e) => console.error('Error while restoring saved data on boot:', e.message))
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Zenith diamond server running on http://localhost:${PORT}`);
    });
  });
