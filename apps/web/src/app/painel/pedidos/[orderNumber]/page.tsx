import { AdminOrderDetailView } from "@/components/orders/admin-order-detail-view";
import { getCurrentAdmin, hasPermission, requireAdminPermission } from "@/lib/auth/session";
import { getAdminOrder } from "@/lib/orders-db";

interface AdminOrderDetailPageProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  await requireAdminPermission("orders.read");
  const { orderNumber } = await params;
  const [order, admin] = await Promise.all([
    getAdminOrder(orderNumber),
    getCurrentAdmin(),
  ]);

  return (
    <AdminOrderDetailView
      orderNumber={orderNumber}
      order={order}
      canUpdateStatus={admin ? hasPermission(admin, "orders.update") : false}
    />
  );
}
