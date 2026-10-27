import type { Metadata } from "next";
import { AdminDashboardView } from "@/components/admin/admin-dashboard-view";
import { requireAdminPermission } from "@/lib/auth/session";
import { getAdminDashboardData } from "@/lib/admin-analytics";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Indicadores do painel administrativo do Mercado Motta Jaraguá.",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const admin = await requireAdminPermission("orders.read");
  const metrics = await getAdminDashboardData();
  return (
    <AdminDashboardView
      metrics={metrics}
      canManageProducts={admin.permissions.includes("products.write")}
      canManageOffers={admin.permissions.includes("promotions.write")}
    />
  );
}
