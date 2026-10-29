import { q, q1 } from "./db";
import { openBotChat } from "./queries";

const DEMO_CHANNEL = "aaaaaaaa-0000-4000-8000-000000000002"; // کانال رسمی نکسورا
const ASSISTANT_BOT = "bbbbbbbb-0000-4000-8000-000000000001"; // دستیار نکسورا

const WELCOME = `🎉 به نکسورا خوش آمدی!

اینجا می‌توانی:
• 💬 چت خصوصی و گروهی بسازی
• 📣 کانال راه بیندازی
• 📷 عکس، فایل و ویس بفرستی
• 🤖 با Bot API ربات بسازی

برای شروع، اسم یک کاربر را جستجو کن (مثلاً sara) یا از دکمهٔ + گفتگوی جدید استفاده کن.`;

/** Makes sure every account has at least the official channel + the assistant bot chat. */
export async function ensureOnboarding(userId: string) {
  try {
    const channel = await q1<any>(`SELECT id FROM nexora_msg.chats WHERE id = $1`, [DEMO_CHANNEL]);
    if (channel) {
      const already = await q1<any>(
        `SELECT 1 FROM nexora_msg.chat_members WHERE chat_id = $1 AND user_id = $2`,
        [DEMO_CHANNEL, userId]
      );
      if (!already) {
        await q(
          `INSERT INTO nexora_msg.chat_members (chat_id, user_id, role, last_read_seq)
           VALUES ($1,$2,'member', (SELECT COALESCE(max(seq),0) FROM nexora_msg.messages WHERE chat_id = $1))
           ON CONFLICT (chat_id, user_id) DO NOTHING`,
          [DEMO_CHANNEL, userId]
        );
      }
    }

    const bot = await q1<any>(`SELECT id FROM nexora_msg.bots WHERE id = $1`, [ASSISTANT_BOT]);
    if (bot) {
      const chat = await openBotChat(userId, ASSISTANT_BOT);
      const hasMessages = await q1<any>(
        `SELECT 1 FROM nexora_msg.messages WHERE chat_id = $1 LIMIT 1`,
        [chat.id]
      );
      if (!hasMessages) {
        const { sendMessage } = await import("./messaging");
        await sendMessage({
          chatId: chat.id,
          botId: ASSISTANT_BOT,
          text: WELCOME,
          meta: {
            buttons: [
              [
                { text: "📊 آمار نکسورا", data: "stats" },
                { text: "🕒 ساعت", data: "time" },
              ],
              [{ text: "🤖 ساخت ربات", data: "newbot" }],
            ],
          },
        });
      }
    }
  } catch (err) {
    console.error("[nexora] onboarding", err);
  }
}
