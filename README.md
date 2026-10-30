# نکسورا — Nexora Messenger

پیام‌رسان فارسی، فوق‌سریع و کاملاً ریسپانسیو با الهام از تلگرام، همراه با **پلتفرم کامل ربات‌سازی (Nexora Bot API)**.

- 🌐 **نسخهٔ زنده:** https://nexora-pish.vercel.app
- 🤖 **ربات‌ساز:** https://nexora-pish.vercel.app/bots
- 📚 **مستندات API:** https://nexora-pish.vercel.app/docs
- 📦 **زیپ کامل سورس:** [`nexora-source.zip`](public/nexora-source.zip) — یا مستقیم از
  <https://nexora-pish.vercel.app/nexora-source.zip> (بدون هیچ کلید و رمزی)

## دانلود سورس کامل

| راه | نشانی |
| --- | --- |
| از خود سایت | <https://nexora-pish.vercel.app/nexora-source.zip> |
| از مخزن گیت | [`public/nexora-source.zip`](public/nexora-source.zip) |
| کل مخزن از گیت‌هاب (zip) | <https://codeload.github.com/alinamvarkallan1390-source/PISH/zip/refs/heads/arena/460fccb4-pish> |
| ساخت مجدد | `bash scripts/pack-source.sh` |

داخل زیپ **هیچ فایل محرمانه‌ای نیست**: نه `.env`، نه `DATABASE_URL`، نه `NEXORA_SECRET`، نه
`node_modules`/`.next` و نه تاریخچهٔ گیت. فقط سورس کامل + `package-lock.json` + `.env.example`.
اسم فایل‌های زیپ زیر پوشهٔ `nexora/` است؛ بعد از استخراج:

```bash
cd nexora
cp .env.example .env.local   # اختیاری: برای دیتابیس واقعی مقادیر را پر کن
npm install
npm run dev
```

## شروع از صفر

نکسورا **هیچ کاربر نمایشی و هیچ کانال پیش‌فرضی** ندارد. نصب تازه کاملاً خالی است: فقط دو ربات رسمی
(`@nexora_bot` و `@echo_bot`) و تنظیمات پیش‌فرض ساخته می‌شوند. کافی است در صفحهٔ ورود حساب بسازید.

> داده‌های نمایشی نسخهٔ قبل (کاربران `ali/sara/reza/mina` و گروه/کانال پیش‌فرض) به‌صورت خودکار و یک‌بار
> در اولین بالا آمدن سرور پاک می‌شوند؛ از پنل مدیریت (`نگهداری → purge_demo`) هم قابل اجراست.

## پنل مدیریت

آدرس: **`/adminn`** — رمز عبور پیش‌فرض `ali026` (قابل تغییر با متغیر محیطی `NEXORA_ADMIN_PASSWORD`).

| بخش | امکانات |
| --- | --- |
| داشبورد | کاربران، چت‌ها، پیام‌ها، مدیا، آنلاین‌ها، بن‌شده‌ها + نمودار ۷ روزه |
| کاربران | جست‌وجو، بن/آنبن با دلیل، پریمیوم، تیک تأیید، ادمین، ریست رمز، حذف |
| گفتگوها | فهرست کامل با نوع/اعضا/پیام، حذف گروه و کانال |
| ربات‌ها | rotate توکن، لغو وبهوک، حذف |
| پیام‌ها | جست‌وجوی محتوا و حذف (مدیریت محتوا) |
| پیام همگانی | ارسال پیام از طرف تیم به همهٔ کاربران |
| تنظیمات | نام برنامه، باز/بستهٔ ثبت‌نام، نظرسنجی، مدیا، سقف حجم و طول پیام |
| نگهداری | حالت تعمیرات + متن پیام، پاک‌سازی دمو، چت‌های خالی، مدیای بی‌مالک |
| لاگ | ثبت همهٔ اقدامات مدیریتی در `audit_log` |

## نکات نسخهٔ ۳

- **ظاهر تلگرام‌گونه و پرمیوم**: حباب‌های دنباله‌دار، تیک خوانده‌شدن آبی، پیل تاریخ، نقل‌قول رنگی،
  ری‌اکشن‌های شیشه‌ای، دکمهٔ شیشه‌ای داخل پیام، پس‌زمینهٔ نقطه‌چین محو، مودال‌ها و منوهای شیشه‌ای.
- **۳ پوسته**: تاریک (تلگرام‌مانند)، روشن (حباب سبز)، آمولد.
- **موبایل واقعی**: تب‌بار پایین، چت تمام‌صفحه، شیت‌های پایین‌کشیدنی، دکمهٔ «رفتن به آخرین پیام».
- **پایتون**: SDK کامل + صفحهٔ مستندات + دانلود مستقیم.

## نکات نسخهٔ ۲

- **طراحی شیشه‌ای‌تر**: aurora blobs، شیشهٔ مات با `backdrop-filter: blur(34px)` در همهٔ سطوح،
  حباب‌های گرادیانی و سایه‌های نرم.
- **ریسپانسیو واقعی موبایل**: ریـل کنار به نوار پایین تبدیل می‌شود، فهرست گفتگوها تمام‌صفحه است،
  پنجرهٔ چت به‌صورت overlay با دکمهٔ بازگشت باز می‌شود، مودال‌ها به bottom-sheet تبدیل می‌شوند،
  `100dvh` + safe-area inset برای ناچ و نوار خانه.
- **نظرسنجی**: ساخت تا ۸ گزینه، رأی زنده، شمارش درصدی.
- **پیام‌های ذخیره‌شده**: گفتگوی شخصی «🔖 پیام‌های ذخیره‌شده» با ذخیرهٔ هر پیام از منوی پیام.
- **ربات در گروه**: افزودن ربات از پنجرهٔ اطلاعات گروه؛ پاسخ به منشن و دستورهای `/`.

## 🐍 ربات‌سازی با پایتون

SDK رسمی و بدون وابستگی برای ساخت ربات:

```bash
curl -O https://nexora-pish.vercel.app/sdk/nexora_bot.py
NEXORA_TOKEN="123456:AAH-..." python echo_bot.py
```

```python
from nexora_bot import Bot, inline_keyboard

bot = Bot("123456:AAH-TOKEN")

@bot.on("command:start")
def start(update):
    bot.send_message(update.chat_id, f"سلام {update.user['first_name']}! 👋",
                     reply_markup=inline_keyboard([[{"text": "راهنما", "data": "help"}]]))

@bot.on("message")
def echo(update):
    if not update.text.startswith("/"):
        bot.reply(update, "🔁 " + update.text)

bot.run_polling()
```

- سورس: [`python/nexora_bot.py`](./python/nexora_bot.py) · نمونه: [`python/echo_bot.py`](./python/echo_bot.py)
- مستندات وب: `/python` · دانلود مستقیم: `/sdk/nexora_bot.py`
- نصب به‌عنوان پکیج: `pip install git+https://github.com/alinamvarkallan1390-source/PISH#subdirectory=python`
- پیلودها **سازگار با تلگرام** هستند (`message.chat.id`, `message.from`, `reply_markup.inline_keyboard`)

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

| `NEXORA_ADMIN_PASSWORD` | رمز پنل `/adminn` (پیش‌فرض `ali026`). |

جداول به‌صورت خودکار در schema اختصاصی **`nexora_msg`** ساخته می‌شوند (idempotent) و فقط
ربات‌های رسمی + تنظیمات پیش‌فرض seed می‌شوند — نه کاربر و نه کانال.

## ساختار

```
app/
  api/            احراز هویت، چت‌ها، پیام‌ها، مدیا، جستوجو، ربات‌ها و Bot API
  bots/           پنل ربات‌ساز
  docs/           مستندات Bot API
  login/          صفحهٔ ورود و ثبت‌نام
  adminn/         پنل مدیریت (رمز محافظت‌شده)
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
