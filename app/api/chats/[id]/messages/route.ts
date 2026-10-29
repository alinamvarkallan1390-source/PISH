import { assertMember, messagesFor } from "@/lib/queries";
import { sendMessage } from "@/lib/messaging";
import { HttpError, num, readJson, str, withUser } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  return withUser(async (user) => {
    await assertMember(id, user.id);
    const url = new URL(req.url);
    const afterSeq = num(url.searchParams.get("after"), 0);
    const beforeSeq = num(url.searchParams.get("before"), 0);
    const limit = num(url.searchParams.get("limit"), 40);
    const query = str(url.searchParams.get("q"), 80).trim();
    const messages = await messagesFor(id, user.id, {
      afterSeq: afterSeq || undefined,
      beforeSeq: beforeSeq || undefined,
      limit,
      query: query || undefined,
    });
    return { ok: true, messages, hasMore: messages.length >= limit };
  });
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  return withUser(async (user) => {
    const member = await assertMember(id, user.id);
    const body = await readJson(req);

    const chat = await (await import("@/lib/queries")).chatById(id);
    if (chat.type === "channel" && member.role === "member")
      throw new HttpError(403, "فقط مدیران کانال می‌توانند پیام بفرستند");

    const kind = ["text", "photo", "voice", "file", "sticker", "video", "audio"].includes(body.kind)
      ? body.kind
      : "text";

    const message = await sendMessage({
      chatId: id,
      senderId: user.id,
      text: str(body.text, 8000),
      kind,
      mediaId: str(body.media_id, 60) || null,
      replyToId: str(body.reply_to_id, 60) || null,
      meta: body.meta && typeof body.meta === "object" ? body.meta : {},
    });
    return { ok: true, message };
  });
}
