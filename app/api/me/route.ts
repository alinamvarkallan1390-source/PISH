import { q, q1 } from "@/lib/db";
import { readJson, str, withUser } from "@/lib/http";

export async function GET() {
  return withUser(async (user) => {
    const isPremium = !!user.is_premium;
    return {
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        avatar_emoji: user.avatar_emoji,
        avatar_color: user.avatar_color,
        bio: user.bio,
        phone: user.phone,
        theme: user.theme,
        lang: user.lang,
        is_premium: isPremium,
        last_seen: user.last_seen,
      },
      stats: {
        chats: Number(
          (await q1<any>(`SELECT count(*)::int AS n FROM nexora.chat_members WHERE user_id = $1`, [user.id]))?.n ?? 0
        ),
        bots: Number(
          (await q1<any>(`SELECT count(*)::int AS n FROM nexora.bots WHERE owner_id = $1`, [user.id]))?.n ?? 0
        ),
      },
    };
  });
}

export async function PATCH(req: Request) {
  return withUser(async (user) => {
    const body = await readJson(req);
    const displayName = str(body.display_name, 60).trim();
    const bio = str(body.bio, 200);
    const avatarEmoji = str(body.avatar_emoji, 8);
    const avatarColor = str(body.avatar_color, 16);
    const theme = ["dark", "light", "amoled"].includes(body.theme) ? body.theme : null;
    const phone = body.phone === undefined ? null : str(body.phone, 24);

    await q(
      `UPDATE nexora.users SET
         display_name = COALESCE(NULLIF($2,''), display_name),
         bio = COALESCE($3, bio),
         avatar_emoji = COALESCE(NULLIF($4,''), avatar_emoji),
         avatar_color = COALESCE(NULLIF($5,''), avatar_color),
         theme = COALESCE($6, theme),
         phone = COALESCE($7, phone)
       WHERE id = $1`,
      [user.id, displayName, bio, avatarEmoji, avatarColor, theme, phone]
    );
    const fresh = await q1<any>(`SELECT * FROM nexora.users WHERE id = $1`, [user.id]);
    return { ok: true, user: { ...fresh, password_hash: undefined } };
  });
}
