import Link from "next/link";

export const metadata = {
  title: "مستندات Nexora Bot API",
  description: "مرجع کامل Bot API نکسورا: متدها، وب‌هوک، دکمه‌های شیشه‌ای و نمونه کد.",
};

const methods: [string, string][] = [
  ["getMe", "اطلاعات ربات را برمی‌گرداند."],
  ["getUpdates", "پیام‌های جدید را با polling دریافت می‌کند (offset, limit)."],
  ["setWebhook", "آدرس وب‌هوک را تنظیم می‌کند (url, secret_token)."],
  ["deleteWebhook", "وب‌هوک را حذف می‌کند."],
  ["getWebhookInfo", "وضعیت فعلی وب‌هوک."],
  ["sendMessage", "ارسال پیام متنی + دکمه‌های شیشه‌ای (chat_id, text, reply_markup)."],
  ["sendPhoto / sendDocument / sendVoice", "ارسال مدیا با شناسهٔ فایل آپلودشده (photo, caption)."],
  ["sendSticker", "ارسال استیکر با ایموجی (emoji)."],
  ["editMessageText", "ویرایش متن پیام ارسال‌شده توسط ربات."],
  ["deleteMessage", "حذف پیام ربات."],
  ["forwardMessage", "فوروارد پیام از یک گفتگو به گفتگوی دیگر."],
  ["pinChatMessage", "سنجاق کردن پیام."],
  ["sendChatAction", "نمایش «در حال نوشتن…»."],
  ["setMyCommands / getMyCommands", "مدیریت لیست دستورات ربات."],
  ["getChat", "اطلاعات گفتگو و لیست اعضا."],
  ["getChatMember", "وضعیت عضویت یک کاربر (owner / admin / member / left)."],
  ["getBotChats", "لیست گفتگوهای فعال ربات."],
  ["answerCallbackQuery", "پاسخ به فشار دکمهٔ شیشه‌ای."],
];

export default function DocsPage() {
  return (
    <div className="page">
      <div className="page-inner">
        <div className="topbar" style={{ margin: "-26px -22px 8px", borderRadius: 0 }}>
          <Link href="/" className="back-link">بازگشت به پیام‌رسان</Link>
          <div style={{ flex: 1 }} />
          <Link href="/python" className="back-link">🐍 ربات پایتون</Link>
          <Link href="/bots" className="back-link">ربات‌ساز</Link>
        </div>

        <div className="page-head">
          <div>
            <h1>📚 Nexora Bot API</h1>
            <p>مرجع کامل پلتفرم ربات‌سازی نکسورا — سازگار با سبک Bot API تلگرام.</p>
          </div>
          <span className="chip">v1.0</span>
        </div>

        <div className="card prose">
          <h2 style={{ marginTop: 0 }}>شروع سریع</h2>
          <p>
            هر ربات یک توکن دارد. تمام متدها با آدرس زیر صدا زده می‌شوند (GET یا POST):
          </p>
          <div className="code-block">{`https://YOUR-DOMAIN/api/bot/<TOKEN>/<method>

# مثال
curl -s https://YOUR-DOMAIN/api/bot/123456:AAHxxxx/getMe`}</div>
          <p>پاسخ‌ها همیشه در قالب زیر هستند:</p>
          <div className="code-block">{`{ "ok": true, "result": { ... } }
{ "ok": false, "error_code": 400, "description": "..." }`}</div>
        </div>

        <div className="card prose">
          <h2 style={{ marginTop: 0 }}>دریافت پیام‌ها (Polling)</h2>
          <div className="code-block">{`# هر ۲ ثانیه پیام‌های جدید را بگیر
curl -s "https://YOUR-DOMAIN/api/bot/<TOKEN>/getUpdates?offset=0&limit=50"`}</div>
          <p>هر آپدیت شامل <code>update_id</code> و نوع رویداد است:</p>
          <div className="code-block">{`{
  "update_id": 42,
  "type": "message",
  "chat_id": "uuid-of-chat",
  "message": {
    "message_id": "uuid",
    "text": "سلام",
    "from": { "id": "user-uuid", "first_name": "علی", "username": "ali" }
  }
}`}</div>
          <h3>وب‌هوک</h3>
          <div className="code-block">{`curl -X POST https://YOUR-DOMAIN/api/bot/<TOKEN>/setWebhook \\
  -H 'content-type: application/json' \\
  -d '{"url":"https://your-server.com/nexora","secret_token":"my-secret"}'`}</div>
          <p>
            نکسورا هر رویداد را به‌صورت <code>POST</code> به آدرس شما می‌فرستد و هدر{" "}
            <code>x-nexora-bot-api-secret-token</code> را ست می‌کند.
          </p>
        </div>

        <div className="card prose">
          <h2 style={{ marginTop: 0 }}>ارسال پیام و دکمه‌های شیشه‌ای</h2>
          <div className="code-block">{`curl -X POST https://YOUR-DOMAIN/api/bot/<TOKEN>/sendMessage \\
  -H 'content-type: application/json' \\
  -d '{
    "chat_id": "<user-id-or-chat-id>",
    "text": "یکی را انتخاب کن:",
    "reply_markup": {
      "inline_keyboard": [
        [{ "text": "🛍 فروشگاه", "data": "shop" }],
        [{ "text": "📞 پشتیبانی", "data": "support" }]
      ]
    }
  }'`}</div>
          <p>
            فشار هر دکمه یک آپدیت از نوع <code>callback_query</code> تولید می‌کند که شامل{" "}
            <code>data</code> و <code>message_id</code> است.
          </p>
        </div>

        <div className="card prose">
          <h2 style={{ marginTop: 0 }}>نمونه ربات در Node.js</h2>
          <div className="code-block">{`const TOKEN = process.env.NEXORA_BOT_TOKEN;
const BASE = "https://YOUR-DOMAIN/api/bot/" + TOKEN;
let offset = 0;

async function loop() {
  const res = await fetch(BASE + "/getUpdates?offset=" + offset);
  const { result } = await res.json();
  for (const upd of result) {
    offset = upd.update_id + 1;
    if (upd.type === "message") {
      await fetch(BASE + "/sendMessage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: upd.chat_id,
          text: "دریافت شد: " + upd.message.text,
          reply_to_message_id: upd.message.message_id,
        }),
      });
    }
  }
  setTimeout(loop, 2000);
}
loop();`}</div>
          <h3>نمونه ربات در Python</h3>
          <div className="code-block">{`import time, requests

TOKEN = "YOUR_TOKEN"
BASE = f"https://YOUR-DOMAIN/api/bot/{TOKEN}"
offset = 0

while True:
    r = requests.get(f"{BASE}/getUpdates", params={"offset": offset}).json()
    for upd in r["result"]:
        offset = upd["update_id"] + 1
        if upd["type"] == "message":
            requests.post(f"{BASE}/sendMessage", json={
                "chat_id": upd["chat_id"],
                "text": f'سلام {upd["message"]["from"]["first_name"]}! 👋',
            })
    time.sleep(2)`}</div>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 18 }}>فهرست متدها</h2>
          <table className="table">
            <thead>
              <tr>
                <th>متد</th>
                <th>توضیح</th>
              </tr>
            </thead>
            <tbody>
              {methods.map(([m, d]) => (
                <tr key={m}>
                  <td><code>{m}</code></td>
                  <td>{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card prose" style={{ borderColor: "rgba(51,144,236,.35)" }}>
          <h2 style={{ marginTop: 0 }}>🐍 SDK رسمی پایتون</h2>
          <p>
            ساده‌ترین راه ساخت ربات: SDK آمادهٔ پایتون بدون هیچ وابستگی. کد کامل + نمونه در صفحهٔ
            مخصوص آن است.
          </p>
          <div className="code-block">{`curl -O https://nexora-pish.vercel.app/sdk/nexora_bot.py`}</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/python" className="btn btn-primary">
              مستندات پایتون
            </Link>
            <a className="btn btn-ghost" href="/nexora-source.zip" download>
              📦 دانلود زیپ کامل سورس
            </a>
          </div>
        </div>

        <div className="card prose">
          <h2 style={{ marginTop: 0 }}>ارسال مدیا از ربات</h2>
          <p>ابتدا فایل را با حساب کاربری آپلود کن (پنل چت)، سپس شناسهٔ فایل را به ربات بده:</p>
          <div className="code-block">{`# آپلود (با کوکی نشست کاربر)
curl -X POST https://YOUR-DOMAIN/api/media -F file=@photo.jpg

# ارسال توسط ربات
curl -X POST https://YOUR-DOMAIN/api/bot/<TOKEN>/sendPhoto \\
  -H 'content-type: application/json' \\
  -d '{"chat_id":"<chat-id>","photo":"<media-id>","caption":"سلام 📷"}'`}</div>
          <h3>محدودیت‌ها</h3>
          <ul>
            <li>حداکثر حجم فایل: ۴ مگابایت</li>
            <li>حداکثر طول متن پیام: ۸۰۰۰ کاراکتر</li>
            <li>نرخ پیشنهادی polling: هر ۱ تا ۳ ثانیه</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
