import type { Metadata } from "next";
import { AdminDeliveriesView } from "@/components/admin/admin-deliveries-view";
import { requireAdminPermission } from "@/lib/auth/session";
import { getAdminDeliveryData } from "@/lib/admin-db";

export const metadata: Metadata = {
  title: "Entregas",
  description: "Acompanhamento de pedidos de entrega persistidos no banco.",
  robots: { index: false, follow: false },
};

export default async function AdminDeliveriesPage() {
  await requireAdminPermission("orders.read");
  const data = await getAdminDeliveryData();
  return <AdminDeliveriesView data={data} />;
}
