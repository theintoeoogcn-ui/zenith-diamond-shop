const express = require('express');
const router = express.Router();

// Looks up a Mobile Legends in-game nickname from a Game ID + Server ID,
// using the free public lookup service at api.isan.eu.org.
// Proxied through our own server (instead of calling it from the browser)
// so we can add timeouts/error-handling and avoid CORS issues.
router.get('/', async (req, res) => {
  const { id, server } = req.query;

  if (!id || !server) {
    return res.status(400).json({ success: false, message: 'id and server are required' });
  }

  const url = `https://api.isan.eu.org/nickname/ml?id=${encodeURIComponent(id)}&server=${encodeURIComponent(server)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const upstream = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!upstream.ok) {
      return res.status(502).json({ success: false, message: 'Lookup service returned an error' });
    }

    const data = await upstream.json();
    // Expected shape: { success: boolean, name?: string, message?: string }
    res.json(data);
  } catch (err) {
    console.error('IGN lookup failed:', err.message);
    res.status(502).json({ success: false, message: 'Lookup service unavailable' });
  }
});

module.exports = router;
