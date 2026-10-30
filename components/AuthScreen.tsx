"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { Icon } from "./Icons";

const NOTICES: Record<string, string> = {
  expired: "نشست قبلی منقضی شده بود (حساب حذف یا بازنشانی شده). دوباره وارد شو.",
  banned: "دسترسی این حساب مسدود شده است. با پشتیبانی تماس بگیر.",
};

export default function AuthScreen({
  registrationOpen = true,
  notice,
}: {
  registrationOpen?: boolean;
  notice?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">(registrationOpen ? "login" : "login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await api("/api/auth/login", { body: { username, password } });
      } else {
        await api("/api/auth/signup", { body: { username, displayName, password } });
      }
      router.replace("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "خطایی رخ داد");
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <section className="auth-hero">
          <div className="brand">
            <div className="brand-mark">✦</div>
            <div>
              نکسورا
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--muted)", letterSpacing: 2 }}>
                N E X O R A
              </div>
            </div>
          </div>
          <h1>
            پیام‌رسانی که <span>سرعت</span> را
            <br /> دوباره تعریف می‌کند
          </h1>
          <p>
            چت خصوصی، گروه، کانال، نظرسنجی، پیام صوتی، ری‌اکشن و پلتفرم کامل ربات‌سازی — در یک تجربهٔ
            شیشه‌ای، فوق‌سریع و کاملاً ریسپانسیو.
          </p>
          <div className="feature-chips">
            <span className="chip">⚡ ری‌تایم زنده</span>
            <span className="chip">🤖 Bot API</span>
            <span className="chip">📎 مدیا و ویس</span>
            <span className="chip">📊 نظرسنجی</span>
            <span className="chip">🔖 پیام ذخیره‌شده</span>
            <span className="chip">🔒 خصوصی و امن</span>
          </div>
        </section>

        <section className="auth-form">
          <div className="auth-switch">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              ورود
            </button>
            <button
              type="button"
              className={mode === "signup" ? "active" : ""}
              onClick={() => {
                if (!registrationOpen) {
                  setError("ثبت‌نام فعلاً بسته است");
                  return;
                }
                setMode("signup");
                setError("");
              }}
            >
              ثبت‌نام
            </button>
          </div>
          <h2>{mode === "login" ? "خوش برگشتی 👋" : "به نکسورا بپیوند 🚀"}</h2>
          <p className="sub">
            {mode === "login" ? "با نام کاربری و رمزت وارد شو" : "در چند ثانیه حساب بساز و شروع کن"}
          </p>

          {notice && NOTICES[notice] && (
            <div className="auth-notice" role="status">
              {NOTICES[notice]}
            </div>
          )}

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="field">
              <label>نام کاربری</label>
              <input
                className="input"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                dir="ltr"
                autoComplete="username"
              />
            </div>
            {mode === "signup" && (
              <div className="field">
                <label>نام نمایشی</label>
                <input
                  className="input"
                  placeholder="مثلاً علی نوری"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            )}
            <div className="field">
              <label>رمز عبور</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button className="btn btn-primary" disabled={busy} type="submit">
              {busy ? "لطفاً صبر کنید…" : mode === "login" ? "ورود به نکسورا" : "ساخت حساب و ورود"}
            </button>
          </form>

          <p style={{ fontSize: 11.5, color: "var(--muted)", margin: 0, lineHeight: 1.9 }}>
            با ورود، قوانین استفاده و حریم خصوصی نکسورا را می‌پذیرید.
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <a href="/python" className="back-link">
              🐍 ربات پایتون
            </a>
            <span style={{ opacity: 0.3 }}>·</span>
            <a href="/docs" className="back-link">
              <Icon name="book" size={15} /> مستندات <span dir="ltr">Bot API</span>
            </a>
            <span style={{ opacity: 0.3 }}>·</span>
            <a href="/adminn" className="back-link" title="پنل مدیریت">
              <Icon name="shield" size={14} /> مدیریت
            </a>
            <span style={{ opacity: 0.3 }}>·</span>
            <a href="/nexora-source.zip" download className="back-link" title="دانلود زیپ کامل سورس">
              <Icon name="download" size={14} /> سورس کامل
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
