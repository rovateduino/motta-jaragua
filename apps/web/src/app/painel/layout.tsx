import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/lib/auth/session";
import { countPendingOrders } from "@/lib/orders-db";
import { getAdminShellMetrics } from "@/lib/admin-db";

export const metadata: Metadata = {
  title: {
    default: "Painel administrativo",
    template: "%s | Painel administrativo",
  },
  description:
    "Painel administrativo do Mercado Motta Jaraguá com acesso autenticado e permissões por papel.",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdminPage();
  const [pendingOrders, metrics] = await Promise.all([
    countPendingOrders(),
    getAdminShellMetrics(),
  ]);

  return (
    <AdminShell admin={admin} pendingOrders={pendingOrders} metrics={metrics}>
      {children}
    </AdminShell>
  );
}
