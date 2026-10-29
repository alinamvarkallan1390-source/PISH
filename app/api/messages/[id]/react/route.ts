import { q1 } from "@/lib/db";
import { assertMember } from "@/lib/queries";
import { toggleReaction } from "@/lib/messaging";
import { HttpError, readJson, str, withUser } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  return withUser(async (user) => {
    const msg = await q1<any>(`SELECT chat_id FROM nexora.messages WHERE id = $1`, [id]);
    if (!msg) throw new HttpError(404, "پیام پیدا نشد");
    await assertMember(msg.chat_id, user.id);
    const body = await readJson(req);
    const emoji = str(body.emoji, 8) || "❤️";
    const message = await toggleReaction(id, user.id, emoji);
    return { ok: true, message };
  });
}
