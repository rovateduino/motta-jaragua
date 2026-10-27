import Link from "next/link";
import { formatBRL, formatQuantity } from "@motta/domain";
import { buttonStyles, Card, CardBody, PackageIcon } from "@motta/ui";
import {
  AdminPageHeader,
  StatCard,
} from "@/components/admin/shared";
import type { AdminReportData } from "@/lib/admin-types";

type ReportData = AdminReportData;

const periods = [
  { value: 7, label: "7 dias" },
  { value: 30, label: "30 dias" },
  { value: 90, label: "90 dias" },
] as const;

export function AdminReportsView({ metrics }: { metrics: ReportData }) {
  const maxDailySales = Math.max(
    1,
    ...metrics.dailySales.map((point) => point.salesCents),
  );

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Análise"
        title="Relatórios"
        description="Indicadores calculados no servidor a partir dos pedidos, itens, estoque e promoções do banco."
        actions={
          <div className="flex gap-1.5" role="group" aria-label="Período do relatório">
            {periods.map((option) => (
              <Link
                key={option.value}
                href={`/painel/relatorios?period=${option.value}`}
                aria-current={metrics.periodDays === option.value ? "page" : undefined}
                className={
                  metrics.periodDays === option.value
                    ? buttonStyles({ variant: "dark", size: "sm" })
                    : buttonStyles({ variant: "outline", size: "sm" })
                }
              >
                {option.label}
              </Link>
            ))}
          </div>
        }
      />

      <section aria-label="Indicadores do período" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Vendas no período"
          value={formatBRL(metrics.salesCents)}
          detail={`${metrics.orderCount} pedidos válidos`}
          iconName="wallet"
          tone="success"
        />
        <StatCard
          label="Ticket médio"
          value={formatBRL(metrics.averageTicketCents)}
          detail="Sem cancelados e reembolsados"
          iconName="wallet"
        />
        <StatCard
          label="Cancelamentos"
          value={`${metrics.cancellationRate}%`}
          detail={`${metrics.cancellationCount} no período`}
          iconName="chart"
          tone={metrics.cancellationRate > 15 ? "danger" : "default"}
        />
        <StatCard
          label="Separação média"
          value={
            metrics.averageSeparationMinutes === null
              ? "—"
              : `${metrics.averageSeparationMinutes} min`
          }
          detail="Confirmado até separação"
          iconName="clock"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
        <Card>
          <CardBody>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="text-lg font-extrabold text-motta-ink">
                  Vendas por dia
                </h2>
                <p className="text-xs text-motta-gray-500">
                  Últimos {Math.min(metrics.periodDays, 14)} dias do período selecionado.
                </p>
              </div>
              <p className="text-[11px] text-motta-gray-500">
                Prazos de conclusão:{" "}
                {metrics.onTimeRate === null ? "sem dados" : `${metrics.onTimeRate}% em 24h`}
              </p>
            </div>
            <div
              className="mt-5 flex h-44 items-end gap-1.5 sm:gap-2"
              role="img"
              aria-label="Gráfico de vendas diárias"
            >
              {metrics.dailySales.map((point) => (
                <div key={point.isoDate} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1">
                  <span className="text-center text-[9px] font-bold text-motta-gray-500">
                    {point.salesCents > 0 ? formatBRL(point.salesCents) : ""}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-motta-red/80"
                    style={{
                      height: `${Math.max(
                        point.salesCents > 0 ? 6 : 1,
                        (point.salesCents / maxDailySales) * 100,
                      )}%`,
                    }}
                    title={`${point.label}: ${formatBRL(point.salesCents)} em ${point.orderCount} pedidos`}
                  />
                  <span className="text-center text-[9px] font-semibold capitalize text-motta-gray-500">
                    {point.label.replace(".", "")}
                  </span>
                </div>
              ))}
            </div>
            {metrics.orderCount === 0 ? (
              <p className="mt-3 rounded-lg bg-motta-gray-50 px-3 py-2 text-xs text-motta-gray-500">
                Não há pedidos no período selecionado.
              </p>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="text-lg font-extrabold text-motta-ink">Alertas de estoque</h2>
            <p className="text-xs text-motta-gray-500">
              Produtos ativos zerados ou abaixo do mínimo.
            </p>
            {metrics.stockoutProducts.length === 0 ? (
              <p className="mt-4 rounded-lg bg-green-50 px-3 py-3 text-xs font-semibold text-green-800">
                Nenhum produto ativo zerado ou abaixo do mínimo.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {metrics.stockoutProducts.map((product) => (
                  <li
                    key={product.id}
                    className="rounded-lg border border-red-100 bg-red-50 px-3 py-2"
                  >
                    <p className="text-xs font-bold text-motta-ink">{product.name}</p>
                    <p className="text-[11px] text-motta-red">
                      {formatQuantity(product.stockQuantityMilli, product.unit)} • mínimo{" "}
                      {formatQuantity(product.minQuantityMilli, product.unit)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[11px] text-motta-gray-500">
              {metrics.lowStockCount} produto(s) ativos com estoque baixo
              (10 un. ou menos).
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardBody>
            <h2 className="text-lg font-extrabold text-motta-ink">
              Produtos mais vendidos
            </h2>
            {metrics.topProducts.length === 0 ? (
              <EmptyStateInline text="Sem vendas no período selecionado." />
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr className="border-b border-motta-gray-200 text-left text-[11px] font-bold uppercase tracking-wide text-motta-gray-500">
                      <th className="pb-2">Produto</th>
                      <th className="pb-2 text-right">Pedidos</th>
                      <th className="pb-2 text-right">Qtd.</th>
                      <th className="pb-2 text-right">Receita</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-motta-gray-200">
                    {metrics.topProducts.map((product) => (
                      <tr key={product.productId}>
                        <td className="py-2 font-semibold text-motta-ink">
                          {product.name}
                        </td>
                        <td className="py-2 text-right text-motta-gray-700">
                          {product.orderCount}
                        </td>
                        <td className="py-2 text-right text-motta-gray-700">
                          {formatQuantity(product.quantityMilli, product.unit)}
                        </td>
                        <td className="py-2 text-right font-bold text-motta-ink">
                          {formatBRL(product.revenueCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="text-lg font-extrabold text-motta-ink">
              Desempenho de ofertas
            </h2>
            {metrics.promotionPerformance.length === 0 ? (
              <EmptyStateInline text="Nenhuma venda vinculada a ofertas no período." />
            ) : (
              <ul className="mt-3 divide-y divide-motta-gray-200">
                {metrics.promotionPerformance.map((promotion) => (
                  <li
                    key={promotion.id}
                    className="flex flex-wrap items-center gap-2 py-2 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate font-semibold text-motta-ink">
                      {promotion.productName}
                    </span>
                    <span className="text-[11px] text-motta-gray-500">
                      {promotion.orderCount} pedidos • {promotion.quantityMilli / 1000} un.
                    </span>
                    <span className="font-bold text-motta-ink">
                      {formatBRL(promotion.revenueCents)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <p className="flex items-center gap-1.5 text-[11px] leading-relaxed text-motta-gray-500">
        <PackageIcon className="h-3.5 w-3.5" />
        Os indicadores são recalculados no servidor usando os dados persistidos no PostgreSQL.
      </p>
    </div>
  );
}

function EmptyStateInline({ text }: { text: string }) {
  return (
    <p className="mt-4 rounded-xl border border-dashed border-motta-gray-300 px-4 py-6 text-center text-sm text-motta-gray-500">
      {text}
    </p>
  );
}
