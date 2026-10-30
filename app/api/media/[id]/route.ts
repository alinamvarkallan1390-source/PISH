import { q1 } from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  await ensureReady();
  const row = await q1<any>(`SELECT mime, name, data FROM nexora_msg.media WHERE id = $1`, [id]);
  if (!row) return new Response("not found", { status: 404 });

  let data: any = row.data;
  if (typeof data === "string" && !data.startsWith("\\x")) {
    // some drivers return bytea as a plain string
    data = Buffer.from(data, "utf8");
  } else if (typeof data === "string") {
    data = Buffer.from(data.slice(2), "hex");
  } else if (data && data.type === "Buffer" && Array.isArray(data.data)) {
    data = Buffer.from(data.data);
  }

  return new Response(data, {
    headers: {
      "content-type": row.mime || "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
      "content-disposition": `inline; filename="${encodeURIComponent(row.name || "file")}"`,
    },
  });
}
