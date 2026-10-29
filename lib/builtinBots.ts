import { q1 } from "./db";
import { sendBotMessage } from "./messaging";

const fa = (n: number) => n.toLocaleString("fa-IR");

export async function builtinReply(bot: any, chatId: string, rawText: string, incoming: any) {
  const text = (rawText || "").trim();
  const command = text.startsWith("/") ? text.split(/\s+/)[0].slice(1).toLowerCase() : "";
  const arg = text.split(/\s+/).slice(1).join(" ");

  const reply = async (body: string, buttons?: { text: string; data: string }[][]) => {
    await sendBotMessage({
      botId: bot.id,
      chatId,
      text: body,
      kind: "text",
      meta: buttons ? { buttons } : {},
      replyToId: incoming?.id ?? null,
    });
  };

  if (bot.username === "echo_bot") {
    await reply(text ? `🔁 ${text}` : "یک پیام بفرست تا اکو شود!");
    return;
  }

  // Handy assistant bot
  switch (command) {
    case "start":
      await reply(
        `سلام ${incoming?.sender_name ?? "دوست من"}! 👋\nمن دستیار رسمی نکسورا هستم.\nبا دکمه‌های زیر شروع کن یا /help را بزن.`,
        [
          [
            { text: "📊 آمار زنده", data: "stats" },
            { text: "🕒 ساعت", data: "time" },
          ],
          [{ text: "🤖 ساخت ربات", data: "newbot" }],
        ]
      );
      return;
    case "help":
      await reply(
        `📚 راهنمای دستیار نکسورا\n\n/start شروع\n/help همین راهنما\n/stats آمار زندهٔ پلتفرم\n/time تاریخ و ساعت\n/id شناسهٔ گفتگو\n\nهمچنین می‌توانی هر متنی بفرستی تا راهنمایی بگیر.`
      );
      return;
    case "stats": {
      const s = await q1<any>(
        `SELECT (SELECT count(*)::int FROM nexora.users) AS users,
                (SELECT count(*)::int FROM nexora.chats) AS chats,
                (SELECT count(*)::int FROM nexora.messages) AS messages,
                (SELECT count(*)::int FROM nexora.bots) AS bots`
      );
      await reply(
        `📊 آمار زندهٔ نکسورا\n\n👤 کاربران: ${fa(Number(s?.users ?? 0))}\n💬 گفتگوها: ${fa(
          Number(s?.chats ?? 0)
        )}\n✉️ پیام‌ها: ${fa(Number(s?.messages ?? 0))}\n🤖 ربات‌ها: ${fa(Number(s?.bots ?? 0))}`
      );
      return;
    }
    case "time": {
      const now = new Date();
      const d = new Intl.DateTimeFormat("fa-IR", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: "Asia/Tehran",
      }).format(now);
      await reply(`🕒 ${d}\nمنطقهٔ زمانی: تهران`);
      return;
    }
    case "id":
      await reply(`🆔 شناسهٔ این گفتگو:\n\`${chatId}\``);
      return;
    default:
      break;
  }

  if (incoming?.meta?.callback_query) return;

  const lower = text.toLowerCase();
  if (["سلام", "hi", "hello", "سلم"].includes(lower)) {
    await reply("سلام! 😄 چطور می‌توانم کمکت کنم؟ /help را بزن تا همه‌چیز را ببینی.");
    return;
  }
  if (text.includes("ربات")) {
    await reply(
      "ساخت ربات در نکسورا ساده است! به صفحهٔ «ربات‌ساز» برو، نام و آیدی انتخاب کن و توکن بگیر. سپس با Bot API (سازگار با سبک تلگرام) پیام بفرست. 🤖"
    );
    return;
  }
  await reply(
    text
      ? `پیامت را گرفتم: «${text.slice(0, 120)}»\n\nمن یک ربات نمایشی هستم؛ برای دیدن قابلیت‌ها /help را بزن.`
      : "یک پیام بفرست! 🙂"
  );
}
