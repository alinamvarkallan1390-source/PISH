import { NextResponse } from "next/server";
import { q1 } from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";
import { makeToken, sessionCookie, verifyPassword } from "@/lib/auth";
import { fail, normalizeUsername, readJson, str } from "@/lib/http";
import { ensureOnboarding } from "@/lib/onboarding";

export async function POST(req: Request) {
  try {
    await ensureReady();
    const body = await readJson(req);
    const username = normalizeUsername(body.username);
    const password = str(body.password, 200);
    if (!username || !password) return fail(400, "نام کاربری و رمز عبور لازم است");

    const user = await q1<any>(`SELECT * FROM nexora_msg.users WHERE username = $1`, [username]);
    if (!user || !verifyPassword(password, user.password_hash))
      return fail(401, "نام کاربری یا رمز عبور اشتباه است");

    await q1(`UPDATE nexora_msg.users SET last_seen = now() WHERE id = $1`, [user.id]);
    await ensureOnboarding(user.id);
    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, username: user.username, display_name: user.display_name },
    });
    res.cookies.set(sessionCookie(makeToken(user.id)));
    return res;
  } catch (err: any) {
    console.error(err);
    return fail(500, "ورود انجام نشد");
  }
}
