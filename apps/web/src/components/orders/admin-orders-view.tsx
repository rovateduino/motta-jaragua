"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  canTransition,
  formatBRL,
  isTerminal,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@motta/domain";
import {
  buttonStyles,
  Card,
  CardBody,
  ClipboardListIcon,
  cn,
  EditIcon,
  Input,
} from "@motta/ui";
import { deleteOrdersAction } from "@/lib/admin-actions";
import type { AdminOrderRowView } from "@/lib/orders-db";
import {
  AdminPageHeader,
  EmptyState,
  Feedback,
  StatusBadge,
} from "@/components/admin/shared";
import { formatAdminDateTime } from "@/lib/admin-format";

export function AdminOrdersView({
  orders,
  canWrite,
}: {
  orders: readonly AdminOrderRowView[];
  canWrite: boolean;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | OrderStatus>("ALL");
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [bulkPending, setBulkPending] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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

  // A seleção em massa vale só para o que está visível: trocar qualquer filtro
  // limpa a seleção para não excluir pedidos escondidos por engano.
  useEffect(() => {
    setSelectedIds([]);
  }, [search, status]);

  // Depois de um refresh os pedidos excluídos saem da lista: descarta da
  // seleção os ids que não existem mais.
  useEffect(() => {
    setSelectedIds((current) => {
      const alive = current.filter((id) => orders.some((order) => order.id === id));
      return alive.length === current.length ? current : alive;
    });
  }, [orders]);

  const allSelected =
    filtered.length > 0 &&
    filtered.every((order) => selectedIds.includes(order.id));

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
    setSelectedIds(allSelected ? [] : filtered.map((order) => order.id));
  }

  async function removeSelected(): Promise<void> {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const label =
      ids.length === 1 ? "1 pedido selecionado" : `${ids.length} pedidos selecionados`;
    const confirmed = window.confirm(
      `Excluir ${label}? A exclusão é lógica: o pedido sai da fila, mas o histórico fiscal e financeiro é preservado. Pedidos em andamento serão cancelados automaticamente (liberando o estoque reservado); pedidos que já saíram para entrega precisam ser finalizados antes.`,
    );
    if (!confirmed) return;

    setBulkPending(true);
    setFeedback(null);
    try {
      const result = await deleteOrdersAction(ids);
      setFeedback({ tone: result.ok ? "success" : "error", text: result.message });
      setSelectedIds([]);
      // `refresh` atualiza a lista do servidor sem perder o feedback na tela.
      router.refresh();
    } catch {
      setFeedback({ tone: "error", text: "Falha inesperada ao excluir os pedidos." });
    } finally {
      setBulkPending(false);
    }
  }

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

      {feedback ? <Feedback tone={feedback.tone}>{feedback.text}</Feedback> : null}

      {canWrite && selectedIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-motta-red/30 bg-red-50 px-3 py-2">
          <strong className="text-xs font-bold text-motta-ink">
            {selectedIds.length} selecionado(s)
          </strong>
          <button
            type="button"
            disabled={bulkPending}
            onClick={() => void removeSelected()}
            className={buttonStyles({ variant: "primary", size: "sm" })}
          >
            {bulkPending
              ? "Excluindo…"
              : `Excluir Selecionados (${selectedIds.length})`}
          </button>
          <button
            type="button"
            disabled={bulkPending}
            onClick={() => setSelectedIds([])}
            className={buttonStyles({ variant: "ghost", size: "sm" })}
          >
            Limpar seleção
          </button>
          <p className="w-full text-[11px] leading-relaxed text-motta-gray-600">
            Exclusão lógica: o pedido sai da fila, mas o histórico é preservado.
            Pedidos em andamento são cancelados automaticamente para liberar o
            estoque; pedidos em entrega precisam ser finalizados antes.
          </p>
        </div>
      ) : null}

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
          <div className="flex items-center gap-3 border-b border-motta-gray-200 bg-motta-gray-50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-motta-gray-500 lg:grid lg:grid-cols-[2rem_minmax(0,1fr)_2.5rem]">
            <span className="flex justify-center">
              {canWrite ? (
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Selecionar todos os pedidos listados"
                  className="h-4 w-4 accent-motta-red"
                />
              ) : null}
            </span>
            <span className="hidden lg:grid lg:grid-cols-[1.2fr_1.2fr_1fr_0.8fr_0.9fr] lg:gap-3">
              <span>Pedido</span>
              <span>Cliente</span>
              <span>Recebido</span>
              <span>Tipo</span>
              <span className="text-right">Total</span>
            </span>
            <span className="ml-auto lg:hidden">{filtered.length} pedido(s)</span>
            <span className="hidden text-right lg:block">Ações</span>
          </div>
          <ul className="divide-y divide-motta-gray-200">
            {filtered.map((order) => {
              const selected = selectedIds.includes(order.id);
              const deletable =
                isTerminal(order.status) ||
                canTransition(order.status, "CANCELLED");
              return (
                <li
                  key={order.orderNumber}
                  className={cn(
                    "grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2 px-4 py-3 text-sm transition-colors hover:bg-motta-gray-50 lg:items-center lg:gap-3",
                    selected && "bg-red-50/60",
                  )}
                >
                  <span className="flex h-10 items-center justify-center">
                    {canWrite ? (
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelection(order.id)}
                        aria-label={`Selecionar pedido ${order.orderNumber}`}
                        title={
                          deletable
                            ? undefined
                            : "Pedidos que já saíram para entrega precisam ser finalizados antes de excluir."
                        }
                        className="h-4 w-4 accent-motta-red"
                      />
                    ) : null}
                  </span>
                  <Link
                    href={`/painel/pedidos/${order.orderNumber}`}
                    className="grid gap-2 lg:grid-cols-[1.2fr_1.2fr_1fr_0.8fr_0.9fr] lg:items-center lg:gap-3"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-motta-ink">
                        {order.orderNumber}
                      </span>
                      <StatusBadge status={order.status} />
                    </span>
                    <span className="truncate text-motta-gray-700">
                      {order.contactName}
                    </span>
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
                  <Link
                    href={`/painel/pedidos/${order.orderNumber}`}
                    aria-label={`Editar pedido ${order.orderNumber}`}
                    title="Editar pedido"
                    className={buttonStyles({ variant: "ghost", size: "sm" })}
                  >
                    <EditIcon className="h-4 w-4" />
                  </Link>
                </li>
              );
            })}
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
