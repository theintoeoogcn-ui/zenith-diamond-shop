const TelegramBot = require('node-telegram-bot-api');
const { getOrder, updateOrder } = require('./db');
const { appendOrderRow } = require('./googleSheets');
const { sendVoucherEmail } = require('./mailer');

const TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
// Optional second destination — e.g. a staff Telegram group — that gets the
// exact same new-order message with the same Confirm/Reject buttons. Telegram
// doesn't restrict who can tap an inline button, so anyone in that group can
// already confirm/reject; no extra permission code is needed for that part.
const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID || '';

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

// A Telegram username/first name can contain Markdown-special characters
// (an underscore is a completely normal username character, for instance) —
// escape them before dropping a name into a Markdown-parsed message, or the
// edit can come out mis-formatted or fail outright.
function escapeMarkdown(s) {
  return String(s || '').replace(/([_*`[])/g, '\\$1');
}

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

// Admin DM plus the optional group, deduped in case someone points both env
// vars at the same chat.
function notifyTargets() {
  const targets = [ADMIN_CHAT_ID];
  if (GROUP_CHAT_ID && GROUP_CHAT_ID !== ADMIN_CHAT_ID) targets.push(GROUP_CHAT_ID);
  return targets;
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

  // Post to every configured destination independently — one chat rejecting
  // the message (e.g. the bot got removed from the group) shouldn't stop the
  // admin DM from going out.
  const messages = [];
  for (const chatId of notifyTargets()) {
    try {
      let sent;
      if (screenshotBuffer) {
        sent = await bot.sendPhoto(chatId, screenshotBuffer, {
          caption: text,
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
      } else {
        sent = await bot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
      }
      messages.push({ chatId: String(chatId), messageId: sent.message_id, hasScreenshot: !!screenshotBuffer });
    } catch (err) {
      console.error(`Failed to notify Telegram chat ${chatId} about order ${order.code}:`, err.message);
    }
  }

  if (!messages.length) return null; // every destination failed — order stays 'pending'

  updateOrder(order.code, {
    status: 'notified',
    telegramMessageId: messages[0].messageId, // kept for backward compat
    telegramMessages: messages,
    hasScreenshot: !!screenshotBuffer,
  });
  return messages;
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

    // Whoever's chat this button lives in — admin DM or the group — acts as
    // the "first responder"; everyone else's copy of the message just gets
    // updated to match below. No per-user permission check on purpose: any
    // member of the group is allowed to confirm/reject, same as the admin —
    // but we do record *who* tapped it, so the edited message (and the
    // saved order) show who actually made the call.
    const actor = query.from || {};
    const actorName = actor.username
      ? '@' + actor.username
      : [actor.first_name, actor.last_name].filter(Boolean).join(' ') || 'someone';
    const actorNameSafe = escapeMarkdown(actorName);

    let updated, ackText, resultSuffix;
    if (action === 'confirm') {
      updated = updateOrder(code, { status: 'confirmed', confirmedBy: actorName, confirmedById: actor.id || null });
      ackText = 'Marked as confirmed';
      resultSuffix = `\n\n✅ *Confirmed by ${actorNameSafe}* — deliver ${order.packageLabel} to game ID ${order.gameId} (server ${order.serverId}).`;
    } else if (action === 'reject') {
      updated = updateOrder(code, { status: 'rejected', rejectedBy: actorName, rejectedById: actor.id || null });
      ackText = 'Marked as rejected';
      resultSuffix = `\n\n❌ *Rejected by ${actorNameSafe}* — no payment found for this code.`;
    } else {
      return;
    }

    await bot.answerCallbackQuery(query.id, { text: ackText });
    const resultText = formatOrderText(order) + resultSuffix;

    // Fall back to the single old-style message reference for orders that
    // were already 'notified' before this multi-chat version deployed.
    const messages = (Array.isArray(order.telegramMessages) && order.telegramMessages.length)
      ? order.telegramMessages
      : (order.telegramMessageId
          ? [{ chatId: String(query.message.chat.id), messageId: order.telegramMessageId, hasScreenshot: order.hasScreenshot }]
          : []);

    await Promise.all(messages.map(async (m) => {
      const editParams = { chat_id: m.chatId, message_id: m.messageId, parse_mode: 'Markdown' };
      try {
        if (m.hasScreenshot) await bot.editMessageCaption(resultText, editParams);
        else await bot.editMessageText(resultText, editParams);
      } catch (err) {
        // e.g. the message is too old to edit, or the bot was removed from
        // that chat since — don't let one failed edit block the others.
        console.error(`Failed to update Telegram message in chat ${m.chatId} for order ${code}:`, err.message);
      }
    }));

    if (action === 'confirm') {
      appendOrderRow(updated).catch(() => {});
      sendVoucherEmail(updated).catch(() => {}); // mailer.js already never throws, but belt-and-suspenders
    }
  });

  bot.on('polling_error', (err) => {
    console.error('Telegram polling error:', err.message);
  });

  // Logs the chat ID of any message the bot can see — the easiest way to
  // find a group's chat ID for GROUP_CHAT_ID: add the bot to the group,
  // send/mention it in any message, then check this service's logs on
  // Render for a line starting with "[telegram chat id]".
  bot.on('message', (msg) => {
    console.log(`[telegram chat id] ${msg.chat.id}  (type: ${msg.chat.type}, title: ${msg.chat.title || msg.chat.first_name || 'n/a'})`);
  });
}

module.exports = { bot, notifyAdmin, BOT_ENABLED };
