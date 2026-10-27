import Link from "next/link";
import { formatBRL, formatQuantity, ORDER_STATUS_LABELS } from "@motta/domain";
import { buttonStyles, Card, CardBody, ClipboardListIcon } from "@motta/ui";
import type { OrderView } from "@/lib/orders-db";
import {
  AdminPageHeader,
  StatusBadge,
} from "@/components/admin/shared";
import { formatAdminDateTime } from "@/lib/admin-format";
import { nextStatuses } from "@motta/domain";
import { AdminOrderStatusForm } from "./admin-order-status-form";

export function AdminOrderDetailView({
  orderNumber,
  order,
  canUpdateStatus,
}: {
  orderNumber: string;
  order: OrderView | null;
  canUpdateStatus: boolean;
}) {
  if (!order) {
    return (
      <Card>
        <CardBody className="px-6 py-10 text-center">
          <h1 className="text-xl font-black text-motta-ink">Pedido não encontrado</h1>
          <p className="mt-2 text-sm text-motta-gray-500">
            O pedido <span className="font-mono">{orderNumber}</span> não está no banco.
          </p>
          <Link
            href="/painel/pedidos"
            className={buttonStyles({ variant: "primary", size: "md" })}
          >
            Voltar para pedidos
          </Link>
        </CardBody>
      </Card>
    );
  }

  const substitutionLabels = {
    DO_NOT_SUBSTITUTE: "Não substituir",
    CONTACT_BEFORE: "Consultar antes",
    ACCEPT_EQUIVALENT: "Aceitar equivalente",
    REMOVE_ITEM: "Remover item indisponível",
  } as const;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Pedido"
        title={order.orderNumber}
        description={`Criado em ${formatAdminDateTime(order.createdAt)} • ${
          order.fulfillmentType === "DELIVERY" ? "Entrega" : "Retirada"
        }`}
        actions={
          <>
            <Link
              href={`/pedidos/${order.orderNumber}`}
              className={buttonStyles({ variant: "outline" })}
            >
              Visão do cliente
            </Link>
            <Link href="/painel/pedidos" className={buttonStyles({ variant: "primary" })}>
              Voltar para pedidos
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={order.status} />
        <span className="rounded-md bg-motta-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-motta-gray-500">
          Pedido no banco
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] xl:items-start">
        <div className="space-y-4">
          <Card>
            <CardBody className="space-y-4">
              <h2 className="text-lg font-extrabold text-motta-ink">Itens do pedido</h2>
              <ul className="divide-y divide-motta-gray-200">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-motta-gray-50 text-2xl"
                    >
                      {item.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-motta-ink">{item.name}</p>
                      <p className="text-[11px] text-motta-gray-500">
                        {formatQuantity(item.quantityMilli, item.unit)} ×{" "}
                        {formatBRL(item.unitPriceCents)}
                        {item.brand ? ` • ${item.brand}` : ""}
                      </p>
                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-motta-gray-500">
                        Preço e descrição capturados no momento do pedido
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-extrabold text-motta-ink">
                      {formatBRL(item.subtotalCents)}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="space-y-2 border-t border-motta-gray-200 pt-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-motta-gray-700">Subtotal</dt>
                  <dd className="font-semibold text-motta-ink">
                    {formatBRL(order.subtotalCents)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-motta-gray-700">
                    {order.fulfillmentType === "DELIVERY" ? "Entrega" : "Retirada"}
                  </dt>
                  <dd className="font-semibold text-motta-ink">
                    {order.deliveryFeeCents === 0 ? "Grátis" : formatBRL(order.deliveryFeeCents)}
                  </dd>
                </div>
                <div className="flex items-end justify-between border-t border-motta-gray-200 pt-2">
                  <dt className="text-sm font-bold text-motta-ink">Total</dt>
                  <dd className="text-2xl font-black text-motta-ink">
                    {formatBRL(order.totalCents)}
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2 className="text-lg font-extrabold text-motta-ink">Trilha de status</h2>
              <p className="text-xs text-motta-gray-500">
                Histórico de transições registradas no banco para este pedido.
              </p>
              <ol className="mt-4 space-y-3">
                {order.history.map((entry, index) => (
                  <li key={`${entry.status}-${entry.at}-${index}`} className="flex gap-3">
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-motta-red/10 text-[10px] font-black text-motta-red">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-motta-ink">
                        {ORDER_STATUS_LABELS[entry.status]}
                      </p>
                      <p className="text-[11px] text-motta-gray-500">
                        {formatAdminDateTime(entry.at)}
                      </p>
                      {entry.note ? (
                        <p className="mt-0.5 text-xs text-motta-gray-700">{entry.note}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardBody className="space-y-2">
              <h2 className="inline-flex items-center gap-2 text-lg font-extrabold text-motta-ink">
                <ClipboardListIcon className="h-5 w-5 text-motta-red" />
                Atualizar status
              </h2>
              {canUpdateStatus ? (
                <AdminOrderStatusForm
                  orderNumber={order.orderNumber}
                  currentStatus={order.status}
                  allowedStatuses={nextStatuses(order.status)}
                />
              ) : (
                <p className="text-xs leading-relaxed text-motta-gray-700">
                  Seu perfil tem acesso somente de leitura para este pedido.
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-2 text-sm">
              <h2 className="text-lg font-extrabold text-motta-ink">
                {order.fulfillmentType === "DELIVERY" ? "Entrega" : "Retirada"}
              </h2>
              {order.fulfillmentType === "DELIVERY" && order.address ? (
                <address className="not-italic leading-relaxed text-motta-gray-700">
                  <strong className="text-motta-ink">{order.address.recipient}</strong>
                  <br />
                  {order.address.street}, {order.address.number}
                  {order.address.complement ? ` — ${order.address.complement}` : ""}
                  <br />
                  {order.address.district} • {order.address.city}/{order.address.state}
                  <br />
                  CEP {order.address.zipCode}
                </address>
              ) : (
                <p className="leading-relaxed text-motta-gray-700">
                  {order.pickupSlotLabel ?? "Janela a combinar"}
                </p>
              )}
              <div className="border-t border-motta-gray-200 pt-2 text-xs text-motta-gray-500">
                <p>
                  Contato: <strong className="text-motta-ink">{order.contactName}</strong>
                </p>
                <p>{order.contactPhone}</p>
                {order.contactEmail ? <p>{order.contactEmail}</p> : null}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-2 text-sm">
              <h2 className="text-lg font-extrabold text-motta-ink">Substituição</h2>
              <p className="text-motta-gray-700">
                {substitutionLabels[order.substitutionPreference]}
              </p>
              {order.notes ? (
                <p className="border-t border-motta-gray-200 pt-2 text-xs leading-relaxed text-motta-gray-700">
                  <span className="block font-bold uppercase tracking-wide text-motta-gray-500">
                    Observações do cliente
                  </span>
                  {order.notes}
                </p>
              ) : null}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
