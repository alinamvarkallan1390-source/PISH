/**
 * Telegram-compatible shapes for bot payloads.
 * Everything a bot receives / returns should look like Telegram's Bot API
 * so SDKs written for Telegram (Python, Node, PHP…) work unchanged.
 */

export function toBotUser(m: any) {
  if (!m) return undefined;
  if (m.is_bot) {
    return {
      id: m.sender_bot_id,
      is_bot: true,
      first_name: m.sender_name,
      username: m.sender_username || undefined,
    };
  }
  return {
    id: m.sender_id,
    is_bot: false,
    first_name: m.sender_name,
    username: m.sender_username || undefined,
  };
}

export function toBotMessage(m: any, chatType = "private") {
  if (!m) return null;
  return {
    message_id: m.id,
    date: Math.floor(new Date(m.created_at).getTime() / 1000),
    chat: { id: m.chat_id, type: chatType },
    from: toBotUser(m),
    text: m.text ?? "",
    kind: m.kind,
    media: m.media_url ? { url: m.media_url, mime: m.media_mime, name: m.media_name } : null,
    reply_markup: m.meta?.buttons ? { inline_keyboard: m.meta.buttons } : undefined,
    reply_to_message_id: m.reply?.id ?? null,
    reactions: m.reactions ?? [],
    entities: [],
  };
}

export function toBotUpdate(type: string, chatId: string, m: any, chatType = "private") {
  const message = toBotMessage(m, chatType);
  return {
    type,
    chat_id: chatId,
    chat_type: chatType,
    message,
    // convenience mirrors, so simple bots can read update.text / update.from
    text: m?.text ?? "",
    from: message?.from,
  };
}
