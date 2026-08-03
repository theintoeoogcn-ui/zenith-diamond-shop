const TelegramBot = require('node-telegram-bot-api');
const { getOrder, updateOrder } = require('./db');

const TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

if (!TOKEN || TOKEN.includes('ExampleToken')) {
  console.error('BOT_TOKEN is missing or still the placeholder — set it in server/.env');
  process.exit(1);
}
if (!ADMIN_CHAT_ID) {
  console.error('ADMIN_CHAT_ID is missing — set it in server/.env');
  process.exit(1);
}

// Polling mode: no public webhook URL needed, works from any machine.
const bot = new TelegramBot(TOKEN, { polling: true });

function formatOrderText(order) {
  return (
    `🆕 *New diamond order*\n` +
    `Code: \`${order.code}\`\n` +
    `Package: ${order.packageLabel}\n` +
    `Amount: ${order.amount.toLocaleString()} Ks\n` +
    `Payment: ${order.paymentMethod}\n` +
    `Game ID: \`${order.gameId}\`\n` +
    `Server: \`${order.serverId}\`\n\n` +
    `Check your ${order.paymentMethod} account for this transfer, then tap a button below.`
  );
}

async function notifyAdmin(order) {
  const text = formatOrderText(order);
  const sent = await bot.sendMessage(ADMIN_CHAT_ID, text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Confirm payment', callback_data: `confirm:${order.code}` },
          { text: '❌ Reject', callback_data: `reject:${order.code}` },
        ],
      ],
    },
  });
  updateOrder(order.code, { status: 'notified', telegramMessageId: sent.message_id });
  return sent;
}

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

  if (action === 'confirm') {
    updateOrder(code, { status: 'confirmed' });
    await bot.answerCallbackQuery(query.id, { text: 'Marked as confirmed' });
    await bot.editMessageText(
      formatOrderText(order) + `\n\n✅ *Confirmed* — deliver ${order.packageLabel} to game ID ${order.gameId} (server ${order.serverId}).`,
      { chat_id: query.message.chat.id, message_id: query.message.message_id, parse_mode: 'Markdown' }
    );
  } else if (action === 'reject') {
    updateOrder(code, { status: 'rejected' });
    await bot.answerCallbackQuery(query.id, { text: 'Marked as rejected' });
    await bot.editMessageText(
      formatOrderText(order) + `\n\n❌ *Rejected* — no payment found for this code.`,
      { chat_id: query.message.chat.id, message_id: query.message.message_id, parse_mode: 'Markdown' }
    );
  }
});

bot.on('polling_error', (err) => {
  console.error('Telegram polling error:', err.message);
});

module.exports = { bot, notifyAdmin };
