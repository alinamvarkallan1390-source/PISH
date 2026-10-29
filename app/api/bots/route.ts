import { q, q1 } from "@/lib/db";
import { HttpError, readJson, str, withUser } from "@/lib/http";
import { openBotChat } from "@/lib/queries";

function makeToken() {
  const head = String(Math.floor(Math.random() * 9e9) + 1e9);
  const body = Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"[b % 64])
    .join("");
  return `${head}:AAH${body}`;
}

export async function GET() {
  return withUser(async (user) => {
    const bots = await q<any>(
      `SELECT id, username, name, token, description, about, webhook_url, commands, is_builtin, created_at
         FROM nexora_msg.bots WHERE owner_id = $1 OR is_builtin = true
        ORDER BY is_builtin DESC, created_at DESC`,
      [user.id]
    );
    return {
      ok: true,
      bots: bots.map((b) => ({ ...b, mine: b.is_builtin ? false : true })),
    };
  });
}

export async function POST(req: Request) {
  return withUser(async (user) => {
    const body = await readJson(req);
    const name = str(body.name, 40).trim();
    let username = str(body.username, 32).trim().replace(/^@/, "").toLowerCase();
    if (name.length < 2) throw new HttpError(400, "نام ربات باید حداقل ۲ کاراکتر باشد");
    if (!username) username = "nexora_" + Math.random().toString(36).slice(2, 8) + "_bot";
    if (!username.endsWith("bot")) username += "_bot";
    if (!/^[a-z0-9_]{4,32}$/.test(username))
      throw new HttpError(400, "آیدی ربات فقط حروف انگلیسی، عدد و _ (۴ تا ۳۲ کاراکتر)");
    if (await q1(`SELECT 1 FROM nexora_msg.bots WHERE username = $1`, [username]))
      throw new HttpError(409, "این آیدی ربات قبلاً گرفته شده است");
    if (await q1(`SELECT 1 FROM nexora_msg.users WHERE username = $1`, [username]))
      throw new HttpError(409, "این آیدی برای یک کاربر ثبت شده است");

    const id = crypto.randomUUID();
    const token = makeToken();
    await q(
      `INSERT INTO nexora_msg.bots (id, owner_id, username, name, token, description, about, commands)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        id,
        user.id,
        username,
        name,
        token,
        str(body.description, 200) || "یک ربات ساخته‌شده با Nexora Bot API",
        str(body.about, 120),
        JSON.stringify([
          { command: "start", description: "شروع کار با ربات" },
          { command: "help", description: "راهنما" },
        ]),
      ]
    );
    const chat = await openBotChat(user.id, id);
    return { ok: true, bot: { id, username, name, token }, chat_id: chat.id };
  });
}
