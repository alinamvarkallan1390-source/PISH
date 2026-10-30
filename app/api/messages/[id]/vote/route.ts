import { q1 } from "@/lib/db";
import { assertMember } from "@/lib/queries";
import { votePoll } from "@/lib/messaging";
import { HttpError, readJson, str, withUser } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  return withUser(async (user) => {
    const msg = await q1<any>(`SELECT chat_id, kind FROM nexora_msg.messages WHERE id = $1`, [id]);
    if (!msg) throw new HttpError(404, "پیام پیدا نشد");
    if (msg.kind !== "poll") throw new HttpError(400, "این پیام نظرسنجی نیست");
    await assertMember(msg.chat_id, user.id);
    const body = await readJson(req);
    const optionId = str(body.option_id, 12);
    if (!optionId) throw new HttpError(400, "گزینه را انتخاب کنید");
    const message = await votePoll(id, user.id, optionId);
    return { ok: true, message };
  });
}
