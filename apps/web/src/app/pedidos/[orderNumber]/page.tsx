import type { Metadata } from "next";
import { OrderDetailView } from "@/components/orders/order-detail-view";
import { requireCustomer } from "@/lib/auth/session";
import { getCustomerOrder } from "@/lib/orders-db";

export const metadata: Metadata = {
  title: "Detalhe do pedido",
  description: "Acompanhe o pedido registrado na sua conta no Mercado Motta Jaraguá.",
  robots: { index: false, follow: false },
};

interface OrderDetailPageProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { orderNumber } = await params;
  const customer = await requireCustomer(`/pedidos/${orderNumber}`);
  const order = await getCustomerOrder(customer.id, orderNumber);

  return <OrderDetailView orderNumber={orderNumber} order={order} />;
}
