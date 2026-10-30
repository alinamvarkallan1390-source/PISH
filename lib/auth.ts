import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "node:crypto";
import { cookies } from "next/headers";

const SECRET =
  process.env.NEXORA_SECRET ||
  process.env.DATABASE_URL?.slice(-24) ||
  "nexora-dev-secret-key-2026";

const COOKIE = "nx_session";
const TTL_DAYS = 30;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `sc1$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [tag, salt, hash] = stored.split("$");
    if (tag !== "sc1" || !salt || !hash) return false;
    const calc = scryptSync(password, salt, 32);
    const known = Buffer.from(hash, "hex");
    return calc.length === known.length && timingSafeEqual(calc, known);
  } catch {
    return false;
  }
}

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function makeToken(userId: string): string {
  const exp = Date.now() + TTL_DAYS * 864e5;
  const payload = Buffer.from(JSON.stringify({ u: userId, e: exp })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readToken(token?: string | null): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (sign(payload) !== sig) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!data?.u || !data?.e || data.e < Date.now()) return null;
    return data.u as string;
  } catch {
    return null;
  }
}

export function sessionCookie(token: string) {
  return {
    name: COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_DAYS * 86400,
  };
}

export const SESSION_COOKIE = COOKIE;

export async function currentUserId(): Promise<string | null> {
  const store = await cookies();
  return readToken(store.get(COOKIE)?.value);
}
