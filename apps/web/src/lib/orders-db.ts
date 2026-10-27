import "server-only";
import { cache } from "react";
import { prisma } from "@motta/db";
import type {
  Address,
  FulfillmentType,
  SubstitutionPreference,
} from "@motta/contracts";
import { type OrderStatus, type SaleUnit } from "@motta/domain";
import { productMeta } from "./catalog-meta";

/**
 * Acesso a pedidos e regras de negócio no PostgreSQL via Prisma.
 *
 * O carrinho continua vivendo no navegador para a experiência de compra, mas o
 * valor final do pedido e a criação de `Order`/`OrderItem` são autoridade do
 * servidor. Aqui ficam apenas leituras; a escrita transacional do checkout está
 * em `orders-actions.ts`.
 */

export interface StoreSettings {
  readonly storeId: string;
  readonly storeName: string;
  readonly deliveryEnabled: boolean;
  readonly pickupEnabled: boolean;
  readonly deliveryFeeCents: number;
  readonly freeShippingThresholdCents: number;
  readonly minimumOrderCents: number;
}

export interface PickupSlotView {
  readonly id: string;
  readonly label: string;
}

export interface OrderLineView {
  readonly id: string;
  readonly productId: string | null;
  readonly slug: string | null;
  readonly name: string;
  readonly brand: string;
  readonly emoji: string;
  readonly unit: SaleUnit;
  readonly unitPriceCents: number;
  readonly quantityMilli: number;
  readonly subtotalCents: number;
}

export interface OrderStatusEntryView {
  readonly status: OrderStatus;
  readonly at: string;
  readonly note: string | null;
}

export interface OrderSummaryView {
  readonly orderNumber: string;
  readonly status: OrderStatus;
  readonly createdAt: string;
  readonly fulfillmentType: FulfillmentType;
  readonly itemCount: number;
  readonly totalCents: number;
}

export interface AdminOrderRowView extends OrderSummaryView {
  readonly id: string;
  readonly contactName: string;
}

export interface OrderView extends OrderSummaryView {
  readonly substitutionPreference: SubstitutionPreference;
  readonly contactName: string;
  readonly contactPhone: string;
  readonly contactEmail: string | null;
  readonly address: Address | null;
  readonly pickupSlotId: string | null;
  readonly pickupSlotLabel: string | null;
  readonly notes: string | null;
  readonly subtotalCents: number;
  readonly deliveryFeeCents: number;
  readonly items: readonly OrderLineView[];
  readonly history: readonly OrderStatusEntryView[];
}

const SETTING_KEYS = {
  storeName: "store.name",
  deliveryEnabled: "delivery.enabled",
  pickupEnabled: "pickup.enabled",
  deliveryFeeCents: "delivery.feeCents",
  freeShippingThresholdCents: "delivery.freeAboveCents",
  minimumOrderCents: "order.minimumCents",
} as const;

const ORDER_NUMBER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Número de pedido no formato `MOTTA-XXXXXX`, único por restrição do banco. */
export function generateOrderNumber(): string {
  let suffix = "";
  for (let index = 0; index < 6; index += 1) {
    const position = Math.floor(Math.random() * ORDER_NUMBER_ALPHABET.length);
    suffix += ORDER_NUMBER_ALPHABET[position] ?? "0";
  }
  return `MOTTA-${suffix}`;
}

/** Identifica violação de unicidade do Prisma sem depender do namespace gerado. */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  );
}

function readJsonNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readJsonBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readJsonString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

/**
 * Regras de negócio da loja (frete, frete grátis, pedido mínimo e canais de
 * entrega) lidas da tabela `Setting`. Devolve `null` quando o banco não está
 * configurado ou não há loja ativa; falhas de consulta são propagadas.
 */
export const getStoreSettings = cache(async (): Promise<StoreSettings | null> => {
  if (!process.env.DATABASE_URL) return null;

  const store = await prisma.store.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });
  if (!store) return null;

  const rows = await prisma.setting.findMany({
    where: { key: { in: Object.values(SETTING_KEYS) } },
    select: { key: true, value: true },
  });
  const settings = new Map(rows.map((row) => [row.key, row.value]));

  return {
    storeId: store.id,
    storeName: readJsonString(settings.get(SETTING_KEYS.storeName), store.name),
    deliveryEnabled: readJsonBoolean(settings.get(SETTING_KEYS.deliveryEnabled), true),
    pickupEnabled: readJsonBoolean(settings.get(SETTING_KEYS.pickupEnabled), true),
    deliveryFeeCents: readJsonNumber(settings.get(SETTING_KEYS.deliveryFeeCents), 0),
    freeShippingThresholdCents: readJsonNumber(
      settings.get(SETTING_KEYS.freeShippingThresholdCents),
      0,
    ),
    minimumOrderCents: readJsonNumber(settings.get(SETTING_KEYS.minimumOrderCents), 0),
  };
});

function formatSlotDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

/** Rótulo legível de uma janela de retirada. */
function formatSlotLabel(date: Date, startTime: string, endTime: string): string {
  return `${formatSlotDate(date)} · das ${startTime} às ${endTime}`;
}

/** Janelas de retirada ativas a partir de hoje (modelo `DeliverySlot`). */
export async function listPickupSlots(storeId: string): Promise<PickupSlotView[]> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  try {
    const slots = await prisma.deliverySlot.findMany({
      where: { storeId, active: true, date: { gte: today } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      select: { id: true, date: true, startTime: true, endTime: true },
      take: 9,
    });

    return slots.map((slot) => ({
      id: slot.id,
      label: formatSlotLabel(slot.date, slot.startTime, slot.endTime),
    }));
  } catch (error) {
    console.error("Falha ao carregar as janelas de retirada:", error);
    return [];
  }
}

/** Data/hora de um pedido no fuso da loja. */
export function formatOrderDate(isoDate: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(isoDate));
}

function parseAddressSnapshot(value: unknown): Address | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const fields = [
    "recipient",
    "phone",
    "zipCode",
    "street",
    "number",
    "district",
    "city",
    "state",
  ] as const;

  for (const field of fields) {
    if (typeof record[field] !== "string" || !record[field]) return null;
  }

  return {
    recipient: record.recipient as string,
    phone: record.phone as string,
    zipCode: record.zipCode as string,
    street: record.street as string,
    number: record.number as string,
    district: record.district as string,
    city: record.city as string,
    state: record.state as string,
    ...(typeof record.complement === "string" && record.complement
      ? { complement: record.complement }
      : {}),
  };
}

interface OrderItemRow {
  readonly id: string;
  readonly productId: string | null;
  readonly productNameSnapshot: string;
  readonly unitSnapshot: SaleUnit;
  readonly unitPriceCents: number;
  readonly quantity: number;
  readonly subtotalCents: number;
  readonly product: { readonly slug: string; readonly brand: string | null } | null;
}

interface OrderStatusHistoryRow {
  readonly toStatus: OrderStatus;
  readonly createdAt: Date;
  readonly note: string | null;
}

interface OrderRow {
  readonly orderNumber: string;
  readonly status: OrderStatus;
  readonly fulfillmentType: FulfillmentType;
  readonly substitutionPreference: SubstitutionPreference;
  readonly contactName: string;
  readonly contactPhone: string;
  readonly contactEmail: string | null;
  readonly addressSnapshot: unknown;
  readonly deliverySlotId: string | null;
  readonly deliverySlot: {
    readonly date: Date;
    readonly startTime: string;
    readonly endTime: string;
  } | null;
  readonly notes: string | null;
  readonly subtotalCents: number;
  readonly deliveryFeeCents: number;
  readonly totalCents: number;
  readonly createdAt: Date;
  readonly items: readonly OrderItemRow[];
  readonly statusHistory: readonly OrderStatusHistoryRow[];
}

function toOrderView(row: OrderRow): OrderView {
  const items: OrderLineView[] = row.items.map((item) => {
    const slug = item.product?.slug ?? null;
    const meta = slug ? productMeta[slug] : undefined;
    return {
      id: item.id,
      productId: item.productId,
      slug,
      name: item.productNameSnapshot,
      brand: item.product?.brand ?? "",
      emoji: meta?.emoji ?? "🛒",
      unit: item.unitSnapshot,
      unitPriceCents: item.unitPriceCents,
      quantityMilli: item.quantity,
      subtotalCents: item.subtotalCents,
    };
  });

  return {
    orderNumber: row.orderNumber,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    fulfillmentType: row.fulfillmentType,
    itemCount: items.length,
    totalCents: row.totalCents,
    substitutionPreference: row.substitutionPreference,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    contactEmail: row.contactEmail,
    address: parseAddressSnapshot(row.addressSnapshot),
    pickupSlotId: row.deliverySlotId,
    pickupSlotLabel: row.deliverySlot
      ? formatSlotLabel(
          row.deliverySlot.date,
          row.deliverySlot.startTime,
          row.deliverySlot.endTime,
        )
      : null,
    notes: row.notes,
    subtotalCents: row.subtotalCents,
    deliveryFeeCents: row.deliveryFeeCents,
    items,
    history: row.statusHistory.map((entry) => ({
      status: entry.toStatus,
      at: entry.createdAt.toISOString(),
      note: entry.note,
    })),
  };
}

/** Pedidos do cliente autenticado, do mais recente para o mais antigo. */
export async function listCustomerOrders(
  customerId: string,
): Promise<OrderSummaryView[]> {
  try {
    const orders = await prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        orderNumber: true,
        status: true,
        createdAt: true,
        fulfillmentType: true,
        totalCents: true,
        _count: { select: { items: true } },
      },
    });

    return orders.map((order) => ({
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      fulfillmentType: order.fulfillmentType,
      itemCount: order._count.items,
      totalCents: order.totalCents,
    }));
  } catch (error) {
    console.error("Falha ao carregar os pedidos do cliente:", error);
    return [];
  }
}

/** Pedido do cliente autenticado; `null` se não existir ou não pertencer a ele. */
export async function getCustomerOrder(
  customerId: string,
  orderNumber: string,
): Promise<OrderView | null> {
  try {
    const order = await prisma.order.findFirst({
      where: { customerId, orderNumber },
      include: {
        items: {
          orderBy: { id: "asc" },
          include: { product: { select: { slug: true, brand: true } } },
        },
        statusHistory: { orderBy: { createdAt: "asc" } },
        deliverySlot: { select: { date: true, startTime: true, endTime: true } },
      },
    });

    return order ? toOrderView(order) : null;
  } catch (error) {
    console.error("Falha ao carregar o pedido do cliente:", error);
    return null;
  }
}

/** Fila real do painel: todos os pedidos gravados no banco. */
async function getActiveStoreId(): Promise<string | null> {
  const store = await prisma.store.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return store?.id ?? null;
}

export async function listAdminOrders(): Promise<AdminOrderRowView[]> {
  const storeId = await getActiveStoreId();
  if (!storeId) return [];
  const orders = await prisma.order.findMany({
    where: { storeId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      createdAt: true,
      fulfillmentType: true,
      totalCents: true,
      contactName: true,
      _count: { select: { items: true } },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    fulfillmentType: order.fulfillmentType,
    itemCount: order._count.items,
    totalCents: order.totalCents,
    contactName: order.contactName,
  }));
}

/** Pedido real para o painel, independentemente do cliente. */
export async function getAdminOrder(orderNumber: string): Promise<OrderView | null> {
  const storeId = await getActiveStoreId();
  if (!storeId) return null;
  const order = await prisma.order.findFirst({
    where: { orderNumber, storeId },
    include: {
      items: {
        orderBy: { id: "asc" },
        include: { product: { select: { slug: true, brand: true } } },
      },
      statusHistory: { orderBy: { createdAt: "asc" } },
      deliverySlot: { select: { date: true, startTime: true, endTime: true } },
    },
  });

  return order ? toOrderView(order) : null;
}

/** Pedidos ainda em andamento (nem concluídos, nem cancelados/reembolsados). */
export const countPendingOrders = cache(async (): Promise<number> => {
  const storeId = await getActiveStoreId();
  if (!storeId) return 0;
  return prisma.order.count({
    where: {
      storeId,
      deletedAt: null,
      status: { notIn: ["COMPLETED", "CANCELLED", "REFUNDED"] },
    },
  });
});
