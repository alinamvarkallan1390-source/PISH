"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  api, AVATAR_EMOJIS, Chat, COLOR_SWATCHES, faNum, Me, Msg, lastSeenLabel, timeOf,
} from "@/lib/client";
import { Icon } from "./Icons";

type ToastFn = (text: string, err?: boolean) => void;

/* ============================ New chat ============================ */
export function NewChatModal({
  onClose, onCreated, onOpenHandle, toast, me,
}: {
  onClose: () => void;
  onCreated: (chatId: string) => void;
  onOpenHandle: (handle: string) => void;
  toast: ToastFn;
  me: Me;
}) {
  const [tab, setTab] = useState<"people" | "group" | "channel" | "handle">("people");
  const [people, setPeople] = useState<Me[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [emoji, setEmoji] = useState("👥");
  const [color, setColor] = useState("#8b5cf6");
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ users: Me[] }>("/api/search?q=_")
      .then((r) => setPeople(r.users))
      .catch(() => {});
  }, []);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function startPrivate(userId: string) {
    setBusy(true);
    try {
      const res = await api<{ chat: any }>("/api/chats", {
        body: { type: "private", user_id: userId },
      });
      onCreated(res.chat.id);
    } catch (err: any) {
      toast(err.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function createGroup(type: "group" | "channel") {
    if (title.trim().length < 2) return toast("نام را وارد کنید", true);
    setBusy(true);
    try {
      const res = await api<{ chat: any }>("/api/chats", {
        body: {
          type,
          title,
          username: username || undefined,
          member_ids: selected,
          avatar_emoji: emoji,
          avatar_color: color,
        },
      });
      onCreated(res.chat.id);
    } catch (err: any) {
      toast(err.message, true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <h3>
          <Icon name="plus" size={18} /> گفتگوی جدید
        </h3>
        <div className="seg">
          <button className={tab === "people" ? "active" : ""} onClick={() => setTab("people")}>
            👤 مخاطبین
          </button>
          <button className={tab === "group" ? "active" : ""} onClick={() => setTab("group")}>
            👥 گروه
          </button>
          <button className={tab === "channel" ? "active" : ""} onClick={() => setTab("channel")}>
            📣 کانال
          </button>
          <button className={tab === "handle" ? "active" : ""} onClick={() => setTab("handle")}>
            🔗 آیدی
          </button>
        </div>

        {tab === "people" && (
          <>
            <p className="hint">یک کاربر را انتخاب کنید تا گفتگوی خصوصی آغاز شود.</p>
            <div className="picker-list">
              {people.length === 0 && <div className="empty-hint">کاربری یافت نشد</div>}
              {people.map((p) => (
                <button key={p.id} className="picker-item" disabled={busy} onClick={() => startPrivate(p.id)}>
                  <div className="avatar sm" style={{ background: `${p.avatar_color}33` }}>
                    {p.avatar_emoji}
                  </div>
                  <div className="meta">
                    <div className="name">{p.display_name}</div>
                    <div className="sub">@{p.username} · {lastSeenLabel(p.last_seen)}</div>
                  </div>
                  <Icon name="back" size={16} />
                </button>
              ))}
            </div>
          </>
        )}

        {(tab === "group" || tab === "channel") && (
          <>
            <div className="field">
              <label>{tab === "group" ? "نام گروه" : "نام کانال"}</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً تیم محصول" />
            </div>
            <div className="field">
              <label>آیدی عمومی (اختیاری)</label>
              <input className="input" dir="ltr" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="my_team" />
            </div>
            <div className="field">
              <label>آیکون</label>
              <div className="emoji-grid">
                {AVATAR_EMOJIS.slice(0, 16).map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    style={emoji === e ? { background: "rgba(109,94,252,.35)", borderRadius: 10 } : undefined}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>رنگ</label>
              <div className="color-grid">
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c}
                    className={`swatch ${color === c ? "on" : ""}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
            <div className="field">
              <label>اعضا ({faNum(selected.length)} نفر)</label>
              <div className="picker-list">
                {people.map((p) => (
                  <button
                    key={p.id}
                    className={`picker-item ${selected.includes(p.id) ? "selected" : ""}`}
                    onClick={() => toggle(p.id)}
                  >
                    <div className="avatar sm" style={{ background: `${p.avatar_color}33` }}>
                      {p.avatar_emoji}
                    </div>
                    <div className="meta">
                      <div className="name">{p.display_name}</div>
                      <div className="sub">@{p.username}</div>
                    </div>
                    <span className={`check ${selected.includes(p.id) ? "on" : ""}`}>
                      {selected.includes(p.id) && <Icon name="check" size={11} />}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={onClose}>
                انصراف
              </button>
              <button className="btn btn-primary" disabled={busy} onClick={() => createGroup(tab)}>
                {busy ? "در حال ساخت…" : tab === "group" ? "ساخت گروه" : "ساخت کانال"}
              </button>
            </div>
          </>
        )}

        {tab === "handle" && (
          <>
            <p className="hint">
              آیدی کاربر (<code>@username</code>)، آیدی عمومی گروه/کانال یا آیدی ربات را وارد کنید.
            </p>
            <div className="field">
              <label>آیدی</label>
              <input
                className="input"
                dir="ltr"
                placeholder="ali / nexora_team / nexora_bot"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handle.trim() && onOpenHandle(handle.trim())}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={onClose}>
                انصراف
              </button>
              <button className="btn btn-primary" onClick={() => handle.trim() && onOpenHandle(handle.trim())}>
                باز کردن
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================ Profile / settings ============================ */
export function ProfileModal({
  me, onClose, onSave, onLogout, onTheme,
}: {
  me: Me;
  onClose: () => void;
  onSave: (patch: any) => void;
  onLogout: () => void;
  onTheme: (t: string) => void;
}) {
  const [name, setName] = useState(me.display_name);
  const [bio, setBio] = useState(me.bio || "");
  const [emoji, setEmoji] = useState(me.avatar_emoji);
  const [color, setColor] = useState(me.avatar_color);
  const theme = typeof document !== "undefined" ? document.documentElement.dataset.theme || "dark" : "dark";

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>
          <Icon name="settings" size={18} /> پروفایل و تنظیمات
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="avatar lg" style={{ background: `${color}33`, border: `1px solid ${color}66` }}>
            {emoji}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{me.display_name}</div>
            <div style={{ color: "var(--accent-2)", fontSize: 12.5, direction: "ltr" }}>@{me.username}</div>
            <div style={{ color: "var(--muted)", fontSize: 11.5, marginTop: 3 }}>
              {me.is_premium ? "✨ کاربر ویژه" : "کاربر نکسورا"}
            </div>
          </div>
        </div>
        <div className="field">
          <label>نام نمایشی</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>بیوگرافی</label>
          <input className="input" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} placeholder="درباره من…" />
        </div>
        <div className="field">
          <label>آیکون پروفایل</label>
          <div className="emoji-grid">
            {AVATAR_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                style={emoji === e ? { background: "rgba(109,94,252,.35)", borderRadius: 10 } : undefined}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>رنگ</label>
          <div className="color-grid">
            {COLOR_SWATCHES.map((c) => (
              <button
                key={c}
                className={`swatch ${color === c ? "on" : ""}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>
        <div className="field">
          <label>پوسته</label>
          <div className="seg">
            {[
              { k: "dark", l: "🌙 تاریک" },
              { k: "light", l: "☀️ روشن" },
              { k: "amoled", l: "⬛ آمولد" },
            ].map((t) => (
              <button key={t.k} className={theme === t.k ? "active" : ""} onClick={() => onTheme(t.k)}>
                {t.l}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href="/bots" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
            <Icon name="bot" size={16} /> ربات‌ساز
          </Link>
          <Link href="/docs" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
            <Icon name="book" size={16} /> مستندات API
          </Link>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onLogout}>
            <Icon name="logout" size={16} /> خروج
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onSave({ display_name: name, bio, avatar_emoji: emoji, avatar_color: color, theme });
              onClose();
            }}
          >
            ذخیرهٔ تغییرات
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================ Chat info ============================ */
export function ChatInfoModal({
  chat, me, onClose, toast, onUpdated, onLeft,
}: {
  chat: any;
  me: Me;
  onClose: () => void;
  toast: ToastFn;
  onUpdated: () => void;
  onLeft: () => void;
}) {
  const [addHandle, setAddHandle] = useState("");
  const [title, setTitle] = useState(chat?.title || "");
  const isGroupish = chat?.type === "group" || chat?.type === "channel";
  const canEdit = chat?.role === "owner" || chat?.role === "admin";

  async function addMember() {
    if (!addHandle.trim()) return;
    try {
      await api(`/api/chats/${chat.id}/members`, { body: { username: addHandle.trim() } });
      setAddHandle("");
      toast("عضو اضافه شد ✅");
      onUpdated();
    } catch (err: any) {
      toast(err.message, true);
    }
  }

  async function removeMember(id: string) {
    try {
      await api(`/api/chats/${chat.id}/members`, { method: "DELETE", body: { user_id: id } });
      toast("عضو حذف شد");
      onUpdated();
    } catch (err: any) {
      toast(err.message, true);
    }
  }

  async function saveTitle() {
    try {
      await api(`/api/chats/${chat.id}`, { method: "PATCH", body: { title } });
      toast("ذخیره شد ✅");
      onUpdated();
    } catch (err: any) {
      toast(err.message, true);
    }
  }

  async function leave() {
    try {
      await api(`/api/chats/${chat.id}`, { method: "DELETE" });
      toast(chat.role === "owner" && isGroupish ? "گفتگو حذف شد" : "از گفتگو خارج شدید");
      onLeft();
    } catch (err: any) {
      toast(err.message, true);
    }
  }

  if (!chat) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>
          <Icon name="info" size={18} /> اطلاعات {chat.type === "channel" ? "کانال" : chat.type === "bot" ? "ربات" : chat.type === "group" ? "گروه" : "گفتگو"}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            className="avatar lg"
            style={{ background: `${chat.avatar_color}33`, border: `1px solid ${chat.avatar_color}66` }}
          >
            {chat.avatar_emoji}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{chat.title}</div>
            {chat.username && (
              <div style={{ color: "var(--accent-2)", fontSize: 12.5, direction: "ltr" }}>@{chat.username}</div>
            )}
            <div style={{ color: "var(--muted)", fontSize: 11.5, marginTop: 3 }}>
              {chat.type === "private"
                ? lastSeenLabel(chat.peer?.last_seen)
                : `${faNum(chat.member_count || 0)} عضو`}
            </div>
          </div>
        </div>

        {chat.bio && <p className="hint" style={{ margin: 0 }}>{chat.bio}</p>}

        {chat.type === "bot" && chat.bot && (
          <div className="token-box">
            <span>@{chat.bot.username}</span>
          </div>
        )}

        {isGroupish && canEdit && (
          <div className="field">
            <label>نام {chat.type === "channel" ? "کانال" : "گروه"}</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
              <button className="btn btn-primary" style={{ flex: "none", paddingInline: 16 }} onClick={saveTitle}>
                ذخیره
              </button>
            </div>
          </div>
        )}

        {(chat.type === "group" || chat.type === "channel") && canEdit && (
          <div className="field">
            <label>افزودن عضو با آیدی</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="input"
                dir="ltr"
                placeholder="sara"
                value={addHandle}
                onChange={(e) => setAddHandle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMember()}
              />
              <button className="btn btn-primary" style={{ flex: "none", paddingInline: 16 }} onClick={addMember}>
                افزودن
              </button>
            </div>
          </div>
        )}

        {chat.members && (
          <div className="field">
            <label>اعضا ({faNum(chat.members.length)})</label>
            <div className="picker-list">
              {chat.members.map((m: any) => (
                <div key={m.id} className="picker-item">
                  <div className="avatar sm" style={{ background: `${m.avatar_color}33` }}>
                    {m.avatar_emoji}
                  </div>
                  <div className="meta">
                    <div className="name">
                      {m.display_name}
                      {m.id === me.id && " (شما)"}
                    </div>
                    <div className="sub">
                      @{m.username} ·{" "}
                      {m.role === "owner" ? "مالک" : m.role === "admin" ? "مدیر" : "عضو"}
                    </div>
                  </div>
                  {canEdit && m.id !== me.id && (
                    <button className="icon-btn" onClick={() => removeMember(m.id)} title="حذف">
                      <Icon name="close" size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            بستن
          </button>
          {(chat.type === "group" || chat.type === "channel" || chat.type === "private") && (
            <button className="btn btn-ghost" style={{ color: "var(--danger)" }} onClick={leave}>
              {chat.role === "owner" && isGroupish ? "حذف گفتگو" : "خروج"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================ Forward ============================ */
export function ForwardModal({
  chats, messages, onClose, onDone, toast,
}: {
  chats: Chat[];
  messages: Msg[];
  onClose: () => void;
  onDone: () => void;
  toast: ToastFn;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!selected.length) return toast("حداقل یک مقصد انتخاب کنید", true);
    setBusy(true);
    try {
      await api("/api/forward", {
        body: { message_ids: messages.map((m) => m.id), to_chat_ids: selected },
      });
      onDone();
    } catch (err: any) {
      toast(err.message, true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>
          <Icon name="forward" size={18} /> فوروارد {faNum(messages.length)} پیام
        </h3>
        <div className="picker-list">
          {chats.map((c) => (
            <button
              key={c.id}
              className={`picker-item ${selected.includes(c.id) ? "selected" : ""}`}
              onClick={() =>
                setSelected((s) => (s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id]))
              }
            >
              <div className="avatar sm" style={{ background: `${c.avatar_color}33` }}>
                {c.avatar_emoji}
              </div>
              <div className="meta">
                <div className="name">{c.title}</div>
                <div className="sub">{c.type === "channel" ? "کانال" : c.type === "group" ? "گروه" : c.type === "bot" ? "ربات" : "خصوصی"}</div>
              </div>
              <span className={`check ${selected.includes(c.id) ? "on" : ""}`}>
                {selected.includes(c.id) && <Icon name="check" size={11} />}
              </span>
            </button>
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            انصراف
          </button>
          <button className="btn btn-primary" disabled={busy} onClick={submit}>
            فوروارد
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================ Global search ============================ */
export function SearchModal({
  initial, onClose, onOpenChat, onOpenHandle, toast,
}: {
  initial: string;
  onClose: () => void;
  onOpenChat: (id: string) => void;
  onOpenHandle: (handle: string) => void;
  toast: ToastFn;
}) {
  const [term, setTerm] = useState(initial);
  const [res, setRes] = useState<any>({ users: [], chats: [], bots: [], messages: [] });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!term.trim()) {
        setRes({ users: [], chats: [], bots: [], messages: [] });
        return;
      }
      setBusy(true);
      try {
        const r = await api<any>(`/api/search?q=${encodeURIComponent(term)}`);
        setRes(r);
      } catch (err: any) {
        toast(err.message, true);
      } finally {
        setBusy(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [term, toast]);

  const total = useMemo(
    () => res.users.length + res.chats.length + res.bots.length + res.messages.length,
    [res]
  );

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()} style={{ gap: 10 }}>
        <h3>
          <Icon name="search" size={18} /> جستجو در نکسورا
        </h3>
        <div className="searchbox">
          <Icon name="search" size={17} />
          <input
            autoFocus
            placeholder="نام کاربر، آیدی، گروه، ربات یا متن پیام…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>

        {!term.trim() && (
          <p className="hint">برای جستجو تایپ کنید. آیدی‌ها بدون @ هم پیدا می‌شوند.</p>
        )}
        {term.trim() && !busy && total === 0 && <div className="empty-hint">نتیجه‌ای پیدا نشد</div>}

        {res.bots.length > 0 && (
          <>
            <div className="result-section">🤖 ربات‌ها</div>
            <div className="picker-list">
              {res.bots.map((b: any) => (
                <button key={b.id} className="picker-item" onClick={() => onOpenHandle(b.username)}>
                  <div className="avatar sm" style={{ background: "rgba(6,182,212,.2)" }}>
                    🤖
                  </div>
                  <div className="meta">
                    <div className="name">{b.name}</div>
                    <div className="sub">@{b.username} · {b.description}</div>
                  </div>
                  <Icon name="back" size={15} />
                </button>
              ))}
            </div>
          </>
        )}

        {res.users.length > 0 && (
          <>
            <div className="result-section">👤 کاربران</div>
            <div className="picker-list">
              {res.users.map((u: any) => (
                <button key={u.id} className="picker-item" onClick={() => onOpenHandle(u.username)}>
                  <div className="avatar sm" style={{ background: `${u.avatar_color}33` }}>
                    {u.avatar_emoji}
                  </div>
                  <div className="meta">
                    <div className="name">{u.display_name}</div>
                    <div className="sub">@{u.username} · {lastSeenLabel(u.last_seen)}</div>
                  </div>
                  <Icon name="back" size={15} />
                </button>
              ))}
            </div>
          </>
        )}

        {res.chats.length > 0 && (
          <>
            <div className="result-section">💬 گروه‌ها و کانال‌ها</div>
            <div className="picker-list">
              {res.chats.map((c: any) => (
                <button
                  key={c.id}
                  className="picker-item"
                  onClick={() => (c.joined ? onOpenChat(c.id) : onOpenHandle(c.username))}
                >
                  <div className="avatar sm" style={{ background: `${c.avatar_color}33` }}>
                    {c.avatar_emoji}
                  </div>
                  <div className="meta">
                    <div className="name">{c.title}</div>
                    <div className="sub">
                      {c.username ? `@${c.username} · ` : ""}
                      {faNum(c.member_count)} عضو {c.joined ? "· عضو هستید" : ""}
                    </div>
                  </div>
                  <Icon name="back" size={15} />
                </button>
              ))}
            </div>
          </>
        )}

        {res.messages.length > 0 && (
          <>
            <div className="result-section">✉️ پیام‌ها</div>
            <div className="picker-list">
              {res.messages.map((m: any) => (
                <button key={m.id} className="picker-item" onClick={() => onOpenChat(m.chat_id)}>
                  <div className="avatar sm" style={{ background: `${m.sender_color}33` }}>
                    {m.sender_emoji}
                  </div>
                  <div className="meta">
                    <div className="name">{m.chat_title}</div>
                    <div className="sub" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.sender_name}: {m.text} · {timeOf(m.created_at)}
                    </div>
                  </div>
                  <Icon name="back" size={15} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
