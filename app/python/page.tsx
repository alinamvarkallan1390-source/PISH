import Link from "next/link";
import { CodeBlock, CopyButton } from "@/components/DocsBits";

export const metadata = {
  title: "ربات‌سازی با پایتون | نکسورا",
  description: "SDK رسمی پایتون برای ساخت ربات در پیام‌رسان نکسورا — بدون هیچ وابستگی",
};

const QUICK = `# ۱) فایل SDK را دانلود کن
curl -O https://nexora-pish.vercel.app/sdk/nexora_bot.py

# ۲) ربات نمونه را اجرا کن
NEXORA_TOKEN="123456:AAH-..." python echo_bot.py`;

const MINIMAL = `from nexora_bot import Bot, inline_keyboard

bot = Bot("123456:AAH-TOKEN")

@bot.on("command:start")
def start(update):
    bot.send_message(
        update.chat_id,
        f"سلام {update.user.get('first_name', 'دوست من')}! 👋",
        reply_markup=inline_keyboard([[{"text": "راهنما", "data": "help"}]]),
    )

@bot.on("callback_query")
def on_button(update):
    bot.send_message(update.chat_id, "دکمه را زدی ✅")

@bot.on("message")
def echo(update):
    if not update.text.startswith("/"):
        bot.reply(update, "🔁 " + update.text)

bot.run_polling()`;

const WEBHOOK = `from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from nexora_bot import Bot

bot = Bot("123456:AAH-TOKEN")
bot.set_webhook("https://your-host.com/webhook", secret_token="my-secret")

class Hook(BaseHTTPRequestHandler):
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["content-length"])))
        msg = body.get("message") or {}
        if msg.get("text") == "/start":
            bot.send_message(msg["chat"]["id"], "سلام از وبهوک! 🚀")
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"ok")

HTTPServer(("0.0.0.0", 8080), Hook).serve_forever()`;

const METHODS: [string, string][] = [
  ["get_me()", "اطلاعات ربات"],
  ["get_updates()", "دریافت رویدادها (polling)"],
  ["send_message(chat_id, text, reply_markup=…)", "ارسال پیام"],
  ["send_photo / send_document / send_voice / send_sticker", "ارسال مدیا و استیکر"],
  ["edit_message_text / delete_message", "ویرایش و حذف"],
  ["forward_message / pin_chat_message", "فوروارد و سنجاق"],
  ["send_chat_action(chat_id, 'typing')", "نمایش «در حال نوشتن…»"],
  ["set_webhook / delete_webhook / get_webhook_info", "مدیریت وبهوک"],
  ["set_my_commands([...])", "منوی دستورها"],
  ["answer_callback_query(id, text)", "پاسخ به دکمهٔ شیشه‌ای"],
  ["run_polling()", "حلقهٔ خودکار دریافت رویداد"],
];

export default function PythonPage() {
  return (
    <div className="page">
      <div className="page-inner">
        <header className="page-head">
          <div>
            <h1>
              <span style={{ fontSize: 26, marginInlineEnd: 8 }}>🐍</span> ربات‌سازی با پایتون
            </h1>
            <p>
              SDK رسمی و کامل نکسورا برای پایتون — بدون هیچ وابستگی خارجی، فقط کتابخانهٔ استاندارد.
              در ۳۰ ثانیهٔ اول یک ربات زنده داشته باش.
            </p>
          </div>
          <Link href="/bots" className="btn btn-ghost">
            پنل ربات‌ساز
          </Link>
        </header>

        <div className="glass-card" style={{ padding: 18, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
            <a className="btn btn-primary" href="/sdk/nexora_bot.py" target="_blank" rel="noreferrer">
              ⬇️ دانلود nexora_bot.py
            </a>
            <a className="btn btn-ghost" href="/sdk/echo_bot.py" target="_blank" rel="noreferrer">
              نمونهٔ کامل echo_bot.py
            </a>
            <a className="btn btn-ghost" href="/sdk/pyproject.toml" target="_blank" rel="noreferrer">
              pyproject.toml
            </a>
            <CopyButton text="pip install git+https://github.com/alinamvarkallan1390-source/PISH#subdirectory=python" label="کپی دستور pip" />
          </div>
          <div style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 2 }}>
            توکن ربات را از <Link href="/bots">پنل ربات‌ساز</Link> بگیر. همین توکن برای پایتون، Node.js و curl
            کار می‌کند — API مشترک است.
          </div>
        </div>

        <section className="glass-card" style={{ padding: 18, marginBottom: 16 }}>
          <h2 className="doc-h2">شروع سریع</h2>
          <CodeBlock code={QUICK} lang="bash" />
        </section>

        <section className="glass-card" style={{ padding: 18, marginBottom: 16 }}>
          <h2 className="doc-h2">کوچک‌ترین ربات دنیا</h2>
          <CodeBlock code={MINIMAL} lang="python" />
        </section>

        <section className="glass-card" style={{ padding: 18, marginBottom: 16 }}>
          <h2 className="doc-h2">وبهوک (روی Vercel یا هر سرور)</h2>
          <CodeBlock code={WEBHOOK} lang="python" />
        </section>

        <section className="glass-card" style={{ padding: 18, marginBottom: 16 }}>
          <h2 className="doc-h2">متدهای SDK</h2>
          <div className="admin-table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>متد</th>
                  <th>کار</th>
                </tr>
              </thead>
              <tbody>
                {METHODS.map(([m, d]) => (
                  <tr key={m}>
                    <td>
                      <code dir="ltr" className="inline-code">
                        {m}
                      </code>
                    </td>
                    <td>{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12, lineHeight: 2 }}>
            هر متدی که در SDK صریحاً تعریف نشده باشد به‌صورت خودکار به API وصل می‌شود:{" "}
            <code dir="ltr" className="inline-code">
              bot.get_chat(chat_id="…")
            </code>{" "}
            → <code dir="ltr" className="inline-code">getChat</code>.
          </p>
        </section>

        <section className="glass-card" style={{ padding: 18 }}>
          <h2 className="doc-h2">نکته‌های حرفه‌ای</h2>
          <ul className="doc-list">
            <li>
              <b>update</b> یک dict است با دسترسی راحت: <code dir="ltr">update.text</code>،{" "}
              <code dir="ltr">update.chat_id</code>، <code dir="ltr">update.command</code>،{" "}
              <code dir="ltr">update.args</code>.
            </li>
            <li>
              هندلرها را روی <code dir="ltr">command:start</code>، <code dir="ltr">message</code>،{" "}
              <code dir="ltr">callback_query</code> یا <code dir="ltr">any</code> ثبت کن.
            </li>
            <li>خطاها از نوع <code dir="ltr">NexoraError</code> هستند و کلیدهای «در حال نوشتن» را هم داری.</li>
            <li>
              می‌خواهی ربات در گروه هم جواب بدهد؟ ربات را از پنجرهٔ اطلاعات گروه اضافه کن؛ به منشن و
              دستورهای <code dir="ltr">/</code> پاسخ می‌دهد.
            </li>
          </ul>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link href="/docs" className="btn btn-primary">
              مستندات کامل API
            </Link>
            <Link href="/" className="btn btn-ghost">
              بازگشت به پیام‌رسان
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
