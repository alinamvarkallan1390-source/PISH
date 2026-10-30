import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Ultra-light liveness probe: no DB, no auth, always fast. */
export async function GET() {
  return NextResponse.json(
    { ok: true, app: "nexora", uptime: process.uptime() },
    { headers: { "cache-control": "no-store" } }
  );
}
