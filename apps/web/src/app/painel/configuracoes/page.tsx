import type { Metadata } from "next";
import { AdminSettingsView } from "@/components/admin/admin-settings-view";
import { requireAdminPermission } from "@/lib/auth/session";
import { getAdminStoreSettings } from "@/lib/admin-db";

export const metadata: Metadata = {
  title: "Configurações",
  description: "Gerencie os dados da loja e as regras de entrega e retirada.",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  await requireAdminPermission("settings.write");
  const settings = await getAdminStoreSettings();
  return <AdminSettingsView settings={settings} />;
}
