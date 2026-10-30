"use client";

export type Me = {
  id: string;
  username: string;
  display_name: string;
  avatar_emoji: string;
  avatar_color: string;
  bio?: string;
  phone?: string | null;
  theme?: string;
  is_premium?: boolean;
  last_seen?: string;
};

export type Chat = {
  id: string;
  type: "private" | "group" | "channel" | "bot";
  title: string;
  avatar_emoji: string;
  avatar_color: string;
  username?: string | null;
  bio?: string;
  bot_id?: string | null;
  peer?: (Me & { last_read_seq?: string }) | null;
  bot?: { id: string; username: string; name: string; description?: string } | null;
  role: string;
  muted: boolean;
  pinned: boolean;
  unread: number;
  member_count: number;
  last_read_seq: number;
  last_message: {
    id: string;
    text: string;
    kind: string;
    seq: number;
    created_at: string;
    sender_id: string | null;
    sender_name: string;
    deleted: boolean;
    meta?: any;
  } | null;
  typing: { user_id: string; display_name: string }[];
  online: boolean;
  last_seen: string | null;
};

export type Msg = {
  id: string;
  seq: number;
  chat_id: string;
  sender_id: string | null;
  sender_bot_id: string | null;
  sender_name: string;
  sender_username: string | null;
  sender_emoji: string;
  sender_color: string;
  is_bot: boolean;
  kind: string;
  text: string;
  media_url: string | null;
  media_mime: string | null;
  media_name: string | null;
  reply: { id: string; text: string; sender_name: string; kind: string } | null;
  forward_from: string | null;
  reactions: { emoji: string; user_id: string }[];
  votes?: { option_id: string; user_id: string }[];
  edited: boolean;
  pinned: boolean;
  deleted: boolean;
  meta: any;
  created_at: string;
  outgoing?: boolean;
  pending?: boolean;
  failed?: boolean;
};

export async function api<T = any>(
  url: string,
  opts: { method?: string; body?: any; form?: FormData } = {}
): Promise<T> {
  const init: RequestInit = { method: opts.method || (opts.body || opts.form ? "POST" : "GET") };
  if (opts.form) init.body = opts.form;
  else if (opts.body !== undefined) {
    init.body = JSON.stringify(opts.body);
    init.headers = { "content-type": "application/json" };
  }
  const res = await fetch(url, init);
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || (res.status === 401 ? "لطفاً دوباره وارد شوید" : "خطا در ارتباط با سرور"));
  }
  return data as T;
}

export const faNum = (n: number | string) =>
  String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

export function timeOf(iso: string) {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Tehran",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, now)) return "امروز";
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (sameDay(d, yest)) return "دیروز";
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "full" }).format(d);
}

export function shortTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 86400 && now.getDate() === d.getDate()) return timeOf(iso);
  if (diff < 172800) return "دیروز";
  return new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(d);
}

export function lastSeenLabel(iso?: string | null) {
  if (!iso) return "آخرین بازدید نامشخص";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 120) return "آنلاین";
  if (diff < 3600) return `آخرین بازدید ${faNum(Math.floor(diff / 60))} دقیقه پیش`;
  if (diff < 86400) return `آخرین بازدید ${faNum(Math.floor(diff / 3600))} ساعت پیش`;
  return `آخرین بازدید ${new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(iso))}`;
}

export function previewOf(chat: Chat): string {
  const lm = chat.last_message;
  if (!lm) return "هنوز پیامی نیست";
  if (lm.deleted) return "پیام حذف شد";
  if (lm.kind === "photo") return "📷 عکس";
  if (lm.kind === "voice") return "🎤 پیام صوتی";
  if (lm.kind === "file") return `📎 ${lm.meta?.name || "فایل"}`;
  if (lm.kind === "sticker") return `${lm.meta?.emoji || "⭐"} استیکر`;
  return lm.text || "پیام";
}

export const EMOJIS = [
  "😀","😁","😂","🤣","😊","😍","😘","😎","🤩","🥳","😇","🙃","😉","😌","😔","😢",
  "😭","😤","😡","🤬","🤯","😱","😨","😰","🤔","🤨","😐","😴","🤤","🥱","🤗","🤫",
  "👍","👎","👌","✌️","🤞","🤝","🙏","👏","🙌","💪","🫶","❤️","🧡","💛","💚","💙",
  "💜","🖤","🤍","💔","💯","🔥","✨","⭐","🌟","⚡","💫","🎉","🎊","🎁","🏆","🥇",
  "🚀","🛸","🌙","☀️","🌈","☁️","🌊","🍀","🌸","🌹","🦊","🦋","🐧","🐳","🐺","🦉",
  "🍕","🍔","🍟","🌮","🍣","🍩","🍪","☕","🍵","🧊","🍉","🍎","⚽","🏀","🎮","🎧",
  "📱","💻","⌨️","🖥️","📷","🎬","🎨","📚","✏️","📝","📌","📎","🔗","🔒","🔑","💡",
];

export const COLOR_SWATCHES = [
  "#6366f1","#8b5cf6","#ec4899","#f43f5e","#f59e0b","#22c55e",
  "#10b981","#06b6d4","#0ea5e9","#3b82f6","#a855f7","#64748b",
];

export const AVATAR_EMOJIS = [
  "🦊","🦋","🐧","🌙","🚀","🐳","🦉","🌟","🔥","🍀","🎧","🧊",
  "🐺","🐯","🦁","🐨","🐼","🦄","🌈","⚡","💎","🎯","🧿","🪐",
];
