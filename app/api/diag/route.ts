import { NextResponse } from "next/server";
import { q } from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";

export async function GET() {
  const out: any = { ok: true, steps: [] };
  try {
    await ensureReady();
    out.steps.push("ensureReady:ok");
  } catch (e: any) {
    out.steps.push("ensureReady:fail:" + e?.message);
    out.readyError = e?.message;
  }
  try {
    out.schemas = await q<any>(
      `SELECT schema_name FROM information_schema.schemata ORDER BY schema_name`
    );
    out.tables = await q<any>(
      `SELECT table_schema, table_name FROM information_schema.tables
        WHERE table_schema NOT IN ('pg_catalog','information_schema') ORDER BY 1,2`
    );
    out.columns = await q<any>(
      `SELECT table_schema, table_name, column_name, data_type
         FROM information_schema.columns
        WHERE table_schema = 'nexora' AND table_name IN ('bots','users','chats','messages')
        ORDER BY table_name, ordinal_position`
    );
    out.counts = await q<any>(
      `SELECT (SELECT count(*)::int FROM nexora.users) AS users,
              (SELECT count(*)::int FROM nexora.bots) AS bots`
    ).catch((e: any) => ({ error: e?.message }));
  } catch (e: any) {
    out.error = e?.message;
  }
  return NextResponse.json(out);
}
