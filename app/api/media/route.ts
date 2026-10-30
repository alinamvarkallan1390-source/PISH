import { q } from "@/lib/db";
import { HttpError, withUser } from "@/lib/http";

const MAX = 4 * 1024 * 1024;

export async function POST(req: Request) {
  return withUser(async (user) => {
    const form = await req.formData().catch(() => null);
    if (!form) throw new HttpError(400, "فرم نامعتبر است");
    const file = form.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "فایلی ارسال نشده است");
    if (file.size > MAX) throw new HttpError(413, "حجم فایل باید کمتر از ۴ مگابایت باشد");

    const buf = Buffer.from(await file.arrayBuffer());
    const id = crypto.randomUUID();
    const mime = file.type || "application/octet-stream";
    await q(
      `INSERT INTO nexora_msg.media (id, owner_id, mime, name, size, data) VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, user.id, mime, file.name || "file", file.size, buf]
    );
    return { ok: true, id, url: `/api/media/${id}`, mime, size: file.size, name: file.name };
  });
}
