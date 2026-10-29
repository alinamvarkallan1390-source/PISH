"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
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

  async function demoLogin(user: string) {
    setError("");
    setBusy(true);
    try {
      await api("/api/auth/login", { body: { username: user, password: "nexora123" } });
      router.replace("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "ورود دمو ناموفق بود");
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
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--muted)", letterSpacing: 1 }}>
                N E X O R A
              </div>
            </div>
          </div>
          <h1>
            پیام‌رسانی که <span>سرعت</span> را
            <br /> دوباره تعریف می‌کند
          </h1>
          <p>
            چت خصوصی، گروه، کانال، پیام صوتی، ری‌اکشن و پلتفرم کامل ربات‌سازی — همه در یک تجربهٔ
            فوق‌سریع، فارسی و کاملاً ریسپانسیو.
          </p>
          <div className="feature-chips">
            <span className="chip">⚡ ری‌تایم زنده</span>
            <span className="chip">🤖 Bot API کامل</span>
            <span className="chip">📎 مدیا و ویس</span>
            <span className="chip">🔒 امن و خصوصی</span>
            <span className="chip">📱 موبایل و دسکتاپ</span>
          </div>
        </section>

        <section className="auth-form">
          <div className="auth-switch">
            <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
              ورود
            </button>
            <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>
              ثبت‌نام
            </button>
          </div>
          <h2>{mode === "login" ? "خوش برگشتی 👋" : "به نکسورا بپیوند 🚀"}</h2>
          <p className="sub">
            {mode === "login"
              ? "با نام کاربری و رمز عبورت وارد شو"
              : "در چند ثانیه حساب بساز و شروع کن"}
          </p>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="field">
              <label>نام کاربری</label>
              <input
                className="input"
                placeholder="مثلاً ali"
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

          <div className="divider-or">ورود سریع با حساب‌های نمایشی</div>
          <div className="demo-row">
            <button className="demo-pill" disabled={busy} onClick={() => demoLogin("ali")}>
              🦊 علی
            </button>
            <button className="demo-pill" disabled={busy} onClick={() => demoLogin("sara")}>
              🦋 سارا
            </button>
            <button className="demo-pill" disabled={busy} onClick={() => demoLogin("reza")}>
              🐧 رضا
            </button>
            <button className="demo-pill" disabled={busy} onClick={() => demoLogin("mina")}>
              🌙 مینا
            </button>
          </div>
          <p style={{ fontSize: 11.5, color: "var(--muted)", margin: 0 }}>
            رمز همهٔ حساب‌های نمایشی: <code style={{ direction: "ltr" }}>nexora123</code>
          </p>
        </section>
      </div>
    </div>
  );
}
