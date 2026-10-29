import { redirect } from "next/navigation";
import { currentUserId } from "@/lib/auth";
import { ensureReady } from "@/lib/bootstrap";
import AuthScreen from "@/components/AuthScreen";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  await ensureReady();
  const uid = await currentUserId();
  if (uid) redirect("/");
  return <AuthScreen />;
}
