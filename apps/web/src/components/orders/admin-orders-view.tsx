"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatBRL, ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "@motta/domain";
import { buttonStyles, Card, CardBody, ClipboardListIcon, Input } from "@motta/ui";
import type { AdminOrderRowView } from "@/lib/orders-db";
import {
  AdminPageHeader,
  EmptyState,
  StatusBadge,
} from "@/components/admin/shared";
import { formatAdminDateTime } from "@/lib/admin-format";

export function AdminOrdersView({ orders }: { orders: readonly AdminOrderRowView[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | OrderStatus>("ALL");

  const sorted = useMemo(
    () =>
      [...orders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [orders],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sorted.filter((order) => {
      if (status !== "ALL" && order.status !== status) return false;
      if (!term) return true;
      return (
        order.orderNumber.toLowerCase().includes(term) ||
        order.contactName.toLowerCase().includes(term)
      );
    });
  }, [sorted, search, status]);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Operação"
        title="Pedidos"
        description="Fila real de pedidos gravados no banco a partir do checkout da loja. Abra um pedido para consultar os dados registrados."
        actions={
          <Link href="/pedidos" className={buttonStyles({ variant: "outline" })}>
            Ver como cliente
          </Link>
        }
      />

      <Card>
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-xs font-bold text-motta-ink">
            Buscar
            <span className="mt-1 block">
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Número do pedido ou cliente"
                aria-label="Buscar pedidos"
              />
            </span>
          </label>
          <label className="text-xs font-bold text-motta-ink sm:w-56">
            Status
            <span className="mt-1 block">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as "ALL" | OrderStatus)}
                className="h-11 w-full rounded-xl border border-motta-gray-300 bg-white px-3 text-sm text-motta-ink focus-visible:border-motta-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-motta-red/30"
              >
                <option value="ALL">Todos os status</option>
                {ORDER_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {ORDER_STATUS_LABELS[option]}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <p className="pb-2 text-xs text-motta-gray-500 sm:pb-3">
            {filtered.length} de {orders.length} pedidos
          </p>
        </CardBody>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum pedido encontrado"
          description={
            orders.length === 0
              ? "Ainda não há pedidos no banco. Finalize um checkout na loja para criar o primeiro."
              : "Ajuste a busca ou o filtro de status para ver outros pedidos."
          }
          action={
            <Link href="/catalogo" className={buttonStyles({ variant: "primary" })}>
              Abrir catálogo
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1.2fr_1.2fr_1fr_0.8fr_0.9fr] gap-3 border-b border-motta-gray-200 bg-motta-gray-50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-motta-gray-500 lg:grid">
            <span>Pedido</span>
            <span>Cliente</span>
            <span>Recebido</span>
            <span>Tipo</span>
            <span className="text-right">Total</span>
          </div>
          <ul className="divide-y divide-motta-gray-200">
            {filtered.map((order) => (
              <li key={order.orderNumber}>
                <Link
                  href={`/painel/pedidos/${order.orderNumber}`}
                  className="grid gap-2 px-4 py-3 text-sm transition-colors hover:bg-motta-gray-50 lg:grid-cols-[1.2fr_1.2fr_1fr_0.8fr_0.9fr] lg:items-center lg:gap-3"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-motta-ink">
                      {order.orderNumber}
                    </span>
                    <StatusBadge status={order.status} />
                  </span>
                  <span className="truncate text-motta-gray-700">{order.contactName}</span>
                  <span className="text-xs text-motta-gray-500">
                    {formatAdminDateTime(order.createdAt)}
                  </span>
                  <span className="text-xs text-motta-gray-700">
                    {order.fulfillmentType === "DELIVERY" ? "Entrega" : "Retirada"}
                  </span>
                  <span className="font-black text-motta-ink lg:text-right">
                    {formatBRL(order.totalCents)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="flex items-center gap-1.5 text-[11px] leading-relaxed text-motta-gray-500">
        <ClipboardListIcon className="h-3.5 w-3.5" />
        Pedidos gravados no banco pelo checkout. Abra um pedido para registrar uma
        transição de status permitida e acompanhar o histórico.
      </p>
    </div>
  );
}
