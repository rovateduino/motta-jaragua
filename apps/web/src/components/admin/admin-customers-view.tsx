"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatBRL } from "@motta/domain";
import { Card, CardBody, Input } from "@motta/ui";
import type { AdminCustomerRecord } from "@/lib/admin-types";
import { AdminPageHeader, EmptyState, StatCard } from "@/components/admin/shared";
import { formatAdminDate } from "@/lib/admin-format";

export function AdminCustomersView({ customers }: { customers: readonly AdminCustomerRecord[] }) {
  const [search, setSearch] = useState("");
  const [recurringOnly, setRecurringOnly] = useState(false);
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return customers.filter((customer) => {
      if (recurringOnly && customer.orderCount < 2) return false;
      return !query || `${customer.name} ${customer.email} ${customer.phone}`.toLocaleLowerCase("pt-BR").includes(query);
    });
  }, [customers, recurringOnly, search]);
  const recurringCount = customers.filter((customer) => customer.orderCount >= 2).length;
  const totalRevenue = customers.reduce((sum, customer) => sum + customer.totalSpentCents, 0);

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
      {filtered.length === 0 ? <EmptyState title="Nenhum cliente encontrado" description="Ajuste os filtros ou aguarde o cadastro de clientes." /> : (
        <Card className="overflow-hidden"><div className="hidden grid-cols-[1.3fr_1fr_0.6fr_0.8fr_0.8fr] gap-3 border-b bg-motta-gray-50 px-4 py-2.5 text-[11px] font-bold uppercase text-motta-gray-500 lg:grid"><span>Cliente</span><span>Contato</span><span className="text-right">Pedidos</span><span className="text-right">Total</span><span className="text-right">Último pedido</span></div>
          <ul className="divide-y divide-motta-gray-200">{filtered.map((customer) => <li key={customer.id} className="grid gap-2 px-4 py-3 text-sm lg:grid-cols-[1.3fr_1fr_0.6fr_0.8fr_0.8fr] lg:items-center lg:gap-3">
            <div className="min-w-0"><p className="truncate font-bold">{customer.name}</p><p className="text-[11px] text-motta-gray-500">{customer.deliveryCount} entrega(s) · {customer.pickupCount} retirada(s)</p></div>
            <div className="min-w-0 text-xs"><p>{customer.phone || "Sem telefone"}</p><p className="truncate text-motta-gray-500">{customer.email}</p></div>
            <span className="text-xs lg:text-right">{customer.orderCount}</span><span className="font-black lg:text-right">{formatBRL(customer.totalSpentCents)}</span>
            <span className="flex flex-wrap items-center gap-2 text-xs text-motta-gray-500 lg:justify-end">{customer.lastOrderAt ? formatAdminDate(customer.lastOrderAt) : "—"}{customer.lastOrderNumber ? <Link href={`/painel/pedidos/${customer.lastOrderNumber}`} className="font-bold text-motta-red hover:underline">{customer.lastOrderNumber}</Link> : null}</span>
          </li>)}</ul>
        </Card>
      )}
      <p className="text-[11px] text-motta-gray-500">Dados pessoais acessíveis apenas a perfis autorizados. Observe as políticas de privacidade e retenção de dados.</p>
    </div>
  );
}
