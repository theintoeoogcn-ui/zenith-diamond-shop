const fs = require('fs');
const path = require('path');

let nodemailer = null;
try {
  // eslint-disable-next-line global-require
  nodemailer = require('nodemailer');
} catch (e) {
  // Package not installed (e.g. npm install wasn't re-run after this
  // feature was added). Don't crash the whole server over an optional
  // feature — just disable voucher emails below.
  console.warn('⚠️  "nodemailer" package not installed — voucher emails are disabled. Run `npm install` in server/ to enable it.');
}

let QRCode = null;
try {
  // eslint-disable-next-line global-require
  QRCode = require('qrcode');
} catch (e) {
  console.warn('⚠️  "qrcode" package not installed — voucher emails will go out without a QR code. Run `npm install` in server/ to enable it.');
}

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;
const SITE_URL = process.env.SITE_URL || 'https://zenithwbf.com';

const EMAIL_ENABLED = !!nodemailer && !!EMAIL_USER && !!EMAIL_APP_PASSWORD;

if (nodemailer && !EMAIL_ENABLED) {
  console.warn('⚠️  Voucher emails are disabled — set EMAIL_USER and EMAIL_APP_PASSWORD in server/.env to enable them.');
}

let transporter = null;
function getTransporter() {
  if (!EMAIL_ENABLED) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_APP_PASSWORD },
  });
  return transporter;
}

// Read once at boot, not per-email — the logo file never changes at
// runtime. A missing/unreadable logo shouldn't block emails from going
// out, it just means the email renders without it.
let logoBuffer = null;
try {
  logoBuffer = fs.readFileSync(path.join(__dirname, '../public/assets/zenith-logo.png'));
} catch (e) {
  // ok — see comment above
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// Mirrors the on-site voucher popup (public/diamond-plan.html), rebuilt with
// table-based layout and inline styles since email clients don't reliably
// support flexbox/grid or <style> blocks. Images are attached with cid: URIs
// rather than linked to the live site, so the voucher still renders even if
// a mail client blocks remote images by default.
function voucherHtml(order) {
  const dateStr = new Date(order.createdAt || Date.now()).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
  const gameIdLine = escapeHtml(order.gameId) + (order.serverId ? ` (${escapeHtml(order.serverId)})` : '');

  return `
  <div style="background:#0A0713;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="max-width:420px;margin:0 auto;background:#0A0713;border:1px solid #2C1F4D;border-radius:16px;overflow:hidden;">
      <div style="padding:20px 22px 14px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
          <td style="vertical-align:middle;">
            <table cellpadding="0" cellspacing="0" role="presentation"><tr>
              <td style="vertical-align:middle;padding-right:8px;">
                ${logoBuffer ? '<img src="cid:zenithlogo" width="28" height="28" style="border-radius:6px;display:block;" alt="Zenith Esports">' : ''}
              </td>
              <td style="vertical-align:middle;">
                <div style="font-size:14px;font-weight:700;color:#F4EEFF;">Zenith Esports</div>
                <div style="font-size:11px;color:#6C6089;">zenithwbf.com</div>
              </td>
            </tr></table>
          </td>
          <td style="text-align:right;vertical-align:middle;">
            <span style="font-size:10px;font-weight:600;color:#4FE0E8;background:rgba(79,224,232,0.12);padding:4px 10px;border-radius:999px;text-transform:uppercase;letter-spacing:0.5px;">Voucher</span>
          </td>
        </tr></table>
      </div>
      <div style="padding:2px 20px 18px;text-align:center;">
        <div style="font-size:13px;color:#B4A4DC;margin-bottom:6px;">Payment confirmed</div>
        <div style="font-size:24px;font-weight:700;color:#F4EEFF;letter-spacing:1px;">${escapeHtml(order.code)}</div>
      </div>
      <div style="border-top:1.5px dashed #2C1F4D;"></div>
      <div style="padding:18px 20px 4px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-size:13px;">
          <tr><td style="color:#6C6089;padding:5px 0;">Package</td><td style="text-align:right;color:#F4EEFF;font-weight:600;padding:5px 0;">${escapeHtml(order.packageLabel)}</td></tr>
          <tr><td style="color:#6C6089;padding:5px 0;">Amount</td><td style="text-align:right;color:#F4EEFF;font-weight:600;padding:5px 0;">${Number(order.amount || 0).toLocaleString()} Ks</td></tr>
          <tr><td style="color:#6C6089;padding:5px 0;">Game ID</td><td style="text-align:right;color:#F4EEFF;font-weight:600;padding:5px 0;">${gameIdLine}</td></tr>
          <tr><td style="color:#6C6089;padding:5px 0;">Date</td><td style="text-align:right;color:#F4EEFF;font-weight:600;padding:5px 0;">${escapeHtml(dateStr)}</td></tr>
          <tr><td style="color:#6C6089;padding:5px 0;">Payment method</td><td style="text-align:right;color:#F4EEFF;font-weight:600;padding:5px 0;">${escapeHtml(order.paymentMethod)}</td></tr>
        </table>
      </div>
      <div style="margin:14px 20px 0;border-top:1px solid #2C1F4D;padding:16px 0 20px;">
        <table cellpadding="0" cellspacing="0" role="presentation"><tr>
          <td style="vertical-align:middle;padding-right:14px;">
            ${QRCode ? '<img src="cid:voucherqr" width="64" height="64" style="border-radius:8px;display:block;" alt="QR code">' : ''}
          </td>
          <td style="vertical-align:middle;font-size:11px;color:#6C6089;line-height:1.5;">
            Scan to visit Zenith Esports. Keep this voucher until your diamonds are delivered.
          </td>
        </tr></table>
      </div>
    </div>
  </div>`;
}

// Never throws — an email hiccup should never block the Telegram confirm
// flow. Silently no-ops if the order has no email on file, or emailing
// isn't configured/installed yet.
async function sendVoucherEmail(order) {
  if (!order || !order.email) return;
  if (!EMAIL_ENABLED) {
    console.log(`[email disabled] Would have emailed the voucher for order ${order.code} to ${order.email}. Set EMAIL_USER/EMAIL_APP_PASSWORD in server/.env to enable it.`);
    return;
  }
  try {
    const attachments = [];
    if (logoBuffer) {
      attachments.push({ filename: 'zenith-logo.png', content: logoBuffer, cid: 'zenithlogo' });
    }
    if (QRCode) {
      const qrBuffer = await QRCode.toBuffer(SITE_URL, {
        width: 256, margin: 1, color: { dark: '#1B1030', light: '#F4EEFF' },
      });
      attachments.push({ filename: 'qr.png', content: qrBuffer, cid: 'voucherqr' });
    }
    await getTransporter().sendMail({
      from: `"Zenith Esports" <${EMAIL_USER}>`,
      to: order.email,
      subject: `Your Zenith Esports voucher — ${order.code}`,
      html: voucherHtml(order),
      attachments,
    });
  } catch (e) {
    console.error(`Failed to email the voucher for order ${order.code}:`, e.message);
  }
}

module.exports = { sendVoucherEmail, EMAIL_ENABLED };
