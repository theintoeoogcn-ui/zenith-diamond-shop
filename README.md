# Zenith Esports — Diamond top-up with Telegram verification

A storefront where a customer picks a diamond package, enters their game ID
and server, and picks a payment method. When they submit, you get a
Telegram message with **Confirm / Reject** buttons — tap one, and the
customer's page updates live.

This guide covers two parts:
- **Part A** — run it on your Mac to test everything works.
- **Part B** — put it on the internet so customers can reach it 24/7,
  even when your Mac is off.

---

## Part A — Run it on your Mac

### A1. Install Node.js

Open **Terminal** (Cmd+Space, type "Terminal", press Enter) and check if
Node is already installed:

```bash
node -v
```

If you see a version number (v18 or higher), skip to A2. If you see
"command not found", install Homebrew first, then Node:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node
```

Confirm it worked:

```bash
node -v
npm -v
```

### A2. Unzip the project

Double-click `zenith-diamond-shop.zip` in Finder (it usually unzips into
the same folder automatically). Move the resulting `zenith-diamond-shop`
folder somewhere easy to find, e.g. your Desktop.

### A3. Create your Telegram bot

1. Open Telegram, search for **@BotFather**, and start a chat.
2. Send `/newbot`.
3. Give it a name (e.g. "Zenith Diamond Bot").
4. Give it a username ending in `bot` (e.g. `zenith_diamond_bot`).
5. BotFather replies with a **token** like:
   `7123456789:AAHxyz...ExampleTokenHere`
   Copy it somewhere safe — treat it like a password.

### A4. Get your admin chat ID

1. Open a chat with the bot you just made and send it any message, e.g. `/start`.
2. In your browser, open (replace `<TOKEN>` with your real token):
   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```
3. Find `"chat":{"id":123456789, ...}` in the response — that number is
   your `ADMIN_CHAT_ID`.
4. If the response is empty (`"result":[]`), send the bot another message
   and reload the page.

### A5. Configure the app

Back in Terminal:

```bash
cd ~/Desktop/zenith-diamond-shop/server
cp .env.example .env
open -e .env
```

`open -e .env` opens the file in TextEdit. Fill in your real values:

```
BOT_TOKEN=7123456789:AAHxyz...ExampleTokenHere
ADMIN_CHAT_ID=123456789
PORT=3000
```

Save (Cmd+S) and close TextEdit.

### A6. Install and run

Still in the `server` folder in Terminal:

```bash
npm install
npm start
```

You should see:

```
Zenith diamond server running on http://localhost:3000
```

Leave this Terminal window open — closing it stops the server.

### A7. Test it

Open your browser to:

```
http://localhost:3000/diamond-plan.html
```

Pick a package, fill in a test Game ID/Server, choose a payment method, and
submit. Within a couple seconds a message with **Confirm payment / Reject**
buttons should land in your Telegram bot chat. Tap **Confirm payment** —
the browser page should update to "Payment confirmed" without a refresh.

Press `Ctrl+C` in Terminal when you're done testing, to stop the server.

---

## Part B — Make it live 24/7

Your Mac being on isn't a real hosting setup — customers need the site
reachable even when your laptop is closed. The steps below put it on
**Render**, a hosting service with a free tier and simple setup. (Any
similar host — Railway, Fly.io, a VPS — works the same way in spirit.)

### B1. Put the project on GitHub

If you don't have a GitHub account, make one free at github.com.

In Terminal:

```bash
cd ~/Desktop/zenith-diamond-shop
git init
git add .
git commit -m "Initial commit"
```

**Important:** before pushing anywhere, make sure your real `.env` file
(with your bot token) is never uploaded. Create a `.gitignore`:

```bash
cat > .gitignore << 'GITIGNORE'
server/.env
server/node_modules/
server/data/orders.json
GITIGNORE
git add .gitignore
git commit -m "Add gitignore"
```

Create a new empty repository on github.com (no README, no .gitignore —
you already have one), then push:

```bash
git remote add origin https://github.com/<your-username>/zenith-diamond-shop.git
git branch -M main
git push -u origin main
```

(GitHub will prompt you to sign in the first time — follow its instructions.)

### B2. Create a Render account and web service

1. Go to render.com and sign up (you can sign in with GitHub directly).
2. On the dashboard, click **New** → **Web Service**.
3. Connect your GitHub account if prompted, then select your
   `zenith-diamond-shop` repo.
4. Fill in the settings:
   - **Root Directory**: `server`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Under **Instance Type**, pick a **paid Starter plan** (a few dollars a
   month). This matters: Render's free tier puts your app to sleep after
   15 minutes of no traffic, so a customer's first visit would sit
   waiting 30–60 seconds while it wakes up. The paid tier stays on, which
   is what "24/7 for customers" actually needs.

### B3. Add your environment variables

Still on the setup screen (or under the service's **Environment** tab
after creation), add:

```
BOT_TOKEN     = your real token
ADMIN_CHAT_ID = your real chat id
```

Render sets `PORT` itself, so you don't need to add it.

### B4. Deploy

Click **Create Web Service**. Render will install dependencies and start
the app — this takes a minute or two the first time. When it's done,
you'll get a URL like:

```
https://zenith-diamond-shop.onrender.com
```

Your storefront is now at:

```
https://zenith-diamond-shop.onrender.com/diamond-plan.html
```

Share that link with customers — it works from any phone or computer,
any time, without your Mac needing to be on.

### B5. (Optional) Keep order history across deploys

Orders are stored in a plain file (`server/data/orders.json`). On Render,
each new deploy starts with a fresh filesystem, so old orders would be
lost on redeploy unless you add a **persistent disk**:

1. On your service page, go to the **Disks** tab → **Add Disk**.
2. Mount path: `/var/data`
3. In the **Environment** tab, add: `DATA_DIR=/var/data`
4. Redeploy.

If you don't mind losing old order history when you push updates, you can
skip this — everything else still works fine.

### B6. Updating the site later

Whenever you want to change something (prices, styling, wording), edit the
files locally, then:

```bash
git add .
git commit -m "describe your change"
git push
```

Render automatically redeploys within a minute or two.

---

## How the confirmation flow works (recap)

- Customer submits → order saved → Telegram message sent to you instantly
  with **Confirm payment / Reject** buttons.
- You check your KBZ/Wave/AYA account for the actual transfer, then tap
  the matching button.
- The customer's page polls every ~2.5 seconds and updates automatically —
  no refresh needed.
- **Confirm** means "payment verified, go ahead and top up their
  diamonds" — the actual in-game top-up is still a manual step for you,
  since there's no public API for that on the game's side.

## Security notes

- Never commit your real `.env` (it holds your bot token) — the
  `.gitignore` above already excludes it.
- Only someone with access to *your* Telegram account can tap
  Confirm/Reject — knowing your bot's username or chat ID isn't enough.
- If the shop gets heavy public traffic, consider adding basic
  rate-limiting to `/api/orders` so one person can't flood your Telegram
  with fake order alerts.
