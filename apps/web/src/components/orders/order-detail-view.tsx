import Link from "next/link";
import { formatBRL, formatQuantity, ORDER_STATUS_LABELS, type OrderStatus } from "@motta/domain";
import { Badge, buttonStyles, Card, CardBody, Container } from "@motta/ui";
import { formatOrderDate, type OrderView } from "@/lib/orders-db";
import { EmptyState } from "@/components/admin/shared";

function statusVariant(status: OrderStatus) {
  if (status === "CANCELLED" || status === "REFUNDED") return "danger" as const;
  if (status === "COMPLETED") return "success" as const;
  if (status === "RECEIVED") return "neutral" as const;
  return "offer" as const;
}

export function OrderDetailView({
  orderNumber,
  order,
}: {
  orderNumber: string;
  order: OrderView | null;
}) {
  if (!order) {
    return (
      <Container className="py-10">
        <EmptyState
          title="Pedido não encontrado"
          description={`Não encontramos o pedido ${orderNumber} na sua conta.`}
          action={<Link href="/pedidos" className={buttonStyles({ variant: "primary" })}>Meus pedidos</Link>}
        />
      </Container>
    );
  }

  return (
    <Container className="space-y-5 py-8 sm:py-10">
      <nav aria-label="Você está aqui" className="text-xs text-motta-gray-500"><Link href="/" className="hover:text-motta-red">Início</Link><span className="mx-1.5">/</span><Link href="/pedidos" className="hover:text-motta-red">Meus pedidos</Link><span className="mx-1.5">/</span>{order.orderNumber}</nav>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-3xl font-black text-motta-ink">{order.orderNumber}</h1><p className="mt-1 text-sm text-motta-gray-500">Pedido de {formatOrderDate(order.createdAt)}</p></div><Badge variant={statusVariant(order.status)}>{ORDER_STATUS_LABELS[order.status]}</Badge></div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card><CardBody><h2 className="text-lg font-extrabold">Itens do pedido</h2><ul className="mt-3 divide-y divide-motta-gray-200">{order.items.map((item) => <li key={item.id} className="flex justify-between gap-3 py-3"><div><p className="font-bold">{item.name}</p><p className="text-xs text-motta-gray-500">{formatQuantity(item.quantityMilli, item.unit)} × {formatBRL(item.unitPriceCents)}</p></div><strong>{formatBRL(item.subtotalCents)}</strong></li>)}</ul><dl className="space-y-2 border-t pt-3 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{formatBRL(order.subtotalCents)}</dd></div><div className="flex justify-between"><dt>Entrega</dt><dd>{order.deliveryFeeCents ? formatBRL(order.deliveryFeeCents) : "Grátis"}</dd></div><div className="flex justify-between border-t pt-2 text-base font-black"><dt>Total</dt><dd>{formatBRL(order.totalCents)}</dd></div></dl></CardBody></Card>
        <div className="space-y-4">
          <Card><CardBody><h2 className="text-lg font-extrabold">Recebimento</h2><p className="mt-2 text-sm">{order.fulfillmentType === "DELIVERY" ? "Entrega" : "Retirada na loja"}</p>{order.address ? <address className="mt-2 not-italic text-sm leading-relaxed text-motta-gray-700">{order.address.street}, {order.address.number}{order.address.complement ? ` · ${order.address.complement}` : ""}<br />{order.address.district}, {order.address.city}/{order.address.state}<br />CEP {order.address.zipCode}</address> : null}{order.pickupSlotLabel ? <p className="mt-2 text-sm">{order.pickupSlotLabel}</p> : null}</CardBody></Card>
          <Card><CardBody><h2 className="text-lg font-extrabold">Acompanhamento</h2><ol className="mt-3 space-y-3">{order.history.map((entry, index) => <li key={`${entry.status}-${entry.at}-${index}`} className="border-l-2 border-motta-red/30 pl-3"><p className="text-sm font-bold">{ORDER_STATUS_LABELS[entry.status]}</p><p className="text-xs text-motta-gray-500">{formatOrderDate(entry.at)}</p>{entry.note ? <p className="text-xs">{entry.note}</p> : null}</li>)}</ol></CardBody></Card>
        </div>
      </div>
    </Container>
  );
}
