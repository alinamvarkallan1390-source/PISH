import { NextResponse } from "next/server";
import { audit, guardAdmin } from "@/lib/admin";
import { ensureReady } from "@/lib/bootstrap";
import { q, q1 } from "@/lib/db";
import { str } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  await ensureReady();
  const url = new URL(req.url);
  const type = str(url.searchParams.get("type"), 20);
  const term = str(url.searchParams.get("q"), 60).trim();
  const rows = await q<any>(
    `SELECT c.id, c.type, COALESCE(c.title, 'گفتگو') AS title, c.username, c.avatar_emoji,
            c.avatar_color, c.bio, c.created_at, c.is_public,
            (SELECT count(*)::int FROM nexora_msg.chat_members m WHERE m.chat_id = c.id) AS members,
            (SELECT count(*)::int FROM nexora_msg.messages x WHERE x.chat_id = c.id AND x.deleted = false) AS messages,
            (SELECT json_agg(json_build_object('id', u.id, 'name', u.display_name, 'emoji', u.avatar_emoji, 'role', m.role))
               FROM nexora_msg.chat_members m JOIN nexora_msg.users u ON u.id = m.user_id
              WHERE m.chat_id = c.id) AS member_list,
            (SELECT count(*)::int FROM nexora_msg.bot_members bm WHERE bm.chat_id = c.id) AS bots
       FROM nexora_msg.chats c
      WHERE ($1 = '' OR c.type = $1) AND ($2 = '%%' OR COALESCE(c.title,'') ILIKE $2 OR COALESCE(c.username,'') ILIKE $2)
      ORDER BY c.created_at DESC LIMIT 300`,
    [type, `%${term}%`]
  );
  return NextResponse.json({ ok: true, chats: rows });
}

export async function DELETE(req: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  await ensureReady();
  const url = new URL(req.url);
  const id = str(url.searchParams.get("id"), 60);
  if (!id) return NextResponse.json({ ok: false, error: "شناسه لازم است" }, { status: 400 });
  const chat = await q1<any>(`SELECT title, type FROM nexora_msg.chats WHERE id = $1`, [id]);
  await q(`DELETE FROM nexora_msg.messages WHERE chat_id = $1`, [id]);
  await q(`DELETE FROM nexora_msg.chats WHERE id = $1`, [id]);
  await audit("chat.delete", id, chat ?? {});
  return NextResponse.json({ ok: true });
}
