import { redirect } from "next/navigation";
import { currentUserId } from "@/lib/auth";
import { ensureReady, getSetting } from "@/lib/bootstrap";
import AuthScreen from "@/components/AuthScreen";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  await ensureReady();
  const uid = await currentUserId();
  if (uid) redirect("/");
  const registrationOpen = await getSetting<boolean>("registration_open");
  return <AuthScreen registrationOpen={registrationOpen} />;
}
