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

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Zenith diamond server running on http://localhost:${PORT}`);
});
