import type { Metadata } from "next";
import { AdminReportsView } from "@/components/admin/admin-reports-view";
import { requireAdminPermission } from "@/lib/auth/session";
import { getAdminReportData } from "@/lib/admin-analytics";

export const metadata: Metadata = {
  title: "Relatórios",
  description: "Relatórios de vendas, estoque e ofertas calculados a partir do banco.",
  robots: { index: false, follow: false },
};

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string | string[] }>;
}) {
  await requireAdminPermission("reports.read");
  const params = await searchParams;
  const rawPeriod = Array.isArray(params.period) ? params.period[0] : params.period;
  const period = rawPeriod === "7" || rawPeriod === "90" ? Number(rawPeriod) : 30;
  const metrics = await getAdminReportData(period as 7 | 30 | 90);
  return <AdminReportsView metrics={metrics} />;
}
