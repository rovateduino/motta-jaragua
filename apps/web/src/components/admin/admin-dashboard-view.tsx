import Link from "next/link";
import { formatBRL, formatQuantity } from "@motta/domain";
import {
  ArrowRightIcon,
  buttonStyles,
  Card,
  CardBody,
  PackageIcon,
  TagIcon,
} from "@motta/ui";
import {
  AdminPageHeader,
  StatCard,
  StatusBadge,
} from "@/components/admin/shared";
import type { AdminDashboardData } from "@/lib/admin-types";
import { formatAdminDateTime } from "@/lib/admin-format";

type DashboardData = AdminDashboardData;

export function AdminDashboardView({
  metrics,
  canManageProducts,
  canManageOffers,
}: {
  metrics: DashboardData;
  canManageProducts: boolean;
  canManageOffers: boolean;
}) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Visão geral"
        title="Dashboard"
        description="Indicadores calculados diretamente dos pedidos, produtos e estoque persistidos no PostgreSQL."
        actions={<><Link href="/painel/pedidos" className={buttonStyles({ variant: "outline" })}>Ver pedidos</Link>{canManageProducts ? <Link href="/painel/produtos" className={buttonStyles({ variant: "primary" })}>Gerenciar produtos</Link> : null}</>}
      />
      <section aria-label="Indicadores principais" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pedidos hoje" value={String(metrics.todayOrderCount)} detail={`${metrics.pendingOrderCount} pedidos em andamento`} iconName="clipboard" />
        <StatCard label="Vendas em 30 dias" value={formatBRL(metrics.last30SalesCents)} detail={`${metrics.last30OrderCount} pedidos válidos`} iconName="wallet" />
        <StatCard label="Ticket médio" value={formatBRL(metrics.averageTicketCents)} detail="Sem cancelados e reembolsados" iconName="wallet" tone="success" />
        <StatCard label="Alertas de estoque" value={String(metrics.lowStockProducts.length)} detail="Produtos disponíveis abaixo do limite" iconName="alert" tone={metrics.lowStockProducts.length ? "danger" : "default"} />
      </section>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <Card><CardBody>
          <h2 className="text-lg font-extrabold">Pedidos recentes</h2>
          {metrics.recentOrders.length === 0 ? <p className="mt-4 rounded-xl border border-dashed p-6 text-center text-sm text-motta-gray-500">Ainda não há pedidos no banco.</p> : <ul className="mt-3 divide-y divide-motta-gray-200">{metrics.recentOrders.map((order) => <li key={order.id}><Link href={`/painel/pedidos/${order.orderNumber}`} className="block py-3 hover:text-motta-red"><span className="flex flex-wrap items-center gap-2"><strong className="font-mono text-xs">{order.orderNumber}</strong><StatusBadge status={order.status} /><strong className="ml-auto">{formatBRL(order.totalCents)}</strong></span><span className="mt-1 flex justify-between text-xs text-motta-gray-500"><span>{order.contactName}</span><span>{formatAdminDateTime(order.createdAt)}</span></span></Link></li>)}</ul>}
        </CardBody></Card>
        <Card><CardBody>
          <h2 className="flex items-center gap-2 text-lg font-extrabold"><PackageIcon className="h-5 w-5 text-motta-red" />Estoque baixo</h2>
          {metrics.lowStockProducts.length === 0 ? <p className="mt-4 rounded-lg bg-green-50 p-3 text-xs font-semibold text-green-800">Nenhum alerta de estoque.</p> : <ul className="mt-3 space-y-2">{metrics.lowStockProducts.map((product) => <li key={product.id} className="flex items-center justify-between gap-3 rounded-lg border border-motta-gray-200 px-3 py-2"><span className="min-w-0"><span className="block truncate text-xs font-bold">{product.emoji} {product.name}</span><span className="text-[11px] text-motta-gray-500">{product.sku}</span></span><strong className="shrink-0 text-xs text-motta-red">{formatQuantity(product.stockQuantityMilli, product.unit)}</strong></li>)}</ul>}
          <Link href="/painel/produtos" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-motta-red">Ajustar estoque<ArrowRightIcon className="h-3.5 w-3.5" /></Link>
        </CardBody></Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card><CardBody>
          <h2 className="text-lg font-extrabold">Produtos mais vendidos · últimos 30 dias</h2>
          {metrics.topProducts.length ? <ul className="mt-3 divide-y divide-motta-gray-200">{metrics.topProducts.map((product) => <li key={product.productId} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span><strong className="block">{product.name}</strong><span className="text-[11px] text-motta-gray-500">{product.orderCount} pedidos · {formatQuantity(product.quantityMilli, product.unit)}</span></span><strong>{formatBRL(product.revenueCents)}</strong></li>)}</ul> : <p className="mt-3 text-sm text-motta-gray-500">Ainda não há vendas válidas.</p>}
        </CardBody></Card>
        <Card><CardBody>
          <h2 className="flex items-center gap-2 text-lg font-extrabold"><TagIcon className="h-5 w-5 text-motta-red" />Ofertas ativas</h2>
          <p className="mt-2 text-3xl font-black">{metrics.activePromotionCount}</p>
          {canManageOffers ? <Link href="/painel/ofertas" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-motta-red">Gerenciar ofertas<ArrowRightIcon className="h-3.5 w-3.5" /></Link> : null}
        </CardBody></Card>
      </div>
    </div>
  );
}
