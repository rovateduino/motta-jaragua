import type { Metadata } from "next";
import { AdminCustomersView } from "@/components/admin/admin-customers-view";
import { requireAdminPermission } from "@/lib/auth/session";
import { getAdminCustomers } from "@/lib/admin-db";

export const metadata: Metadata = {
  title: "Clientes",
  description: "Clientes cadastrados e pedidos registrados no banco.",
  robots: { index: false, follow: false },
};

export default async function AdminCustomersPage() {
  await requireAdminPermission("customers.read");
  const customers = await getAdminCustomers();
  return <AdminCustomersView customers={customers} />;
}
