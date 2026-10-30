import { NextResponse } from "next/server";
import { adminCookie, audit, checkPassword } from "@/lib/admin";
import { ensureReady } from "@/lib/bootstrap";
import { readJson, str } from "@/lib/http";

export async function POST(req: Request) {
  await ensureReady();
  const body = await readJson(req);
  const password = str(body.password, 200);
  if (!password) return NextResponse.json({ ok: false, error: "رمز عبور را وارد کنید" }, { status: 400 });
  if (!checkPassword(password)) {
    await audit("admin.login_failed");
    return NextResponse.json({ ok: false, error: "رمز عبور اشتباه است" }, { status: 401 });
  }
  await audit("admin.login");
  const res = NextResponse.json({ ok: true });
  res.cookies.set(adminCookie());
  return res;
}
