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

// Diamond package pricing — public to read, admin-passcode-protected to edit
const diamondPricingRoutes = require('./routes/diamond-pricing');
app.use('/api/diamond-pricing', diamondPricingRoutes);

if (!process.env.ADMIN_PASSCODE) {
  console.warn('⚠️  ADMIN_PASSCODE is not set — the "Create Tournament" admin panel is disabled until you set one in server/.env.');
}

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Zenith diamond server running on http://localhost:${PORT}`);
});
