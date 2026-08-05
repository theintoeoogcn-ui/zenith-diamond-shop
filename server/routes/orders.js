const express = require('express');
const router = express.Router();
const { createOrder, getOrder } = require('../db');
const { notifyAdmin } = require('../bot');

// Create a new order and alert the admin on Telegram
router.post('/', async (req, res) => {
  const {
    gameId, serverId, ignName, packageLabel, amount, paymentMethod,
    senderNumber, screenshotBase64, screenshotMime,
  } = req.body || {};

  if (!gameId || !serverId || !packageLabel || !amount || !paymentMethod) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number.' });
  }

  let screenshotBuffer = null;
  if (screenshotBase64) {
    try {
      screenshotBuffer = Buffer.from(screenshotBase64, 'base64');
    } catch (e) {
      return res.status(400).json({ error: 'Invalid screenshot data.' });
    }
  }

  const order = createOrder({
    gameId: String(gameId).trim(),
    serverId: String(serverId).trim(),
    ignName: ignName ? String(ignName).trim() : null,
    packageLabel: String(packageLabel).trim(),
    amount,
    paymentMethod: String(paymentMethod).trim(),
    senderNumber: senderNumber ? String(senderNumber).trim() : null,
    hasScreenshot: !!screenshotBuffer,
  });

  try {
    await notifyAdmin(order, screenshotBuffer);
  } catch (err) {
    console.error('Failed to notify admin on Telegram:', err.message);
    // Order still exists — admin can be notified manually / retried.
  }

  res.status(201).json({ code: order.code, status: order.status });
});

// Poll order status (used by the frontend ticket to update live)
router.get('/:code', (req, res) => {
  const order = getOrder(req.params.code);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json(order);
});

module.exports = router;
