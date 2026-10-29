import { q } from "@/lib/db";
import { str, withUser } from "@/lib/http";
import { mapMessage } from "@/lib/queries";

export async function GET(req: Request) {
  return withUser(async (user) => {
    const url = new URL(req.url);
    const term = str(url.searchParams.get("q"), 60).trim();
    if (term.length < 1) return { ok: true, users: [], chats: [], bots: [], messages: [] };
    const like = `%${term}%`;

    const users = await q<any>(
      `SELECT id, username, display_name, avatar_emoji, avatar_color, bio, last_seen
         FROM nexora.users
        WHERE (username ILIKE $1 OR display_name ILIKE $1) AND id <> $2
        ORDER BY username LIMIT 12`,
      [like, user.id]
    );

    const chats = await q<any>(
      `SELECT c.id, c.type, c.title, c.username, c.avatar_emoji, c.avatar_color, c.bio,
              (SELECT count(*)::int FROM nexora.chat_members WHERE chat_id = c.id) AS member_count,
              EXISTS(SELECT 1 FROM nexora.chat_members WHERE chat_id = c.id AND user_id = $2) AS joined
         FROM nexora.chats c
        WHERE c.type IN ('group','channel') AND (c.title ILIKE $1 OR c.username ILIKE $1)
        ORDER BY member_count DESC LIMIT 12`,
      [like, user.id]
    );

    const bots = await q<any>(
      `SELECT id, username, name, description FROM nexora.bots
        WHERE username ILIKE $1 OR name ILIKE $1 ORDER BY is_builtin DESC LIMIT 12`,
      [like]
    );

    const rows = await q<any>(
      `SELECT m.*,
              COALESCE(u.display_name, b.name, 'کاربر') AS sender_name,
              u.username AS sender_username, u.avatar_emoji AS sender_emoji,
              u.avatar_color AS sender_color, md.mime AS media_mime, md.name AS media_name,
              c.title AS chat_title, c.type AS chat_type,
              (SELECT json_build_object('id', pu.id, 'display_name', pu.display_name, 'avatar_emoji', pu.avatar_emoji)
                 FROM nexora.chat_members pcm JOIN nexora.users pu ON pu.id = pcm.user_id
                WHERE pcm.chat_id = c.id AND pcm.user_id <> $2 LIMIT 1) AS peer,
              NULL AS reactions, NULL AS reply
         FROM nexora.messages m
         JOIN nexora.chat_members cm ON cm.chat_id = m.chat_id AND cm.user_id = $2
         JOIN nexora.chats c ON c.id = m.chat_id
         LEFT JOIN nexora.users u ON u.id = m.sender_id
         LEFT JOIN nexora.bots b ON b.id = m.sender_bot_id
         LEFT JOIN nexora.media md ON md.id = m.media_id
        WHERE m.deleted = false AND m.text ILIKE $1
        ORDER BY m.seq DESC LIMIT 20`,
      [like, user.id]
    );

    return {
      ok: true,
      users,
      chats,
      bots,
      messages: rows.map((r) => ({
        ...mapMessage(r, user.id),
        chat_title: r.chat_type === "private" ? r.peer?.display_name || "گفتگو" : r.chat_title,
      })),
    };
  });
}
