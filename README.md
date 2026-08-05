# Zenith Esports — updated site

## What changed in this pass

1. **Hero animation (home page)** — the hero character now has an animated
   "hair sway" overlay and an animated bow-draw/arrow-release loop layered on
   top of `assets/hero-character.png`. These are separate SVG/CSS layers, not
   pixel edits to your PNG (I don't have the source artwork), so you'll
   likely need to nudge their position. In `index.html`, search for
   `.char-stage{` and adjust:
   ```css
   --hair-top: 2%;   --hair-left: 24%;  --hair-width: 38%;
   --bow-top: 30%;   --bow-left: 8%;    --bow-width: 20%;
   ```
   until the strands sit over the hair and the bow sits in the hand.

2. **Fonts** — the whole site now uses a San Francisco system-font stack
   (`-apple-system, BlinkMacSystemFont, 'SF Pro Text'`) as the primary body
   font, paired with **Inter** as the web fallback (closest match to SF for
   Windows/Android/Linux, since SF Pro itself only exists on Apple devices).
   Orbitron remains as the display/heading font for the esports branding.
   Noto Sans Myanmar and Noto Sans Thai are loaded too, so Burmese and Thai
   text render correctly when the language is switched.

3. **Language switch** — MM / EN / TH pill switcher in the header on all
   three pages. Translations live in one place:
   `public/js/app-shared.js` → the `T` object near the top. Add more
   `data-i18n="your.key"` attributes anywhere you want new text to be
   translatable, and add the matching key to all three language blocks.

4. **Light / dark mode** — toggle button in the header with an animated
   sun/moon icon (rotates + cross-fades). Preference is remembered
   (`localStorage`). Theme colors live in `public/css/theme.css` under
   `[data-theme="light"]` — tweak the hex values there if you want a
   different light palette.

5. **Animations** — scroll-reveal fade-ups on the home page, package-card
   pop on selection, tab-switch fade on the diamond page, a floating trophy
   on the "coming soon" tournament page, and hover/press micro-interactions
   on buttons.

## Project structure

```
public/            → static frontend, served directly by the backend
  index.html
  tournament.html
  diamond-plan.html
  css/theme.css     → light/dark variables + shared animation utilities
  js/app-shared.js  → theme toggle + language switch + translations
  assets/           → put your images here (see ASSETS-NEEDED.md)

server/             → backend (Express + Telegram bot)
  index.js          → app entry point
  routes/orders.js  → POST/GET /api/orders
  routes/ign.js     → GET /api/ign (Mobile Legends nickname lookup)
  db.js             → simple JSON-file order storage (server/data/orders.json)
  bot.js            → Telegram admin notifications
  .env.example      → copy to .env and fill in
```

## Running it

```bash
cd server
npm install
cp .env.example .env      # then edit .env with your real BOT_TOKEN / ADMIN_CHAT_ID
npm start                 # or: npm run dev  (auto-restarts on file changes)
```

Then open **http://localhost:3000** — the backend serves the `public/`
folder directly, so the site and the API are on the same origin (no CORS
setup needed, though `cors` is still enabled).

**You don't need a real Telegram bot to try the site.** If `BOT_TOKEN` /
`ADMIN_CHAT_ID` are missing or still placeholders, the server now logs a
warning and keeps running with Telegram notifications disabled, instead of
crashing (previously `bot.js` called `process.exit(1)`). Orders still get
created and stored in `server/data/orders.json`; you just won't get pinged
on Telegram, and there's no button to confirm/reject them until you add
real credentials.

To enable real Telegram notifications:
1. Message **@BotFather** on Telegram → `/newbot` → copy the token into
   `BOT_TOKEN`.
2. Message **@userinfobot** to get your numeric chat ID (or add your bot to
   a group and use a tool like @RawDataBot for a group ID) → put it in
   `ADMIN_CHAT_ID`.
3. Restart the server.

## Known gaps to be aware of

- **Image assets aren't included** — `zenith-logo.png`, `hero-character.png`,
  `diamond-icon.png`, `kbz-pay.png`, `wave-money.png`, and `aya-pay.png` were
  never uploaded, so those `<img>` tags will 404 until you drop your real
  files into `public/assets/`. See `public/assets/ASSETS-NEEDED.md`.
- **Hero overlay positioning is approximate** — see point 1 above.
- **Translation coverage** — I translated all the primary UI text (nav,
  hero, footer, tournament page, and the full diamond-plan order flow
  including dynamic status text). A few very minor strings I might have
  missed will silently fall back to English — that's safe, nothing will
  break, just add the key to `app-shared.js` if you spot one.
- I could not run `npm install` / boot the server in this environment
  (no network access here), so I syntax-checked every JS file and verified
  the HTML is well-formed, but please do a real run-through on your machine
  before deploying.
