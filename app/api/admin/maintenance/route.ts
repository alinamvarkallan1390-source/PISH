import { NextResponse } from "next/server";
import { audit, guardAdmin } from "@/lib/admin";
import { ensureReady } from "@/lib/bootstrap";
import { q, q1 } from "@/lib/db";
import { readJson, str } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Maintenance actions:
 *  - purge_demo: removes legacy demo users/chats seeded by v1
 *  - purge_empty_chats: drops chats that never received a message
 *  - purge_media: deletes orphan media
 */
export async function POST(req: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  await ensureReady();
  const body = await readJson(req);
  const action = str(body.action, 40);
  const report: any = { ok: true, action };

  if (action === "purge_demo") {
    const demoUsers = await q<any>(
      `DELETE FROM nexora_msg.users
        WHERE username IN ('ali','sara','reza','mina','demo','niaz')
        RETURNING id, username`
    );
    const demoChats = await q<any>(
      `DELETE FROM nexora_msg.chats
        WHERE id::text LIKE 'aaaaaaaa-%'
           OR COALESCE(username,'') IN ('nexora','nexora_team')
        RETURNING id`
    );
    const demoBots = await q<any>(
      `DELETE FROM nexora_msg.bots WHERE is_builtin = false RETURNING id`
    );
    report.deleted = {
      users: demoUsers.map((u) => u.username),
      chats: demoChats.length,
      bots: demoBots.length,
    };
  } else if (action === "purge_empty_chats") {
    const rows = await q<any>(
      `DELETE FROM nexora_msg.chats c
        WHERE c.type IN ('private','group','channel')
          AND NOT EXISTS (SELECT 1 FROM nexora_msg.messages m WHERE m.chat_id = c.id)
        RETURNING c.id`
    );
    report.deleted = { chats: rows.length };
  } else if (action === "purge_media") {
    const rows = await q<any>(
      `DELETE FROM nexora_msg.media md
        WHERE NOT EXISTS (SELECT 1 FROM nexora_msg.messages m WHERE m.media_id = md.id)
        RETURNING md.id`
    );
    report.deleted = { media: rows.length };
  } else if (action === "stats") {
    report.stats = await q1<any>(
      `SELECT (SELECT count(*)::int FROM nexora_msg.users) AS users,
              (SELECT count(*)::int FROM nexora_msg.chats) AS chats,
              (SELECT count(*)::int FROM nexora_msg.messages) AS messages,
              (SELECT count(*)::int FROM nexora_msg.media) AS media`
    );
    return NextResponse.json(report);
  } else {
    return NextResponse.json({ ok: false, error: "عملیات نامعتبر" }, { status: 400 });
  }

  await audit(`maintenance.${action}`, null, report.deleted);
  return NextResponse.json(report);
}
