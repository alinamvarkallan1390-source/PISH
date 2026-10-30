import { q, q1 } from "@/lib/db";
import { assertMember, getMessage } from "@/lib/queries";
import { HttpError, readJson, str, withUser } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

async function loadMessage(id: string) {
  const msg = await q1<any>(`SELECT * FROM nexora_msg.messages WHERE id = $1`, [id]);
  if (!msg) throw new HttpError(404, "پیام پیدا نشد");
  return msg;
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  return withUser(async (user) => {
    const msg = await loadMessage(id);
    if (msg.sender_id !== user.id) throw new HttpError(403, "فقط فرستنده می‌تواند پیام را ویرایش کند");
    await assertMember(msg.chat_id, user.id);
    const body = await readJson(req);
    const text = str(body.text, 8000);
    if (!text.trim()) throw new HttpError(400, "متن پیام خالی است");
    await q(`UPDATE nexora_msg.messages SET text = $2, edited_at = now() WHERE id = $1`, [id, text]);
    return { ok: true, message: await getMessage(id, user.id) };
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  return withUser(async (user) => {
    const msg = await loadMessage(id);
    const member = await assertMember(msg.chat_id, user.id);
    const isAdmin = member.role === "owner" || member.role === "admin";
    if (msg.sender_id !== user.id && !isAdmin)
      throw new HttpError(403, "اجازهٔ حذف این پیام را ندارید");
    await q(`UPDATE nexora_msg.messages SET deleted = true, text = '' WHERE id = $1`, [id]);
    return { ok: true };
  });
}
