import { q1 } from "@/lib/db";
import { assertMember } from "@/lib/queries";
import { sendBotMessage, dispatchBotUpdate } from "@/lib/messaging";
import { builtinReply } from "@/lib/builtinBots";
import { HttpError, readJson, str, withUser } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

/** Handles inline-keyboard button presses on bot messages. */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  return withUser(async (user) => {
    const msg = await q1<any>(`SELECT * FROM nexora_msg.messages WHERE id = $1`, [id]);
    if (!msg) throw new HttpError(404, "پیام پیدا نشد");
    await assertMember(msg.chat_id, user.id);
    const chat = await q1<any>(`SELECT * FROM nexora_msg.chats WHERE id = $1`, [msg.chat_id]);
    const bot = chat?.bot_id ? await q1<any>(`SELECT * FROM nexora_msg.bots WHERE id = $1`, [chat.bot_id]) : null;
    if (!bot) throw new HttpError(400, "این پیام مربوط به ربات نیست");

    const body = await readJson(req);
    const data = str(body.data, 64);
    const label = str(body.label, 64) || data;

    if (bot.is_builtin) {
      if (data === "stats" || data === "time" || data === "newbot") {
        const text =
          data === "stats" ? "/stats" : data === "time" ? "/time" : "چطور ربات بسازم؟";
        await builtinReply(bot, msg.chat_id, text, { id: msg.id, sender_name: user.display_name });
      } else {
        await sendBotMessage({
          botId: bot.id,
          chatId: msg.chat_id,
          text: `✅ دکمهٔ «${label}» انتخاب شد.`,
          replyToId: msg.id,
        });
      }
    } else {
      await dispatchBotUpdate(bot, {
        type: "callback_query",
        chat_id: msg.chat_id,
        from: { id: user.id, username: user.username, display_name: user.display_name },
        data,
        message_id: id,
      });
    }
    return { ok: true };
  });
}
