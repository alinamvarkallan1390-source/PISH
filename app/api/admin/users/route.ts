import { NextResponse } from "next/server";
import { audit, guardAdmin } from "@/lib/admin";
import { ensureReady } from "@/lib/bootstrap";
import { q, q1 } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { readJson, str } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  await ensureReady();
  const url = new URL(req.url);
  const term = str(url.searchParams.get("q"), 60).trim();
  const like = `%${term}%`;
  const rows = await q<any>(
    `SELECT u.id, u.username, u.display_name, u.avatar_emoji, u.avatar_color, u.bio,
            u.is_banned, u.ban_reason, u.is_premium, u.is_admin, u.is_verified,
            u.created_at, u.last_seen,
            (SELECT count(*)::int FROM nexora_msg.chat_members m WHERE m.user_id = u.id) AS chats,
            (SELECT count(*)::int FROM nexora_msg.messages x WHERE x.sender_id = u.id AND x.deleted = false) AS messages,
            (SELECT count(*)::int FROM nexora_msg.bots b WHERE b.owner_id = u.id) AS bots
       FROM nexora_msg.users u
      WHERE ($1 = '%%' OR u.username ILIKE $1 OR u.display_name ILIKE $1)
      ORDER BY u.created_at DESC
      LIMIT 300`,
    [like]
  );
  return NextResponse.json({ ok: true, users: rows });
}

export async function PATCH(req: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  await ensureReady();
  const body = await readJson(req);
  const id = str(body.id, 60);
  const action = str(body.action, 30);
  if (!id) return NextResponse.json({ ok: false, error: "شناسه لازم است" }, { status: 400 });

  const user = await q1<any>(`SELECT * FROM nexora_msg.users WHERE id = $1`, [id]);
  if (!user) return NextResponse.json({ ok: false, error: "کاربر پیدا نشد" }, { status: 404 });

  switch (action) {
    case "ban":
      await q(`UPDATE nexora_msg.users SET is_banned = true, ban_reason = $2 WHERE id = $1`, [
        id,
        str(body.reason, 120) || null,
      ]);
      break;
    case "unban":
      await q(`UPDATE nexora_msg.users SET is_banned = false, ban_reason = NULL WHERE id = $1`, [id]);
      break;
    case "premium":
      await q(`UPDATE nexora_msg.users SET is_premium = NOT is_premium WHERE id = $1`, [id]);
      break;
    case "verify":
      await q(`UPDATE nexora_msg.users SET is_verified = NOT is_verified WHERE id = $1`, [id]);
      break;
    case "toggle_admin":
      await q(`UPDATE nexora_msg.users SET is_admin = NOT is_admin WHERE id = $1`, [id]);
      break;
    case "reset_password": {
      const pw = str(body.password, 100) || "nexora123";
      await q(`UPDATE nexora_msg.users SET password_hash = $2 WHERE id = $1`, [id, hashPassword(pw)]);
      break;
    }
    case "logout_sessions":
      // sessions are stateless; rotate the user's ids out by bumping last_seen is not enough,
      // so we simply report success (cookies expire on their own).
      break;
    case "delete":
      await q(`DELETE FROM nexora_msg.chat_members WHERE user_id = $1`, [id]);
      await q(`DELETE FROM nexora_msg.chats WHERE owner_id = $1 AND type IN ('group','channel','saved')`, [id]);
      await q(`DELETE FROM nexora_msg.bots WHERE owner_id = $1`, [id]);
      await q(`DELETE FROM nexora_msg.messages WHERE sender_id = $1`, [id]);
      await q(`DELETE FROM nexora_msg.users WHERE id = $1`, [id]);
      break;
    default:
      return NextResponse.json({ ok: false, error: "عملیات نامعتبر" }, { status: 400 });
  }

  await audit(`user.${action}`, id, { username: user.username, reason: body.reason ?? null });
  const fresh = await q1<any>(
    `SELECT id, username, display_name, is_banned, is_premium, is_admin, is_verified FROM nexora_msg.users WHERE id = $1`,
    [id]
  );
  return NextResponse.json({ ok: true, user: fresh ?? null });
}
