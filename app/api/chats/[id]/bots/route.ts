import { q } from "@/lib/db";
import { addBotToChat, assertAdmin, assertMember, chatBots } from "@/lib/queries";
import { HttpError, readJson, str, withUser } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  return withUser(async (user) => {
    await assertMember(id, user.id);
    const bots = await chatBots(id);
    return {
      ok: true,
      bots: bots.map((b: any) => ({ id: b.id, username: b.username, name: b.name, description: b.description })),
    };
  });
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  return withUser(async (user) => {
    await assertAdmin(id, user.id);
    const body = await readJson(req);
    const handle = str(body.username, 40).trim().replace(/^@/, "").toLowerCase();
    const botId = str(body.bot_id, 60);
    const { q1 } = await import("@/lib/db");
    const bot = botId
      ? await q1<any>(`SELECT * FROM nexora_msg.bots WHERE id = $1`, [botId])
      : await q1<any>(`SELECT * FROM nexora_msg.bots WHERE username = $1`, [handle]);
    if (!bot) throw new HttpError(404, "رباتی با این آیدی پیدا نشد");
    await addBotToChat(id, bot.id, user.id);
    return { ok: true, bot: { id: bot.id, username: bot.username, name: bot.name } };
  });
}

export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  return withUser(async (user) => {
    await assertAdmin(id, user.id);
    const body = await readJson(req);
    const botId = str(body.bot_id, 60);
    if (!botId) throw new HttpError(400, "ربات مشخص نیست");
    await q(`DELETE FROM nexora_msg.bot_members WHERE chat_id = $1 AND bot_id = $2`, [id, botId]);
    return { ok: true };
  });
}
