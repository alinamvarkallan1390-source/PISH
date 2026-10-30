import { q, q1 } from "./db";
import { getMessage, chatById, lastSeq, chatBots } from "./queries";
import { builtinReply } from "./builtinBots";
import { HttpError } from "./http";

export type SendOptions = {
  chatId: string;
  senderId?: string | null;
  botId?: string | null;
  text?: string;
  kind?: string;
  mediaId?: string | null;
  replyToId?: string | null;
  forwardFrom?: string | null;
  meta?: any;
  createdAt?: string | null;
};

export async function sendMessage(opts: SendOptions) {
  const chat = await chatById(opts.chatId);
  const id = crypto.randomUUID();
  const text = (opts.text ?? "").slice(0, 8000);
  const kind = opts.kind || "text";

  if (!text.trim() && !opts.mediaId && kind === "text") {
    throw new HttpError(400, "متن پیام خالی است");
  }

  let replyToId = opts.replyToId || null;
  if (replyToId) {
    const target = await q1<any>(
      `SELECT id FROM nexora_msg.messages WHERE id = $1 AND chat_id = $2`,
      [replyToId, opts.chatId]
    );
    if (!target) replyToId = null;
  }

  await q(
    `INSERT INTO nexora_msg.messages (id, chat_id, sender_id, sender_bot_id, kind, text, media_id, reply_to_id, forward_from, meta, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, COALESCE($11::timestamptz, now()))`,
    [
      id,
      opts.chatId,
      opts.senderId ?? null,
      opts.botId ?? null,
      kind,
      text,
      opts.mediaId ?? null,
      replyToId,
      opts.forwardFrom ?? null,
      JSON.stringify(opts.meta ?? {}),
      opts.createdAt ?? null,
    ]
  );

  if (opts.senderId) {
    await q(
      `UPDATE nexora_msg.chat_members SET last_read_seq = (SELECT COALESCE(max(seq),0) FROM nexora_msg.messages WHERE chat_id = $1)
        WHERE chat_id = $1 AND user_id = $2`,
      [opts.chatId, opts.senderId]
    );
  }

  const message = await getMessage(id, opts.senderId ?? undefined);

  // Deliver to bots that live in groups / channels
  if ((chat.type === "group" || chat.type === "channel") && opts.senderId && !opts.botId) {
    void deliverToGroupBots(chat, message);
  }

  // Deliver to a private bot chat
  if (chat.type === "bot" && opts.senderId && !opts.botId) {
    const bot = await q1<any>(`SELECT * FROM nexora_msg.bots WHERE id = $1`, [chat.bot_id]);
    if (bot) {
      if (bot.is_builtin) {
        void builtinReply(bot, opts.chatId, text, message);
      } else {
        void dispatchBotUpdate(bot, {
          type: "message",
          chat_id: opts.chatId,
          message,
        });
      }
    }
  }

  return message!;
}

export async function sendBotMessage(opts: {
  botId: string;
  chatId?: string;
  userId?: string;
  text?: string;
  kind?: string;
  mediaId?: string | null;
  replyToId?: string | null;
  meta?: any;
}) {
  const bot = await q1<any>(`SELECT * FROM nexora_msg.bots WHERE id = $1`, [opts.botId]);
  if (!bot) throw new HttpError(401, "توکن ربات نامعتبر است");

  let chatId = opts.chatId;
  if (!chatId && opts.userId) {
    const found = await q1<any>(
      `SELECT c.id FROM nexora_msg.chats c JOIN nexora_msg.chat_members m ON m.chat_id = c.id AND m.user_id = $2
        WHERE c.type = 'bot' AND c.bot_id = $1 LIMIT 1`,
      [bot.id, opts.userId]
    );
    if (found) chatId = found.id;
    else {
      chatId = crypto.randomUUID();
      await q(
        `INSERT INTO nexora_msg.chats (id, type, title, avatar_emoji, avatar_color, bot_id)
         VALUES ($1,'bot',$2,'🤖','#06b6d4',$3)`,
        [chatId, bot.name, bot.id]
      );
      await q(
        `INSERT INTO nexora_msg.chat_members (chat_id, user_id, role) VALUES ($1,$2,'member')`,
        [chatId, opts.userId]
      );
    }
  }
  if (!chatId) throw new HttpError(400, "chat_id لازم است");

  return sendMessage({
    chatId,
    botId: bot.id,
    text: opts.text,
    kind: opts.kind,
    mediaId: opts.mediaId,
    replyToId: opts.replyToId,
    meta: opts.meta,
  });
}

export async function dispatchBotUpdate(bot: any, payload: any) {
  try {
    const nextId = await q1<any>(
      `SELECT COALESCE(max(id),0)::text AS n FROM nexora_msg.bot_updates`
    );
    const updateId = Number(nextId?.n ?? 0) + 1;
    const update = { update_id: updateId, ...payload };
    await q(
      `INSERT INTO nexora_msg.bot_updates (bot_id, payload) VALUES ($1,$2)`,
      [bot.id, JSON.stringify(update)]
    );
    if (bot.webhook_url) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      fetch(bot.webhook_url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-nexora-bot-api-secret-token": bot.webhook_secret || "",
        },
        body: JSON.stringify(update),
        signal: controller.signal,
      })
        .catch(() => {})
        .finally(() => clearTimeout(timer));
    }
    return update;
  } catch (err) {
    console.error("[nexora] dispatchBotUpdate", err);
    return null;
  }
}

export async function markRead(chatId: string, userId: string) {
  const seq = await lastSeq(chatId);
  await q(
    `UPDATE nexora_msg.chat_members SET last_read_seq = GREATEST(last_read_seq, $3)
      WHERE chat_id = $1 AND user_id = $2`,
    [chatId, userId, seq]
  );
  return seq;
}

export async function setTyping(chatId: string, userId: string) {
  await q(
    `INSERT INTO nexora_msg.typing (chat_id, user_id, until) VALUES ($1,$2, now() + interval '6 seconds')
     ON CONFLICT (chat_id, user_id) DO UPDATE SET until = now() + interval '6 seconds'`,
    [chatId, userId]
  );
}

export async function toggleReaction(messageId: string, userId: string, emoji: string) {
  const msg = await q1<any>(`SELECT * FROM nexora_msg.messages WHERE id = $1`, [messageId]);
  if (!msg) throw new HttpError(404, "پیام پیدا نشد");
  const existing = await q1<any>(
    `SELECT 1 FROM nexora_msg.reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3`,
    [messageId, userId, emoji]
  );
  if (existing) {
    await q(
      `DELETE FROM nexora_msg.reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3`,
      [messageId, userId, emoji]
    );
  } else {
    await q(
      `INSERT INTO nexora_msg.reactions (message_id, user_id, emoji) VALUES ($1,$2,$3)
       ON CONFLICT DO NOTHING`,
      [messageId, userId, emoji]
    );
  }
  return getMessage(messageId, userId);
}


/** Sends a group/channel message to every bot installed in that chat. */
async function deliverToGroupBots(chat: any, message: any) {
  try {
    const bots = await chatBots(chat.id);
    if (!bots.length) return;
    const mentioned = bots.filter(
      (b: any) =>
        new RegExp(`@${b.username}\\b`, "i").test(message.text || "") ||
        (message.text || "").trim().startsWith("/")
    );
    for (const bot of bots) {
      if (bot.is_builtin) {
        if (mentioned.includes(bot)) {
          const { builtinReply } = await import("./builtinBots");
          void builtinReply(bot, chat.id, (message.text || "").replace(new RegExp(`@${bot.username}`, "gi"), "").trim(), message);
        }
      } else {
        void dispatchBotUpdate(bot, {
          type: "message",
          chat_id: chat.id,
          chat_type: chat.type,
          message,
        });
      }
    }
  } catch (err) {
    console.error("[nexora] group bots", err);
  }
}

export async function votePoll(messageId: string, userId: string, optionId: string) {
  const msg = await q1<any>(`SELECT * FROM nexora_msg.messages WHERE id = $1`, [messageId]);
  if (!msg) throw new HttpError(404, "نظرسنجی پیدا نشد");
  const options: any[] = Array.isArray(msg.meta?.options) ? msg.meta.options : [];
  if (!options.some((o) => o.id === optionId)) throw new HttpError(400, "گزینه نامعتبر است");
  const current = await q1<any>(
    `SELECT option_id FROM nexora_msg.poll_votes WHERE message_id = $1 AND user_id = $2`,
    [messageId, userId]
  );
  if (current?.option_id === optionId) {
    await q(
      `DELETE FROM nexora_msg.poll_votes WHERE message_id = $1 AND user_id = $2`,
      [messageId, userId]
    );
  } else {
    await q(
      `INSERT INTO nexora_msg.poll_votes (message_id, user_id, option_id) VALUES ($1,$2,$3)
       ON CONFLICT (message_id, user_id) DO UPDATE SET option_id = EXCLUDED.option_id`,
      [messageId, userId, optionId]
    );
  }
  return getMessage(messageId, userId);
}
