import { redirect } from "next/navigation";
import { currentUserId } from "@/lib/auth";
import { ensureReady } from "@/lib/bootstrap";
import { q1 } from "@/lib/db";
import Messenger from "@/components/Messenger";

export const dynamic = "force-dynamic";

export default async function Home() {
  await ensureReady();
  const uid = await currentUserId();
  if (!uid) redirect("/login");
  const user = await q1<any>(`SELECT * FROM nexora.users WHERE id = $1`, [uid]);
  if (!user) redirect("/login");

  return (
    <Messenger
      me={{
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        avatar_emoji: user.avatar_emoji,
        avatar_color: user.avatar_color,
        bio: user.bio,
        phone: user.phone,
        theme: user.theme,
        is_premium: !!user.is_premium,
      }}
    />
  );
}
