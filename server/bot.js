const TelegramBot = require('node-telegram-bot-api');
const { getOrder, updateOrder } = require('./db');

const TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

// If the bot isn't configured yet, don't crash the whole server — just run
// without Telegram notifications so the storefront/API still work locally.
// Fill in server/.env (copy from server/.env.example) to enable real
// notifications: BOT_TOKEN from @BotFather, ADMIN_CHAT_ID from @userinfobot.
const BOT_ENABLED = !!TOKEN && !TOKEN.includes('ExampleToken') && !!ADMIN_CHAT_ID;

if (!BOT_ENABLED) {
  if (!TOKEN || TOKEN.includes('ExampleToken')) {
    console.warn('⚠️  BOT_TOKEN is missing or still the placeholder — Telegram notifications are disabled. Set it in server/.env to enable them.');
  }
  if (!ADMIN_CHAT_ID) {
    console.warn('⚠️  ADMIN_CHAT_ID is missing — Telegram notifications are disabled. Set it in server/.env to enable them.');
  }
}

// Polling mode: no public webhook URL needed, works from any machine.
const bot = BOT_ENABLED ? new TelegramBot(TOKEN, { polling: true }) : null;

function formatOrderText(order) {
  return (
    `🆕 *New diamond order*\n` +
    `Code: \`${order.code}\`\n` +
    `Package: ${order.packageLabel}\n` +
    `Amount: ${order.amount.toLocaleString()} Ks\n` +
    `Payment: ${order.paymentMethod}\n` +
    (order.senderNumber ? `Sender number: \`${order.senderNumber}\`\n` : '') +
    `Game ID: \`${order.gameId}\`\n` +
    `Server: \`${order.serverId}\`\n` +
    (order.ignName ? `IGN: ${order.ignName}\n` : '') +
    `\nCheck your ${order.paymentMethod} account for this transfer, then tap a button below.`
  );
}

async function notifyAdmin(order, screenshotBuffer) {
  if (!BOT_ENABLED) {
    console.log(`[bot disabled] Would have notified admin about order ${order.code}. Set BOT_TOKEN/ADMIN_CHAT_ID in server/.env to enable Telegram alerts.`);
    return null;
  }

  const text = formatOrderText(order);
  const keyboard = {
    inline_keyboard: [
      [
        { text: '✅ Confirm payment', callback_data: `confirm:${order.code}` },
        { text: '❌ Reject', callback_data: `reject:${order.code}` },
      ],
    ],
  };

  let sent;
  if (screenshotBuffer) {
    sent = await bot.sendPhoto(ADMIN_CHAT_ID, screenshotBuffer, {
      caption: text,
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  } else {
    sent = await bot.sendMessage(ADMIN_CHAT_ID, text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  }

  updateOrder(order.code, {
    status: 'notified',
    telegramMessageId: sent.message_id,
    hasScreenshot: !!screenshotBuffer,
  });
  return sent;
}

if (BOT_ENABLED) {
  bot.on('callback_query', async (query) => {
    const data = query.data || '';
    const [action, code] = data.split(':');
    if (!code) return;

    const order = getOrder(code);
    if (!order) {
      await bot.answerCallbackQuery(query.id, { text: 'Order not found (already handled?)' });
      return;
    }

    if (order.status === 'confirmed' || order.status === 'rejected') {
      await bot.answerCallbackQuery(query.id, { text: `Already marked ${order.status}` });
      return;
    }

    const editParams = { chat_id: query.message.chat.id, message_id: query.message.message_id, parse_mode: 'Markdown' };
    const editFn = order.hasScreenshot
      ? (newText) => bot.editMessageCaption(newText, editParams)
      : (newText) => bot.editMessageText(newText, editParams);

    if (action === 'confirm') {
      updateOrder(code, { status: 'confirmed' });
      await bot.answerCallbackQuery(query.id, { text: 'Marked as confirmed' });
      await editFn(
        formatOrderText(order) + `\n\n✅ *Confirmed* — deliver ${order.packageLabel} to game ID ${order.gameId} (server ${order.serverId}).`
      );
    } else if (action === 'reject') {
      updateOrder(code, { status: 'rejected' });
      await bot.answerCallbackQuery(query.id, { text: 'Marked as rejected' });
      await editFn(
        formatOrderText(order) + `\n\n❌ *Rejected* — no payment found for this code.`
      );
    }
  });

  bot.on('polling_error', (err) => {
    console.error('Telegram polling error:', err.message);
  });
}

module.exports = { bot, notifyAdmin, BOT_ENABLED };
