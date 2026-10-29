import { q, q1 } from "./db";
import { HttpError } from "./http";

export type PublicUser = {
  id: string;
  username: string;
  display_name: string;
  avatar_emoji: string;
  avatar_color: string;
  bio?: string;
  last_seen?: string;
  is_premium?: boolean;
};

export type Reaction = { emoji: string; user_id: string };

export type MessageDTO = {
  id: string;
  seq: number;
  chat_id: string;
  sender_id: string | null;
  sender_bot_id: string | null;
  sender_name: string;
  sender_username: string | null;
  sender_emoji: string;
  sender_color: string;
  is_bot: boolean;
  kind: string;
  text: string;
  media_url: string | null;
  media_mime: string | null;
  media_name: string | null;
  reply: { id: string; text: string; sender_name: string; kind: string } | null;
  forward_from: string | null;
  reactions: Reaction[];
  edited: boolean;
  pinned: boolean;
  deleted: boolean;
  meta: any;
  created_at: string;
  outgoing?: boolean;
};

const MESSAGE_SELECT = `
  SELECT m.id, m.seq::text AS seq, m.chat_id, m.sender_id, m.sender_bot_id,
         m.kind, m.text, m.media_id, m.reply_to_id, m.forward_from,
         m.edited_at, m.deleted, m.pinned, m.meta, m.created_at,
         COALESCE(u.display_name, b.name, 'کاربر نکسورا') AS sender_name,
         u.username AS sender_username,
         u.avatar_emoji AS sender_emoji, u.avatar_color AS sender_color,
         md.mime AS media_mime, md.name AS media_name,
         (SELECT json_agg(json_build_object('emoji', r.emoji, 'user_id', r.user_id))
            FROM nexora_msg.reactions r WHERE r.message_id = m.id) AS reactions,
         (SELECT json_build_object('id', rm.id, 'text', rm.text, 'kind', rm.kind,
                    'sender_name', COALESCE(ru.display_name, rb.name, 'کاربر'))
            FROM nexora_msg.messages rm
            LEFT JOIN nexora_msg.users ru ON ru.id = rm.sender_id
            LEFT JOIN nexora_msg.bots rb ON rb.id = rm.sender_bot_id
           WHERE rm.id = m.reply_to_id) AS reply
    FROM nexora_msg.messages m
    LEFT JOIN nexora_msg.users u ON u.id = m.sender_id
    LEFT JOIN nexora_msg.bots b ON b.id = m.sender_bot_id
    LEFT JOIN nexora_msg.media md ON md.id = m.media_id
`;

export function mapMessage(row: any, meId?: string): MessageDTO {
  const meta = row.meta && typeof row.meta === "object" ? row.meta : {};
  return {
    id: row.id,
    seq: Number(row.seq),
    chat_id: row.chat_id,
    sender_id: row.sender_id,
    sender_bot_id: row.sender_bot_id,
    sender_name: row.sender_name || "کاربر",
    sender_username: row.sender_username || null,
    sender_emoji: row.sender_emoji || "🤖",
    sender_color: row.sender_color || "#6366f1",
    is_bot: !!row.sender_bot_id,
    kind: row.kind,
    text: row.text || "",
    media_url: row.media_id ? `/api/media/${row.media_id}` : null,
    media_mime: row.media_mime || null,
    media_name: row.media_name || null,
    reply: row.reply && row.reply.id ? row.reply : null,
    forward_from: row.forward_from || null,
    reactions: Array.isArray(row.reactions) ? row.reactions.filter(Boolean) : [],
    edited: !!row.edited_at,
    pinned: !!row.pinned,
    deleted: !!row.deleted,
    meta,
    created_at: row.created_at,
    outgoing: meId ? row.sender_id === meId : undefined,
  };
}

export async function assertMember(chatId: string, userId: string) {
  const row = await q1<any>(
    `SELECT * FROM nexora_msg.chat_members WHERE chat_id = $1 AND user_id = $2`,
    [chatId, userId]
  );
  if (!row) throw new HttpError(403, "شما عضو این گفتگو نیستید");
  return row;
}

export async function assertAdmin(chatId: string, userId: string) {
  const row = await assertMember(chatId, userId);
  if (row.role !== "owner" && row.role !== "admin") {
    throw new HttpError(403, "فقط مدیران می‌توانند این کار را انجام دهند");
  }
  return row;
}

export async function chatById(chatId: string) {
  const chat = await q1<any>(`SELECT * FROM nexora_msg.chats WHERE id = $1`, [chatId]);
  if (!chat) throw new HttpError(404, "گفتگو پیدا نشد");
  return chat;
}

export async function chatMembers(chatId: string) {
  return q<any>(
    `SELECT u.id, u.username, u.display_name, u.avatar_emoji, u.avatar_color, u.last_seen, cm.role
       FROM nexora_msg.chat_members cm JOIN nexora_msg.users u ON u.id = cm.user_id
      WHERE cm.chat_id = $1
      ORDER BY CASE cm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, u.display_name`,
    [chatId]
  );
}

export async function listChats(userId: string) {
  const rows = await q<any>(
    `SELECT c.id, c.type, c.title, c.avatar_emoji, c.avatar_color, c.username, c.bio,
            c.owner_id, c.bot_id, c.is_public, c.created_at,
            m.role, m.last_read_seq::text AS last_read_seq, m.muted, m.pinned,
            (SELECT COALESCE(json_build_object(
                       'id', lm.id, 'text', lm.text, 'kind', lm.kind, 'seq', lm.seq::text,
                       'created_at', lm.created_at, 'sender_id', lm.sender_id,
                       'sender_name', COALESCE(lu.display_name, lb.name, ''),
                       'deleted', lm.deleted,
                       'meta', lm.meta
                     ), NULL)
               FROM nexora_msg.messages lm
               LEFT JOIN nexora_msg.users lu ON lu.id = lm.sender_id
               LEFT JOIN nexora_msg.bots lb ON lb.id = lm.sender_bot_id
              WHERE lm.chat_id = c.id AND lm.deleted = false
              ORDER BY lm.seq DESC LIMIT 1) AS last_message,
            (SELECT count(*)::int FROM nexora_msg.messages um
              WHERE um.chat_id = c.id AND um.seq > m.last_read_seq
                AND (um.sender_id IS DISTINCT FROM $1) AND um.deleted = false) AS unread,
            (SELECT count(*)::int FROM nexora_msg.chat_members WHERE chat_id = c.id) AS member_count,
            CASE WHEN c.type = 'private' THEN (
              SELECT json_build_object('id', pu.id, 'username', pu.username, 'display_name', pu.display_name,
                       'avatar_emoji', pu.avatar_emoji, 'avatar_color', pu.avatar_color, 'last_seen', pu.last_seen,
                       'last_read_seq', pcm.last_read_seq::text)
                FROM nexora_msg.chat_members pcm JOIN nexora_msg.users pu ON pu.id = pcm.user_id
               WHERE pcm.chat_id = c.id AND pcm.user_id <> $1 LIMIT 1) END AS peer,
            CASE WHEN c.type = 'bot' THEN (
              SELECT json_build_object('id', b.id, 'username', b.username, 'name', b.name,
                       'description', b.description) FROM nexora_msg.bots b WHERE b.id = c.bot_id) END AS bot,
            (SELECT json_agg(json_build_object('user_id', t.user_id, 'display_name', tu.display_name))
               FROM nexora_msg.typing t JOIN nexora_msg.users tu ON tu.id = t.user_id
              WHERE t.chat_id = c.id AND t.until > now() AND t.user_id <> $1) AS typing
       FROM nexora_msg.chats c
       JOIN nexora_msg.chat_members m ON m.chat_id = c.id AND m.user_id = $1
      ORDER BY m.pinned DESC, COALESCE(
        (SELECT max(lm2.seq) FROM nexora_msg.messages lm2 WHERE lm2.chat_id = c.id), 0) DESC, c.created_at DESC`,
    [userId]
  );

  return rows.map((r) => {
    const peer = r.peer || null;
    const bot = r.bot || null;
    const title =
      r.type === "private"
        ? peer?.display_name || "گفتگوی خصوصی"
        : r.type === "bot"
        ? bot?.name || "ربات"
        : r.title || "گفتگو";
    const emoji = r.type === "private" ? peer?.avatar_emoji || "👤" : r.avatar_emoji;
    const color = r.type === "private" ? peer?.avatar_color || "#6366f1" : r.avatar_color;
    const online =
      r.type === "private" && peer?.last_seen
        ? Date.now() - new Date(peer.last_seen).getTime() < 120000
        : r.type === "bot"
        ? true
        : false;
    return {
      id: r.id,
      type: r.type,
      title,
      avatar_emoji: emoji,
      avatar_color: color,
      username: r.username,
      bio: r.bio,
      bot_id: r.bot_id,
      peer,
      bot,
      role: r.role,
      muted: r.muted,
      pinned: r.pinned,
      unread: Number(r.unread || 0),
      member_count: Number(r.member_count || 0),
      last_read_seq: Number(r.last_read_seq || 0),
      last_message: r.last_message
        ? { ...r.last_message, seq: Number(r.last_message.seq) }
        : null,
      typing: Array.isArray(r.typing) ? r.typing.filter(Boolean) : [],
      online,
      last_seen: peer?.last_seen || null,
    };
  });
}

export async function messagesFor(
  chatId: string,
  meId: string,
  opts: { afterSeq?: number; beforeSeq?: number; limit?: number; query?: string } = {}
) {
  const limit = Math.min(Math.max(opts.limit ?? 40, 1), 100);
  const params: any[] = [chatId];
  let where = `m.chat_id = $1`;
  if (opts.afterSeq) {
    params.push(opts.afterSeq);
    where += ` AND m.seq > $${params.length}`;
  }
  if (opts.beforeSeq) {
    params.push(opts.beforeSeq);
    where += ` AND m.seq < $${params.length}`;
  }
  if (opts.query) {
    params.push(`%${opts.query}%`);
    where += ` AND m.text ILIKE $${params.length}`;
  }
  params.push(limit);
  const rows = await q<any>(
    `${MESSAGE_SELECT} WHERE ${where} ORDER BY m.seq DESC LIMIT $${params.length}`,
    params
  );
  return rows.reverse().map((r) => mapMessage(r, meId));
}

export async function getMessage(id: string, meId?: string) {
  const row = await q1<any>(`${MESSAGE_SELECT} WHERE m.id = $1`, [id]);
  return row ? mapMessage(row, meId) : null;
}

export async function lastSeq(chatId: string): Promise<number> {
  const row = await q1<any>(
    `SELECT COALESCE(max(seq),0)::text AS s FROM nexora_msg.messages WHERE chat_id = $1`,
    [chatId]
  );
  return Number(row?.s ?? 0);
}

export async function createChat(opts: {
  type: "private" | "group" | "channel";
  title?: string;
  username?: string | null;
  bio?: string;
  avatarEmoji?: string;
  avatarColor?: string;
  ownerId: string;
  memberIds: string[];
  isPublic?: boolean;
}) {
  const id = crypto.randomUUID();
  await q(
    `INSERT INTO nexora_msg.chats (id, type, title, avatar_emoji, avatar_color, username, bio, owner_id, is_public)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      id,
      opts.type,
      opts.title ?? null,
      opts.avatarEmoji || (opts.type === "channel" ? "📣" : "👥"),
      opts.avatarColor || "#8b5cf6",
      opts.username || null,
      opts.bio || "",
      opts.ownerId,
      !!opts.isPublic,
    ]
  );
  const members = Array.from(new Set([opts.ownerId, ...opts.memberIds]));
  for (const uid of members) {
    await q(
      `INSERT INTO nexora_msg.chat_members (chat_id, user_id, role) VALUES ($1,$2,$3)
       ON CONFLICT (chat_id, user_id) DO NOTHING`,
      [id, uid, uid === opts.ownerId ? "owner" : "member"]
    );
  }
  return chatById(id);
}

export async function findPrivateChat(a: string, b: string) {
  return q1<any>(
    `SELECT c.* FROM nexora_msg.chats c
      JOIN nexora_msg.chat_members m1 ON m1.chat_id = c.id AND m1.user_id = $1
      JOIN nexora_msg.chat_members m2 ON m2.chat_id = c.id AND m2.user_id = $2
     WHERE c.type = 'private' LIMIT 1`,
    [a, b]
  );
}

export async function openPrivateChat(a: string, b: string) {
  const existing = await findPrivateChat(a, b);
  if (existing) return existing;
  return createChat({ type: "private", ownerId: a, memberIds: [b] });
}

export async function openBotChat(userId: string, botId: string) {
  const existing = await q1<any>(
    `SELECT c.* FROM nexora_msg.chats c
      JOIN nexora_msg.chat_members m ON m.chat_id = c.id AND m.user_id = $1
     WHERE c.type = 'bot' AND c.bot_id = $2 LIMIT 1`,
    [userId, botId]
  );
  if (existing) return existing;
  const bot = await q1<any>(`SELECT * FROM nexora_msg.bots WHERE id = $1`, [botId]);
  if (!bot) throw new HttpError(404, "ربات پیدا نشد");
  const id = crypto.randomUUID();
  await q(
    `INSERT INTO nexora_msg.chats (id, type, title, avatar_emoji, avatar_color, bot_id)
     VALUES ($1,'bot',$2,'🤖','#06b6d4',$3)`,
    [id, bot.name, botId]
  );
  await q(
    `INSERT INTO nexora_msg.chat_members (chat_id, user_id, role) VALUES ($1,$2,'member')`,
    [id, userId]
  );
  return chatById(id);
}

export async function chatDetail(chatId: string, meId: string) {
  const chat = await chatById(chatId);
  const member = await assertMember(chatId, meId);
  const members = await chatMembers(chatId);
  const peer = chat.type === "private" ? members.find((m: any) => m.id !== meId) : null;
  const bot =
    chat.type === "bot"
      ? await q1<any>(`SELECT id, username, name, description, about FROM nexora_msg.bots WHERE id = $1`, [chat.bot_id])
      : null;
  return {
    ...chat,
    role: member.role,
    muted: member.muted,
    pinned: member.pinned,
    last_read_seq: Number(member.last_read_seq),
    members,
    member_count: members.length,
    peer,
    bot,
    peer_read_seq:
      chat.type === "private" && peer
        ? Number(members.find((m: any) => m.id === peer.id) ? 0 : 0) // filled below
        : 0,
  };
}
