"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api, Chat, EMOJIS, Me, Msg, dayLabel, faNum, lastSeenLabel, timeOf } from "@/lib/client";
import { Icon } from "./Icons";

const QUICK_REACTIONS = ["❤️", "👍", "🔥", "😂", "😮", "🙏"];

type Props = {
  me: Me;
  chat: Chat;
  detail: any;
  messages: Msg[];
  loading: boolean;
  peerReadSeq: number;
  typingNames: string[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onBack: () => void;
  onSend: (payload: any) => Promise<void> | void;
  onReact: (id: string, emoji: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onPin: (id: string) => void;
  onPressButton: (id: string, data: string, label: string) => void;
  onToast: (text: string, err?: boolean) => void;
  onOpenInfo: () => void;
  onForward: (msgs: Msg[]) => void;
  onRefreshMeta: () => void;
  reloadChats: () => void;
  onMessageUpdated: (m: Msg) => void;
};

export default function ChatWindow(props: Props) {
  const {
    me, chat, detail, messages, loading, peerReadSeq, typingNames, scrollRef,
    onBack, onSend, onReact, onDelete, onEdit, onPin, onPressButton, onToast,
    onOpenInfo, onForward, onMessageUpdated,
  } = props;

  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [editing, setEditing] = useState<Msg | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [pickerTab, setPickerTab] = useState<"emoji" | "sticker">("emoji");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollQ, setPollQ] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const imgRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const lastTyping = useRef(0);

  const peer = chat.type === "private" ? detail?.peer || chat.peer : null;
  const isChannelReadOnly = chat.type === "channel" && detail?.role === "member";
  const status = useMemo(() => {
    if (typingNames.length) return { text: `${typingNames[0]} در حال نوشتن…`, cls: "online" };
    if (chat.type === "private") {
      const online = peer?.last_seen ? Date.now() - new Date(peer.last_seen).getTime() < 120000 : false;
      return { text: online ? "آنلاین" : lastSeenLabel(peer?.last_seen), cls: online ? "online" : "" };
    }
    if (chat.type === "bot") return { text: "ربات · همیشه آنلاین", cls: "online" };
    const count = detail?.member_count ?? chat.member_count;
    return {
      text: `${chat.type === "channel" ? "کانال" : "گروه"} · ${faNum(count)} عضو`,
      cls: "",
    };
  }, [typingNames, peer, chat, detail]);

  const pinned = messages.filter((m) => m.pinned && !m.deleted).slice(-1)[0];

  useEffect(() => {
    setText("");
    setReplyTo(null);
    setEditing(null);
    setShowEmoji(false);
  }, [chat.id]);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 150) + "px";
  }, [text]);

  function noteTyping() {
    const now = Date.now();
    if (now - lastTyping.current > 3500) {
      lastTyping.current = now;
      api(`/api/chats/${chat.id}/typing`, { body: {} }).catch(() => {});
    }
  }

  async function submit() {
    const value = text.trim();
    if (!value || busy) return;
    if (editing) {
      onEdit(editing.id, value);
      setEditing(null);
      setText("");
      return;
    }
    setBusy(true);
    setText("");
    await onSend({ text: value, reply_to_id: replyTo?.id ?? null });
    setReplyTo(null);
    setBusy(false);
  }

  async function uploadAndSend(file: File, kind?: string) {
    if (file.size > 4 * 1024 * 1024) {
      onToast("حجم فایل باید کمتر از ۴ مگابایت باشد", true);
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api<{ id: string }>("/api/media", { form });
      const isImage = file.type.startsWith("image/");
      const isAudio = file.type.startsWith("audio/");
      await onSend({
        text: text.trim(),
        kind: kind || (isImage ? "photo" : isAudio ? "voice" : "file"),
        media_id: res.id,
        meta: { name: file.name, size: file.size, mime: file.type },
        reply_to_id: replyTo?.id ?? null,
      });
      setText("");
      setReplyTo(null);
    } catch (err: any) {
      onToast(err.message || "بارگذاری ناموفق بود", true);
    } finally {
      setUploading(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        if (blob.size < 1200) return;
        const file = new File([blob], "voice.webm", { type: blob.type });
        await uploadAndSend(file, "voice");
      };
      rec.start();
      setRecording(true);
    } catch {
      onToast("دسترسی به میکروفون ممکن نشد", true);
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  function sendSticker(emoji: string) {
    onSend({ kind: "sticker", text: "", meta: { emoji }, reply_to_id: replyTo?.id ?? null });
    setShowEmoji(false);
    setReplyTo(null);
  }

  async function vote(messageId: string, optionId: string) {
    try {
      const res = await api<{ message: Msg }>(`/api/messages/${messageId}/vote`, {
        body: { option_id: optionId },
      });
      onMessageUpdated(res.message);
    } catch (err: any) {
      onToast(err.message || "ثبت رأی ناموفق بود", true);
    }
  }

  async function saveMessage(messageId: string) {
    setSavingId(messageId);
    try {
      const saved = await api<{ chat_id: string }>("/api/saved", { body: {} });
      await api("/api/forward", { body: { message_ids: [messageId], to_chat_ids: [saved.chat_id] } });
      onToast("در پیام‌های ذخیره‌شده ذخیره شد 🔖");
      props.reloadChats();
    } catch (err: any) {
      onToast(err.message, true);
    } finally {
      setTimeout(() => setSavingId(null), 900);
    }
  }

  async function createPoll() {
    const question = pollQ.trim();
    const options = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (question.length < 2) return onToast("صورت نظرسنجی را وارد کنید", true);
    if (options.length < 2) return onToast("حداقل دو گزینه لازم است", true);
    await onSend({
      kind: "poll",
      text: question,
      meta: {
        question,
        options: options.map((text, i) => ({ id: `o${i + 1}`, text })),
        anonymous: false,
      },
    });
    setShowPoll(false);
    setPollQ("");
    setPollOptions(["", ""]);
  }

  function trackScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 120);
  }

  function scrollToBottom() {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setAtBottom(true);
  }

  let lastDay = "";

  return (
    <div className="chatwrap open">
      <div className="chat-head">
        <button className="icon-btn back-btn" onClick={onBack} title="بازگشت">
          <Icon name="back" size={22} />
        </button>
        <div
          className="avatar sm"
          style={{ background: `${chat.avatar_color}2e`, border: `1px solid ${chat.avatar_color}55` }}
          onClick={onOpenInfo}
        >
          {chat.avatar_emoji}
          {status.cls === "online" && chat.type === "private" && <span className="online-dot" />}
        </div>
        <div className="chat-head-info" onClick={onOpenInfo} style={{ cursor: "pointer" }}>
          <div className="chat-head-name">
            {chat.title}
            {chat.type === "channel" && <span className="verified">✓</span>}
            {chat.type === "bot" && <span className="pill-tag">BOT</span>}
          </div>
          <div className={`chat-head-status ${status.cls}`}>{status.text}</div>
        </div>
        <button className="icon-btn" title="اطلاعات گفتگو" onClick={onOpenInfo}>
          <Icon name="info" size={20} />
        </button>
      </div>

      {pinned && (
        <div
          style={{
            padding: "7px 16px",
            background: "rgba(109,94,252,.12)",
            borderBottom: "1px solid var(--border)",
            fontSize: 12.5,
            display: "flex",
            gap: 8,
            alignItems: "center",
            color: "var(--text-dim)",
          }}
        >
          <Icon name="pin" size={14} />
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {pinned.text || "پیام سنجاق‌شده"}
          </span>
          <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => onPin(pinned.id)}>
            <Icon name="close" size={13} />
          </button>
        </div>
      )}

      <div className="messages" ref={scrollRef} onScroll={trackScroll}>
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 18 }}>
            {[70, 45, 60, 35].map((w, i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: 42, width: `${w}%`, alignSelf: i % 2 ? "flex-start" : "flex-end" }}
              />
            ))}
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="empty-hint">
            هنوز پیامی نیست — اولین پیام را بفرست ✨
          </div>
        )}
        {messages.map((m) => {
          const day = dayLabel(m.created_at);
          const showDay = day !== lastDay;
          lastDay = day;
          const mine = m.sender_id === me.id;
          const isSticker = m.kind === "sticker";
          const buttons = m.meta?.buttons as { text: string; data: string }[][] | undefined;
          const myReactions = m.reactions.filter((r) => r.user_id === me.id).map((r) => r.emoji);
          const grouped = new Map<string, number>();
          m.reactions.forEach((r) => grouped.set(r.emoji, (grouped.get(r.emoji) || 0) + 1));

          return (
            <div key={String(m.id)}>
              {showDay && <div className="day-sep">{day}</div>}
              <div className={`msg-row ${mine ? "out" : ""}`}>
                {!mine && chat.type !== "private" && chat.type !== "bot" && (
                  <div
                    className="avatar sm"
                    style={{ background: `${m.sender_color}33`, alignSelf: "flex-end" }}
                    title={m.sender_name}
                  >
                    {m.sender_emoji}
                  </div>
                )}
                <div className="msg-col">
                  {!mine && chat.type !== "private" && (
                    <span className="msg-sender" style={{ color: m.sender_color }}>
                      {m.sender_name} {m.is_bot && "🤖"}
                    </span>
                  )}
                  <div
                    className={`bubble ${m.deleted ? "deleted" : ""} ${mine ? "tail-out" : "tail-in"}`}
                    onDoubleClick={() => {
                      if (!m.deleted) {
                        setReplyTo(m);
                        taRef.current?.focus();
                      }
                    }}
                  >
                    {!m.deleted && (
                      <div className="msg-tools">
                        <button title="پاسخ" onClick={() => { setReplyTo(m); taRef.current?.focus(); }}>
                          <Icon name="reply" size={13} />
                        </button>
                        <button title="ری‌اکشن" onClick={() => onReact(m.id, "❤️")}>
                          ❤️
                        </button>
                        <button title="فوروارد" onClick={() => onForward([m])}>
                          <Icon name="forward" size={13} />
                        </button>
                        <button title="سنجاق" onClick={() => onPin(m.id)}>
                          <Icon name="pin" size={13} />
                        </button>
                        <button title="ذخیره" onClick={() => saveMessage(m.id)}>
                          {savingId === m.id ? "✓" : <Icon name="bookmark" size={13} />}
                        </button>
                        {mine && m.kind === "text" && (
                          <button
                            title="ویرایش"
                            onClick={() => {
                              setEditing(m);
                              setText(m.text);
                              taRef.current?.focus();
                            }}
                          >
                            <Icon name="edit" size={13} />
                          </button>
                        )}
                        {mine && (
                          <button title="حذف" onClick={() => onDelete(m.id)}>
                            <Icon name="trash" size={13} />
                          </button>
                        )}
                      </div>
                    )}

                    {m.forward_from && !m.deleted && (
                      <div className="forward-tag">
                        <Icon name="forward" size={11} /> فوروارد شده
                      </div>
                    )}

                    {m.reply && !m.deleted && (
                      <div className="reply-quote">
                        <strong>{m.reply.sender_name}</strong>
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 260,
                          }}
                        >
                          {m.reply.kind === "photo"
                            ? "📷 عکس"
                            : m.reply.kind === "voice"
                            ? "🎤 پیام صوتی"
                            : m.reply.kind === "sticker"
                            ? "⭐ استیکر"
                            : m.reply.text}
                        </span>
                      </div>
                    )}

                    {m.deleted ? (
                      <div className="bubble-text">🚫 این پیام حذف شد</div>
                    ) : m.kind === "poll" ? (
                      <PollView message={m} meId={me.id} onVote={vote} />
                    ) : isSticker ? (
                      <div className="sticker-big">{m.meta?.emoji || "⭐"}</div>
                    ) : (
                      <>
                        {m.media_url && m.kind === "photo" && (
                          <div className="msg-media">
                            <img src={m.media_url} alt={m.media_name || "photo"} onClick={() => setLightbox(m.media_url!)} />
                          </div>
                        )}
                        {m.media_url && m.kind === "voice" && (
                          <VoiceNote url={m.media_url} />
                        )}
                        {m.media_url && m.kind === "file" && (
                          <a
                            className="voice-note"
                            href={m.media_url}
                            download={m.media_name || true}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "inherit" }}
                          >
                            <span className="voice-play">
                              <Icon name="doc" size={16} />
                            </span>
                            <span style={{ flex: 1, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis" }}>
                              {m.media_name || "فایل پیوست"}
                            </span>
                          </a>
                        )}
                        {m.text && <div className="bubble-text">{m.text}</div>}
                      </>
                    )}

                    {buttons && !m.deleted && (
                      <div className="inline-buttons">
                        {buttons.map((row, i) => (
                          <div className="row" key={i}>
                            {row.map((b) => (
                              <button
                                key={b.data}
                                className="inline-btn"
                                onClick={() => onPressButton(m.id, b.data, b.text)}
                              >
                                {b.text}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}

                    {grouped.size > 0 && (
                      <div className="reactions">
                        {[...grouped.entries()].map(([emoji, count]) => (
                          <button
                            key={emoji}
                            className={`reaction ${myReactions.includes(emoji) ? "mine" : ""}`}
                            onClick={() => onReact(m.id, emoji)}
                          >
                            {emoji} {count > 1 ? faNum(count) : ""}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="msg-meta">
                      {m.edited && <span>ویرایش‌شده</span>}
                      <span>{timeOf(m.created_at)}</span>
                      {mine && !m.pending && (
                        <span className="tick" title={peerReadSeq >= m.seq ? "خوانده شد" : "ارسال شد"}>
                          <Icon name={peerReadSeq >= m.seq && chat.type === "private" ? "checks" : "check"} size={13} />
                        </span>
                      )}
                      {m.pending && <span style={{ opacity: 0.7 }}>⏳</span>}
                      {m.failed && <span style={{ color: "#ffb3c1" }}>ناموفق</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div style={{ height: 6 }} />
      </div>

      <button
        className={`fab-down ${!atBottom ? "show" : ""}`}
        onClick={scrollToBottom}
        title="رفتن به آخرین پیام‌ها"
        aria-label="رفتن به آخرین پیام‌ها"
      >
        <Icon name="chevron" size={18} />
      </button>

      <div className="typing-bar">
        {typingNames.length > 0 && (
          <>
            <span className="dots">
              <span />
              <span />
              <span />
            </span>
            {typingNames[0]} در حال نوشتن است…
          </>
        )}
      </div>

      {isChannelReadOnly ? (
        <div className="composer">
          <div
            className="card"
            style={{ textAlign: "center", fontSize: 13, padding: 14, color: "var(--muted)" }}
          >
            📣 شما عضو این کانال هستید؛ فقط مدیران می‌توانند پیام بفرستند.
          </div>
        </div>
      ) : (
        <div className="composer" style={{ position: "relative" }}>
          {showPoll && (
            <div className="modal" style={{ position: "absolute", bottom: 84, insetInlineStart: 14, width: "min(430px, calc(100% - 28px))", zIndex: 30 }}>
              <h3>
                <Icon name="poll" size={17} /> نظرسنجی جدید
              </h3>
              <div className="field">
                <label>سؤال</label>
                <input
                  className="input"
                  placeholder="مثلاً: کدام قابلیت را اول اضافه کنیم؟"
                  value={pollQ}
                  onChange={(e) => setPollQ(e.target.value)}
                />
              </div>
              <div className="field">
                <label>گزینه‌ها</label>
                {pollOptions.map((o, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <input
                      className="input"
                      placeholder={`گزینه ${faNum(i + 1)}`}
                      value={o}
                      onChange={(e) =>
                        setPollOptions((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))
                      }
                    />
                    {pollOptions.length > 2 && (
                      <button
                        className="icon-btn"
                        onClick={() => setPollOptions((prev) => prev.filter((_, j) => j !== i))}
                      >
                        <Icon name="close" size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 8 && (
                  <button
                    className="btn btn-ghost"
                    style={{ padding: "8px", fontSize: 12.5 }}
                    onClick={() => setPollOptions((prev) => [...prev, ""])}
                  >
                    + افزودن گزینه
                  </button>
                )}
              </div>
              <div className="modal-actions">
                <button className="btn btn-ghost" onClick={() => setShowPoll(false)}>
                  انصراف
                </button>
                <button className="btn btn-primary" onClick={createPoll}>
                  ساخت نظرسنجی
                </button>
              </div>
            </div>
          )}
          {replyTo && (
            <div className="reply-banner">
              <Icon name="reply" size={15} />
              <div>
                پاسخ به <b>{replyTo.sender_name}</b>: {replyTo.text || "پیام"}
              </div>
              <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => setReplyTo(null)}>
                <Icon name="close" size={13} />
              </button>
            </div>
          )}
          {editing && (
            <div className="reply-banner">
              <Icon name="edit" size={15} />
              <div>ویرایش پیام…</div>
              <button
                className="icon-btn"
                style={{ width: 26, height: 26 }}
                onClick={() => {
                  setEditing(null);
                  setText("");
                }}
              >
                <Icon name="close" size={13} />
              </button>
            </div>
          )}

          {showEmoji && (
            <div className="emoji-panel">
              <div style={{ gridColumn: "1/-1", display: "flex", gap: 4, marginBottom: 6 }}>
                <button
                  className={`folder ${pickerTab === "emoji" ? "active" : ""}`}
                  onClick={() => setPickerTab("emoji")}
                  style={{ flex: 1 }}
                >
                  ایموجی
                </button>
                <button
                  className={`folder ${pickerTab === "sticker" ? "active" : ""}`}
                  onClick={() => setPickerTab("sticker")}
                  style={{ flex: 1 }}
                >
                  استیکر
                </button>
              </div>
              {pickerTab === "emoji"
                ? EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => {
                        setText((t) => t + e);
                        taRef.current?.focus();
                      }}
                    >
                      {e}
                    </button>
                  ))
                : ["🔥", "🎉", "🚀", "💎", "🦊", "🌙", "⭐", "🌈", "😎", "🫶", "🏆", "🪐"].map((e) => (
                    <button key={e} onClick={() => sendSticker(e)}>
                      {e}
                    </button>
                  ))}
            </div>
          )}

          {showAttach && (
            <div className="attach-menu">
              <button
                onClick={() => {
                  setShowAttach(false);
                  imgRef.current?.click();
                }}
              >
                <span className="ico">
                  <Icon name="camera" size={16} />
                </span>
                عکس و تصویر
              </button>
              <button
                onClick={() => {
                  setShowAttach(false);
                  fileRef.current?.click();
                }}
              >
                <span className="ico">
                  <Icon name="doc" size={16} />
                </span>
                فایل و سند
              </button>
              <button
                onClick={() => {
                  setShowAttach(false);
                  setShowPoll(true);
                }}
              >
                <span className="ico">
                  <Icon name="poll" size={16} />
                </span>
                نظرسنجی
              </button>
              <button
                onClick={() => {
                  setShowAttach(false);
                  startRecording();
                }}
              >
                <span className="ico">
                  <Icon name="mic" size={16} />
                </span>
                پیام صوتی
              </button>
            </div>
          )}

          <div className="composer-inner">
            <div className="composer-tools">
              <button
                className="icon-btn"
                title="پیوست"
                onClick={() => {
                  setShowAttach((v) => !v);
                  setShowEmoji(false);
                }}
              >
                <Icon name="paperclip" size={20} />
              </button>
              <button
                className="icon-btn"
                title="ایموجی و استیکر"
                onClick={() => {
                  setShowEmoji((s) => !s);
                  setShowAttach(false);
                }}
              >
                <Icon name="smile" size={20} />
              </button>
            </div>
            <textarea
              ref={taRef}
              rows={1}
              placeholder={uploading ? "در حال بارگذاری…" : "پیامی بنویس…"}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                noteTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            {text.trim() || editing ? (
              <button className="send-btn" onClick={submit} disabled={busy} title="ارسال">
                <Icon name="send" size={20} />
              </button>
            ) : (
              <button
                className="send-btn"
                title={recording ? "پایان ضبط و ارسال" : "ضبط پیام صوتی"}
                onClick={recording ? stopRecording : startRecording}
                style={recording ? { background: "linear-gradient(135deg,#ff5c7a,#ff8a5c)" } : undefined}
              >
                {recording ? <Icon name="pause" size={18} /> : <Icon name="mic" size={20} />}
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadAndSend(f);
              e.target.value = "";
            }}
          />
          <input
            ref={imgRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadAndSend(f, "photo");
              e.target.value = "";
            }}
          />
        </div>
      )}

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="preview" />
        </div>
      )}
    </div>
  );
}

function VoiceNote({ url }: { url: string }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const bars = useMemo(
    () => Array.from({ length: 26 }, () => 6 + Math.round(Math.random() * 16)),
    [url]
  );
  return (
    <div className="voice-note">
      <button
        className="voice-play"
        onClick={() => {
          const el = ref.current;
          if (!el) return;
          if (playing) {
            el.pause();
            setPlaying(false);
          } else {
            el.play();
            setPlaying(true);
          }
        }}
      >
        <Icon name={playing ? "pause" : "play"} size={15} />
      </button>
      <div className="wave">
        {bars.map((h, i) => (
          <span key={i} style={{ height: h }} />
        ))}
      </div>
      <audio ref={ref} src={url} onEnded={() => setPlaying(false)} preload="none" />
      <span style={{ fontSize: 11, opacity: 0.8 }}>صوتی</span>
    </div>
  );
}


function PollView({
  message,
  meId,
  onVote,
}: {
  message: Msg;
  meId: string;
  onVote: (messageId: string, optionId: string) => void;
}) {
  const options: { id: string; text: string }[] = Array.isArray(message.meta?.options)
    ? message.meta.options
    : [];
  const votes = message.votes || [];
  const total = votes.length;
  const myVote = votes.find((v) => v.user_id === meId)?.option_id;
  const closed = !!message.meta?.closed;

  return (
    <div className="poll">
      <div className="poll-q">{message.meta?.question || message.text || "نظرسنجی"}</div>
      {options.map((o) => {
        const count = votes.filter((v) => v.option_id === o.id).length;
        const pct = total ? Math.round((count / total) * 100) : 0;
        return (
          <button
            key={o.id}
            className={`poll-option ${myVote === o.id ? "chosen" : ""}`}
            onClick={() => !closed && onVote(message.id, o.id)}
          >
            <span className="fill" style={{ width: `${pct}%` }} />
            <span>{o.text}</span>
            <span style={{ opacity: 0.8, fontSize: 12 }}>
              {myVote === o.id ? "✓ " : ""}
              {faNum(pct)}%
            </span>
          </button>
        );
      })}
      <div className="poll-meta">
        <Icon name="users" size={13} />
        {faNum(total)} رأی · {total === 0 ? "اولین نفر باش!" : myVote ? "رأی شما ثبت شد" : "برای رأی دادن کلیک کن"}
      </div>
    </div>
  );
}
