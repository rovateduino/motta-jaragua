import type { Metadata } from "next";
import { AdminPromotionsView } from "@/components/admin/admin-promotions-view";
import { requireAdminPermission } from "@/lib/auth/session";
import { getAdminPromotionsData } from "@/lib/admin-db";

export const metadata: Metadata = {
  title: "Ofertas e promoções",
  description: "Gestão de ofertas e preços persistidos no banco de dados.",
  robots: { index: false, follow: false },
};

export default async function AdminPromotionsPage() {
  await requireAdminPermission("promotions.write");
  const data = await getAdminPromotionsData();
  return <AdminPromotionsView {...data} />;
}
