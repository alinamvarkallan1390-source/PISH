import { NextResponse } from "next/server";
import { q, q1 } from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";
import { sendBotMessage, dispatchBotUpdate } from "@/lib/messaging";
import { getMessage, openBotChat, chatMembers } from "@/lib/queries";

type Params = { params: Promise<{ token: string; method: string }> };

function botError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error_code: status, description: message }, { status });
}

function toBotMessage(m: any) {
  if (!m) return null;
  return {
    message_id: m.id,
    date: Math.floor(new Date(m.created_at).getTime() / 1000),
    chat: { id: m.chat_id, type: "private" },
    from: m.is_bot
      ? { id: m.sender_bot_id, is_bot: true, first_name: m.sender_name, username: m.sender_username }
      : {
          id: m.sender_id,
          is_bot: false,
          first_name: m.sender_name,
          username: m.sender_username,
        },
    text: m.text,
    kind: m.kind,
    media: m.media_url ? { url: m.media_url, mime: m.media_mime, name: m.media_name } : null,
    reply_markup: m.meta?.buttons ? { inline_keyboard: m.meta.buttons } : undefined,
    reply_to_message_id: m.reply?.id ?? null,
    reactions: m.reactions,
  };
}

async function handle(
  token: string,
  method: string,
  payload: any,
  isGet: boolean
): Promise<any> {
  const bot = await q1<any>(`SELECT * FROM nexora_msg.bots WHERE token = $1`, [token]);
  if (!bot) return botError("Unauthorized: invalid bot token", 401);

  const get = (k: string, d: any = undefined) => (payload?.[k] !== undefined ? payload[k] : d);
  const chatId = get("chat_id") ?? get("chatId");

  async function resolveChatId(): Promise<string | null> {
    if (!chatId) return null;
    const s = String(chatId);
    if (/^[-]?\d+$/.test(s)) return null;
    const asChat = await q1<any>(`SELECT id FROM nexora_msg.chats WHERE id = $1`, [s]);
    if (asChat) return asChat.id;
    const asUser = await q1<any>(`SELECT id FROM nexora_msg.users WHERE id = $1`, [s]);
    if (asUser) return (await openBotChat(asUser.id, bot.id)).id;
    const byUsername = await q1<any>(`SELECT id FROM nexora_msg.users WHERE username = $1`, [s.replace(/^@/, "")]);
    if (byUsername) return (await openBotChat(byUsername.id, bot.id)).id;
    return null;
  }

  switch (method.toLowerCase()) {
    case "getme":
      return {
        result: {
          id: bot.id,
          is_bot: true,
          first_name: bot.name,
          username: bot.username,
          description: bot.description,
          about: bot.about,
          can_join_groups: true,
          can_read_all_group_messages: false,
        },
      };

    case "getupdates": {
      const offset = Number(get("offset", 0)) || 0;
      const limit = Math.min(Number(get("limit", 50)) || 50, 100);
      const rows = await q<any>(
        `SELECT payload FROM nexora_msg.bot_updates
          WHERE bot_id = $1 AND id >= $2 ORDER BY id ASC LIMIT $3`,
        [bot.id, offset > 0 ? offset : 0, limit]
      );
      return { result: rows.map((r) => r.payload) };
    }

    case "sendmessage": {
      const cid = await resolveChatId();
      if (!cid) return botError("Bad Request: chat not found");
      const text = String(get("text", "") ?? "");
      if (!text.trim()) return botError("Bad Request: message text is empty");
      const buttons = get("reply_markup")?.inline_keyboard ?? get("buttons") ?? undefined;
      const msg = await sendBotMessage({
        botId: bot.id,
        chatId: cid,
        text,
        kind: "text",
        replyToId: get("reply_to_message_id") ?? null,
        meta: buttons ? { buttons } : {},
      });
      return { result: toBotMessage(msg) };
    }

    case "sendphoto":
    case "senddocument":
    case "sendvoice": {
      const cid = await resolveChatId();
      if (!cid) return botError("Bad Request: chat not found");
      const mediaId = String(get("photo") ?? get("document") ?? get("voice") ?? "");
      const exists = await q1<any>(`SELECT id FROM nexora_msg.media WHERE id = $1`, [mediaId]);
      if (!exists) return botError("Bad Request: media not found (upload it first via POST /api/media)");
      const kind = method.toLowerCase() === "sendphoto" ? "photo" : method.toLowerCase() === "sendvoice" ? "voice" : "file";
      const msg = await sendBotMessage({
        botId: bot.id,
        chatId: cid,
        text: String(get("caption", "") ?? ""),
        kind,
        mediaId,
      });
      return { result: toBotMessage(msg) };
    }

    case "sendsticker": {
      const cid = await resolveChatId();
      if (!cid) return botError("Bad Request: chat not found");
      const msg = await sendBotMessage({
        botId: bot.id,
        chatId: cid,
        text: "",
        kind: "sticker",
        meta: { emoji: String(get("emoji", "⭐")) },
      });
      return { result: toBotMessage(msg) };
    }

    case "sendchataction": {
      const cid = await resolveChatId();
      if (!cid) return botError("Bad Request: chat not found");
      await q(
        `INSERT INTO nexora_msg.typing (chat_id, user_id, until) VALUES ($1,$2, now() + interval '6 seconds')
         ON CONFLICT (chat_id, user_id) DO UPDATE SET until = now() + interval '6 seconds'`,
        [cid, bot.id]
      );
      return { result: true };
    }

    case "editmessagetext": {
      const mid = String(get("message_id", ""));
      const msg = await q1<any>(`SELECT * FROM nexora_msg.messages WHERE id = $1 AND sender_bot_id = $2`, [mid, bot.id]);
      if (!msg) return botError("Bad Request: message to edit not found");
      await q(`UPDATE nexora_msg.messages SET text = $2, edited_at = now() WHERE id = $1`, [
        mid,
        String(get("text", "")),
      ]);
      return { result: toBotMessage(await getMessage(mid)) };
    }

    case "deletemessage": {
      const mid = String(get("message_id", ""));
      await q(`UPDATE nexora_msg.messages SET deleted = true, text = '' WHERE id = $1 AND sender_bot_id = $2`, [
        mid,
        bot.id,
      ]);
      return { result: true };
    }

    case "setwebhook": {
      const url = String(get("url", "") ?? "");
      if (!/^https?:\/\//.test(url)) return botError("Bad Request: invalid webhook url");
      const secret = String(get("secret_token", "") || "");
      await q(`UPDATE nexora_msg.bots SET webhook_url = $2, webhook_secret = $3 WHERE id = $1`, [
        bot.id,
        url,
        secret,
      ]);
      return { result: true, description: "Webhook was set" };
    }

    case "deletewebhook":
      await q(`UPDATE nexora_msg.bots SET webhook_url = NULL, webhook_secret = NULL WHERE id = $1`, [bot.id]);
      return { result: true };

    case "getwebhookinfo": {
      const fresh = await q1<any>(`SELECT webhook_url, webhook_secret FROM nexora_msg.bots WHERE id = $1`, [bot.id]);
      return {
        result: {
          url: fresh?.webhook_url ?? "",
          has_custom_certificate: false,
          pending_update_count: 0,
          max_connections: 40,
          secret_token_set: !!fresh?.webhook_secret,
        },
      };
    }

    case "setmycommands": {
      const commands = Array.isArray(get("commands", [])) ? get("commands", []) : [];
      await q(`UPDATE nexora_msg.bots SET commands = $2::jsonb WHERE id = $1`, [
        bot.id,
        JSON.stringify(commands.slice(0, 30)),
      ]);
      return { result: true };
    }

    case "getmycommands": {
      const fresh = await q1<any>(`SELECT commands FROM nexora_msg.bots WHERE id = $1`, [bot.id]);
      return { result: fresh?.commands ?? [] };
    }

    case "getchat": {
      const cid = await resolveChatId();
      if (!cid) return botError("Bad Request: chat not found");
      const chat = await q1<any>(`SELECT * FROM nexora_msg.chats WHERE id = $1`, [cid]);
      const members = chat ? await chatMembers(cid) : [];
      return {
        result: {
          id: cid,
          type: chat?.type ?? "private",
          title: chat?.title ?? null,
          members: members.map((m: any) => ({
            id: m.id,
            first_name: m.display_name,
            username: m.username,
            status: m.role,
          })),
          members_count: members.length,
        },
      };
    }

    case "getchatmember": {
      const cid = await resolveChatId();
      const uid = String(get("user_id", ""));
      if (!cid) return botError("Bad Request: chat not found");
      const member = await q1<any>(
        `SELECT role FROM nexora_msg.chat_members WHERE chat_id = $1 AND user_id = $2`,
        [cid, uid]
      );
      return { result: { status: member ? member.role : "left" } };
    }

    case "forwardmessage": {
      const target = String(get("from_chat_id", "") || "");
      const mid = String(get("message_id", ""));
      const src = await q1<any>(`SELECT * FROM nexora_msg.messages WHERE id = $1 AND chat_id = $2`, [mid, target]);
      if (!src) return botError("Bad Request: message to forward not found");
      const cid = await resolveChatId();
      if (!cid) return botError("Bad Request: chat not found");
      const msg = await sendBotMessage({
        botId: bot.id,
        chatId: cid,
        text: src.text,
        kind: src.kind,
        mediaId: src.media_id,
      });
      return { result: toBotMessage(msg) };
    }

    case "pinchatmessage": {
      const mid = String(get("message_id", ""));
      await q(`UPDATE nexora_msg.messages SET pinned = true WHERE id = $1`, [mid]);
      return { result: true };
    }

    case "answercallbackquery":
      return { result: true };

    case "getbotchats": {
      const rows = await q<any>(
        `SELECT c.id, c.title, c.created_at FROM nexora_msg.chats c WHERE c.bot_id = $1 ORDER BY c.created_at DESC LIMIT 50`,
        [bot.id]
      );
      return { result: rows };
    }

    case "sendtoplayer": {
      // convenience: send a message to the bot owner
      const msg = await sendBotMessage({
        botId: bot.id,
        userId: bot.owner_id,
        text: String(get("text", "") ?? ""),
      });
      return { result: toBotMessage(msg) };
    }

    default:
      if (isGet && method.toLowerCase() === "health") return { result: { status: "ok", bot: bot.username } };
      return botError(`Not Found: unknown method "${method}"`, 404);
  }
}

async function run(req: Request, params: Promise<{ token: string; method: string }>) {
  const { token, method } = await params;
  await ensureReady();
  let payload: any = {};
  if (req.method === "GET") {
    const url = new URL(req.url);
    payload = Object.fromEntries(url.searchParams.entries());
  } else {
    payload = await req.json().catch(() => ({}));
  }
  try {
    const out = await handle(token, method, payload, req.method === "GET");
    if (out instanceof Response) return out;
    return NextResponse.json({ ok: true, ...out });
  } catch (err: any) {
    console.error("[nexora] bot api", err);
    return botError(err?.message || "Internal error", 500);
  }
}

export async function POST(req: Request, { params }: Params) {
  return run(req, params);
}

export async function GET(req: Request, { params }: Params) {
  return run(req, params);
}
