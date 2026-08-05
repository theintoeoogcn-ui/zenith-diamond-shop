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
      "tournament.eyebrow": "Compete & win",
      "tournament.title": "Zenith Esports Tournaments",
      "tournament.desc": "Browse upcoming events and see the results of tournaments we've already run. New tournaments are announced here first.",
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
      "diamond.admin.add.title": "Add package",
      "diamond.admin.edit.title": "Edit package",
      "diamond.admin.add.btn": "Add package",
      "diamond.admin.field.amount": "Diamonds",
      "diamond.admin.field.price": "Price (Ks)",
      "diamond.admin.editpass.title": "Edit weekly pass price",
      "diamond.admin.delete.confirm": "Remove this package?",
      "diamond.admin.error.save": "Could not save prices. Please try again.",

      "tournament.upcoming.title": "Upcoming Tournaments",
      "tournament.upcoming.empty": "No upcoming tournaments yet — check back soon.",
      "tournament.past.title": "Past Tournaments",
      "tournament.past.empty": "No past tournaments listed yet.",
      "tournament.badge.upcoming": "Upcoming",
      "tournament.badge.past": "Completed",
      "tournament.field.date": "Date",
      "tournament.field.prize": "Prize pool",
      "tournament.field.format": "Format",
      "tournament.field.slots": "Slots",
      "tournament.admin.locked": "Admin",
      "tournament.admin.unlocked": "Admin mode",
      "tournament.admin.exit": "Exit admin mode",
      "tournament.admin.prompt.title": "Enter admin passcode",
      "tournament.admin.prompt.placeholder": "Passcode",
      "tournament.admin.prompt.submit": "Unlock",
      "tournament.admin.prompt.wrong": "Incorrect passcode",
      "tournament.admin.prompt.cancel": "Cancel",
      "tournament.admin.prompt.disabled": "Admin panel is disabled — set ADMIN_PASSCODE on the server.",
      "tournament.create.btn": "+ Create Tournament",
      "tournament.form.title.create": "Create tournament",
      "tournament.form.title.edit": "Edit tournament",
      "tournament.form.field.title": "Tournament title",
      "tournament.form.field.status": "Status",
      "tournament.form.field.status.upcoming": "Upcoming",
      "tournament.form.field.status.past": "Completed",
      "tournament.form.field.date": "Date",
      "tournament.form.field.prize": "Prize pool",
      "tournament.form.field.format": "Format",
      "tournament.form.field.slots": "Slots / Teams",
      "tournament.form.field.icon": "Icon",
      "tournament.form.field.cover": "Cover image",
      "tournament.form.field.cover.tap": "Tap to add a cover image",
      "tournament.form.field.cover.remove": "Remove cover image",
      "tournament.form.field.cover.attached": "Cover image attached",
      "tournament.form.field.description": "Description",
      "tournament.form.save": "Save",
      "tournament.form.saving": "Saving…",
      "tournament.form.cancel": "Cancel",
      "tournament.card.edit": "Edit",
      "tournament.card.delete": "Delete",
      "tournament.card.delete.confirm": "Delete this tournament?",
      "tournament.error.save": "Could not save. Please try again.",
      "tournament.error.delete": "Could not delete. Please try again.",

      "service.eyebrow": "We're here to help",
      "service.title": "Customer Service",
      "service.desc": "Run into an issue with an order, or just have a question? Reach our team directly — we usually reply within minutes.",
      "service.phone.label": "Phone",
      "service.phone.cta": "Call now",
      "service.telegram.label": "Telegram",
      "service.telegram.cta": "Message us",
      "service.viber.label": "Viber",
      "service.viber.cta": "Message us",
      "service.hours": "Available daily · Fast response times",
      "service.note": "Please have your order code ready (e.g. ZE-1234) if you're contacting us about an existing order.",
    },
    mm: {
      "nav.home": "Home",
      "nav.tournament": "Tournament",
      "nav.diamond": "Diamond",
      "nav.service": "Customer Service",
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
      "tournament.eyebrow": "ယှဉ်ပြိုင်ပြီးဆုရယူပါ",
      "tournament.title": "Zenith Esports ပြိုင်ပွဲများ",
      "tournament.desc": "လာမည့်ပြိုင်ပွဲများကိုကြည့်ရှုပြီး ပြီးဆုံးသွားသောပြိုင်ပွဲများ၏ရလဒ်များကိုလည်း ကြည့်နိုင်ပါသည်။ ပြိုင်ပွဲအသစ်များကို ဒီနေရာတွင်ပထမဆုံးကြေညာပါမည်။",
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
      "diamond.admin.add.title": "ပက်ကေ့ချ်အသစ်ထည့်ရန်",
      "diamond.admin.edit.title": "ပက်ကေ့ချ်ပြင်ရန်",
      "diamond.admin.add.btn": "ပက်ကေ့ချ်ထည့်ရန်",
      "diamond.admin.field.amount": "ဒိုင်ယမြောင်းအရေအတွက်",
      "diamond.admin.field.price": "ဈေးနှုန်း (Ks)",
      "diamond.admin.editpass.title": "အပတ်စဉ်ပတ်စ်ဈေးနှုန်းပြင်ရန်",
      "diamond.admin.delete.confirm": "ဒီပက်ကေ့ချ်ကိုဖျက်မလား?",
      "diamond.admin.error.save": "ဈေးနှုန်းများ သိမ်းမရပါ — ထပ်စမ်းကြည့်ပါ။",

      "tournament.upcoming.title": "လာမည့်ပြိုင်ပွဲများ",
      "tournament.upcoming.empty": "လာမည့်ပြိုင်ပွဲ မရှိသေးပါ — ခဏနေမှ ပြန်ကြည့်ပါ။",
      "tournament.past.title": "ပြီးဆုံးသွားသောပြိုင်ပွဲများ",
      "tournament.past.empty": "ပြီးဆုံးသွားသောပြိုင်ပွဲ မရှိသေးပါ။",
      "tournament.badge.upcoming": "လာမည့်ပွဲ",
      "tournament.badge.past": "ပြီးဆုံးပြီး",
      "tournament.field.date": "ရက်စွဲ",
      "tournament.field.prize": "ဆုငွေ",
      "tournament.field.format": "ပြိုင်ပွဲပုံစံ",
      "tournament.field.slots": "နေရာအရေအတွက်",
      "tournament.admin.locked": "Admin",
      "tournament.admin.unlocked": "Admin မုဒ်",
      "tournament.admin.exit": "Admin မုဒ်မှထွက်ရန်",
      "tournament.admin.prompt.title": "Admin passcode ထည့်ပါ",
      "tournament.admin.prompt.placeholder": "Passcode",
      "tournament.admin.prompt.submit": "ဖွင့်ရန်",
      "tournament.admin.prompt.wrong": "Passcode မှားနေပါသည်",
      "tournament.admin.prompt.cancel": "မလုပ်တော့ပါ",
      "tournament.admin.prompt.disabled": "Admin panel ကို ပိတ်ထားပါသည် — server ပေါ်တွင် ADMIN_PASSCODE သတ်မှတ်ပါ။",
      "tournament.create.btn": "+ ပြိုင်ပွဲအသစ်ထည့်ရန်",
      "tournament.form.title.create": "ပြိုင်ပွဲအသစ်ဖန်တီးရန်",
      "tournament.form.title.edit": "ပြိုင်ပွဲပြင်ရန်",
      "tournament.form.field.title": "ပြိုင်ပွဲအမည်",
      "tournament.form.field.status": "အခြေအနေ",
      "tournament.form.field.status.upcoming": "လာမည့်ပွဲ",
      "tournament.form.field.status.past": "ပြီးဆုံးပြီး",
      "tournament.form.field.date": "ရက်စွဲ",
      "tournament.form.field.prize": "ဆုငွေ",
      "tournament.form.field.format": "ပြိုင်ပွဲပုံစံ",
      "tournament.form.field.slots": "နေရာ / အသင်းအရေအတွက်",
      "tournament.form.field.icon": "အိုင်ကွန်",
      "tournament.form.field.cover": "အဖုံးပုံ",
      "tournament.form.field.cover.tap": "အဖုံးပုံထည့်ရန်နှိပ်ပါ",
      "tournament.form.field.cover.remove": "အဖုံးပုံဖျက်ရန်",
      "tournament.form.field.cover.attached": "အဖုံးပုံတွဲပြီးပါပြီ",
      "tournament.form.field.description": "ဖော်ပြချက်",
      "tournament.form.save": "သိမ်းမည်",
      "tournament.form.saving": "သိမ်းနေသည်…",
      "tournament.form.cancel": "မလုပ်တော့ပါ",
      "tournament.card.edit": "ပြင်ရန်",
      "tournament.card.delete": "ဖျက်ရန်",
      "tournament.card.delete.confirm": "ဒီပြိုင်ပွဲကိုဖျက်မလား?",
      "tournament.error.save": "သိမ်းမရပါ — ထပ်စမ်းကြည့်ပါ။",
      "tournament.error.delete": "ဖျက်မရပါ — ထပ်စမ်းကြည့်ပါ။",

      "service.eyebrow": "ကူညီရန် အသင့်ရှိပါသည်",
      "service.title": "ဖောက်သည်ဝန်ဆောင်မှု",
      "service.desc": "အော်ဒါနှင့်ပတ်သက်၍ အခက်အခဲရှိပါက သို့မဟုတ် မေးခွန်းရှိပါက ကျွန်ုပ်တို့အဖွဲ့ကို တိုက်ရိုက်ဆက်သွယ်နိုင်ပါသည် — များသောအားဖြင့် မိနစ်အနည်းငယ်အတွင်း ပြန်လည်ဖြေကြားပါသည်။",
      "service.phone.label": "ဖုန်း",
      "service.phone.cta": "ယခုပဲခေါ်ဆိုပါ",
      "service.telegram.label": "Telegram",
      "service.telegram.cta": "စာပို့ရန်",
      "service.viber.label": "Viber",
      "service.viber.cta": "စာပို့ရန်",
      "service.hours": "နေ့စဉ်ဝန်ဆောင်မှုပေးသည် · အမြန်ဆုံးပြန်ကြားပါမည်",
      "service.note": "အော်ဒါဟောင်းတစ်ခုနှင့်ပတ်သက်၍ ဆက်သွယ်ပါက အော်ဒါကုဒ် (ဥပမာ ZE-1234) ကို အသင့်ပြင်ထားပါ။",
    },
    th: {
      "nav.home": "Home",
      "nav.tournament": "Tournament",
      "nav.diamond": "Diamond",
      "nav.service": "Customer Service",
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
      "tournament.eyebrow": "แข่งขันและคว้าชัยชนะ",
      "tournament.title": "ทัวร์นาเมนต์ Zenith Esports",
      "tournament.desc": "ดูทัวร์นาเมนต์ที่กำลังจะมาถึงและผลการแข่งขันที่ผ่านมาของเรา ทัวร์นาเมนต์ใหม่จะประกาศที่นี่เป็นที่แรก",
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
      "diamond.admin.add.title": "เพิ่มแพ็ก",
      "diamond.admin.edit.title": "แก้ไขแพ็ก",
      "diamond.admin.add.btn": "เพิ่มแพ็ก",
      "diamond.admin.field.amount": "ไดมอนด์",
      "diamond.admin.field.price": "ราคา (Ks)",
      "diamond.admin.editpass.title": "แก้ไขราคาพาสรายสัปดาห์",
      "diamond.admin.delete.confirm": "ลบแพ็กนี้หรือไม่?",
      "diamond.admin.error.save": "บันทึกราคาไม่สำเร็จ กรุณาลองใหม่",

      "tournament.upcoming.title": "ทัวร์นาเมนต์ที่กำลังจะมาถึง",
      "tournament.upcoming.empty": "ยังไม่มีทัวร์นาเมนต์ที่กำลังจะมาถึง — กลับมาดูใหม่เร็ว ๆ นี้",
      "tournament.past.title": "ทัวร์นาเมนต์ที่ผ่านมา",
      "tournament.past.empty": "ยังไม่มีทัวร์นาเมนต์ที่ผ่านมา",
      "tournament.badge.upcoming": "กำลังจะมาถึง",
      "tournament.badge.past": "จบแล้ว",
      "tournament.field.date": "วันที่",
      "tournament.field.prize": "เงินรางวัล",
      "tournament.field.format": "รูปแบบ",
      "tournament.field.slots": "จำนวนที่ว่าง",
      "tournament.admin.locked": "แอดมิน",
      "tournament.admin.unlocked": "โหมดแอดมิน",
      "tournament.admin.exit": "ออกจากโหมดแอดมิน",
      "tournament.admin.prompt.title": "กรอกรหัสผ่านแอดมิน",
      "tournament.admin.prompt.placeholder": "รหัสผ่าน",
      "tournament.admin.prompt.submit": "ปลดล็อก",
      "tournament.admin.prompt.wrong": "รหัสผ่านไม่ถูกต้อง",
      "tournament.admin.prompt.cancel": "ยกเลิก",
      "tournament.admin.prompt.disabled": "แผงควบคุมแอดมินถูกปิดใช้งาน — ตั้งค่า ADMIN_PASSCODE บนเซิร์ฟเวอร์",
      "tournament.create.btn": "+ สร้างทัวร์นาเมนต์",
      "tournament.form.title.create": "สร้างทัวร์นาเมนต์",
      "tournament.form.title.edit": "แก้ไขทัวร์นาเมนต์",
      "tournament.form.field.title": "ชื่อทัวร์นาเมนต์",
      "tournament.form.field.status": "สถานะ",
      "tournament.form.field.status.upcoming": "กำลังจะมาถึง",
      "tournament.form.field.status.past": "จบแล้ว",
      "tournament.form.field.date": "วันที่",
      "tournament.form.field.prize": "เงินรางวัล",
      "tournament.form.field.format": "รูปแบบ",
      "tournament.form.field.slots": "จำนวนทีม / ที่ว่าง",
      "tournament.form.field.icon": "ไอคอน",
      "tournament.form.field.cover": "ภาพปก",
      "tournament.form.field.cover.tap": "แตะเพื่อเพิ่มภาพปก",
      "tournament.form.field.cover.remove": "ลบภาพปก",
      "tournament.form.field.cover.attached": "แนบภาพปกแล้ว",
      "tournament.form.field.description": "รายละเอียด",
      "tournament.form.save": "บันทึก",
      "tournament.form.saving": "กำลังบันทึก…",
      "tournament.form.cancel": "ยกเลิก",
      "tournament.card.edit": "แก้ไข",
      "tournament.card.delete": "ลบ",
      "tournament.card.delete.confirm": "ลบทัวร์นาเมนต์นี้หรือไม่?",
      "tournament.error.save": "บันทึกไม่สำเร็จ กรุณาลองใหม่",
      "tournament.error.delete": "ลบไม่สำเร็จ กรุณาลองใหม่",

      "service.eyebrow": "เราพร้อมช่วยเหลือ",
      "service.title": "ฝ่ายบริการลูกค้า",
      "service.desc": "พบปัญหากับออเดอร์ หรือมีคำถาม? ติดต่อทีมงานของเราได้โดยตรง — เรามักจะตอบกลับภายในไม่กี่นาที",
      "service.phone.label": "โทรศัพท์",
      "service.phone.cta": "โทรเลย",
      "service.telegram.label": "Telegram",
      "service.telegram.cta": "ส่งข้อความหาเรา",
      "service.viber.label": "Viber",
      "service.viber.cta": "ส่งข้อความหาเรา",
      "service.hours": "ให้บริการทุกวัน · ตอบกลับรวดเร็ว",
      "service.note": "กรุณาเตรียมรหัสออเดอร์ของคุณ (เช่น ZE-1234) หากติดต่อเกี่ยวกับออเดอร์ที่มีอยู่แล้ว",
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
