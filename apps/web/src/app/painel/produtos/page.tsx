import type { Metadata } from "next";
import { AdminProductsView } from "@/components/admin/admin-products-view";
import { requireAdminPermission } from "@/lib/auth/session";
import { getAdminCatalogData } from "@/lib/admin-db";

export const metadata: Metadata = {
  title: "Produtos e estoque",
  description: "Gestão fictícia de produtos e estoque do painel demonstrativo.",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  const admin = await requireAdminPermission("products.read");
  const { products, categories } = await getAdminCatalogData();
  return (
    <AdminProductsView
      products={products}
      categories={categories}
      canWrite={admin.permissions.includes("products.write")}
    />
  );
}
