import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin";
import { ensureReady, getSettings } from "@/lib/bootstrap";
import { q, q1 } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  await ensureReady();

  const totals = await q1<any>(
    `SELECT (SELECT count(*)::int FROM nexora_msg.users) AS users,
            (SELECT count(*)::int FROM nexora_msg.bots WHERE is_builtin = false) AS bots,
            (SELECT count(*)::int FROM nexora_msg.chats) AS chats,
            (SELECT count(*)::int FROM nexora_msg.messages WHERE deleted = false) AS messages,
            (SELECT count(*)::int FROM nexora_msg.media) AS media,
            (SELECT COALESCE(sum(size),0)::bigint FROM nexora_msg.media) AS media_bytes,
            (SELECT count(*)::int FROM nexora_msg.users WHERE is_banned) AS banned,
            (SELECT count(*)::int FROM nexora_msg.users WHERE last_seen > now() - interval '15 minutes') AS online,
            (SELECT count(*)::int FROM nexora_msg.messages WHERE created_at > now() - interval '24 hours') AS today`
  );

  const series = await q<any>(
    `SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
            (SELECT count(*)::int FROM nexora_msg.messages m
              WHERE m.created_at >= d.day AND m.created_at < d.day + interval '1 day') AS messages,
            (SELECT count(*)::int FROM nexora_msg.users u
              WHERE u.created_at >= d.day AND u.created_at < d.day + interval '1 day') AS users
       FROM generate_series(current_date - interval '6 days', current_date, interval '1 day') AS d(day)
      ORDER BY d.day`
  );

  const recentUsers = await q<any>(
    `SELECT id, username, display_name, avatar_emoji, avatar_color, is_banned, created_at, last_seen
       FROM nexora_msg.users ORDER BY created_at DESC LIMIT 8`
  );

  const recentMessages = await q<any>(
    `SELECT m.id, m.text, m.kind, m.created_at, m.deleted,
            c.type AS chat_type, COALESCE(c.title, 'گفتگو') AS chat_title,
            COALESCE(u.display_name, 'کاربر') AS sender_name, u.avatar_emoji AS sender_emoji
       FROM nexora_msg.messages m
       JOIN nexora_msg.chats c ON c.id = m.chat_id
       LEFT JOIN nexora_msg.users u ON u.id = m.sender_id
      ORDER BY m.seq DESC LIMIT 10`
  );

  const topChats = await q<any>(
    `SELECT c.id, c.type, COALESCE(c.title,'گفتگو') AS title, c.avatar_emoji,
            (SELECT count(*)::int FROM nexora_msg.messages m WHERE m.chat_id = c.id) AS messages,
            (SELECT count(*)::int FROM nexora_msg.chat_members m WHERE m.chat_id = c.id) AS members
       FROM nexora_msg.chats c
      ORDER BY messages DESC LIMIT 6`
  );

  const types = await q<any>(
    `SELECT type, count(*)::int AS n FROM nexora_msg.chats GROUP BY type ORDER BY n DESC`
  );

  return NextResponse.json({
    ok: true,
    totals,
    series,
    recentUsers,
    recentMessages,
    topChats,
    types,
    settings: await getSettings(),
  });
}
