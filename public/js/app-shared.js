/* ============================================================
   Zenith Esports — shared theme + language system
   ============================================================ */
(function () {
  "use strict";

  /* ---------------- translations ---------------- */
  const T = {
    en: {
      "nav.home": "Home",
      "nav.tournament": "Tournament",
      "nav.diamond": "Diamond",
      "nav.service": "Customer Service",
      "home.eyebrow": "Est. 2026 · Beyond the peak",
      "home.h1": "The Ultimate Hub for Esports Tournaments & MLBB Top-Ups",
      "home.desc": "Join competitive gaming events and get the fastest, most affordable Diamond services tailored for you.",
      "home.btn.tournament": "🏆 Tournament",
      "home.btn.diamond": "💎 Diamond",
      "home.stat.tournament": "Tournament",
      "home.stat.diamond": "Diamond Sold",
      "home.stat.players": "Players",
      "home.stat.rating": "Rating",
      "footer.est": "EST 2026",
      "footer.tagline": "Beyond the peak — Zenith Esports",
      "tournament.title": "Tournaments coming soon",
      "tournament.desc": "We're setting up the next Zenith Esports tournament. Check back soon, or head over to the Diamond store in the meantime.",
      "tournament.cta": "Go to Diamond store",
      "diamond.eyebrow": "Top-up center",
      "diamond.title": "Diamond Plan",
      "diamond.desc": "Pick a pack, enter your game ID, and pay. Our team confirms every order on Telegram before diamonds are sent — usually within minutes.",
      "diamond.tab.diamond": "Diamond",
      "diamond.tab.double": "Double diamond",
      "diamond.ticket.label": "Order ticket",
      "diamond.ticket.title": "Enter your account",
      "diamond.field.gameid": "Game ID",
      "diamond.field.server": "Server",
      "diamond.field.payment": "Payment method",
      "diamond.total": "Total",
      "diamond.submit": "Send for verification",
      "diamond.field.sender": "Your account / phone number",
      "diamond.field.screenshot": "Payment screenshot",
      "diamond.field.screenshot.sub": "Proof of your transfer",
      "diamond.field.screenshot.tap": "Tap to add a screenshot",
      "diamond.summary.empty": "No package selected yet — choose one on the left.",
      "diamond.passcard.name": "Weekly pass",
      "diamond.step.placed.title": "Order placed",
      "diamond.step.placed.sub": "Your details were submitted",
      "diamond.step.telegram.title": "Sent to Telegram",
      "diamond.step.telegram.sub": "Admin notified of your payment",
      "diamond.step.review.title": "Awaiting confirmation",
      "diamond.step.review.sub": "Admin checks the transfer, then approves",
      "diamond.step.done.title": "Diamonds delivered",
      "diamond.step.done.sub": "Sent straight to your account",
      "diamond.neworder": "Start a new order",
      "theme.toggle": "Toggle light / dark mode",
      "diamond.field.screenshot.attached": "Screenshot attached",
      "diamond.submit.sending": "Sending…",
      "diamond.ign.checking": "Checking account…",
      "diamond.ign.notfound": "Account not found — check your Game ID and Server",
      "diamond.ign.unavailable": "Couldn't verify account right now — you can still continue",
      "diamond.recap.gameid": "Game ID",
      "diamond.recap.server": "Server",
      "diamond.recap.ign": "IGN",
      "diamond.recap.notverified": "not verified yet",
      "diamond.proof.suffix": "payment details",
      "diamond.confirmed.title": "Payment confirmed",
      "diamond.confirmed.sub": "Your diamonds are on the way",
      "diamond.rejected.title": "Payment not found",
      "diamond.rejected.sub": "Contact us on Telegram with your order code",
    },
    mm: {
      "nav.home": "ပင်မ",
      "nav.tournament": "ပြိုင်ပွဲ",
      "nav.diamond": "ဒိုင်ယမြောင်း",
      "nav.service": "ဖောက်သည်ဝန်ဆောင်မှု",
      "home.eyebrow": "၂၀၂၆ ခုနှစ်တည်ထောင် · စိန်ခေါ်မှုများကိုကျော်လွှားပါ",
      "home.h1": "E-Sports ပြိုင်ပွဲများနှင့် MLBB ဒိုင်ယမြောင်းဖြည့်ရန် အကောင်းဆုံးနေရာ",
      "home.desc": "ယှဉ်ပြိုင်မှုပွဲများတွင်ပါဝင်ပြီး သင့်အတွက်အကောင်းဆုံးနှင့် အသက်သာဆုံး ဒိုင်ယမြောင်းဝန်ဆောင်မှုကို အမြန်ဆုံးရယူလိုက်ပါ။",
      "home.btn.tournament": "🏆 ပြိုင်ပွဲ",
      "home.btn.diamond": "💎 ဒိုင်ယမြောင်း",
      "home.stat.tournament": "ပြိုင်ပွဲများ",
      "home.stat.diamond": "ရောင်းချပြီးဒိုင်ယမြောင်း",
      "home.stat.players": "ကစားသမားများ",
      "home.stat.rating": "အဆင့်သတ်မှတ်ချက်",
      "footer.est": "၂၀၂၆ တည်ထောင်",
      "footer.tagline": "စိန်ခေါ်မှုများကိုကျော်လွှားပါ — Zenith Esports",
      "tournament.title": "ပြိုင်ပွဲများ မကြာမီစတင်မည်",
      "tournament.desc": "နောက်လာမည့် Zenith Esports ပြိုင်ပွဲကို ပြင်ဆင်နေပါသည်။ ခဏနေမှ ပြန်လာကြည့်ပါ၊ သို့မဟုတ် ဒိုင်ယမြောင်းဆိုင်သို့ ဝင်ရောက်ကြည့်ရှုနိုင်ပါသည်။",
      "tournament.cta": "ဒိုင်ယမြောင်းဆိုင်သို့ သွားရန်",
      "diamond.eyebrow": "ဒိုင်ယမြောင်းဖြည့်ရန်",
      "diamond.title": "ဒိုင်ယမြောင်းပက်ကေ့ချ်များ",
      "diamond.desc": "ပက်ကေ့ချ်တစ်ခုရွေးပြီး Game ID ထည့်ပြီး ငွေပေးချေပါ။ ဒိုင်ယမြောင်းမပို့မီ Telegram မှတဆင့် စစ်ဆေးအတည်ပြုပေးပါမည် — များသောအားဖြင့် မိနစ်အနည်းငယ်အတွင်း ပြီးမြောက်ပါသည်။",
      "diamond.tab.diamond": "ဒိုင်ယမြောင်း",
      "diamond.tab.double": "ဒိုင်ယမြောင်း နှစ်ဆ",
      "diamond.ticket.label": "အော်ဒါလက်မှတ်",
      "diamond.ticket.title": "သင့်အကောင့်အချက်အလက်ဖြည့်ပါ",
      "diamond.field.gameid": "Game ID",
      "diamond.field.server": "ဆာဗာ",
      "diamond.field.payment": "ငွေပေးချေမှုနည်းလမ်း",
      "diamond.total": "စုစုပေါင်း",
      "diamond.submit": "အတည်ပြုရန်ပို့ပါ",
      "diamond.field.sender": "သင့်အကောင့် / ဖုန်းနံပါတ်",
      "diamond.field.screenshot": "ငွေလွှဲပြေစာပုံ",
      "diamond.field.screenshot.sub": "ငွေလွှဲထားကြောင်းအထောက်အထား",
      "diamond.field.screenshot.tap": "ဓာတ်ပုံထည့်ရန်နှိပ်ပါ",
      "diamond.summary.empty": "ပက်ကေ့ချ်မရွေးရသေးပါ — ဘယ်ဘက်တွင်ရွေးချယ်ပါ။",
      "diamond.passcard.name": "အပတ်စဉ်ပတ်စ်",
      "diamond.step.placed.title": "အော်ဒါတင်ပြီး",
      "diamond.step.placed.sub": "သင့်အချက်အလက်များပို့ပြီးပါပြီ",
      "diamond.step.telegram.title": "Telegram သို့ပို့ပြီး",
      "diamond.step.telegram.sub": "အက်မင်ကို ငွေပေးချေမှုအကြောင်းအကြားပြီးပါပြီ",
      "diamond.step.review.title": "အတည်ပြုချက်စောင့်ဆိုင်းနေသည်",
      "diamond.step.review.sub": "အက်မင်က ငွေလွှဲမှုစစ်ဆေးပြီး အတည်ပြုပါမည်",
      "diamond.step.done.title": "ဒိုင်ယမြောင်းပို့ပြီးပါပြီ",
      "diamond.step.done.sub": "သင့်အကောင့်ထဲသို့တိုက်ရိုက်ပို့ပြီးပါပြီ",
      "diamond.neworder": "အော်ဒါအသစ်တင်ရန်",
      "theme.toggle": "အလင်း/အမှောင်မုဒ်ပြောင်းရန်",
      "diamond.field.screenshot.attached": "ဓာတ်ပုံတွဲပြီးပါပြီ",
      "diamond.submit.sending": "ပို့နေသည်…",
      "diamond.ign.checking": "အကောင့်စစ်ဆေးနေသည်…",
      "diamond.ign.notfound": "အကောင့်မတွေ့ပါ — Game ID နှင့် Server ကိုစစ်ဆေးပါ",
      "diamond.ign.unavailable": "အကောင့်ကိုယခုအချိန်တွင် စစ်ဆေးမရပါ — ဆက်လုပ်ဆောင်နိုင်ပါသည်",
      "diamond.recap.gameid": "Game ID",
      "diamond.recap.server": "ဆာဗာ",
      "diamond.recap.ign": "IGN",
      "diamond.recap.notverified": "မစစ်ဆေးရသေးပါ",
      "diamond.proof.suffix": "ငွေပေးချေမှုအသေးစိတ်",
      "diamond.confirmed.title": "ငွေပေးချေမှုအတည်ပြုပြီး",
      "diamond.confirmed.sub": "သင့်ဒိုင်ယမြောင်းများပို့နေပါသည်",
      "diamond.rejected.title": "ငွေပေးချေမှုမတွေ့ပါ",
      "diamond.rejected.sub": "အော်ဒါကုဒ်နှင့်အတူ Telegram တွင်ဆက်သွယ်ပါ",
    },
    th: {
      "nav.home": "หน้าแรก",
      "nav.tournament": "ทัวร์นาเมนต์",
      "nav.diamond": "ไดมอนด์",
      "nav.service": "ฝ่ายบริการลูกค้า",
      "home.eyebrow": "ก่อตั้ง 2026 · ก้าวข้ามขีดสุด",
      "home.h1": "ศูนย์รวมทัวร์นาเมนต์อีสปอร์ตและเติมไดมอนด์ MLBB ที่ดีที่สุด",
      "home.desc": "เข้าร่วมการแข่งขันเกมและรับบริการเติมไดมอนด์ที่รวดเร็วและคุ้มค่าที่สุดสำหรับคุณ",
      "home.btn.tournament": "🏆 ทัวร์นาเมนต์",
      "home.btn.diamond": "💎 ไดมอนด์",
      "home.stat.tournament": "ทัวร์นาเมนต์",
      "home.stat.diamond": "ไดมอนด์ที่ขายแล้ว",
      "home.stat.players": "ผู้เล่น",
      "home.stat.rating": "คะแนนรีวิว",
      "footer.est": "ก่อตั้ง 2026",
      "footer.tagline": "ก้าวข้ามขีดสุด — Zenith Esports",
      "tournament.title": "ทัวร์นาเมนต์กำลังจะมาเร็ว ๆ นี้",
      "tournament.desc": "เรากำลังจัดเตรียมทัวร์นาเมนต์ครั้งต่อไปของ Zenith Esports กลับมาดูใหม่เร็ว ๆ นี้ หรือแวะไปที่ร้านไดมอนด์ระหว่างนี้",
      "tournament.cta": "ไปที่ร้านไดมอนด์",
      "diamond.eyebrow": "ศูนย์เติมไดมอนด์",
      "diamond.title": "แพ็กไดมอนด์",
      "diamond.desc": "เลือกแพ็ก กรอก Game ID แล้วชำระเงิน ทีมงานของเราจะยืนยันทุกออเดอร์ผ่าน Telegram ก่อนส่งไดมอนด์ — โดยปกติภายในไม่กี่นาที",
      "diamond.tab.diamond": "ไดมอนด์",
      "diamond.tab.double": "ไดมอนด์คู่",
      "diamond.ticket.label": "ตั๋วคำสั่งซื้อ",
      "diamond.ticket.title": "กรอกข้อมูลบัญชีของคุณ",
      "diamond.field.gameid": "Game ID",
      "diamond.field.server": "เซิร์ฟเวอร์",
      "diamond.field.payment": "วิธีการชำระเงิน",
      "diamond.total": "ยอดรวม",
      "diamond.submit": "ส่งเพื่อตรวจสอบ",
      "diamond.field.sender": "บัญชี / เบอร์โทรศัพท์ของคุณ",
      "diamond.field.screenshot": "ภาพหน้าจอการชำระเงิน",
      "diamond.field.screenshot.sub": "หลักฐานการโอนเงินของคุณ",
      "diamond.field.screenshot.tap": "แตะเพื่อแนบภาพหน้าจอ",
      "diamond.summary.empty": "ยังไม่ได้เลือกแพ็ก — เลือกทางด้านซ้าย",
      "diamond.passcard.name": "พาสรายสัปดาห์",
      "diamond.step.placed.title": "สั่งซื้อสำเร็จ",
      "diamond.step.placed.sub": "ส่งข้อมูลของคุณเรียบร้อยแล้ว",
      "diamond.step.telegram.title": "ส่งไปยัง Telegram แล้ว",
      "diamond.step.telegram.sub": "แจ้งแอดมินเรื่องการชำระเงินแล้ว",
      "diamond.step.review.title": "กำลังรอการยืนยัน",
      "diamond.step.review.sub": "แอดมินกำลังตรวจสอบการโอนก่อนอนุมัติ",
      "diamond.step.done.title": "ส่งไดมอนด์เรียบร้อยแล้ว",
      "diamond.step.done.sub": "ส่งเข้าบัญชีของคุณโดยตรง",
      "diamond.neworder": "เริ่มออเดอร์ใหม่",
      "theme.toggle": "สลับโหมดสว่าง/มืด",
      "diamond.field.screenshot.attached": "แนบภาพหน้าจอแล้ว",
      "diamond.submit.sending": "กำลังส่ง…",
      "diamond.ign.checking": "กำลังตรวจสอบบัญชี…",
      "diamond.ign.notfound": "ไม่พบบัญชี — ตรวจสอบ Game ID และเซิร์ฟเวอร์ของคุณ",
      "diamond.ign.unavailable": "ยังตรวจสอบบัญชีไม่ได้ในตอนนี้ — คุณสามารถดำเนินการต่อได้",
      "diamond.recap.gameid": "Game ID",
      "diamond.recap.server": "เซิร์ฟเวอร์",
      "diamond.recap.ign": "IGN",
      "diamond.recap.notverified": "ยังไม่ได้ตรวจสอบ",
      "diamond.proof.suffix": "รายละเอียดการชำระเงิน",
      "diamond.confirmed.title": "ยืนยันการชำระเงินแล้ว",
      "diamond.confirmed.sub": "ไดมอนด์ของคุณกำลังจัดส่ง",
      "diamond.rejected.title": "ไม่พบการชำระเงิน",
      "diamond.rejected.sub": "ติดต่อเราทาง Telegram พร้อมรหัสออเดอร์ของคุณ",
    },
  };

  const LANG_KEY = "zenith-lang";
  const THEME_KEY = "zenith-theme";

  function getLang() {
    return localStorage.getItem(LANG_KEY) || "en";
  }
  function getTheme() {
    return localStorage.getItem(THEME_KEY) || "dark";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      btn.setAttribute("aria-pressed", theme === "light");
    });
  }

  function applyLang(lang) {
    const dict = T[lang] || T.en;
    document.documentElement.setAttribute("lang", lang === "mm" ? "my" : lang);
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key] !== undefined) el.textContent = dict[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (dict[key] !== undefined) el.setAttribute("placeholder", dict[key]);
    });
    document.querySelectorAll(".lang-switch button").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === lang);
    });
    const pill = document.querySelector(".lang-switch .pill");
    const activeBtn = document.querySelector(`.lang-switch button[data-lang="${lang}"]`);
    if (pill && activeBtn) {
      pill.style.transform = `translateX(${activeBtn.offsetLeft - 3}px)`;
    }
    localStorage.setItem(LANG_KEY, lang);
    window.ZenithI18n && window.ZenithI18n.onLangChange && window.ZenithI18n.onLangChange(lang, dict);
  }

  // expose a tiny hook pages can use for dynamically-rendered text (e.g. diamond-plan.js)
  window.ZenithI18n = { t: (key) => (T[getLang()] || T.en)[key], getLang, getTheme };

  function initControls() {
    const themeBtn = document.querySelector(".theme-toggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        const next = getTheme() === "dark" ? "light" : "dark";
        applyTheme(next);
      });
    }
    document.querySelectorAll(".lang-switch button").forEach((btn) => {
      btn.addEventListener("click", () => applyLang(btn.dataset.lang));
    });
  }

  // apply saved theme immediately (before paint) to avoid a flash
  applyTheme(getTheme());

  document.addEventListener("DOMContentLoaded", () => {
    initControls();
    applyLang(getLang());
    document.body.classList.add("page-ready");

    // scroll-reveal for elements marked .reveal / .reveal-stagger
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll(".reveal, .reveal-stagger").forEach((el) => io.observe(el));
  });
})();
