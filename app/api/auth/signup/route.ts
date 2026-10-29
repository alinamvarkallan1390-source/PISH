import { NextResponse } from "next/server";
import { q, q1 } from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";
import { hashPassword, makeToken, sessionCookie } from "@/lib/auth";
import { fail, normalizeUsername, readJson, str, validUsername } from "@/lib/http";

export async function POST(req: Request) {
  try {
    await ensureReady();
    const body = await readJson(req);
    const username = normalizeUsername(body.username);
    const displayName = str(body.displayName, 60).trim() || username;
    const password = str(body.password, 200);

    if (!validUsername(username))
      return fail(400, "نام کاربری باید ۳ تا ۲۴ کاراکتر و شامل حروف انگلیسی، عدد یا _ باشد");
    if (password.length < 6) return fail(400, "رمز عبور باید حداقل ۶ کاراکتر باشد");

    const exists = await q1(`SELECT 1 FROM nexora.users WHERE username = $1`, [username]);
    if (exists) return fail(409, "این نام کاربری قبلاً گرفته شده است");

    const avatars = ["🦊", "🦋", "🐧", "🌙", "🚀", "🐳", "🦉", "🌟", "🔥", "🍀", "🎧", "🧊"];
    const colors = ["#6366f1", "#ec4899", "#22c55e", "#f59e0b", "#06b6d4", "#8b5cf6", "#ef4444"];
    const id = crypto.randomUUID();
    await q(
      `INSERT INTO nexora.users (id, username, display_name, password_hash, avatar_emoji, avatar_color, bio)
       VALUES ($1,$2,$3,$4,$5,$6,'')`,
      [
        id,
        username,
        displayName,
        hashPassword(password),
        avatars[Math.floor(Math.random() * avatars.length)],
        colors[Math.floor(Math.random() * colors.length)],
      ]
    );

    const res = NextResponse.json({ ok: true, user: { id, username, display_name: displayName } });
    res.cookies.set(sessionCookie(makeToken(id)));
    return res;
  } catch (err: any) {
    console.error(err);
    return fail(500, "ثبت‌نام انجام نشد");
  }
}
