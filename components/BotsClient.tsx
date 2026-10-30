"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, Me } from "@/lib/client";
import { Icon } from "./Icons";

type Bot = {
  id: string;
  username: string;
  name: string;
  token: string;
  description: string;
  about: string;
  webhook_url: string | null;
  commands: { command: string; description: string }[];
  is_builtin: boolean;
  mine?: boolean;
};

export default function BotsClient({ me }: { me: Me }) {
  const router = useRouter();
  const [bots, setBots] = useState<Bot[]>([]);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ t: string; err?: boolean } | null>(null);
  const [webhookFor, setWebhookFor] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");

  const showToast = (t: string, err = false) => {
    setToast({ t, err });
    setTimeout(() => setToast(null), 3000);
  };

  async function load() {
    try {
      const r = await api<{ bots: Bot[] }>("/api/bots");
      setBots(r.bots);
    } catch (err: any) {
      showToast(err.message, true);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createBot() {
    if (!name.trim()) return showToast("نام ربات را وارد کنید", true);
    setBusy(true);
    try {
      const r = await api<{ bot: Bot; chat_id: string }>("/api/bots", {
        body: { name, username },
      });
      setName("");
      setUsername("");
      await load();
      showToast("ربات ساخته شد! توکن را کپی کن 🎉");
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function saveWebhook(bot: Bot) {
    try {
      await api(`/api/bots/${bot.id}`, { method: "PATCH", body: { webhook_url: webhookUrl } });
      setWebhookFor(null);
      setWebhookUrl("");
      await load();
      showToast("وب‌هوک ذخیره شد ✅");
    } catch (err: any) {
      showToast(err.message, true);
    }
  }

  async function removeBot(bot: Bot) {
    if (!confirm(`ربات @${bot.username} حذف شود؟`)) return;
    try {
      await api(`/api/bots/${bot.id}`, { method: "DELETE" });
      await load();
      showToast("ربات حذف شد");
    } catch (err: any) {
      showToast(err.message, true);
    }
  }

  async function openChat(bot: Bot) {
    try {
      await api("/api/open", { body: { handle: bot.username } });
      router.push("/");
    } catch (err: any) {
      showToast(err.message, true);
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "https://nexora.app";

  return (
    <div className="page">
      <div className="page-inner">
        <div className="topbar">
          <Link href="/" className="back-link">
            <Icon name="back" size={15} /> بازگشت به پیام‌رسان
          </Link>
          <div style={{ flex: 1 }} />
          <Link href="/python" className="back-link">
            🐍 ربات پایتون
          </Link>
          <Link href="/docs" className="back-link">
            <Icon name="book" size={15} /> مستندات Bot API
          </Link>
        </div>

        <div className="page-head">
          <div>
            <h1>🤖 ربات‌ساز نکسورا</h1>
            <p>
              در چند ثانیه ربات خودت را بساز، توکن بگیر و با API سازگار با سبک تلگرام به آن جان بده.
            </p>
          </div>
          <div className="chip">👤 {me.display_name}</div>
        </div>

        <div className="grid-2">
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h3 style={{ margin: 0, display: "flex", gap: 8, alignItems: "center" }}>
              <Icon name="plus" size={17} /> ساخت ربات جدید
            </h3>
            <div className="field">
              <label>نام ربات</label>
              <input className="input" value={name} placeholder="مثلاً ربات فروشگاه" onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label>آیدی ربات (انگلیسی)</label>
              <input
                className="input"
                dir="ltr"
                value={username}
                placeholder="my_shop_bot"
                onChange={(e) => setUsername(e.target.value)}
              />
              <span style={{ fontSize: 11.5, color: "var(--muted)" }}>
                اگر خالی بگذاری، نکسورا یک آیدی یکتا می‌سازد. پسوند <code>_bot</code> خودکار اضافه می‌شود.
              </span>
            </div>
            <button className="btn btn-primary" disabled={busy} onClick={createBot}>
              {busy ? "در حال ساخت…" : "ساخت ربات و دریافت توکن"}
            </button>
          </div>

          <div className="card">
            <h3 style={{ margin: "0 0 10px", display: "flex", gap: 8, alignItems: "center" }}>
              <Icon name="zap" size={17} /> شروع سریع
            </h3>
            <div className="code-block">{`curl -s ${origin}/api/bot/<TOKEN>/getMe

curl -s -X POST ${origin}/api/bot/<TOKEN>/sendMessage \\
  -H 'content-type: application/json' \\
  -d '{"chat_id":"<USER_ID>","text":"سلام از ربات! 👋"}'`}</div>
            <p style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 2, marginBottom: 0 }}>
              هر ربات یک توکن اختصاصی دارد. با <code>getUpdates</code> پیام‌های کاربران را بگیر یا با{" "}
              <code>setWebhook</code> آن‌ها را زنده به سرور خودت بفرست.
            </p>
          </div>
        </div>

        <div className="card">
          <h3 style={{ margin: "0 0 12px", display: "flex", gap: 8, alignItems: "center" }}>
            <Icon name="bot" size={17} /> ربات‌های من و ربات‌های رسمی
          </h3>
          <div className="grid-2">
            {bots.map((b) => (
              <div key={b.id} className="bot-card">
                <div className="bot-card-top">
                  <div className="avatar md" style={{ background: "rgba(6,182,212,.18)" }}>
                    🤖
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4>{b.name}</h4>
                    <div className="handle">@{b.username}</div>
                  </div>
                  {b.is_builtin ? (
                    <span className="pill-tag">رسمی</span>
                  ) : (
                    <span className="pill-tag">مال من</span>
                  )}
                </div>
                <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0, lineHeight: 1.9 }}>
                  {b.description || "بدون توضیح"}
                </p>
                <div className="token-box">
                  <span>{b.token}</span>
                  <button
                    className="icon-btn"
                    style={{ width: 28, height: 28 }}
                    title="کپی توکن"
                    onClick={() => {
                      navigator.clipboard?.writeText(b.token);
                      showToast("توکن کپی شد ✅");
                    }}
                  >
                    <Icon name="copy" size={14} />
                  </button>
                </div>
                {b.commands?.length > 0 && (
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {b.commands.slice(0, 6).map((c) => (
                      <span key={c.command} className="chip" style={{ padding: "3px 9px", fontSize: 11 }}>
                        /{c.command}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button className="btn btn-ghost" style={{ padding: "8px 12px", fontSize: 12.5 }} onClick={() => openChat(b)}>
                    <Icon name="chat" size={14} /> گفتگو
                  </button>
                  {!b.is_builtin && (
                    <>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "8px 12px", fontSize: 12.5 }}
                        onClick={() => {
                          setWebhookFor(webhookFor === b.id ? null : b.id);
                          setWebhookUrl(b.webhook_url || "");
                        }}
                      >
                        <Icon name="globe" size={14} /> وب‌هوک
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "8px 12px", fontSize: 12.5, color: "var(--danger)" }}
                        onClick={() => removeBot(b)}
                      >
                        <Icon name="trash" size={14} /> حذف
                      </button>
                    </>
                  )}
                </div>
                {webhookFor === b.id && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      className="input"
                      dir="ltr"
                      placeholder="https://your-server.com/webhook"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                    />
                    <button className="btn btn-primary" style={{ flex: "none", paddingInline: 14 }} onClick={() => saveWebhook(b)}>
                      ذخیره
                    </button>
                  </div>
                )}
                {b.webhook_url && (
                  <div style={{ fontSize: 11, color: "var(--muted)", direction: "ltr", textAlign: "left" }}>
                    webhook → {b.webhook_url}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card prose">
          <h2 style={{ marginTop: 0 }}>چطور ربات بسازم؟</h2>
          <ol style={{ paddingInlineStart: 20 }}>
            <li>نام و آیدی ربات را بنویس و «ساخت ربات» را بزن.</li>
            <li>توکن را کپی کن و در سرور خودت نگه دار (مثل توکن تلگرام، محرمانه است).</li>
            <li>
              با <code>getUpdates</code> پیام‌ها را polling کن یا <code>setWebhook</code> بزن تا رویدادها به
              سرورت push شوند.
            </li>
            <li>
              با <code>sendMessage</code>، <code>sendPhoto</code>، <code>editMessageText</code> و دکمه‌های
              شیشه‌ای (<code>reply_markup.inline_keyboard</code>) پاسخ بده.
            </li>
          </ol>
          <p>
            مستندات کامل: <Link href="/docs">Nexora Bot API</Link>
          </p>
        </div>
      </div>

      {toast && (
        <div className="toasts">
          <div className={`toast ${toast.err ? "err" : ""}`}>{toast.err ? "⚠️" : "✅"} {toast.t}</div>
        </div>
      )}
    </div>
  );
}
