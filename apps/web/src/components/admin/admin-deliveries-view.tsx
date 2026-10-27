"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatBRL } from "@motta/domain";
import type { OrderStatus } from "@motta/domain";
import {
  buttonStyles,
  Card,
  CardBody,
  cn,
  EditIcon,
  Input,
} from "@motta/ui";
import { markOrdersAsDeliveredAction } from "@/lib/admin-actions";
import type { AdminDeliveryData } from "@/lib/admin-types";
import { AdminPageHeader, EmptyState, Feedback, StatCard, StatusBadge } from "@/components/admin/shared";
import { formatAdminDateTime } from "@/lib/admin-format";

type DeliveryData = AdminDeliveryData;
type DeliveryOrder = DeliveryData["orders"][number];

const preparationStatuses: readonly OrderStatus[] = [
  "RECEIVED", "CONFIRMED", "SEPARATING", "AWAITING_SUBSTITUTION", "READY_FOR_PICKUP",
];

export function AdminDeliveriesView({
  data,
  canWrite,
}: {
  data: DeliveryData;
  canWrite: boolean;
}) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [bulkPending, setBulkPending] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const activeOrders = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return data.orders
      .filter((order) => order.status !== "CANCELLED" && order.status !== "REFUNDED")
      .filter((order) => !query || `${order.orderNumber} ${order.contactName} ${order.district}`.toLocaleLowerCase("pt-BR").includes(query));
  }, [data.orders, search]);

  const inRouteOrders = activeOrders.filter(
    (order) => order.status === "OUT_FOR_DELIVERY",
  );

  const lanes: { title: string; description: string; orders: DeliveryOrder[] }[] = [
    { title: "Em preparo", description: "Pedidos em separação ou aguardando confirmação.", orders: activeOrders.filter((order) => preparationStatuses.includes(order.status as OrderStatus)) },
    { title: "Saiu para entrega", description: "Pedidos registrados em rota.", orders: inRouteOrders },
    { title: "Concluídas", description: "Entregas concluídas.", orders: activeOrders.filter((order) => order.status === "COMPLETED") },
  ];
  const today = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const completedToday = activeOrders.filter((order) =>
    order.statusHistory.some((entry) => entry.status === "COMPLETED" &&
      new Date(entry.at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) === today),
  ).length;

  // A seleção vale só para o que está visível: trocar a busca limpa a seleção
  // para não concluir entregas escondidas por engano.
  useEffect(() => {
    setSelectedIds([]);
  }, [search]);

  // Depois de um refresh as entregas concluídas continuam na lista, mas ids
  // removidos (por exemplo, pedido excluído em outro fluxo) saem da seleção.
  useEffect(() => {
    setSelectedIds((current) => {
      const alive = current.filter((id) =>
        data.orders.some((order) => order.id === id),
      );
      return alive.length === current.length ? current : alive;
    });
  }, [data.orders]);

  const allSelected =
    inRouteOrders.length > 0 &&
    inRouteOrders.every((order) => selectedIds.includes(order.id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedIds.length > 0 && !allSelected;
    }
  }, [selectedIds.length, allSelected]);

  function toggleSelection(orderId: string): void {
    setSelectedIds((current) =>
      current.includes(orderId)
        ? current.filter((id) => id !== orderId)
        : [...current, orderId],
    );
  }

  function toggleAll(): void {
    setSelectedIds(
      allSelected ? [] : inRouteOrders.map((order) => order.id),
    );
  }

  async function markSelectedAsDelivered(): Promise<void> {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const label =
      ids.length === 1 ? "1 entrega" : `${ids.length} entregas`;
    const confirmed = window.confirm(
      `Marcar ${label} como entregue(s)? O status será alterado para Concluído e o estoque será baixado.`,
    );
    if (!confirmed) return;

    setBulkPending(true);
    setFeedback(null);
    try {
      const result = await markOrdersAsDeliveredAction(ids);
      setFeedback({ tone: result.ok ? "success" : "error", text: result.message });
      setSelectedIds([]);
      // `refresh` atualiza as lanes do servidor sem perder o feedback na tela.
      router.refresh();
    } catch {
      setFeedback({ tone: "error", text: "Falha inesperada ao concluir as entregas." });
    } finally {
      setBulkPending(false);
    }
  }

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

      {feedback ? <Feedback tone={feedback.tone}>{feedback.text}</Feedback> : null}

      {canWrite && activeOrders.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-motta-gray-200 bg-motta-gray-50 px-3 py-2">
          <label className="flex items-center gap-2 text-xs font-bold text-motta-ink">
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              disabled={inRouteOrders.length === 0}
              aria-label="Selecionar todas as entregas em rota"
              className="h-4 w-4 accent-motta-red"
            />
            Selecionar todas em rota
          </label>
          <span className="text-xs text-motta-gray-500">
            {selectedIds.length > 0
              ? `${selectedIds.length} de ${inRouteOrders.length} selecionada(s)`
              : `${inRouteOrders.length} entrega(s) em rota`}
          </span>
          <span className="text-[11px] leading-relaxed text-motta-gray-500">
            Somente pedidos que saíram para entrega podem ser concluídos em massa.
          </span>
        </div>
      ) : null}

      {canWrite && selectedIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-motta-red/30 bg-red-50 px-3 py-2">
          <strong className="text-xs font-bold text-motta-ink">
            {selectedIds.length} selecionada(s)
          </strong>
          <button
            type="button"
            disabled={bulkPending}
            onClick={() => void markSelectedAsDelivered()}
            className={buttonStyles({ variant: "primary", size: "sm" })}
          >
            {bulkPending
              ? "Concluindo…"
              : `Marcar como Entregue (${selectedIds.length})`}
          </button>
          <button
            type="button"
            disabled={bulkPending}
            onClick={() => setSelectedIds([])}
            className={buttonStyles({ variant: "ghost", size: "sm" })}
          >
            Limpar seleção
          </button>
        </div>
      ) : null}

      {activeOrders.length === 0 ? <EmptyState title="Nenhuma entrega encontrada" description="Ainda não há pedidos de entrega ou nenhum corresponde à busca." /> : <div className="grid gap-3 lg:grid-cols-3">{lanes.map((lane) => <Card key={lane.title}><CardBody className="space-y-3 p-4"><div><h2 className="text-sm font-extrabold">{lane.title} ({lane.orders.length})</h2><p className="text-[11px] text-motta-gray-500">{lane.description}</p></div>{lane.orders.length ? <ul className="space-y-2">{lane.orders.map((order) => {
        const selected = selectedIds.includes(order.id);
        const eligible = order.status === "OUT_FOR_DELIVERY";
        return <li key={order.id} className={cn("rounded-xl border p-3", selected ? "border-motta-red ring-2 ring-motta-red/20" : "border-motta-gray-200")}>
          <div className="flex items-start gap-2">
            {canWrite ? <input type="checkbox" checked={selected} disabled={!eligible} onChange={() => toggleSelection(order.id)} aria-label={`Selecionar entrega ${order.orderNumber}`} title={eligible ? undefined : "Somente pedidos que saíram para entrega podem ser concluídos em massa."} className="mt-1 h-4 w-4 shrink-0 accent-motta-red" /> : null}
            <div className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2"><strong className="font-mono text-[11px]">{order.orderNumber}</strong><StatusBadge status={order.status as OrderStatus} /></span>
              <p className="mt-1 truncate text-xs font-semibold">{order.contactName}</p>
              {order.street ? <p className="text-[11px] text-motta-gray-500">{order.street}, {order.number} · {order.district}</p> : null}
              <span className="mt-1 flex items-center justify-between gap-2 text-[11px] text-motta-gray-500"><span>{formatAdminDateTime(order.createdAt)}</span><strong>{formatBRL(order.totalCents)}</strong></span>
              <Link href={`/painel/pedidos/${order.orderNumber}`} className={cn(buttonStyles({ variant: "ghost", size: "sm" }), "mt-2")}><EditIcon className="h-4 w-4" />Ver detalhes</Link>
            </div>
          </div>
        </li>;
      })}</ul> : <p className="rounded-lg border border-dashed p-5 text-center text-xs text-motta-gray-500">Nenhum pedido nesta etapa.</p>}</CardBody></Card>)}</div>}
    </div>
  );
}
