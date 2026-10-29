import { db, q } from "./db";
import { SCHEMA_STATEMENTS } from "./schema";
import { hashPassword } from "./auth";

declare global {
  // eslint-disable-next-line no-var
  var __nexoraBoot: Promise<void> | undefined;
}

const U = {
  ali: "11111111-1111-4111-8111-111111111111",
  sara: "22222222-2222-4222-8222-222222222222",
  reza: "33333333-3333-4333-8333-333333333333",
  mina: "44444444-4444-4444-8444-444444444444",
};

const C = {
  team: "aaaaaaaa-0000-4000-8000-000000000001",
  channel: "aaaaaaaa-0000-4000-8000-000000000002",
  aliSara: "aaaaaaaa-0000-4000-8000-000000000003",
  aliReza: "aaaaaaaa-0000-4000-8000-000000000004",
  aliBot: "aaaaaaaa-0000-4000-8000-000000000005",
};

const B = {
  assistant: "bbbbbbbb-0000-4000-8000-000000000001",
  echo: "bbbbbbbb-0000-4000-8000-000000000002",
};

const M = {
  m1: "cccccccc-0000-4000-8000-000000000001",
  m2: "cccccccc-0000-4000-8000-000000000002",
  m3: "cccccccc-0000-4000-8000-000000000003",
  m4: "cccccccc-0000-4000-8000-000000000004",
  m5: "cccccccc-0000-4000-8000-000000000005",
  m6: "cccccccc-0000-4000-8000-000000000006",
  m7: "cccccccc-0000-4000-8000-000000000007",
  m8: "cccccccc-0000-4000-8000-000000000008",
  m9: "cccccccc-0000-4000-8000-000000000009",
  m10: "cccccccc-0000-4000-8000-000000000010",
  m11: "cccccccc-0000-4000-8000-000000000011",
  m12: "cccccccc-0000-4000-8000-000000000012",
};

export async function ensureReady(): Promise<void> {
  if (!globalThis.__nexoraBoot) globalThis.__nexoraBoot = boot();
  return globalThis.__nexoraBoot;
}

async function boot() {
  const sql = await db();
  for (const stmt of SCHEMA_STATEMENTS) {
    try {
      await sql(stmt);
    } catch (err: any) {
      if (!/already exists/i.test(String(err?.message))) {
        console.error("[nexora] schema error:", err?.message);
      }
    }
  }
  await seed();
}

async function seed() {
  const existing = await q(`SELECT count(*)::int AS n FROM nexora_msg.users`);
  if (Number(existing[0]?.n ?? 0) > 0) return;

  const pw = hashPassword("nexora123");
  const users: [string, string, string, string, string, string][] = [
    [U.ali, "ali", "علی نوری", "🦊", "#6366f1", "بنیان‌گذار نکسورا · عاشق سرعت و طراحی"],
    [U.sara, "sara", "سارا محمدی", "🦋", "#ec4899", "طراح محصول · قهوه، رنگ و پیکسل"],
    [U.reza, "reza", "رضا کریمی", "🐧", "#22c55e", "برنامه‌نویس بک‌اند · ترمیم‌گر باگ‌ها"],
    [U.mina, "mina", "مینا احمدی", "🌙", "#f59e0b", "مدیر محتوا و کانال نکسورا"],
  ];
  for (const [id, username, name, emoji, color, bio] of users) {
    await q(
      `INSERT INTO nexora_msg.users (id, username, display_name, password_hash, avatar_emoji, avatar_color, bio)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
      [id, username, name, pw, emoji, color, bio]
    );
  }

  await q(
    `INSERT INTO nexora_msg.users (id, username, display_name, password_hash, avatar_emoji, avatar_color, bio)
     VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (username) DO NOTHING`,
    [
      "55555555-5555-4555-8555-555555555555",
      "demo",
      "کاربر دمو",
      hashPassword("demo"),
      "🚀",
      "#06b6d4",
      "حساب نمایشی نکسورا",
    ]
  );

  // Bots
  await q(
    `INSERT INTO nexora_msg.bots (id, owner_id, username, name, token, description, about, commands, is_builtin)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true) ON CONFLICT (id) DO NOTHING`,
    [
      B.assistant,
      U.ali,
      "nexora_bot",
      "دستیار نکسورا",
      "7000000001:AAH-nexora-assistant-builtin-demo-token",
      "ربات رسمی نکسورا؛ با /help شروع کنید",
      "دستیار هوشمند پلتفرم نکسورا",
      JSON.stringify([
        { command: "start", description: "شروع کار با ربات" },
        { command: "help", description: "راهنمای دستورات" },
        { command: "stats", description: "آمار زنده نکسورا" },
        { command: "time", description: "ساعت و تاریخ" },
      ]),
    ]
  );
  await q(
    `INSERT INTO nexora_msg.bots (id, owner_id, username, name, token, description, about, commands, is_builtin)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true) ON CONFLICT (id) DO NOTHING`,
    [
      B.echo,
      U.ali,
      "echo_bot",
      "ربات اکو",
      "7000000002:AAH-nexora-echo-builtin-demo-token",
      "هر چیزی بفرستی، همان را پس می‌دهد",
      "نمونهٔ ساده از قدرت Bot API نکسورا",
      JSON.stringify([{ command: "start", description: "شروع" }]),
    ]
  );

  // Chats
  const chats: any[] = [
    [C.team, "group", "تیم نکسورا", "🛠️", "#6366f1", "nexora_team", U.ali, true, "قلب تپندهٔ تیم نکسورا"],
    [C.channel, "channel", "کانال رسمی نکسورا", "📣", "#8b5cf6", "nexora", U.ali, true, "اخبار، آپدیت‌ها و قابلیت‌های نکسورا"],
  ];
  for (const [id, type, title, emoji, color, username, owner, isPublic, bio] of chats) {
    await q(
      `INSERT INTO nexora_msg.chats (id, type, title, avatar_emoji, avatar_color, username, owner_id, is_public, bio)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
      [id, type, title, emoji, color, username, owner, isPublic, bio]
    );
  }
  for (const [id, title, emoji, color] of [
    [C.aliSara, null, "🦋", "#ec4899"],
    [C.aliReza, null, "🐧", "#22c55e"],
  ] as any[]) {
    await q(
      `INSERT INTO nexora_msg.chats (id, type, title, avatar_emoji, avatar_color, owner_id)
       VALUES ($1,'private',$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
      [id, title, emoji, color, U.ali]
    );
  }
  await q(
    `INSERT INTO nexora_msg.chats (id, type, title, avatar_emoji, avatar_color, bot_id, is_public)
     VALUES ($1,'bot',$2,'🤖','#06b6d4',$3,false) ON CONFLICT (id) DO NOTHING`,
    [C.aliBot, "دستیار نکسورا", B.assistant]
  );

  // Members
  const memberRows: [string, string, string][] = [
    [C.team, U.ali, "owner"],
    [C.team, U.sara, "admin"],
    [C.team, U.reza, "member"],
    [C.team, U.mina, "member"],
    [C.channel, U.ali, "owner"],
    [C.channel, U.mina, "admin"],
    [C.channel, U.sara, "member"],
    [C.channel, U.reza, "member"],
    [C.aliSara, U.ali, "member"],
    [C.aliSara, U.sara, "member"],
    [C.aliReza, U.ali, "member"],
    [C.aliReza, U.reza, "member"],
    [C.aliBot, U.ali, "member"],
  ];
  for (const [chat, user, role] of memberRows) {
    await q(
      `INSERT INTO nexora_msg.chat_members (chat_id, user_id, role) VALUES ($1,$2,$3)
       ON CONFLICT (chat_id, user_id) DO NOTHING`,
      [chat, user, role]
    );
  }

  // Messages
  const now = Date.now();
  const msg = async (
    id: string,
    chat: string,
    sender: string | null,
    bot: string | null,
    text: string,
    minutesAgo: number,
    extra: { kind?: string; meta?: any } = {}
  ) => {
    await q(
      `INSERT INTO nexora_msg.messages (id, chat_id, sender_id, sender_bot_id, text, kind, meta, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7, now() - ($8 || ' minutes')::interval)
       ON CONFLICT (id) DO NOTHING`,
      [id, chat, sender, bot, text, extra.kind ?? "text", JSON.stringify(extra.meta ?? {}), String(minutesAgo)]
    );
  };

  await msg(M.m1, C.team, U.sara, null, "بچه‌ها نسخهٔ جدید پنل آماده شد ✨", 240);
  await msg(M.m2, C.team, U.reza, null, "دمت گرم! بک‌اند رو هم بهینه کردم، لتنسی ۴۰٪ کمتر شد ⚡", 232);
  await msg(M.m3, C.team, U.mina, null, "پست کانال رو با قابلیت ربات‌ساز هماهنگ کردم 📣", 210);
  await msg(M.m4, C.team, U.ali, null, "عالیه. بریم برای ریلیز امشب 🚀", 96);
  await msg(M.m5, C.team, U.sara, null, "من تست ریسپانسیو موبایل رو دارم تموم می‌کنم 📱", 22);
  await msg(M.m6, C.channel, U.ali, null, "نکسورا ۱.۰ منتشر شد — سریع‌ترین پیام‌رسان با ربات‌ساز کامل 🎉", 300);
  await msg(M.m7, C.channel, U.mina, null, "در این نسخه: چت خصوصی، گروه، کانال، ری‌اکشن، مدیا و Bot API کامل.", 180);
  await msg(M.m8, C.aliSara, U.sara, null, "سلام علی! طرح جدید چت رو ببین 👀", 90);
  await msg(M.m9, C.aliSara, U.ali, null, "دیدم، واقعاً خفنه! رنگ‌ها رو یه کم نرم‌تر کنیم؟", 84);
  await msg(M.m10, C.aliReza, U.reza, null, "اپ گیت آماده است، merge کنم؟", 30);
  await msg(M.m11, C.aliBot, null, B.assistant, "سلام! من دستیار نکسورا هستم 🤖\nبرای دیدن دستورات /help را بفرست.", 12);
  await msg(M.m12, C.team, U.reza, null, "", 8, {
    kind: "sticker",
    meta: { emoji: "🔥" },
  });

  await q(
    `UPDATE nexora_msg.chat_members SET last_read_seq = COALESCE((SELECT max(seq) FROM nexora_msg.messages WHERE chat_id = $1), 0)
     WHERE chat_id = $1`,
    [C.team]
  );

  await q(`UPDATE nexora_msg.users SET last_seen = now() - interval '2 minutes' WHERE id <> $1`, [U.ali]);
  await q(`UPDATE nexora_msg.users SET last_seen = now() WHERE id = $1`, [U.ali]);
}

export const DEMO = { U, C, B };
