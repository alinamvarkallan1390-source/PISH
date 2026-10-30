import { redirect } from "next/navigation";
import { currentUserId } from "@/lib/auth";
import { ensureReady } from "@/lib/bootstrap";
import { q1 } from "@/lib/db";
import BotsClient from "@/components/BotsClient";

export const dynamic = "force-dynamic";

export default async function BotsPage() {
  await ensureReady();
  const uid = await currentUserId();
  if (!uid) redirect("/login");
  const user = await q1<any>(`SELECT * FROM nexora_msg.users WHERE id = $1`, [uid]);
  if (!user) redirect("/login");
  return (
    <BotsClient
      me={{
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        avatar_emoji: user.avatar_emoji,
        avatar_color: user.avatar_color,
        theme: user.theme,
      }}
    />
  );
}
