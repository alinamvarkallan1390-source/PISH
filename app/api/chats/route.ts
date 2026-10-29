import { q } from "@/lib/db";
import { listChats, createChat, openPrivateChat } from "@/lib/queries";
import { readJson, str, withUser, HttpError } from "@/lib/http";

export async function GET() {
  return withUser(async (user) => ({ ok: true, chats: await listChats(user.id) }));
}

export async function POST(req: Request) {
  return withUser(async (user) => {
    const body = await readJson(req);
    const type = body.type;

    if (type === "private") {
      const targetId = str(body.user_id, 60);
      if (!targetId) throw new HttpError(400, "کاربر مقصد مشخص نیست");
      if (targetId === user.id) throw new HttpError(400, "نمی‌توانید با خودتان گفتگو کنید");
      const chat = await openPrivateChat(user.id, targetId);
      return { ok: true, chat };
    }

    if (type !== "group" && type !== "channel") throw new HttpError(400, "نوع گفتگو نامعتبر است");

    const title = str(body.title, 80).trim();
    if (title.length < 2) throw new HttpError(400, "نام گفتگو باید حداقل ۲ کاراکتر باشد");

    const username = str(body.username, 32).trim().replace(/^@/, "").toLowerCase() || null;
    if (username) {
      if (!/^[a-z0-9_]{4,32}$/.test(username))
        throw new HttpError(400, "آیدی عمومی باید ۴ تا ۳۲ کاراکتر انگلیسی باشد");
      const taken = await q(`SELECT 1 FROM nexora_msg.chats WHERE username = $1`, [username]);
      if (taken.length) throw new HttpError(409, "این آیدی عمومی قبلاً استفاده شده است");
    }

    const memberIds: string[] = Array.isArray(body.member_ids) ? body.member_ids.slice(0, 200) : [];
    const chat = await createChat({
      type,
      title,
      username,
      bio: str(body.bio, 200),
      avatarEmoji: str(body.avatar_emoji, 8) || (type === "channel" ? "📣" : "👥"),
      avatarColor: str(body.avatar_color, 16) || "#8b5cf6",
      ownerId: user.id,
      memberIds,
      isPublic: !!username,
    });
    return { ok: true, chat };
  });
}
