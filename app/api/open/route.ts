import { q, q1 } from "@/lib/db";
import { openBotChat, openPrivateChat, chatDetail } from "@/lib/queries";
import { HttpError, readJson, str, withUser } from "@/lib/http";

/** Opens (or joins) a chat from a @username / public handle / bot username. */
export async function POST(req: Request) {
  return withUser(async (user) => {
    const body = await readJson(req);
    const handle = str(body.handle, 40).trim().replace(/^@/, "").toLowerCase();
    if (!handle) throw new HttpError(400, "آیدی را وارد کنید");

    const bot = await q1<any>(`SELECT * FROM nexora.bots WHERE username = $1`, [handle]);
    if (bot) {
      const chat = await openBotChat(user.id, bot.id);
      return { ok: true, chat_id: chat.id, kind: "bot" };
    }

    const person = await q1<any>(`SELECT * FROM nexora.users WHERE username = $1`, [handle]);
    if (person) {
      if (person.id === user.id) throw new HttpError(400, "این آیدی مربوط به خودتان است");
      const chat = await openPrivateChat(user.id, person.id);
      return { ok: true, chat_id: chat.id, kind: "private" };
    }

    const pub = await q1<any>(
      `SELECT * FROM nexora.chats WHERE username = $1 AND type IN ('group','channel')`,
      [handle]
    );
    if (pub) {
      await q(
        `INSERT INTO nexora.chat_members (chat_id, user_id, role) VALUES ($1,$2,'member')
         ON CONFLICT (chat_id, user_id) DO NOTHING`,
        [pub.id, user.id]
      );
      return { ok: true, chat_id: pub.id, kind: pub.type, joined: true };
    }

    throw new HttpError(404, "چیزی با این آیدی پیدا نشد");
  });
}
