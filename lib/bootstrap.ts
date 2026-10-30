import { db, q, q1 } from "./db";
import { SCHEMA_STATEMENTS } from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __nexoraBoot: Promise<void> | undefined;
}

export const OFFICIAL_BOTS = {
  nexora_bot: "bbbbbbbb-0000-4000-8000-000000000001",
  echo_bot: "bbbbbbbb-0000-4000-8000-000000000002",
};

const SEED_BOTS = [
  {
    id: OFFICIAL_BOTS.nexora_bot,
    username: "nexora_bot",
    name: "دستیار نکسورا",
    token: "7000000001:AAH-nexora-assistant-builtin-demo-token",
    description: "دستیار رسمی نکسورا · با /help شروع کن",
    about: "دستیار هوشمند پلتفرم نکسورا",
    commands: [
      { command: "start", description: "شروع کار با ربات" },
      { command: "help", description: "راهنمای دستورات" },
      { command: "stats", description: "آمار زنده نکسورا" },
      { command: "time", description: "ساعت و تاریخ" },
    ],
  },
  {
    id: OFFICIAL_BOTS.echo_bot,
    username: "echo_bot",
    name: "ربات اکو",
    token: "7000000002:AAH-nexora-echo-builtin-demo-token",
    description: "هر چیزی بفرستی، همان را پس می‌دهد",
    about: "نمونهٔ ساده از قدرت Nexora Bot API",
    commands: [{ command: "start", description: "شروع" }],
  },
];

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
        console.error("[nexora] schema error:", err?.message?.slice(0, 200));
      }
    }
  }
  await ensureBots();
  await ensureSettings();
  await purgeLegacyDemo();
  await purgeOrphansOnce();
}

/** One-time removal of chats/messages left behind by the v1 demo accounts. */
async function purgeOrphansOnce() {
  try {
    const done = await q1<any>(`SELECT value FROM nexora_msg.settings WHERE key = 'orphans_purged_v2'`);
    if (done?.value === true) return;
    const chats = await q<any>(
      `DELETE FROM nexora_msg.chats c
        WHERE NOT EXISTS (SELECT 1 FROM nexora_msg.chat_members m WHERE m.chat_id = c.id)
        RETURNING c.id`
    );
    const msgs = await q<any>(
      `DELETE FROM nexora_msg.messages m
        WHERE NOT EXISTS (SELECT 1 FROM nexora_msg.chats c WHERE c.id = m.chat_id)
        RETURNING m.id`
    );
    await q(
      `INSERT INTO nexora_msg.settings (key, value, updated_at) VALUES ('orphans_purged_v2','true'::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET value = 'true'::jsonb, updated_at = now()`
    );
    console.log(`[nexora] orphans purged: ${chats.length} chats, ${msgs.length} messages`);
  } catch (err: any) {
    console.error("[nexora] purge orphans:", err?.message);
  }
}

/**
 * One-time cleanup of the demo directory that v1 seeded
 * (ali/sara/reza/mina + the default "team" group and official channel).
 * Runs exactly once, tracked by a settings flag.
 */
async function purgeLegacyDemo() {
  try {
    const done = await q1<any>(
      `SELECT value FROM nexora_msg.settings WHERE key = 'legacy_demo_purged'`
    );
    if (done?.value === true) return;

    const demoChatIds = [
      "aaaaaaaa-0000-4000-8000-000000000001",
      "aaaaaaaa-0000-4000-8000-000000000002",
      "aaaaaaaa-0000-4000-8000-000000000003",
      "aaaaaaaa-0000-4000-8000-000000000004",
      "aaaaaaaa-0000-4000-8000-000000000005",
    ];
    const demoUserIds = [
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
      "33333333-3333-4333-8333-333333333333",
      "44444444-4444-4444-8444-444444444444",
      "55555555-5555-4555-8555-555555555555",
    ];
    const demoUsernames = ["ali", "sara", "reza", "mina", "demo", "niaz"];

    await q(`DELETE FROM nexora_msg.chats WHERE id = ANY($1::uuid[])`, [demoChatIds]);
    await q(
      `DELETE FROM nexora_msg.chats WHERE COALESCE(username,'') IN ('nexora','nexora_team') AND id <> ALL($1::uuid[])`,
      [demoChatIds]
    );
    await q(`DELETE FROM nexora_msg.chat_members WHERE user_id = ANY($1::uuid[])`, [demoUserIds]);
    await q(`DELETE FROM nexora_msg.messages WHERE sender_id = ANY($1::uuid[])`, [demoUserIds]);
    await q(
      `DELETE FROM nexora_msg.users WHERE id = ANY($1::uuid[]) OR username = ANY($2::text[])`,
      [demoUserIds, demoUsernames]
    );

    await q(
      `INSERT INTO nexora_msg.settings (key, value, updated_at) VALUES ('legacy_demo_purged','true'::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET value = 'true'::jsonb, updated_at = now()`
    );

    console.log("[nexora] legacy demo data purged");
  } catch (err: any) {
    console.error("[nexora] purge legacy demo:", err?.message);
  }
}

/**
 * Only the official bot directory is seeded — no demo users, no default chats,
 * no default channels. A fresh install starts completely empty.
 */
async function ensureBots() {
  for (const b of SEED_BOTS) {
    await q(
      `INSERT INTO nexora_msg.bots (id, owner_id, username, name, token, description, about, commands, is_builtin)
       VALUES ($1, NULL, $2, $3, $4, $5, $6, $7::jsonb, true)
       ON CONFLICT (id) DO NOTHING`,
      [b.id, b.username, b.name, b.token, b.description, b.about, JSON.stringify(b.commands)]
    );
  }
}

const DEFAULT_SETTINGS: Record<string, any> = {
  app_name: "نکسورا",
  registration_open: true,
  maintenance_mode: false,
  maintenance_text: "نکسورا در حال به‌روزرسانی است. چند دقیقهٔ دیگر برمی‌گردیم ✨",
  welcome_message: "",
  max_upload_mb: 4,
  max_message_length: 8000,
  polls_enabled: true,
  media_enabled: true,
};

async function ensureSettings() {
  try {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      await q(
        `INSERT INTO nexora_msg.settings (key, value) VALUES ($1, $2::jsonb)
         ON CONFLICT (key) DO NOTHING`,
        [key, JSON.stringify(value)]
      );
    }
  } catch (err) {
    console.error("[nexora] settings seed", err);
  }
}

export async function getSettings(): Promise<Record<string, any>> {
  const rows = await q<any>(`SELECT key, value FROM nexora_msg.settings`);
  const out: Record<string, any> = { ...DEFAULT_SETTINGS };
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export async function getSetting<T = any>(key: string): Promise<T> {
  const row = await q1<any>(`SELECT value FROM nexora_msg.settings WHERE key = $1`, [key]);
  return (row?.value ?? DEFAULT_SETTINGS[key]) as T;
}
