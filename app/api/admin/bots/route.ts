import { NextResponse } from "next/server";
import { audit, guardAdmin } from "@/lib/admin";
import { ensureReady } from "@/lib/bootstrap";
import { q, q1 } from "@/lib/db";
import { readJson, str } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  await ensureReady();
  const rows = await q<any>(
    `SELECT b.id, b.username, b.name, b.description, b.is_builtin, b.webhook_url, b.created_at,
            b.token, b.commands,
            u.username AS owner_username,
            (SELECT count(*)::int FROM nexora_msg.bot_members bm WHERE bm.bot_id = b.id) AS groups,
            (SELECT count(*)::int FROM nexora_msg.messages m WHERE m.sender_bot_id = b.id) AS sent
       FROM nexora_msg.bots b
       LEFT JOIN nexora_msg.users u ON u.id = b.owner_id
      ORDER BY b.created_at DESC LIMIT 300`
  );
  return NextResponse.json({ ok: true, bots: rows });
}

export async function PATCH(req: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  await ensureReady();
  const body = await readJson(req);
  const id = str(body.id, 60);
  const action = str(body.action, 30);
  const bot = await q1<any>(`SELECT * FROM nexora_msg.bots WHERE id = $1`, [id]);
  if (!bot) return NextResponse.json({ ok: false, error: "ربات پیدا نشد" }, { status: 404 });

  if (action === "revoke_webhook") {
    await q(`UPDATE nexora_msg.bots SET webhook_url = NULL, webhook_secret = NULL WHERE id = $1`, [id]);
  } else if (action === "rotate_token") {
    const head = String(Math.floor(Math.random() * 9e9) + 1e9);
    const body2 = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"[b % 64])
      .join("");
    await q(`UPDATE nexora_msg.bots SET token = $2 WHERE id = $1`, [id, `${head}:AAH${body2}`]);
  } else {
    return NextResponse.json({ ok: false, error: "عملیات نامعتبر" }, { status: 400 });
  }

  await audit(`bot.${action}`, id, { username: bot.username });
  const fresh = await q1<any>(`SELECT id, token, webhook_url FROM nexora_msg.bots WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true, bot: fresh });
}

export async function DELETE(req: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  await ensureReady();
  const url = new URL(req.url);
  const id = str(url.searchParams.get("id"), 60);
  const bot = await q1<any>(`SELECT * FROM nexora_msg.bots WHERE id = $1`, [id]);
  if (!bot) return NextResponse.json({ ok: false, error: "ربات پیدا نشد" }, { status: 404 });
  await q(`DELETE FROM nexora_msg.chats WHERE bot_id = $1`, [id]);
  await q(`DELETE FROM nexora_msg.bot_updates WHERE bot_id = $1`, [id]);
  await q(`DELETE FROM nexora_msg.bot_members WHERE bot_id = $1`, [id]);
  await q(`DELETE FROM nexora_msg.bots WHERE id = $1`, [id]);
  await audit("bot.delete", id, { username: bot.username });
  return NextResponse.json({ ok: true });
}
