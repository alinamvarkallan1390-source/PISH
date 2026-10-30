import { NextResponse } from "next/server";
import { audit, guardAdmin } from "@/lib/admin";
import { ensureReady, getSettings } from "@/lib/bootstrap";
import { q } from "@/lib/db";
import { readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

const ALLOWED: Record<string, "bool" | "number" | "text"> = {
  app_name: "text",
  registration_open: "bool",
  maintenance_mode: "bool",
  maintenance_text: "text",
  welcome_message: "text",
  max_upload_mb: "number",
  max_message_length: "number",
  polls_enabled: "bool",
  media_enabled: "bool",
};

export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  await ensureReady();
  return NextResponse.json({ ok: true, settings: await getSettings() });
}

export async function PATCH(req: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  await ensureReady();
  const body = await readJson(req);
  const patch = body?.settings && typeof body.settings === "object" ? body.settings : body;
  const applied: Record<string, any> = {};

  for (const [key, type] of Object.entries(ALLOWED)) {
    if (!(key in patch)) continue;
    let value = patch[key];
    if (type === "bool") value = !!value;
    else if (type === "number") value = Math.max(0, Number(value) || 0);
    else value = String(value ?? "").slice(0, 600);
    await q(
      `INSERT INTO nexora_msg.settings (key, value, updated_at) VALUES ($1, $2::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [key, JSON.stringify(value)]
    );
    applied[key] = value;
  }

  await audit("settings.update", null, applied);
  return NextResponse.json({ ok: true, settings: await getSettings() });
}
