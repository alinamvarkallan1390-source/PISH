# نکسورا — Nexora Messenger

پیام‌رسان فارسی، فوق‌سریع و کاملاً ریسپانسیو با الهام از تلگرام، همراه با **پلتفرم کامل ربات‌سازی (Nexora Bot API)**.

- 🌐 **نسخهٔ زنده:** https://nexora-pish.vercel.app
- 🤖 **ربات‌ساز:** https://nexora-pish.vercel.app/bots
- 📚 **مستندات API:** https://nexora-pish.vercel.app/docs

## حساب‌های نمایشی

| کاربر | نام کاربری | رمز |
| --- | --- | --- |
| 🦊 علی | `ali` | `nexora123` |
| 🦋 سارا | `sara` | `nexora123` |
| 🐧 رضا | `reza` | `nexora123` |
| 🌙 مینا | `mina` | `nexora123` |

یا از دکمه‌های ورود سریع در صفحهٔ ورود استفاده کنید. ثبت‌نام حساب جدید هم باز است.

## قابلیت‌ها

**پیام‌رسان**
- چت خصوصی، گروه و کانال (با آیدی عمومی و عضویت از طریق آیدی)
- ری‌تایم زنده (همگام‌سازی هر ۲ ثانیه) شامل پیام جدید، ویرایش، حذف و ری‌اکشن
- متن، عکس، فایل، پیام صوتی (ضبط با میکروفون) و استیکر
- ری‌اکشن (۶ ایموجی سریع + شمارش)، ریپلای، فوروارد، ویرایش، حذف، سنجاق
- تیک ارسال/خوانده‌شدن، شمارندهٔ خوانده‌نشده، «در حال نوشتن…»، وضعیت آنلاین
- فولدرها (همه / خوانده‌نشده / گروه‌ها / کانال‌ها / ربات‌ها) و جستوجوی سراسری
- جستوجوی کاربر، گروه، کانال، ربات و متن پیام
- پروفایل قابل ویرایش (نام، بیو، آواتار ایموجی، رنگ)
- سه پوسته: تاریک، روشن و آمولد + طراحی ریسپانسیو کامل (موبایل/تبلت/دسکتاپ)
- مدیریت اعضا، نقش‌ها (مالک/مدیر/عضو)، سکوت و سنجاق گفتگو
- لینک اشتراکی برای هر گروه/کانال با آیدی عمومی

**ربات‌ساز**
- ساخت ربات در چند ثانیه + توکن اختصاصی
- آپلود مدیا و ارسال آن توسط ربات
- دکمه‌های شیشه‌ای (inline keyboard) و رویداد `callback_query`
- Polling با `getUpdates` یا دریافت زندهٔ رویدادها با `setWebhook`
- دو ربات رسمی آماده: `@nexora_bot` (دستیار با دستورات `/start /help /stats /time /id`) و `@echo_bot`
- پنل مدیریت ربات + مستندات کامل با نمونه‌کد Node.js و Python

## تکنولوژی

- **Next.js 15 (App Router) + React 19 + TypeScript**
- **PostgreSQL** (Neon serverless) — لایهٔ داده با درایور HTTP سازگار با Vercel
- برای توسعهٔ محلی بدون دیتابیس، به‌صورت خودکار از **PGlite** (Postgres در WASM) استفاده می‌شود
- احراز هویت: کوکی امضاشدهٔ HMAC + هش رمز با `scrypt`
- بدون هیچ کتابخانهٔ UI — CSS دست‌نویس، فونت Vazirmatn
- دیپلوی روی **Vercel**

## اجرا

```bash
npm install
npm run dev      # http://localhost:3000  (بدون نیاز به دیتابیس)
```

متغیرهای محیطی:

| متغیر | توضیح |
| --- | --- |
| `DATABASE_URL` | رشتهٔ اتصال Postgres (Neon). اگر نباشد، PGlite محلی استفاده می‌شود. |
| `NEXORA_SECRET` | کلید امضای کوکی نشست. |

جداول به‌صورت خودکار در schema اختصاصی **`nexora_msg`** ساخته و دادهٔ نمایشی seed می‌شوند (idempotent).

## ساختار

```
app/
  api/            احراز هویت، چت‌ها، پیام‌ها، مدیا، جستوجو، ربات‌ها و Bot API
  bots/           پنل ربات‌ساز
  docs/           مستندات Bot API
  login/          صفحهٔ ورود و ثبت‌نام
components/       رابط کاربری (Messenger, ChatWindow, Modals, Icons, ...)
lib/              دیتابیس، اسکیما، کوئری‌ها، مسنجینگ، ربات‌های داخلی، auth
```

## Nexora Bot API (خلاصه)

```
GET|POST https://nexora-pish.vercel.app/api/bot/<TOKEN>/<method>
```

متدها: `getMe`, `getUpdates`, `setWebhook`, `deleteWebhook`, `getWebhookInfo`,
`sendMessage`, `sendPhoto`, `sendDocument`, `sendVoice`, `sendSticker`,
`editMessageText`, `deleteMessage`, `forwardMessage`, `pinChatMessage`,
`sendChatAction`, `setMyCommands`, `getMyCommands`, `getChat`, `getChatMember`,
`getBotChats`, `answerCallbackQuery`.

```bash
curl -s https://nexora-pish.vercel.app/api/bot/<TOKEN>/getMe

curl -s -X POST https://nexora-pish.vercel.app/api/bot/<TOKEN>/sendMessage \
  -H 'content-type: application/json' \
  -d '{"chat_id":"<USER_ID>","text":"سلام از ربات 👋",
       "reply_markup":{"inline_keyboard":[[{"text":"شروع","data":"start"}]]}}'
```

## سلامت سامانه

```
GET /api/diag   →  {"ok":true,"db":"connected","stats":{...}}
```

---

ساخته‌شده با ❤️ برای وب فارسی.
