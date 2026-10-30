import type { Metadata } from "next";
import { ensureReady } from "@/lib/bootstrap";
import { isAdminRequest } from "@/lib/admin";
import { AdminDashboard, AdminLogin } from "@/components/AdminPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "پنل مدیریت نکسورا",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  await ensureReady();
  const authed = await isAdminRequest();
  return authed ? <AdminDashboard /> : <AdminLogin />;
}
