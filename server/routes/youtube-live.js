const express = require('express');
const router = express.Router();
const { checkLive, ENABLED } = require('../youtubeLive');

// GET /api/youtube-live/:videoId -> { isLive }
router.get('/:videoId', async (req, res) => {
  const { videoId } = req.params;
  if (!videoId || !/^[a-zA-Z0-9_-]{6,15}$/.test(videoId)) {
    return res.status(400).json({ error: 'Invalid video id.' });
  }
  if (!ENABLED) {
    return res.json({ isLive: false, disabled: true });
  }
  const isLive = await checkLive(videoId);
  res.json({ isLive });
});

module.exports = router;
