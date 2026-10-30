"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, faNum, lastSeenLabel, shortTime } from "@/lib/client";
import { Icon } from "./Icons";

/* ------------------------------------------------------------------ */
/*  Login gate                                                        */
/* ------------------------------------------------------------------ */
export function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/login", { body: { password } });
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "ورود ناموفق بود");
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="admin-gate">
        <div className="brand" style={{ justifyContent: "center" }}>
          <div className="brand-mark">🛡️</div>
          <div>
            پنل مدیریت نکسورا
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--muted)", letterSpacing: 1 }}>
              N E X O R A · A D M I N
            </div>
          </div>
        </div>
        <p className="hint" style={{ textAlign: "center" }}>
          برای ورود، رمز مدیریت را وارد کنید. این صفحه برای عموم قابل دسترسی نیست.
        </p>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="field">
            <label>رمز مدیریت</label>
            <input
              className="input"
              type="password"
              autoFocus
              dir="ltr"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button className="btn btn-primary" disabled={busy} type="submit">
            {busy ? "در حال بررسی…" : "ورود به پنل"}
          </button>
        </form>
        <a href="/" className="hint" style={{ textAlign: "center", display: "block" }}>
          ← بازگشت به پیام‌رسان
        </a>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                         */
/* ------------------------------------------------------------------ */
type Tab = "overview" | "users" | "chats" | "bots" | "messages" | "broadcast" | "settings" | "maintenance";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "overview", label: "نمای کلی", icon: "globe" },
  { key: "users", label: "کاربران", icon: "users" },
  { key: "chats", label: "گفتگوها", icon: "chat" },
  { key: "bots", label: "ربات‌ها", icon: "bot" },
  { key: "messages", label: "پیام‌ها", icon: "doc" },
  { key: "broadcast", label: "ارسال همگانی", icon: "megaphone" },
  { key: "settings", label: "تنظیمات", icon: "settings" },
  { key: "maintenance", label: "نگهداری و لاگ", icon: "shield" },
];

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [chats, setChats] = useState<any[]>([]);
  const [chatType, setChatType] = useState("");
  const [bots, setBots] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgQuery, setMsgQuery] = useState("");
  const [settings, setSettings] = useState<any>({});
  const [logs, setLogs] = useState<any[]>([]);
  const [broadcast, setBroadcast] = useState("");
  const [broadcastTo, setBroadcastTo] = useState("");
  const [toast, setToast] = useState<{ t: string; err?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const notify = (t: string, err = false) => {
    setToast({ t, err });
    setTimeout(() => setToast(null), 3200);
  };

  const loadOverview = useCallback(async () => {
    try {
      const r = await api<any>("/api/admin/overview");
      setOverview(r);
      setSettings(r.settings || {});
    } catch (err: any) {
      notify(err.message, true);
    }
  }, []);

  const loadUsers = useCallback(async (q = "") => {
    try {
      const r = await api<any>(`/api/admin/users?q=${encodeURIComponent(q)}`);
      setUsers(r.users);
    } catch (err: any) {
      notify(err.message, true);
    }
  }, []);

  const loadChats = useCallback(async (type = "", q = "") => {
    try {
      const r = await api<any>(`/api/admin/chats?type=${type}&q=${encodeURIComponent(q)}`);
      setChats(r.chats);
    } catch (err: any) {
      notify(err.message, true);
    }
  }, []);

  const loadBots = useCallback(async () => {
    try {
      const r = await api<any>("/api/admin/bots");
      setBots(r.bots);
    } catch (err: any) {
      notify(err.message, true);
    }
  }, []);

  const loadMessages = useCallback(async (q = "", kind = "") => {
    try {
      const r = await api<any>(`/api/admin/messages?q=${encodeURIComponent(q)}&kind=${kind}`);
      setMessages(r.messages);
    } catch (err: any) {
      notify(err.message, true);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      const r = await api<any>("/api/admin/audit");
      setLogs(r.logs);
    } catch (err: any) {
      notify(err.message, true);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (tab === "users") loadUsers(userQuery);
    if (tab === "chats") loadChats(chatType);
    if (tab === "bots") loadBots();
    if (tab === "messages") loadMessages(msgQuery);
    if (tab === "maintenance") loadLogs();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  async function act(path: string, opts: any, successMsg: string) {
    setBusy(true);
    try {
      await api(path, opts);
      notify(successMsg);
      return true;
    } catch (err: any) {
      notify(err.message, true);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function userAction(id: string, action: string, extra: any = {}) {
    const map: Record<string, string> = {
      ban: "کاربر مسدود شد",
      unban: "مسدودیت برداشته شد",
      premium: "وضعیت ویژه تغییر کرد",
      verify: "وضعیت تأیید تغییر کرد",
      toggle_admin: "دسترسی مدیریت تغییر کرد",
      reset_password: "رمز عبور بازنشانی شد",
      delete: "کاربر حذف شد",
    };
    if (action === "delete" && !confirm("این کاربر و داده‌هایش حذف شود؟ این کار بازگشت‌پذیر نیست.")) return;
    const ok = await act(
      "/api/admin/users",
      { method: "PATCH", body: { id, action, ...extra } },
      map[action] || "انجام شد"
    );
    if (ok) loadUsers(userQuery);
  }

  async function saveSettings(patch: any) {
    const ok = await act("/api/admin/settings", { method: "PATCH", body: { settings: patch } }, "تنظیمات ذخیره شد");
    if (ok) loadOverview();
  }

  async function maintenance(action: string) {
    const ok = await act(
      "/api/admin/maintenance",
      { body: { action } },
      "عملیات انجام شد"
    );
    if (ok) {
      loadOverview();
      loadLogs();
      if (action === "purge_demo") loadUsers(userQuery);
    }
  }

  const maxSeries = useMemo(() => {
    const s = overview?.series || [];
    return Math.max(1, ...s.map((d: any) => Math.max(d.messages, d.users * 3)));
  }, [overview]);

  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <div className="admin-brand">
          <div className="brand-mark" style={{ width: 38, height: 38, borderRadius: 12, fontSize: 18 }}>
            🛡️
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>نکسورا</div>
            <div style={{ fontSize: 10.5, color: "var(--muted)", letterSpacing: 1 }}>ADMIN</div>
          </div>
        </div>
        <nav className="admin-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`admin-tab ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              <Icon name={t.icon} size={18} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="admin-nav-foot">
          <a href="/" className="admin-tab" style={{ textDecoration: "none" }}>
            <Icon name="back" size={18} />
            <span>پیام‌رسان</span>
          </a>
          <button
            className="admin-tab"
            onClick={async () => {
              await api("/api/admin/logout", { body: {} }).catch(() => {});
              window.location.reload();
            }}
          >
            <Icon name="logout" size={18} />
            <span>خروج</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {/* ---------------- overview ---------------- */}
        {tab === "overview" && (
          <>
            <header className="admin-head">
              <div>
                <h1>نمای کلی</h1>
                <p>وضعیت زندهٔ پلتفرم نکسورا</p>
              </div>
              <button className="btn btn-ghost" onClick={loadOverview}>
                <Icon name="zap" size={16} /> به‌روزرسانی
              </button>
            </header>

            <div className="kpi-grid">
              {[
                { label: "کاربران", value: overview?.totals?.users, icon: "users", color: "#6d5efc" },
                { label: "آنلاین (۱۵ دقیقه)", value: overview?.totals?.online, icon: "zap", color: "#34d399" },
                { label: "گفتگوها", value: overview?.totals?.chats, icon: "chat", color: "#22d3ee" },
                { label: "پیام‌ها", value: overview?.totals?.messages, icon: "doc", color: "#f472b6" },
                { label: "پیام ۲۴ ساعت", value: overview?.totals?.today, icon: "megaphone", color: "#f59e0b" },
                { label: "ربات‌ها", value: overview?.totals?.bots, icon: "bot", color: "#a855f7" },
                { label: "فایل‌ها", value: overview?.totals?.media, icon: "paperclip", color: "#38bdf8" },
                {
                  label: "حجم مدیا",
                  value: `${faNum(Math.round(((overview?.totals?.media_bytes || 0) / 1048576) * 10) / 10)} MB`,
                  icon: "shield",
                  color: "#fb7185",
                },
              ].map((k) => (
                <div className="kpi" key={k.label} style={{ ["--kpi" as any]: k.color }}>
                  <div className="kpi-icon">
                    <Icon name={k.icon} size={18} />
                  </div>
                  <div>
                    <div className="kpi-value">{typeof k.value === "number" ? faNum(k.value) : k.value || faNum(0)}</div>
                    <div className="kpi-label">{k.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="admin-grid">
              <section className="glass-card">
                <h3>فعالیت ۷ روز گذشته</h3>
                <div className="chart">
                  {(overview?.series || []).map((d: any) => (
                    <div className="chart-col" key={d.day}>
                      <div className="chart-bars">
                        <div
                          className="bar msgs"
                          style={{ height: `${Math.max(2, (d.messages / maxSeries) * 100)}%` }}
                          title={`${d.messages} پیام`}
                        />
                        <div
                          className="bar users"
                          style={{ height: `${Math.max(2, (d.users / maxSeries) * 100)}%` }}
                          title={`${d.users} کاربر`}
                        />
                      </div>
                      <span className="chart-label">
                        {new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "short" }).format(
                          new Date(d.day)
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="chart-legend">
                  <span><i style={{ background: "var(--accent)" }} /> پیام</span>
                  <span><i style={{ background: "var(--accent-2)" }} /> کاربر جدید</span>
                </div>
              </section>

              <section className="glass-card">
                <h3>پرتکرارترین گفتگوها</h3>
                <div className="mini-list">
                  {(overview?.topChats || []).length === 0 && <div className="empty-hint">هنوز گفتگویی نیست</div>}
                  {(overview?.topChats || []).map((c: any) => (
                    <div className="mini-row" key={c.id}>
                      <span className="mini-emoji">{c.avatar_emoji || "💬"}</span>
                      <div className="mini-main">
                        <div className="mini-title">{c.title}</div>
                        <div className="mini-sub">
                          {c.type === "group" ? "گروه" : c.type === "channel" ? "کانال" : c.type === "bot" ? "ربات" : "خصوصی"}
                          {" · "}
                          {faNum(c.members)} عضو
                        </div>
                      </div>
                      <span className="mini-badge">{faNum(c.messages)}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="glass-card">
                <h3>آخرین کاربران</h3>
                <div className="mini-list">
                  {(overview?.recentUsers || []).length === 0 && <div className="empty-hint">هنوز کاربری نیست</div>}
                  {(overview?.recentUsers || []).map((u: any) => (
                    <div className="mini-row" key={u.id}>
                      <span
                        className="avatar sm"
                        style={{ background: `${u.avatar_color}33`, fontSize: 15 }}
                      >
                        {u.avatar_emoji}
                      </span>
                      <div className="mini-main">
                        <div className="mini-title">{u.display_name}</div>
                        <div className="mini-sub" dir="ltr" style={{ textAlign: "start" }}>
                          @{u.username}
                        </div>
                      </div>
                      <span className="mini-badge">{shortTime(u.created_at)}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="glass-card">
                <h3>آخرین پیام‌ها</h3>
                <div className="mini-list">
                  {(overview?.recentMessages || []).length === 0 && <div className="empty-hint">هنوز پیامی نیست</div>}
                  {(overview?.recentMessages || []).map((m: any) => (
                    <div className="mini-row" key={m.id}>
                      <span className="mini-emoji">{m.sender_emoji || "💬"}</span>
                      <div className="mini-main">
                        <div className="mini-title" style={{ fontWeight: 600 }}>
                          {m.deleted ? "🚫 حذف‌شده" : (m.text || "—").slice(0, 70)}
                        </div>
                        <div className="mini-sub">
                          {m.sender_name} · {m.chat_title}
                        </div>
                      </div>
                      <span className="mini-badge">{shortTime(m.created_at)}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}

        {/* ---------------- users ---------------- */}
        {tab === "users" && (
          <>
            <header className="admin-head">
              <div>
                <h1>کاربران</h1>
                <p>{faNum(users.length)} کاربر</p>
              </div>
              <div className="searchbox" style={{ maxWidth: 280 }}>
                <Icon name="search" size={16} />
                <input
                  placeholder="جستجوی نام یا آیدی…"
                  value={userQuery}
                  onChange={(e) => {
                    setUserQuery(e.target.value);
                    loadUsers(e.target.value);
                  }}
                />
              </div>
            </header>

            <div className="admin-cards">
              {users.length === 0 && <div className="glass-card empty-hint">کاربری پیدا نشد</div>}
              {users.map((u) => (
                <div className="admin-user-card glass-card" key={u.id}>
                  <div className="admin-user-top">
                    <div className="avatar md" style={{ background: `${u.avatar_color}33` }}>
                      {u.avatar_emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="admin-user-name">
                        {u.display_name}
                        {u.is_premium && <span className="tag gold">ویژه</span>}
                        {u.is_verified && <span className="tag cyan">تأیید</span>}
                        {u.is_admin && <span className="tag purple">مدیر</span>}
                        {u.is_banned && <span className="tag red">مسدود</span>}
                      </div>
                      <div className="admin-user-handle">@{u.username}</div>
                      <div className="admin-user-meta">
                        {faNum(u.chats)} گفتگو · {faNum(u.messages)} پیام · {faNum(u.bots)} ربات
                      </div>
                      <div className="admin-user-meta">
                        ساخته‌شده {shortTime(u.created_at)} · آخرین بازدید {lastSeenLabel(u.last_seen)}
                      </div>
                    </div>
                  </div>
                  <div className="admin-actions">
                    <button className="chip-btn" disabled={busy} onClick={() => userAction(u.id, u.is_banned ? "unban" : "ban")}>
                      {u.is_banned ? "رفع مسدودی" : "مسدود کردن"}
                    </button>
                    <button className="chip-btn" disabled={busy} onClick={() => userAction(u.id, "premium")}>
                      ویژه
                    </button>
                    <button className="chip-btn" disabled={busy} onClick={() => userAction(u.id, "verify")}>
                      تأیید
                    </button>
                    <button className="chip-btn" disabled={busy} onClick={() => userAction(u.id, "toggle_admin")}>
                      دسترسی مدیریت
                    </button>
                    <button
                      className="chip-btn"
                      disabled={busy}
                      onClick={() => {
                        const pw = prompt("رمز جدید کاربر (خالی = nexora123):") ?? "";
                        if (pw === "") userAction(u.id, "reset_password");
                        else userAction(u.id, "reset_password", { password: pw });
                      }}
                    >
                      بازنشانی رمز
                    </button>
                    <button
                      className="chip-btn danger"
                      disabled={busy}
                      onClick={() => userAction(u.id, "delete")}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---------------- chats ---------------- */}
        {tab === "chats" && (
          <>
            <header className="admin-head">
              <div>
                <h1>گفتگوها</h1>
                <p>{faNum(chats.length)} گفتگو</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <select
                  className="input"
                  style={{ width: "auto", padding: "9px 14px" }}
                  value={chatType}
                  onChange={(e) => {
                    setChatType(e.target.value);
                    loadChats(e.target.value);
                  }}
                >
                  <option value="">همه</option>
                  <option value="private">خصوصی</option>
                  <option value="group">گروه</option>
                  <option value="channel">کانال</option>
                  <option value="bot">ربات</option>
                  <option value="saved">ذخیره‌شده</option>
                </select>
                <button className="btn btn-ghost" onClick={() => loadChats(chatType)}>
                  به‌روزرسانی
                </button>
              </div>
            </header>

            <div className="admin-table-wrap glass-card">
              <table className="table admin-table">
                <thead>
                  <tr>
                    <th>گفتگو</th>
                    <th>نوع</th>
                    <th>آیدی</th>
                    <th>اعضا</th>
                    <th>پیام</th>
                    <th>ربات</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {chats.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span>{c.avatar_emoji || "💬"}</span>
                          <span style={{ fontWeight: 600 }}>{c.title}</span>
                        </div>
                      </td>
                      <td>{c.type === "group" ? "گروه" : c.type === "channel" ? "کانال" : c.type === "bot" ? "ربات" : c.type === "saved" ? "ذخیره" : "خصوصی"}</td>
                      <td dir="ltr" style={{ fontSize: 11.5 }}>
                        {c.username ? "@" + c.username : "—"}
                      </td>
                      <td>{faNum(c.members)}</td>
                      <td>{faNum(c.messages)}</td>
                      <td>{faNum(c.bots)}</td>
                      <td>
                        <button
                          className="chip-btn danger"
                          onClick={async () => {
                            if (!confirm("این گفتگو حذف شود؟")) return;
                            const ok = await act(`/api/admin/chats?id=${c.id}`, { method: "DELETE" }, "گفتگو حذف شد");
                            if (ok) loadChats(chatType);
                          }}
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {chats.length === 0 && <div className="empty-hint">گفتگویی پیدا نشد</div>}
            </div>
          </>
        )}

        {/* ---------------- bots ---------------- */}
        {tab === "bots" && (
          <>
            <header className="admin-head">
              <div>
                <h1>ربات‌ها</h1>
                <p>{faNum(bots.length)} ربات ثبت‌شده</p>
              </div>
              <button className="btn btn-ghost" onClick={loadBots}>
                به‌روزرسانی
              </button>
            </header>
            <div className="admin-cards">
              {bots.length === 0 && <div className="glass-card empty-hint">رباتی ثبت نشده</div>}
              {bots.map((b) => (
                <div className="glass-card" key={b.id}>
                  <div className="admin-user-top">
                    <div className="avatar md" style={{ background: "rgba(6,182,212,.18)" }}>
                      🤖
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="admin-user-name">
                        {b.name}
                        {b.is_builtin && <span className="tag cyan">رسمی</span>}
                      </div>
                      <div className="admin-user-handle">@{b.username}</div>
                      <div className="admin-user-meta">
                        مالک: {b.owner_username ? "@" + b.owner_username : "سیستم"} · {faNum(b.sent)} پیام ·{" "}
                        {faNum(b.groups)} گروه
                      </div>
                    </div>
                  </div>
                  <div className="token-box">
                    <span>{b.token}</span>
                    <button
                      className="icon-btn"
                      style={{ width: 28, height: 28 }}
                      onClick={() => {
                        navigator.clipboard?.writeText(b.token);
                        notify("توکن کپی شد");
                      }}
                    >
                      <Icon name="copy" size={14} />
                    </button>
                  </div>
                  <div className="admin-actions">
                    <button
                      className="chip-btn"
                      disabled={busy}
                      onClick={async () => {
                        const ok = await act(
                          "/api/admin/bots",
                          { method: "PATCH", body: { id: b.id, action: "rotate_token" } },
                          "توکن چرخش داده شد"
                        );
                        if (ok) loadBots();
                      }}
                    >
                      چرخش توکن
                    </button>
                    <button
                      className="chip-btn"
                      disabled={busy}
                      onClick={async () => {
                        const ok = await act(
                          "/api/admin/bots",
                          { method: "PATCH", body: { id: b.id, action: "revoke_webhook" } },
                          "وب‌هوک حذف شد"
                        );
                        if (ok) loadBots();
                      }}
                    >
                      حذف وب‌هوک
                    </button>
                    <button
                      className="chip-btn danger"
                      disabled={busy}
                      onClick={async () => {
                        if (!confirm(`ربات @${b.username} حذف شود؟`)) return;
                        const ok = await act(`/api/admin/bots?id=${b.id}`, { method: "DELETE" }, "ربات حذف شد");
                        if (ok) loadBots();
                      }}
                    >
                      حذف ربات
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---------------- messages ---------------- */}
        {tab === "messages" && (
          <>
            <header className="admin-head">
              <div>
                <h1>پیام‌ها</h1>
                <p>پایش و حذف محتوای نامناسب</p>
              </div>
              <div className="searchbox" style={{ maxWidth: 280 }}>
                <Icon name="search" size={16} />
                <input
                  placeholder="جستجوی متن پیام…"
                  value={msgQuery}
                  onChange={(e) => {
                    setMsgQuery(e.target.value);
                    loadMessages(e.target.value);
                  }}
                />
              </div>
            </header>
            <div className="admin-cards">
              {messages.length === 0 && <div className="glass-card empty-hint">پیامی پیدا نشد</div>}
              {messages.map((m) => (
                <div className="glass-card" key={m.id} style={{ padding: 14 }}>
                  <div className="mini-row" style={{ padding: 0 }}>
                    <span
                      className="avatar sm"
                      style={{ background: `${m.sender_color || "#6366f1"}33`, fontSize: 15 }}
                    >
                      {m.sender_emoji || "👤"}
                    </span>
                    <div className="mini-main">
                      <div className="mini-title" style={{ fontSize: 13 }}>
                        {m.sender_name} <span style={{ color: "var(--muted)", fontWeight: 400 }}>· {m.chat_title}</span>
                      </div>
                      <div className="mini-sub">{shortTime(m.created_at)} · {m.kind}</div>
                    </div>
                    <button
                      className="chip-btn danger"
                      disabled={m.deleted}
                      onClick={async () => {
                        if (!confirm("پیام حذف شود؟")) return;
                        const ok = await act(`/api/admin/messages?id=${m.id}`, { method: "DELETE" }, "پیام حذف شد");
                        if (ok) loadMessages(msgQuery);
                      }}
                    >
                      {m.deleted ? "حذف‌شده" : "حذف"}
                    </button>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13.5, lineHeight: 1.9, opacity: m.deleted ? 0.5 : 1 }}>
                    {m.deleted ? "🚫 این پیام حذف شده است" : m.text || `[${m.kind}]`}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---------------- broadcast ---------------- */}
        {tab === "broadcast" && (
          <>
            <header className="admin-head">
              <div>
                <h1>ارسال همگانی</h1>
                <p>پیام سیستمی به همه یا یک گفتگوی مشخص</p>
              </div>
            </header>
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="field">
                <label>مقصد</label>
                <select className="input" value={broadcastTo} onChange={(e) => setBroadcastTo(e.target.value)}>
                  <option value="">همهٔ گفتگوها</option>
                  {chats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.type})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>متن پیام</label>
                <textarea
                  className="input"
                  rows={6}
                  style={{ resize: "vertical", lineHeight: 1.9 }}
                  placeholder="مثلاً: نکسورا ۲.۰ منتشر شد 🎉"
                  value={broadcast}
                  onChange={(e) => setBroadcast(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn-primary"
                  disabled={busy || !broadcast.trim()}
                  onClick={async () => {
                    if (!chats.length) await loadChats("");
                    const ok = await act(
                      "/api/admin/broadcast",
                      { body: { text: broadcast, chat_id: broadcastTo || undefined } },
                      "پیام همگانی ارسال شد"
                    );
                    if (ok) setBroadcast("");
                  }}
                >
                  ارسال پیام
                </button>
                <button className="btn btn-ghost" onClick={() => loadChats("")}>
                  بارگذاری مقصدها
                </button>
              </div>
            </div>
          </>
        )}

        {/* ---------------- settings ---------------- */}
        {tab === "settings" && (
          <>
            <header className="admin-head">
              <div>
                <h1>تنظیمات پلتفرم</h1>
                <p>کنترل رفتار نکسورا بدون نیاز به دیپلوی</p>
              </div>
            </header>
            <div className="admin-grid">
              <section className="glass-card">
                <h3>عمومی</h3>
                <div className="field">
                  <label>نام پلتفرم</label>
                  <input
                    className="input"
                    value={settings.app_name ?? ""}
                    onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>پیام خوش‌آمد (اختیاری)</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={settings.welcome_message ?? ""}
                    onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>حداکثر حجم فایل (مگابایت)</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={20}
                    value={settings.max_upload_mb ?? 4}
                    onChange={(e) => setSettings({ ...settings, max_upload_mb: Number(e.target.value) })}
                  />
                </div>
                <div className="field">
                  <label>حداکثر طول پیام</label>
                  <input
                    className="input"
                    type="number"
                    min={100}
                    max={8000}
                    value={settings.max_message_length ?? 8000}
                    onChange={(e) => setSettings({ ...settings, max_message_length: Number(e.target.value) })}
                  />
                </div>
              </section>

              <section className="glass-card">
                <h3>دسترسی و قابلیت‌ها</h3>
                {[
                  { key: "registration_open", label: "ثبت‌نام باز باشد", icon: "users" },
                  { key: "polls_enabled", label: "نظرسنجی فعال باشد", icon: "zap" },
                  { key: "media_enabled", label: "آپلود فایل و مدیا", icon: "paperclip" },
                  { key: "maintenance_mode", label: "حالت تعمیرات", icon: "shield" },
                ].map((s) => (
                  <label className="switch-row" key={s.key}>
                    <Icon name={s.icon} size={17} />
                    <span>{s.label}</span>
                    <button
                      type="button"
                      className={`switch ${settings[s.key] ? "on" : ""}`}
                      onClick={() => {
                        const next = !settings[s.key];
                        setSettings({ ...settings, [s.key]: next });
                        saveSettings({ [s.key]: next });
                      }}
                    >
                      <span />
                    </button>
                  </label>
                ))}
                <div className="field" style={{ marginTop: 8 }}>
                  <label>متن حالت تعمیرات</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={settings.maintenance_text ?? ""}
                    onChange={(e) => setSettings({ ...settings, maintenance_text: e.target.value })}
                  />
                </div>
              </section>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              <button className="btn btn-primary" disabled={busy} onClick={() => saveSettings(settings)}>
                ذخیرهٔ همهٔ تنظیمات
              </button>
              <button className="btn btn-ghost" onClick={loadOverview}>
                بازگردانی مقادیر
              </button>
            </div>
          </>
        )}

        {/* ---------------- maintenance ---------------- */}
        {tab === "maintenance" && (
          <>
            <header className="admin-head">
              <div>
                <h1>نگهداری و لاگ</h1>
                <p>پاکسازی داده و پیگیری اقدامات مدیریتی</p>
              </div>
            </header>
            <div className="admin-grid">
              <section className="glass-card">
                <h3>پاکسازی</h3>
                <p className="hint" style={{ marginTop: 0 }}>
                  حذف داده‌های نمایشی نسخهٔ اول (کاربران و کانال‌های پیش‌فرض) و پاکسازی داده‌های بی‌مصرف.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button className="btn btn-ghost" disabled={busy} onClick={() => maintenance("purge_demo")}>
                    حذف داده‌های نمایشی و کانال‌های پیش‌فرض
                  </button>
                  <button className="btn btn-ghost" disabled={busy} onClick={() => maintenance("purge_empty_chats")}>
                    حذف گفتگوهای بدون پیام
                  </button>
                  <button className="btn btn-ghost" disabled={busy} onClick={() => maintenance("purge_media")}>
                    حذف فایل‌های بی‌استفاده
                  </button>
                </div>
              </section>
              <section className="glass-card">
                <h3>لاگ اقدامات</h3>
                <div className="mini-list" style={{ maxHeight: 420, overflowY: "auto" }}>
                  {logs.length === 0 && <div className="empty-hint">لاگی ثبت نشده</div>}
                  {logs.map((l) => (
                    <div className="mini-row" key={l.id}>
                      <span className="mini-emoji">•</span>
                      <div className="mini-main">
                        <div className="mini-title" style={{ fontSize: 12.5, direction: "ltr", textAlign: "start" }}>
                          {l.action}
                        </div>
                        <div className="mini-sub">{shortTime(l.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </main>

      {toast && (
        <div className="toasts">
          <div className={`toast ${toast.err ? "err" : ""}`}>
            {toast.err ? "⚠️" : "✅"} {toast.t}
          </div>
        </div>
      )}
    </div>
  );
}
