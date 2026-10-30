"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, Chat, Me, Msg, faNum, previewOf, shortTime, lastSeenLabel } from "@/lib/client";
import { Icon } from "./Icons";
import ChatWindow from "./ChatWindow";
import {
  NewChatModal,
  ProfileModal,
  ChatInfoModal,
  ForwardModal,
  SearchModal,
} from "./Modals";

type Toast = { id: number; text: string; err?: boolean };

export default function Messenger({ me: initialMe }: { me: Me }) {
  const router = useRouter();
  const [me, setMe] = useState<Me>(initialMe);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [peerReadSeq, setPeerReadSeq] = useState(0);
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "groups" | "channels" | "bots">("all");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<any>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hideList, setHideList] = useState(false);
  const lastSeqRef = useRef(0);
  const activeIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  activeIdRef.current = activeId;

  const toast = useCallback((text: string, err = false) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, err }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const loadChats = useCallback(async () => {
    try {
      const res = await api<{ chats: Chat[] }>("/api/chats");
      setChats(res.chats);
      return res.chats;
    } catch {
      return [] as Chat[];
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const openChat = useCallback(
    async (chatId: string) => {
      if (!chatId) return;
      setActiveId(chatId);
      setMobileOpen(true);
      setHideList(true);
      setLoadingChat(true);
      setMessages([]);
      setDetail(null);
      try {
        const [d, m] = await Promise.all([
          api<{ chat: any }>(`/api/chats/${chatId}`),
          api<{ messages: Msg[] }>(`/api/chats/${chatId}/messages?limit=40`),
        ]);
        setDetail(d.chat);
        setMessages(m.messages);
        lastSeqRef.current = m.messages.length ? m.messages[m.messages.length - 1].seq : 0;
        setPeerReadSeq(d.chat.peer_read_seq || 0);
        requestAnimationFrame(() => {
          const el = scrollRef.current;
          if (el) el.scrollTop = el.scrollHeight;
        });
        api(`/api/chats/${chatId}/read`, { body: {} }).catch(() => {});
        setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, unread: 0 } : c)));
      } catch (err: any) {
        toast(err.message || "باز کردن گفتگو ناموفق بود", true);
      } finally {
        setLoadingChat(false);
      }
    },
    [toast]
  );

  const refreshChatMeta = useCallback(async (chatId: string) => {
    try {
      const d = await api<{ chat: any }>(`/api/chats/${chatId}`);
      setDetail(d.chat);
      setPeerReadSeq(d.chat.peer_read_seq || 0);
    } catch {
      /* ignore */
    }
  }, []);

  // realtime poller
  useEffect(() => {
    let stopped = false;
    let timer: any;
    const tick = async () => {
      if (stopped) return;
      try {
        const chatId = activeIdRef.current;
        const qs = new URLSearchParams();
        if (chatId) {
          qs.set("chatId", chatId);
          qs.set("afterSeq", String(lastSeqRef.current));
        }
        const res = await api<any>(`/api/rt?${qs.toString()}`);
        if (stopped) return;
        setChats(res.chats);
        if (chatId) {
          setPeerReadSeq(res.peerReadSeq || 0);
          setTypingNames(res.typing || []);
          if (Array.isArray(res.messages) && res.messages.length) {
            setMessages((prev) => {
              const incoming = new Map<string, Msg>(res.messages.map((m: Msg) => [m.id, m]));
              let hasNewFromOthers = false;
              let hasNew = false;
              let replaced = false;
              const next = prev.map((m) => {
                const fresh = incoming.get(m.id);
                if (!fresh || m.pending) return m;
                incoming.delete(m.id);
                if (
                  fresh.text !== m.text ||
                  fresh.deleted !== m.deleted ||
                  fresh.pinned !== m.pinned ||
                  JSON.stringify(fresh.reactions) !== JSON.stringify(m.reactions) ||
                  JSON.stringify(fresh.votes || []) !== JSON.stringify(m.votes || []) ||
                  fresh.edited !== m.edited
                ) {
                  replaced = true;
                  return { ...fresh, pending: false };
                }
                return m;
              });
              const appended = [...incoming.values()].sort((a, b) => a.seq - b.seq);
              for (const m of appended) {
                hasNew = true;
                if (m.sender_id !== me.id) hasNewFromOthers = true;
                next.push(m);
                lastSeqRef.current = Math.max(lastSeqRef.current, m.seq);
              }
              if (hasNewFromOthers) {
                api(`/api/chats/${chatId}/read`, { body: {} }).catch(() => {});
              }
              if (hasNew) {
                setTimeout(() => {
                  const el = scrollRef.current;
                  if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 420) {
                    el.scrollTop = el.scrollHeight;
                  }
                }, 30);
                return next;
              }
              return replaced ? next : prev;
            });
          }
        } else {
          setTypingNames([]);
        }
      } catch {
        /* offline / transient */
      }
      timer = setTimeout(tick, 2200);
    };
    tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [me.id]);

  const activeChat = useMemo(() => chats.find((c) => c.id === activeId) || null, [chats, activeId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return chats.filter((c) => {
      if (filter === "unread" && c.unread === 0) return false;
      if (filter === "groups" && c.type !== "group") return false;
      if (filter === "channels" && c.type !== "channel") return false;
      if (filter === "bots" && c.type !== "bot") return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        (c.username || "").toLowerCase().includes(q) ||
        (c.last_message?.text || "").toLowerCase().includes(q)
      );
    });
  }, [chats, filter, query]);

  const totalUnread = chats.reduce((s, c) => s + (c.unread || 0), 0);

  function setTheme(theme: string) {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("nexora-theme", theme);
    } catch {}
    setMe((m) => ({ ...m, theme }));
    api("/api/me", { method: "PATCH", body: { theme } }).catch(() => {});
  }

  async function logout() {
    await api("/api/auth/logout", { body: {} }).catch(() => {});
    router.replace("/login");
    router.refresh();
  }

  // ---------- message actions ----------
  async function sendMessage(payload: {
    text?: string;
    kind?: string;
    media_id?: string | null;
    reply_to_id?: string | null;
    meta?: any;
  }) {
    if (!activeId) return;
    const tempId = `tmp-${Math.random().toString(36).slice(2)}`;
    const optimistic: Msg = {
      id: tempId,
      seq: lastSeqRef.current + 0.5,
      chat_id: activeId,
      sender_id: me.id,
      sender_bot_id: null,
      sender_name: me.display_name,
      sender_username: me.username,
      sender_emoji: me.avatar_emoji,
      sender_color: me.avatar_color,
      is_bot: false,
      kind: payload.kind || "text",
      text: payload.text || "",
      media_url: payload.media_id ? `/api/media/${payload.media_id}` : null,
      media_mime: null,
      media_name: null,
      reply: payload.reply_to_id
        ? (() => {
            const m = messages.find((x) => x.id === payload.reply_to_id);
            return m
              ? { id: m.id, text: m.text, sender_name: m.sender_name, kind: m.kind }
              : null;
          })()
        : null,
      forward_from: null,
      reactions: [],
      edited: false,
      pinned: false,
      deleted: false,
      meta: payload.meta || {},
      created_at: new Date().toISOString(),
      outgoing: true,
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
    try {
      const res = await api<{ message: Msg }>(`/api/chats/${activeId}/messages`, { body: payload });
      lastSeqRef.current = Math.max(lastSeqRef.current, res.message.seq);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? res.message : m)));
      loadChats();
    } catch (err: any) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)));
      toast(err.message || "ارسال پیام ناموفق بود", true);
    }
  }

  async function react(messageId: string, emoji: string) {
    try {
      const res = await api<{ message: Msg }>(`/api/messages/${messageId}/react`, { body: { emoji } });
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions: res.message.reactions } : m)));
    } catch (err: any) {
      toast(err.message, true);
    }
  }

  async function deleteMessage(messageId: string) {
    try {
      await api(`/api/messages/${messageId}`, { method: "DELETE" });
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, deleted: true, text: "" } : m))
      );
      loadChats();
    } catch (err: any) {
      toast(err.message, true);
    }
  }

  async function editMessage(messageId: string, text: string) {
    try {
      const res = await api<{ message: Msg }>(`/api/messages/${messageId}`, {
        method: "PATCH",
        body: { text },
      });
      setMessages((prev) => prev.map((m) => (m.id === messageId ? res.message : m)));
    } catch (err: any) {
      toast(err.message, true);
    }
  }

  async function pinMessage(messageId: string) {
    try {
      await api(`/api/messages/${messageId}/pin`, { body: {} });
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, pinned: !m.pinned } : m)));
    } catch (err: any) {
      toast(err.message, true);
    }
  }

  async function pressButton(messageId: string, data: string, label: string) {
    try {
      await api(`/api/messages/${messageId}/callback`, { body: { data, label } });
    } catch (err: any) {
      toast(err.message, true);
    }
  }

  async function editProfile(patch: any) {
    try {
      const res = await api<{ user: Me }>("/api/me", { method: "PATCH", body: patch });
      setMe((m) => ({ ...m, ...res.user }));
      toast("پروفایل به‌روزرسانی شد ✨");
    } catch (err: any) {
      toast(err.message, true);
    }
  }

  async function openHandle(handle: string) {
    try {
      const res = await api<{ chat_id: string }>("/api/open", { body: { handle } });
      await loadChats();
      setModal(null);
      await openChat(res.chat_id);
    } catch (err: any) {
      toast(err.message, true);
    }
  }

  async function afterCreateChat(chatId: string) {
    setModal(null);
    await loadChats();
    await openChat(chatId);
  }

  return (
    <>
      <div className="app">
        <aside className="rail">
          <button className="rail-btn rail-brand" title="نکسورا" onClick={() => setFilter("all")}>
            <div className="brand-mark" style={{ width: 34, height: 34, borderRadius: 11, fontSize: 16 }}>
              ✦
            </div>
          </button>
          <div style={{ height: 4 }} />
          <button className={`rail-btn ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")} title="همهٔ گفتگوها">
            <Icon name="chat" size={22} />
            {totalUnread > 0 && <span className="badge">{faNum(Math.min(totalUnread, 99))}</span>}
          </button>
          <button className={`rail-btn rail-optional ${filter === "groups" ? "active" : ""}`} onClick={() => setFilter("groups")} title="گروه‌ها">
            <Icon name="users" size={22} />
          </button>
          <button className={`rail-btn rail-optional ${filter === "channels" ? "active" : ""}`} onClick={() => setFilter("channels")} title="کانال‌ها">
            <Icon name="megaphone" size={22} />
          </button>
          <button className={`rail-btn ${filter === "bots" ? "active" : ""}`} onClick={() => setFilter("bots")} title="ربات‌ها">
            <Icon name="bot" size={22} />
          </button>
          <button
            className="rail-btn"
            title="پیام‌های ذخیره‌شده"
            onClick={async () => {
              try {
                const r = await api<{ chat_id: string }>("/api/saved", { body: {} });
                await loadChats();
                await openChat(r.chat_id);
              } catch (err: any) {
                toast(err.message, true);
              }
            }}
          >
            <Icon name="bookmark" size={21} />
          </button>
          <Link href="/bots" className="rail-btn rail-optional" title="ربات‌ساز">
            <Icon name="zap" size={22} />
          </Link>
          <Link href="/python" className="rail-btn rail-optional" title="ربات‌سازی با پایتون">
            <span style={{ fontSize: 19 }}>🐍</span>
          </Link>
          <Link href="/docs" className="rail-btn rail-optional" title="مستندات Bot API">
            <Icon name="book" size={22} />
          </Link>
          <div className="rail-spacer" />
          <button className="rail-btn" title="جستجو" onClick={() => setModal({ type: "search" })}>
            <Icon name="search" size={21} />
          </button>
          <button
            className="rail-btn"
            title="حالت روشن/تاریک"
            onClick={() => setTheme(me.theme === "light" ? "dark" : "light")}
          >
            <Icon name={me.theme === "light" ? "sun" : "moon"} size={21} />
          </button>
          <button className="rail-btn" title="تنظیمات" onClick={() => setModal({ type: "profile" })}>
            <Icon name="settings" size={21} />
          </button>
          <button
            className="rail-avatar"
            style={{ background: `${me.avatar_color}33` }}
            title={me.display_name}
            onClick={() => setModal({ type: "profile" })}
          >
            {me.avatar_emoji}
          </button>
        </aside>

        <section className="sidebar">
          <div className="sidebar-head">
            <div className="sidebar-title">
              <h2>گفتگوها</h2>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="icon-btn" title="جستجوی پیشرفته" onClick={() => setModal({ type: "search" })}>
                  <Icon name="search" size={19} />
                </button>
                <button className="icon-btn accent" title="گفتگوی جدید" onClick={() => setModal({ type: "new" })}>
                  <Icon name="plus" size={20} />
                </button>
              </div>
            </div>
            <div className="searchbox">
              <Icon name="search" size={17} />
              <input
                placeholder="جستجو در گفتگوها…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query.trim()) setModal({ type: "search", initial: query });
                }}
              />
            </div>
          </div>

          <div className="folders">
            {[
              { k: "all", l: "همه" },
              { k: "unread", l: `خوانده‌نشده${totalUnread ? ` (${faNum(totalUnread)})` : ""}` },
              { k: "groups", l: "گروه‌ها" },
              { k: "channels", l: "کانال‌ها" },
              { k: "bots", l: "ربات‌ها" },
            ].map((f) => (
              <button
                key={f.k}
                className={`folder ${filter === f.k ? "active" : ""}`}
                onClick={() => setFilter(f.k as any)}
              >
                {f.l}
              </button>
            ))}
          </div>

          <div className="chat-scroll">
            {filtered.length === 0 && (
              <div className="empty-hint">
                {chats.length === 0 ? (
                  <>
                    هنوز گفتگویی نداری.
                    <br />
                    با دکمهٔ + شروع کن یا یک آیدی را جستجو کن.
                  </>
                ) : (
                  "چیزی پیدا نشد."
                )}
              </div>
            )}
            {filtered.map((c) => {
              const typing = c.typing?.length ? c.typing[0].display_name : null;
              return (
                <div
                  key={c.id}
                  className={`chat-item ${c.id === activeId ? "active" : ""}`}
                  onClick={() => openChat(c.id)}
                >
                  <div
                    className="avatar md"
                    style={{ background: `${c.avatar_color}2e`, border: `1px solid ${c.avatar_color}55` }}
                  >
                    {c.avatar_emoji}
                    {c.online && <span className="online-dot" />}
                  </div>
                  <div className="chat-item-main">
                    <div className="chat-item-top">
                      <span className="chat-item-name">
                        {c.title}
                        {c.type === "channel" && <span style={{ marginInlineStart: 4 }}>📣</span>}
                        {c.type === "bot" && <span style={{ marginInlineStart: 4 }}>🤖</span>}
                      </span>
                      <span className="chat-item-time">
                        {c.last_message ? shortTime(c.last_message.created_at) : ""}
                      </span>
                    </div>
                    <div className="chat-item-bottom">
                      <span className={`chat-item-preview ${typing ? "typing" : ""}`}>
                        {typing ? (
                          <>در حال نوشتن…</>
                        ) : c.last_message?.sender_id === me.id ? (
                          <>
                            <span className="preview-tick">
                              <Icon name="checks" size={15} />
                            </span>
                            {previewOf(c)}
                          </>
                        ) : c.type !== "private" && c.last_message ? (
                          <>
                            {c.type !== "bot" && (
                              <b style={{ fontWeight: 600, opacity: 0.85 }}>
                                {c.last_message.sender_id === me.id ? "شما: " : `${c.last_message.sender_name}: `}
                              </b>
                            )}
                            {previewOf(c)}
                          </>
                        ) : (
                          previewOf(c)
                        )}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        {c.muted && <Icon name="bell-off" size={13} />}
                        {c.pinned && <Icon name="pin" size={13} />}
                        {c.unread > 0 && <span className="unread">{faNum(c.unread > 99 ? 99 : c.unread)}+</span>}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {activeChat ? (
          <ChatWindow
            me={me}
            chat={activeChat}
            detail={detail}
            messages={messages}
            loading={loadingChat}
            peerReadSeq={peerReadSeq}
            typingNames={typingNames}
            scrollRef={scrollRef}
            onBack={() => {
              setMobileOpen(false);
              setHideList(false);
              setActiveId(null);
            }}
            onSend={sendMessage}
            onReact={react}
            onDelete={deleteMessage}
            onEdit={editMessage}
            onPin={pinMessage}
            onPressButton={pressButton}
            onToast={toast}
            onOpenInfo={() => setModal({ type: "info", chat: detail || activeChat })}
            onForward={(msgs) => setModal({ type: "forward", messages: msgs })}
            onRefreshMeta={() => refreshChatMeta(activeChat.id)}
            reloadChats={loadChats}
            onMessageUpdated={(m) => setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...m, pending: false } : x)))}
          />
        ) : (
          <div className="chatwrap">
            <div className="chat-empty">
              <div className="chat-empty-inner">
                <div className="chat-empty-orb">✦</div>
                <h2 style={{ margin: 0, color: "var(--text)", fontSize: 20 }}>به نکسورا خوش آمدی</h2>
                <p style={{ margin: 0 }}>
                  یک گفتگو را از فهرست انتخاب کن یا با جستجوی آیدی، گفتگوی تازه بساز.
                  <br />
                  ربات بساز، گروه راه بینداز، و پیام‌ها را در کسری از ثانیه ببین.
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  <button className="btn btn-primary" onClick={() => setModal({ type: "new" })}>
                    <Icon name="plus" size={17} /> گفتگوی جدید
                  </button>
                  <Link className="btn btn-ghost" href="/bots">
                    <Icon name="bot" size={17} /> ربات‌ساز
                  </Link>
                  <Link className="btn btn-ghost" href="/python">
                    <span style={{ fontSize: 15 }}>🐍</span> با پایتون بساز
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {modal?.type === "new" && (
        <NewChatModal
          onClose={() => setModal(null)}
          onCreated={afterCreateChat}
          onOpenHandle={openHandle}
          toast={toast}
          me={me}
        />
      )}
      {modal?.type === "profile" && (
        <ProfileModal
          me={me}
          onClose={() => setModal(null)}
          onSave={editProfile}
          onLogout={logout}
          onTheme={setTheme}
        />
      )}
      {modal?.type === "info" && (
        <ChatInfoModal
          chat={modal.chat}
          me={me}
          onClose={() => setModal(null)}
          toast={toast}
          onUpdated={() => {
            loadChats();
            if (activeId) refreshChatMeta(activeId);
            setModal(null);
          }}
          onLeft={async () => {
            setModal(null);
            setActiveId(null);
            setHideList(false);
            await loadChats();
          }}
        />
      )}
      {modal?.type === "forward" && (
        <ForwardModal
          chats={chats}
          messages={modal.messages}
          onClose={() => setModal(null)}
          toast={toast}
          onDone={() => {
            setModal(null);
            loadChats();
            toast("پیام‌ها فوروارد شدند ✅");
          }}
        />
      )}
      {modal?.type === "search" && (
        <SearchModal
          initial={modal.initial || ""}
          onClose={() => setModal(null)}
          onOpenChat={async (id) => {
            setModal(null);
            await openChat(id);
          }}
          onOpenHandle={openHandle}
          toast={toast}
        />
      )}

      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.err ? "err" : ""}`}>
            {t.err ? "⚠️" : "✅"} {t.text}
          </div>
        ))}
      </div>
    </>
  );
}
