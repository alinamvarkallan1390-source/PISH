import { NextResponse } from "next/server";
import { q1 } from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";

/** Lightweight health probe (no sensitive structure is exposed). */
export async function GET() {
  const started = Date.now();
  try {
    await ensureReady();
    const stats = await q1<any>(
      `SELECT (SELECT count(*)::int FROM nexora_msg.users) AS users,
              (SELECT count(*)::int FROM nexora_msg.chats) AS chats,
              (SELECT count(*)::int FROM nexora_msg.messages) AS messages,
              (SELECT count(*)::int FROM nexora_msg.bots) AS bots`
    );
    return NextResponse.json({
      ok: true,
      app: "nexora",
      version: "1.0.0",
      db: "connected",
      stats,
      latency_ms: Date.now() - started,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, app: "nexora", db: "error", error: err?.message, latency_ms: Date.now() - started },
      { status: 500 }
    );
  }
}
