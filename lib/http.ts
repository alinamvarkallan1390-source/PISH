import { NextResponse } from "next/server";
import { currentUserId } from "./auth";
import { q1 } from "./db";
import { ensureReady } from "./bootstrap";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function ok(data: any = { ok: true }, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function withUser<T>(fn: (user: any) => Promise<T>): Promise<Response> {
  try {
    await ensureReady();
    const uid = await currentUserId();
    if (!uid) return fail(401, "برای ادامه وارد شوید");
    const user = await q1<any>(`SELECT * FROM nexora.users WHERE id = $1`, [uid]);
    if (!user) return fail(401, "حساب کاربری یافت نشد");
    await q1(`UPDATE nexora.users SET last_seen = now() WHERE id = $1`, [uid]);
    const result = await fn(user);
    if (result instanceof Response) return result;
    return NextResponse.json(result ?? { ok: true });
  } catch (err: any) {
    if (err instanceof HttpError) return fail(err.status, err.message);
    console.error("[nexora] api error:", err);
    return fail(500, err?.message || "خطای سرور");
  }
}

export async function readJson(req: Request): Promise<any> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export function str(v: any, max = 4000): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

export function normalizeUsername(raw: any): string {
  const u = String(raw ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
  return u;
}

export function validUsername(u: string): boolean {
  return /^[a-z0-9_]{3,24}$/.test(u);
}

export function num(v: any, def = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}
