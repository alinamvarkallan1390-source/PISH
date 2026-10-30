import { q, q1 } from "@/lib/db";
import { HttpError, readJson, str, withUser } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

async function ownBot(id: string, userId: string) {
  const bot = await q1<any>(`SELECT * FROM nexora_msg.bots WHERE id = $1`, [id]);
  if (!bot) throw new HttpError(404, "ربات پیدا نشد");
  if (bot.owner_id !== userId) throw new HttpError(403, "این ربات متعلق به شما نیست");
  return bot;
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  return withUser(async (user) => {
    await ownBot(id, user.id);
    const body = await readJson(req);
    const commands = Array.isArray(body.commands) ? body.commands.slice(0, 30) : null;
    await q(
      `UPDATE nexora_msg.bots SET
         name = COALESCE(NULLIF($2,''), name),
         description = COALESCE($3, description),
         about = COALESCE($4, about),
         webhook_url = COALESCE($5, webhook_url),
         webhook_secret = COALESCE($6, webhook_secret),
         commands = COALESCE($7::jsonb, commands)
       WHERE id = $1`,
      [
        id,
        str(body.name, 40),
        body.description === undefined ? null : str(body.description, 200),
        body.about === undefined ? null : str(body.about, 120),
        body.webhook_url === undefined ? null : str(body.webhook_url, 300) || null,
        body.webhook_secret === undefined ? null : str(body.webhook_secret, 120) || null,
        commands ? JSON.stringify(commands) : null,
      ]
    );
    const bot = await q1<any>(`SELECT * FROM nexora_msg.bots WHERE id = $1`, [id]);
    return { ok: true, bot };
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  return withUser(async (user) => {
    const bot = await ownBot(id, user.id);
    if (bot.is_builtin) throw new HttpError(403, "ربات‌های رسمی قابل حذف نیستند");
    await q(`DELETE FROM nexora_msg.chats WHERE bot_id = $1`, [id]);
    await q(`DELETE FROM nexora_msg.bot_updates WHERE bot_id = $1`, [id]);
    await q(`DELETE FROM nexora_msg.bots WHERE id = $1`, [id]);
    return { ok: true };
  });
}
