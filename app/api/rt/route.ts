import { listChats, messagesFor, assertMember, chatById } from "@/lib/queries";
import { num, withUser } from "@/lib/http";

/** Single lightweight realtime endpoint: chat list + new messages since a sequence. */
export async function GET(req: Request) {
  return withUser(async (user) => {
    const url = new URL(req.url);
    const chatId = url.searchParams.get("chatId");
    const afterSeq = num(url.searchParams.get("afterSeq"), 0);
    const chats = await listChats(user.id);

    let messages: any[] = [];
    let peerReadSeq = 0;
    let typing: string[] = [];
    if (chatId) {
      try {
        await assertMember(chatId, user.id);
        if (afterSeq > 0) {
          messages = await messagesFor(chatId, user.id, { afterSeq, limit: 100 });
        }
        // always refresh the tail so edits, deletes and reactions stay in sync
        const tail = await messagesFor(chatId, user.id, { limit: 15 });
        const known = new Set(messages.map((m: any) => m.id));
        for (const m of tail) if (!known.has(m.id)) messages.push(m);
        const chat = await chatById(chatId);
        if (chat.type === "private") {
          const { q1 } = await import("@/lib/db");
          const peer = await q1<any>(
            `SELECT last_read_seq::text AS s FROM nexora.chat_members WHERE chat_id = $1 AND user_id <> $2 LIMIT 1`,
            [chatId, user.id]
          );
          peerReadSeq = Number(peer?.s ?? 0);
        }
        const row = chats.find((c) => c.id === chatId);
        typing = (row?.typing || []).map((t: any) => t.display_name);
      } catch {
        messages = [];
      }
    }

    return { ok: true, chats, messages, peerReadSeq, typing, serverTime: Date.now() };
  });
}
