import { q, q1 } from "@/lib/db";
import { assertAdmin, assertMember, chatMembers } from "@/lib/queries";
import { HttpError, readJson, str, withUser } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  return withUser(async (user) => {
    await assertMember(id, user.id);
    return { ok: true, members: await chatMembers(id) };
  });
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  return withUser(async (user) => {
    await assertAdmin(id, user.id);
    const body = await readJson(req);
    const ids: string[] = Array.isArray(body.user_ids) ? body.user_ids.slice(0, 100) : [];
    const username = str(body.username, 32).trim().replace(/^@/, "");
    if (username) {
      const found = await q1<any>(`SELECT id FROM nexora_msg.users WHERE username = $1`, [username.toLowerCase()]);
      if (!found) throw new HttpError(404, "کاربری با این نام کاربری پیدا نشد");
      ids.push(found.id);
    }
    if (!ids.length) throw new HttpError(400, "کاربری انتخاب نشده است");
    for (const uid of ids) {
      await q(
        `INSERT INTO nexora_msg.chat_members (chat_id, user_id, role) VALUES ($1,$2,'member')
         ON CONFLICT (chat_id, user_id) DO NOTHING`,
        [id, uid]
      );
    }
    return { ok: true, members: await chatMembers(id) };
  });
}

export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  return withUser(async (user) => {
    const me = await assertMember(id, user.id);
    const body = await readJson(req);
    const targetId = str(body.user_id, 60);
    if (!targetId) throw new HttpError(400, "کاربر مشخص نیست");
    if (targetId !== user.id && me.role !== "owner" && me.role !== "admin")
      throw new HttpError(403, "دسترسی ندارید");
    await q(`DELETE FROM nexora_msg.chat_members WHERE chat_id = $1 AND user_id = $2`, [id, targetId]);
    return { ok: true, members: await chatMembers(id) };
  });
}
