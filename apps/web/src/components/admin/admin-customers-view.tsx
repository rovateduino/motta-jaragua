"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatBRL } from "@motta/domain";
import {
  buttonStyles,
  Card,
  CardBody,
  cn,
  EditIcon,
  Input,
} from "@motta/ui";
import { deleteCustomersAction, updateAdminCustomer } from "@/lib/admin-actions";
import type { AdminCustomerRecord } from "@/lib/admin-types";
import {
  AdminPageHeader,
  EmptyState,
  Feedback,
  StatCard,
} from "@/components/admin/shared";
import { formatAdminDate } from "@/lib/admin-format";

type FeedbackState = { tone: "success" | "error"; text: string };

const fieldClass =
  "mt-1 h-11 w-full rounded-xl border border-motta-gray-300 bg-white px-3 text-sm text-motta-ink focus-visible:border-motta-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-motta-red/30";

function CustomerEditDialog({
  customer,
  onClose,
  onSaved,
}: {
  customer: AdminCustomerRecord;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [name, setName] = useState(customer.name);
  const [email, setEmail] = useState(customer.email);
  const [phone, setPhone] = useState(customer.phone);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await updateAdminCustomer({
        id: customer.id,
        name,
        email,
        phone,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onSaved(result.message);
    } catch {
      setError("Falha inesperada ao atualizar o cliente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-edit-title"
        className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="customer-edit-title"
              className="text-lg font-extrabold text-motta-ink"
            >
              Editar cliente
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-motta-gray-500">
              Apenas dados básicos de contato. Pagamentos e histórico de pedidos
              não são editáveis aqui.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar edição do cliente"
            className={buttonStyles({ variant: "ghost", size: "sm" })}
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
          <label className="block text-xs font-bold text-motta-ink">
            Nome *
            <input
              ref={nameRef}
              required
              minLength={2}
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block text-xs font-bold text-motta-ink">
            E-mail *
            <input
              required
              type="email"
              maxLength={160}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block text-xs font-bold text-motta-ink">
            Telefone
            <input
              type="tel"
              maxLength={20}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="(48) 99999-0000"
              className={fieldClass}
            />
          </label>
          {error ? <Feedback tone="error">{error}</Feedback> : null}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className={buttonStyles({ variant: "primary" })}
            >
              {submitting ? "Salvando…" : "Salvar alterações"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={buttonStyles({ variant: "outline" })}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminCustomersView({
  customers,
  canWrite,
}: {
  customers: readonly AdminCustomerRecord[];
  canWrite: boolean;
}) {
  const [search, setSearch] = useState("");
  const [recurringOnly, setRecurringOnly] = useState(false);
  const [editing, setEditing] = useState<AdminCustomerRecord | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [bulkPending, setBulkPending] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return customers.filter((customer) => {
      if (recurringOnly && customer.orderCount < 2) return false;
      return !query || `${customer.name} ${customer.email} ${customer.phone}`.toLocaleLowerCase("pt-BR").includes(query);
    });
  }, [customers, recurringOnly, search]);

  const recurringCount = customers.filter((customer) => customer.orderCount >= 2).length;
  const totalRevenue = customers.reduce((sum, customer) => sum + customer.totalSpentCents, 0);

  // A seleção em massa vale só para o que está visível: trocar busca ou filtro
  // limpa a seleção para não excluir clientes escondidos por engano.
  useEffect(() => {
    setSelectedIds([]);
  }, [search, recurringOnly]);

  // Depois de um refresh os clientes anonimizados saem da lista: descarta da
  // seleção os ids que não existem mais.
  useEffect(() => {
    setSelectedIds((current) => {
      const alive = current.filter((id) =>
        customers.some((customer) => customer.id === id),
      );
      return alive.length === current.length ? current : alive;
    });
  }, [customers]);

  const allSelected =
    filtered.length > 0 &&
    filtered.every((customer) => selectedIds.includes(customer.id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedIds.length > 0 && !allSelected;
    }
  }, [selectedIds.length, allSelected]);

  function toggleSelection(customerId: string): void {
    setSelectedIds((current) =>
      current.includes(customerId)
        ? current.filter((id) => id !== customerId)
        : [...current, customerId],
    );
  }

  function toggleAll(): void {
    setSelectedIds(allSelected ? [] : filtered.map((customer) => customer.id));
  }

  async function removeSelected(): Promise<void> {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const label =
      ids.length === 1 ? "1 cliente selecionado" : `${ids.length} clientes selecionados`;
    const confirmed = window.confirm(
      `Excluir ${label}? Os dados pessoais (nome, e-mail, telefone e endereços) serão anonimizados e o histórico de pedidos será preservado. Esta ação não pode ser desfeita.`,
    );
    if (!confirmed) return;

    setBulkPending(true);
    setFeedback(null);
    try {
      const result = await deleteCustomersAction(ids);
      setFeedback({ tone: result.ok ? "success" : "error", text: result.message });
      setSelectedIds([]);
      // `refresh` atualiza a lista do servidor sem perder o feedback na tela.
      router.refresh();
    } catch {
      setFeedback({ tone: "error", text: "Falha inesperada ao anonimizar os clientes." });
    } finally {
      setBulkPending(false);
    }
  }

  function handleSaved(message: string): void {
    setFeedback({ tone: "success", text: message });
    setEditing(null);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader eyebrow="Relacionamento" title="Clientes" description="Contas e histórico agregado de pedidos cadastrados no banco." />
      <section aria-label="Resumo de clientes" className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Clientes com pedidos" value={String(customers.length)} detail="Até 200 contas mais recentes" iconName="users" />
        <StatCard label="Recorrentes" value={String(recurringCount)} detail="Dois pedidos ou mais" iconName="users" tone="success" />
        <StatCard label="Receita atribuída" value={formatBRL(totalRevenue)} detail="Sem cancelados ou reembolsados" iconName="users" tone="offer" />
      </section>
      <Card><CardBody className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-xs font-bold">Buscar cliente<Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, telefone ou e-mail" aria-label="Buscar clientes" /></label>
        <label className="flex items-center gap-2 pb-2 text-xs font-semibold"><input type="checkbox" checked={recurringOnly} onChange={(event) => setRecurringOnly(event.target.checked)} /> Somente recorrentes</label>
        <span className="pb-2 text-xs text-motta-gray-500">{filtered.length} de {customers.length}</span>
      </CardBody></Card>
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
              ? "Anonimizando…"
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
            LGPD: os dados pessoais são removidos, mas o histórico de pedidos é
            preservado e vinculado a um cliente anônimo.
          </p>
        </div>
      ) : null}
      {filtered.length === 0 ? <EmptyState title="Nenhum cliente encontrado" description="Ajuste os filtros ou aguarde o cadastro de clientes." /> : (
        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 border-b bg-motta-gray-50 px-4 py-2.5 text-[11px] font-bold uppercase text-motta-gray-500 lg:grid lg:grid-cols-[2rem_1.3fr_1fr_0.6fr_0.8fr_0.8fr_2.5rem]">
            <span className="flex justify-center">
              {canWrite ? (
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Selecionar todos os clientes listados"
                  className="h-4 w-4 accent-motta-red"
                />
              ) : null}
            </span>
            <span className="hidden lg:contents">
              <span>Cliente</span>
              <span>Contato</span>
              <span className="text-right">Pedidos</span>
              <span className="text-right">Total</span>
              <span className="text-right">Último pedido</span>
            </span>
            <span className="ml-auto lg:hidden">{filtered.length} cliente(s)</span>
            <span className="hidden text-right lg:block">Ações</span>
          </div>
          <ul className="divide-y divide-motta-gray-200">
            {filtered.map((customer) => {
              const selected = selectedIds.includes(customer.id);
              return (
                <li
                  key={customer.id}
                  className={cn(
                    "grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2 px-4 py-3 text-sm transition-colors hover:bg-motta-gray-50 lg:grid-cols-[2rem_1.3fr_1fr_0.6fr_0.8fr_0.8fr_2.5rem] lg:items-center lg:gap-3",
                    selected && "bg-red-50/60",
                  )}
                >
                  <span className="flex h-10 items-center justify-center">
                    {canWrite ? (
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelection(customer.id)}
                        aria-label={`Selecionar cliente ${customer.name}`}
                        className="h-4 w-4 accent-motta-red"
                      />
                    ) : null}
                  </span>
                  <div className="grid min-w-0 gap-2 lg:contents">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{customer.name}</p>
                      <p className="text-[11px] text-motta-gray-500">{customer.deliveryCount} entrega(s) · {customer.pickupCount} retirada(s)</p>
                    </div>
                    <div className="min-w-0 text-xs">
                      <p>{customer.phone || "Sem telefone"}</p>
                      <p className="truncate text-motta-gray-500">{customer.email}</p>
                    </div>
                    <span className="text-xs lg:text-right">{customer.orderCount}</span>
                    <span className="font-black lg:text-right">{formatBRL(customer.totalSpentCents)}</span>
                    <span className="flex flex-wrap items-center gap-2 text-xs text-motta-gray-500 lg:justify-end">
                      {customer.lastOrderAt ? formatAdminDate(customer.lastOrderAt) : "—"}
                      {customer.lastOrderNumber ? <Link href={`/painel/pedidos/${customer.lastOrderNumber}`} className="font-bold text-motta-red hover:underline">{customer.lastOrderNumber}</Link> : null}
                    </span>
                  </div>
                  {canWrite ? (
                    <button
                      type="button"
                      onClick={() => setEditing(customer)}
                      aria-label={`Editar cliente ${customer.name}`}
                      title="Editar cliente"
                      className={buttonStyles({ variant: "ghost", size: "sm" })}
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
      <p className="text-[11px] text-motta-gray-500">Dados pessoais acessíveis apenas a perfis autorizados. A exclusão anonimiza o cadastro e preserva o histórico de pedidos para fins fiscais e financeiros.</p>

      {canWrite && editing ? (
        <CustomerEditDialog
          customer={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      ) : null}
    </div>
  );
}
