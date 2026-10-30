import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { q } from "./db";

export const ADMIN_COOKIE = "nx_admin";
export const ADMIN_PATH = "/adminn";
const TTL_HOURS = 12;

const SECRET =
  process.env.NEXORA_SECRET ||
  process.env.DATABASE_URL?.slice(-24) ||
  "nexora-dev-secret-key-2026";

export function adminPassword(): string {
  return process.env.NEXORA_ADMIN_PASSWORD || "ali026";
}

function sign(payload: string) {
  return createHmac("sha256", `${SECRET}:admin`).update(payload).digest("base64url");
}

export function makeAdminToken() {
  const payload = Buffer.from(
    JSON.stringify({ a: true, e: Date.now() + TTL_HOURS * 3600_000 })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token?: string | null): boolean {
  try {
    if (!token) return false;
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return false;
    const expected = sign(payload);
    if (
      expected.length !== sig.length ||
      !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
    )
      return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data?.a === true && Number(data?.e) > Date.now();
  } catch {
    return false;
  }
}

export function checkPassword(input: string): boolean {
  const expected = adminPassword();
  const a = Buffer.from(String(input ?? ""));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function adminCookie() {
  return {
    name: ADMIN_COOKIE,
    value: makeAdminToken(),
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_HOURS * 3600,
  };
}

export async function isAdminRequest(): Promise<boolean> {
  const store = await cookies();
  return verifyAdminToken(store.get(ADMIN_COOKIE)?.value);
}

/** Returns a 401 response when the caller is not an authenticated admin. */
export async function guardAdmin(): Promise<NextResponse | null> {
  if (await isAdminRequest()) return null;
  return NextResponse.json({ ok: false, error: "دسترسی ادمین لازم است" }, { status: 401 });
}

export async function audit(action: string, target?: string | null, meta: any = {}) {
  try {
    await q(
      `INSERT INTO nexora_msg.audit_log (actor, action, target, meta) VALUES ('admin', $1, $2, $3::jsonb)`,
      [action, target ?? null, JSON.stringify(meta ?? {})]
    );
  } catch (err) {
    console.error("[nexora] audit", err);
  }
}
