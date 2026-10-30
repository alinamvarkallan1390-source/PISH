import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

function safeNext(raw: string | null): string {
  // only allow local, single-slash paths (no protocol-relative or absolute URLs)
  if (!raw) return "/login";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/login";
  return raw;
}

/** Clears the session cookie and sends the visitor somewhere safe. */
function clearAndGo(next: string, extra: Record<string, string> = {}) {
  const params = new URLSearchParams(extra);
  const location = params.toString() ? `${next}?${params.toString()}` : next;
  // relative Location keeps the original host (no proxy/alias mismatch)
  const res = new NextResponse(null, { status: 303, headers: { location } });
  res.cookies.set({ name: SESSION_COOKIE, value: "", path: "/", maxAge: 0, httpOnly: true, sameSite: "lax" });
  return res;
}

/** Browser navigation friendly: /api/auth/logout?next=/login */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const reason = url.searchParams.get("reason");
  return clearAndGo(safeNext(url.searchParams.get("next")), reason ? { reason } : {});
}

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: SESSION_COOKIE, value: "", path: "/", maxAge: 0 });
  return res;
}
