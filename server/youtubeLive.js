const API_KEY = process.env.YOUTUBE_API_KEY;

if (!API_KEY) {
  console.warn('⚠️  YOUTUBE_API_KEY is not set — News posts with YouTube video links will never show an automatic "Live Now" badge. Set it in server/.env to enable auto live-detection.');
}

// videoId -> { isLive, checkedAt }. Keeps repeated page loads from the same
// visitors (or several visitors at once) from burning API quota on the same
// video within a short window.
const cache = new Map();
const CACHE_TTL_MS = 20 * 1000;

async function checkLive(videoId) {
  if (!API_KEY || !videoId) return false;

  const cached = cache.get(videoId);
  if (cached && Date.now() - cached.checkedAt < CACHE_TTL_MS) {
    return cached.isLive;
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${encodeURIComponent(videoId)}&key=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error('YouTube live-status check failed:', res.status, await res.text());
      return cached ? cached.isLive : false;
    }
    const data = await res.json();
    const status = data.items && data.items[0] && data.items[0].snippet
      ? data.items[0].snippet.liveBroadcastContent
      : 'none';
    const isLive = status === 'live';
    cache.set(videoId, { isLive, checkedAt: Date.now() });
    return isLive;
  } catch (e) {
    console.error('YouTube live-status check error:', e.message);
    return cached ? cached.isLive : false;
  }
}

module.exports = { checkLive, ENABLED: !!API_KEY };
