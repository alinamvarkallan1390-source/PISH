import { redirect } from "next/navigation";
import { currentUserId } from "@/lib/auth";
import { ensureReady, getSetting } from "@/lib/bootstrap";
import { q1 } from "@/lib/db";
import AuthScreen from "@/components/AuthScreen";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  await ensureReady();
  const { reason } = await searchParams;

  // Only bounce an already-signed-in visitor back to the app when the account
  // really exists and is allowed in. Without this check, a stale cookie for a
  // deleted user produced the endless /login → / → /login loop.
  const uid = await currentUserId();
  if (uid) {
    const user = await q1<any>(`SELECT id, is_banned FROM nexora_msg.users WHERE id = $1`, [uid]);
    if (user && !user.is_banned) redirect("/");
    if (user && user.is_banned) redirect("/api/auth/logout?next=/login&reason=banned");
    redirect("/api/auth/logout?next=/login&reason=expired");
  }

  const registrationOpen = await getSetting<boolean>("registration_open");
  return <AuthScreen registrationOpen={registrationOpen} notice={reason} />;
}
