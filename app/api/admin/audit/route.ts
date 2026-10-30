import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin";
import { ensureReady } from "@/lib/bootstrap";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  await ensureReady();
  const rows = await q<any>(
    `SELECT id, actor, action, target, meta, created_at
       FROM nexora_msg.audit_log ORDER BY id DESC LIMIT 80`
  );
  return NextResponse.json({ ok: true, logs: rows });
}
