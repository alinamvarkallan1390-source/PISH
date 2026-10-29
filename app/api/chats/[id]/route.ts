import { q, q1 } from "@/lib/db";
import { assertAdmin, assertMember, chatById, chatDetail, chatMembers } from "@/lib/queries";
import { readJson, str, withUser } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  return withUser(async (user) => {
    await assertMember(id, user.id);
    const detail = await chatDetail(id, user.id);
    if (detail.type === "private" && detail.peer) {
      const peerRow = await q1<any>(
        `SELECT last_read_seq::text AS seq FROM nexora.chat_members WHERE chat_id = $1 AND user_id = $2`,
        [id, detail.peer.id]
      );
      (detail as any).peer_read_seq = Number(peerRow?.seq ?? 0);
    }
    return { ok: true, chat: detail };
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  return withUser(async (user) => {
    const chat = await chatById(id);
    const body = await readJson(req);

    if (body.action === "pin" || body.action === "unpin") {
      await assertMember(id, user.id);
      await q(`UPDATE nexora.chat_members SET pinned = $3 WHERE chat_id = $1 AND user_id = $2`, [
        id,
        user.id,
        body.action === "pin",
      ]);
      return { ok: true };
    }
    if (body.action === "mute" || body.action === "unmute") {
      await assertMember(id, user.id);
      await q(`UPDATE nexora.chat_members SET muted = $3 WHERE chat_id = $1 AND user_id = $2`, [
        id,
        user.id,
        body.action === "mute",
      ]);
      return { ok: true };
    }

    if (chat.type === "group" || chat.type === "channel") {
      await assertAdmin(id, user.id);
      await q(
        `UPDATE nexora.chats SET
           title = COALESCE(NULLIF($2,''), title),
           bio = COALESCE($3, bio),
           avatar_emoji = COALESCE(NULLIF($4,''), avatar_emoji),
           avatar_color = COALESCE(NULLIF($5,''), avatar_color)
         WHERE id = $1`,
        [id, str(body.title, 80), body.bio === undefined ? null : str(body.bio, 200), str(body.avatar_emoji, 8), str(body.avatar_color, 16)]
      );
    }
    return { ok: true, chat: await chatById(id) };
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  return withUser(async (user) => {
    const member = await assertMember(id, user.id);
    const chat = await chatById(id);
    if (chat.type === "private") {
      await q(`DELETE FROM nexora.chat_members WHERE chat_id = $1 AND user_id = $2`, [id, user.id]);
      return { ok: true };
    }
    if (member.role === "owner") {
      await q(`DELETE FROM nexora.chats WHERE id = $1`, [id]);
      return { ok: true, deleted: true };
    }
    await q(`DELETE FROM nexora.chat_members WHERE chat_id = $1 AND user_id = $2`, [id, user.id]);
    return { ok: true };
  });
}
