import { NextResponse } from "next/server";
import { audit, guardAdmin } from "@/lib/admin";
import { ensureReady } from "@/lib/bootstrap";
import { q } from "@/lib/db";
import { readJson, str } from "@/lib/http";
import { sendMessage } from "@/lib/messaging";

export const dynamic = "force-dynamic";

/** Broadcast: delivers a platform message to every chat (or one chat). */
export async function POST(req: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  await ensureReady();
  const body = await readJson(req);
  const text = str(body.text, 4000).trim();
  const chatId = str(body.chat_id, 60);
  if (text.length < 1) return NextResponse.json({ ok: false, error: "متن پیام خالی است" }, { status: 400 });

  const targets = chatId
    ? [{ id: chatId }]
    : await q<any>(
        `SELECT DISTINCT c.id FROM nexora_msg.chats c
          JOIN nexora_msg.chat_members m ON m.chat_id = c.id
         WHERE c.type IN ('private','group','channel','saved')
         ORDER BY c.id`
      );

  let delivered = 0;
  for (const t of targets) {
    try {
      await sendMessage({
        chatId: t.id,
        text,
        kind: "text",
        meta: { system: true, broadcast: true },
      });
      delivered++;
    } catch {
      /* skip broken chats */
    }
  }
  await audit("system.broadcast", chatId || "all", { delivered, length: text.length });
  return NextResponse.json({ ok: true, delivered, total: targets.length });
}
