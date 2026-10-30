import { NextResponse } from "next/server";
import { audit, guardAdmin } from "@/lib/admin";
import { ensureReady } from "@/lib/bootstrap";
import { q } from "@/lib/db";
import { str } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  await ensureReady();
  const url = new URL(req.url);
  const term = str(url.searchParams.get("q"), 80).trim();
  const kind = str(url.searchParams.get("kind"), 20);
  const rows = await q<any>(
    `SELECT m.id, m.text, m.kind, m.deleted, m.created_at, m.chat_id,
            COALESCE(c.title, 'گفتگو') AS chat_title, c.type AS chat_type,
            COALESCE(u.display_name, 'کاربر') AS sender_name, u.username AS sender_username,
            u.avatar_emoji AS sender_emoji, u.avatar_color AS sender_color
       FROM nexora_msg.messages m
       JOIN nexora_msg.chats c ON c.id = m.chat_id
       LEFT JOIN nexora_msg.users u ON u.id = m.sender_id
      WHERE ($1 = '%%' OR m.text ILIKE $1) AND ($2 = '' OR m.kind = $2)
      ORDER BY m.seq DESC LIMIT 100`,
    [`%${term}%`, kind]
  );
  return NextResponse.json({ ok: true, messages: rows });
}

export async function DELETE(req: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  await ensureReady();
  const url = new URL(req.url);
  const id = str(url.searchParams.get("id"), 60);
  if (!id) return NextResponse.json({ ok: false, error: "شناسه لازم است" }, { status: 400 });
  await q(`UPDATE nexora_msg.messages SET deleted = true, text = '' WHERE id = $1`, [id]);
  await audit("message.delete", id);
  return NextResponse.json({ ok: true });
}
