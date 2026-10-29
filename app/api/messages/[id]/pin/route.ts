import { q, q1 } from "@/lib/db";
import { assertMember } from "@/lib/queries";
import { HttpError, withUser } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  return withUser(async (user) => {
    const msg = await q1<any>(`SELECT * FROM nexora.messages WHERE id = $1`, [id]);
    if (!msg) throw new HttpError(404, "پیام پیدا نشد");
    const member = await assertMember(msg.chat_id, user.id);
    await q(`UPDATE nexora.messages SET pinned = NOT pinned WHERE id = $1`, [id]);
    if (member.role === "owner" || member.role === "admin" || msg.sender_id === user.id) {
      return { ok: true, pinned: !msg.pinned };
    }
    throw new HttpError(403, "دسترسی ندارید");
  });
}
