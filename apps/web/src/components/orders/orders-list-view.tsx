import Link from "next/link";
import { formatBRL, ORDER_STATUS_LABELS, type OrderStatus } from "@motta/domain";
import {
  ArrowRightIcon,
  Badge,
  buttonStyles,
  Card,
  CardBody,
  ClipboardListIcon,
  Container,
} from "@motta/ui";
import { formatOrderDate, type OrderSummaryView } from "@/lib/orders-db";

function statusVariant(status: OrderStatus) {
  if (status === "CANCELLED" || status === "REFUNDED") return "danger" as const;
  if (status === "COMPLETED") return "success" as const;
  if (status === "RECEIVED") return "neutral" as const;
  return "offer" as const;
}

export function OrdersListView({ orders }: { orders: readonly OrderSummaryView[] }) {
  return (
    <Container className="py-8 sm:py-10">
      <nav aria-label="Você está aqui" className="mb-4 text-xs text-motta-gray-500">
        <Link href="/" className="hover:text-motta-red hover:underline">
          Início
        </Link>
        <span className="mx-1.5">/</span>
        <span aria-current="page" className="font-semibold text-motta-ink">
          Meus pedidos
        </span>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-motta-ink sm:text-4xl">
              Meus pedidos
            </h1>
            <Badge variant="demo">Demonstração</Badge>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-motta-gray-500">
            Pedidos registrados na sua conta. Nenhum pagamento é processado neste
            ambiente de demonstração.
          </p>
        </div>
        <Link href="/catalogo" className={buttonStyles({ variant: "outline" })}>
          Continuar comprando
        </Link>
      </div>

      {orders.length === 0 ? (
        <Card className="mx-auto mt-8 max-w-2xl text-center">
          <CardBody className="px-6 py-12">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-motta-gray-100 text-motta-gray-500">
              <ClipboardListIcon className="h-8 w-8" />
            </span>
            <h2 className="mt-4 text-xl font-black text-motta-ink">
              Você ainda não fez pedidos
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-motta-gray-500">
              Monte um carrinho e finalize o checkout para acompanhar o pedido aqui.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/catalogo" className={buttonStyles({ variant: "primary" })}>
                Ver catálogo
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link href="/ofertas" className={buttonStyles({ variant: "outline" })}>
                Ver ofertas
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((order) => (
            <li key={order.orderNumber}>
              <Link
                href={`/pedidos/${order.orderNumber}`}
                className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-motta-red focus-visible:ring-offset-2"
              >
                <Card className="transition-colors hover:border-motta-gray-300">
                  <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold tracking-wide text-motta-ink">
                          {order.orderNumber}
                        </span>
                        <Badge variant={statusVariant(order.status)}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-motta-gray-500">
                        {formatOrderDate(order.createdAt)} •{" "}
                        {order.fulfillmentType === "DELIVERY" ? "Entrega" : "Retirada"} •{" "}
                        {order.itemCount === 1 ? "1 item" : `${order.itemCount} itens`}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <span className="text-lg font-black text-motta-ink">
                        {formatBRL(order.totalCents)}
                      </span>
                      <ArrowRightIcon className="h-4 w-4 text-motta-gray-500" />
                    </div>
                  </CardBody>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
