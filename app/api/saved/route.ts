import { openSavedChat } from "@/lib/queries";
import { withUser } from "@/lib/http";

/** Opens the personal "saved messages" space (and forwards target). */
export async function POST() {
  return withUser(async (user) => {
    const chat = await openSavedChat(user.id);
    return { ok: true, chat_id: chat.id };
  });
}

export async function GET() {
  return withUser(async (user) => {
    const chat = await openSavedChat(user.id);
    return { ok: true, chat_id: chat.id };
  });
}
