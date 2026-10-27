import type { Metadata } from "next";
import { AdminOrdersView } from "@/components/orders/admin-orders-view";
import { hasPermission, requireAdminPermission } from "@/lib/auth/session";
import { listAdminOrders } from "@/lib/orders-db";

export const metadata: Metadata = {
  title: "Fila de pedidos",
  description: "Pedidos registrados no banco pelo checkout da loja.",
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage() {
  const admin = await requireAdminPermission("orders.read");
  const orders = await listAdminOrders();

  return (
    <AdminOrdersView
      orders={orders}
      canWrite={hasPermission(admin, "orders.update")}
    />
  );
}
