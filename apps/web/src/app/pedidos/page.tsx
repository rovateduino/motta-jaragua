import type { Metadata } from "next";
import { OrdersListView } from "@/components/orders/orders-list-view";
import { requireCustomer } from "@/lib/auth/session";
import { listCustomerOrders } from "@/lib/orders-db";

export const metadata: Metadata = {
  title: "Meus pedidos",
  description: "Acompanhe os pedidos registrados na sua conta no Mercado Motta Jaraguá.",
  robots: { index: false, follow: false },
};

export default async function OrdersPage() {
  const customer = await requireCustomer("/pedidos");
  const orders = await listCustomerOrders(customer.id);

  return <OrdersListView orders={orders} />;
}
