import { q1 } from "@/lib/db";
import { assertMember, chatById } from "@/lib/queries";
import { sendMessage } from "@/lib/messaging";
import { HttpError, readJson, str, withUser } from "@/lib/http";

export async function POST(req: Request) {
  return withUser(async (user) => {
    const body = await readJson(req);
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const messageIds: string[] = (Array.isArray(body.message_ids) ? body.message_ids : [])
      .filter((x: any) => typeof x === "string" && uuid.test(x))
      .slice(0, 20);
    const toIds: string[] = (Array.isArray(body.to_chat_ids) ? body.to_chat_ids : [])
      .filter((x: any) => typeof x === "string" && uuid.test(x))
      .slice(0, 20);
    if (!messageIds.length || !toIds.length) throw new HttpError(400, "پیام یا مقصد مشخص نیست");

    let count = 0;
    for (const toId of toIds) {
      const chat = await chatById(toId);
      const member = await assertMember(toId, user.id);
      if (chat.type === "channel" && member.role === "member") continue;
      for (const mid of messageIds) {
        const src = await q1<any>(`SELECT * FROM nexora_msg.messages WHERE id = $1`, [mid]);
        if (!src || src.deleted) continue;
        await sendMessage({
          chatId: toId,
          senderId: user.id,
          text: src.text,
          kind: src.kind,
          mediaId: src.media_id,
          meta: src.meta,
          forwardFrom: src.sender_id ? "یک کاربر" : "یک ربات",
        });
        count++;
      }
    }
    return { ok: true, forwarded: count };
  });
}
