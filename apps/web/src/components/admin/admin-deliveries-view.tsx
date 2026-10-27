"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatBRL } from "@motta/domain";
import type { OrderStatus } from "@motta/domain";
import { buttonStyles, Card, CardBody, Input } from "@motta/ui";
import type { AdminDeliveryData } from "@/lib/admin-types";
import { AdminPageHeader, EmptyState, StatCard, StatusBadge } from "@/components/admin/shared";
import { formatAdminDateTime } from "@/lib/admin-format";

type DeliveryData = AdminDeliveryData;
type DeliveryOrder = DeliveryData["orders"][number];

const preparationStatuses: readonly OrderStatus[] = [
  "RECEIVED", "CONFIRMED", "SEPARATING", "AWAITING_SUBSTITUTION", "READY_FOR_PICKUP",
];

export function AdminDeliveriesView({ data }: { data: DeliveryData }) {
  const [search, setSearch] = useState("");
  const activeOrders = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return data.orders
      .filter((order) => order.status !== "CANCELLED" && order.status !== "REFUNDED")
      .filter((order) => !query || `${order.orderNumber} ${order.contactName} ${order.district}`.toLocaleLowerCase("pt-BR").includes(query));
  }, [data.orders, search]);
  const lanes: { title: string; description: string; orders: DeliveryOrder[] }[] = [
    { title: "Em preparo", description: "Pedidos em separação ou aguardando confirmação.", orders: activeOrders.filter((order) => preparationStatuses.includes(order.status as OrderStatus)) },
    { title: "Saiu para entrega", description: "Pedidos registrados em rota.", orders: activeOrders.filter((order) => order.status === "OUT_FOR_DELIVERY") },
    { title: "Concluídas", description: "Entregas concluídas.", orders: activeOrders.filter((order) => order.status === "COMPLETED") },
  ];
  const today = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const completedToday = activeOrders.filter((order) =>
    order.statusHistory.some((entry) => entry.status === "COMPLETED" &&
      new Date(entry.at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) === today),
  ).length;

  return (
    <div className="space-y-5">
      <AdminPageHeader eyebrow="Logística" title="Entregas" description="Pedidos de entrega registrados no banco, organizados pelo status operacional." actions={<Link href="/painel/configuracoes" className={buttonStyles({ variant: "outline" })}>Regras de entrega</Link>} />
      <section aria-label="Resumo de entregas" className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Em preparo" value={String(lanes[0]?.orders.length ?? 0)} detail="Pedidos de entrega" iconName="package" />
        <StatCard label="Em rota" value={String(lanes[1]?.orders.length ?? 0)} detail="Saíram para entrega" iconName="package" tone="offer" />
        <StatCard label="Concluídas hoje" value={String(completedToday)} detail="Conforme histórico persistido" iconName="package" tone="success" />
      </section>
      {data.settings ? <div className="rounded-xl border border-motta-gray-200 bg-white px-4 py-3 text-xs"><strong>{data.settings.storeName}</strong><p>{data.settings.deliveryEnabled ? "Entrega habilitada" : "Entrega desabilitada"} · {data.settings.minimumOrderCents ? `Pedido mínimo: ${formatBRL(data.settings.minimumOrderCents)}` : "Sem pedido mínimo configurado"}</p></div> : null}
      <Card><CardBody className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1 text-xs font-bold">Buscar entrega<Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pedido, cliente ou bairro" aria-label="Buscar entregas" /></label><span className="pb-2 text-xs text-motta-gray-500">{activeOrders.length} entregas ativas ou concluídas</span></CardBody></Card>
      {activeOrders.length === 0 ? <EmptyState title="Nenhuma entrega encontrada" description="Ainda não há pedidos de entrega ou nenhum corresponde à busca." /> : <div className="grid gap-3 lg:grid-cols-3">{lanes.map((lane) => <Card key={lane.title}><CardBody className="space-y-3 p-4"><div><h2 className="text-sm font-extrabold">{lane.title} ({lane.orders.length})</h2><p className="text-[11px] text-motta-gray-500">{lane.description}</p></div>{lane.orders.length ? <ul className="space-y-2">{lane.orders.map((order) => <li key={order.id}><Link href={`/painel/pedidos/${order.orderNumber}`} className="block rounded-xl border border-motta-gray-200 p-3 hover:border-motta-red"><span className="flex flex-wrap items-center gap-2"><strong className="font-mono text-[11px]">{order.orderNumber}</strong><StatusBadge status={order.status as OrderStatus} /></span><p className="mt-1 truncate text-xs font-semibold">{order.contactName}</p>{order.street ? <p className="text-[11px] text-motta-gray-500">{order.street}, {order.number} · {order.district}</p> : null}<span className="mt-1 flex justify-between text-[11px] text-motta-gray-500"><span>{formatAdminDateTime(order.createdAt)}</span><strong>{formatBRL(order.totalCents)}</strong></span></Link></li>)}</ul> : <p className="rounded-lg border border-dashed p-5 text-center text-xs text-motta-gray-500">Nenhum pedido nesta etapa.</p>}</CardBody></Card>)}</div>}
    </div>
  );
}
