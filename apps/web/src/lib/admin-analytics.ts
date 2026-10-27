import "server-only";

import type { SaleUnit } from "@motta/domain";
import { prisma } from "@motta/db";
import {
  LOW_STOCK_THRESHOLD_MILLI,
  type AdminDashboardData,
  type AdminReportData,
  type AdminTopProduct,
} from "./admin-types";
import { productMeta } from "./catalog-meta";

export type { AdminTopProduct } from "./admin-types";

const ignoredRevenueStatuses = new Set(["CANCELLED", "REFUNDED"]);
const pendingStatuses = [
  "RECEIVED",
  "CONFIRMED",
  "SEPARATING",
  "AWAITING_SUBSTITUTION",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
] as const;

function startOfStoreDay(date: Date): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return new Date(`${value("year")}-${value("month")}-${value("day")}T03:00:00.000Z`);
}

function isRevenueStatus(status: string): boolean {
  return !ignoredRevenueStatuses.has(status);
}

interface OrderAnalyticsRow {
  readonly id: string;
  readonly status: string;
  readonly createdAt: Date;
  readonly totalCents: number;
  readonly items: readonly {
    readonly productId: string | null;
    readonly productNameSnapshot: string;
    readonly quantity: number;
    readonly unitSnapshot: SaleUnit;
    readonly subtotalCents: number;
    readonly unitPriceCents: number;
  }[];
  readonly statusHistory: readonly {
    readonly toStatus: string;
    readonly createdAt: Date;
  }[];
}

function aggregateProducts(orders: readonly OrderAnalyticsRow[]): AdminTopProduct[] {
  const values = new Map<string, {
    name: string;
    quantityMilli: number;
    unit: OrderAnalyticsRow["items"][number]["unitSnapshot"];
    revenueCents: number;
    orders: Set<string>;
  }>();
  for (const order of orders) {
    if (!isRevenueStatus(order.status)) continue;
    for (const item of order.items) {
      const id = item.productId ?? item.productNameSnapshot;
      const current = values.get(id) ?? {
        name: item.productNameSnapshot,
        quantityMilli: 0,
        unit: item.unitSnapshot,
        revenueCents: 0,
        orders: new Set<string>(),
      };
      current.quantityMilli += item.quantity;
      current.revenueCents += item.subtotalCents;
      current.orders.add(order.id);
      values.set(id, current);
    }
  }
  return Array.from(values, ([productId, value]) => ({
    productId,
    name: value.name,
    quantityMilli: value.quantityMilli,
    unit: value.unit,
    revenueCents: value.revenueCents,
    orderCount: value.orders.size,
  })).sort((a, b) => b.revenueCents - a.revenueCents).slice(0, 5);
}

async function loadOrders(since: Date, storeId: string): Promise<OrderAnalyticsRow[]> {
  return prisma.order.findMany({
    where: { storeId, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      totalCents: true,
      items: {
        select: {
          productId: true,
          productNameSnapshot: true,
          quantity: true,
          unitSnapshot: true,
          subtotalCents: true,
          unitPriceCents: true,
        },
      },
      statusHistory: {
        orderBy: { createdAt: "asc" },
        select: { toStatus: true, createdAt: true },
      },
    },
  });
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const now = new Date();
  const todayStart = startOfStoreDay(now);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const store = await prisma.store.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!store) {
    return {
      todayOrderCount: 0,
      todaySalesCents: 0,
      pendingOrderCount: 0,
      last30SalesCents: 0,
      last30OrderCount: 0,
      averageTicketCents: 0,
      lowStockProducts: [],
      recentOrders: [],
      topProducts: [],
      activePromotionCount: 0,
    };
  }
  const [orders, inventory, activePromotionCount, pendingOrderCount, allOrders] = await Promise.all([
    loadOrders(thirtyDaysAgo, store.id),
    prisma.inventory.findMany({
      where: { storeId: store.id, product: { active: true } },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            slug: true,
            unit: true,
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { onHand: "asc" },
    }),
    prisma.promotion.count({
      where: { storeId: store.id, active: true, startsAt: { lte: now }, endsAt: { gt: now } },
    }),
    prisma.order.count({
      where: { storeId: store.id, status: { in: [...pendingStatuses] } },
    }),
    prisma.order.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        contactName: true,
        totalCents: true,
      },
    }),
  ]);
  const revenueOrders = orders.filter((order) => isRevenueStatus(order.status));
  const revenueCents = revenueOrders.reduce((sum, order) => sum + order.totalCents, 0);
  const lowStockProducts = inventory
    // Reservas órfãs (reserved > onHand) não podem derrubar o painel: o
    // disponível é limitado a zero até a conciliação da reserva.
    .map((entry) => ({
      entry,
      availableMilli: Math.max(0, entry.onHand - entry.reserved),
    }))
    .filter(({ availableMilli }) => availableMilli <= LOW_STOCK_THRESHOLD_MILLI)
    .sort((left, right) => left.availableMilli - right.availableMilli)
    .slice(0, 6)
    .map(({ entry, availableMilli }) => ({
      id: entry.product.id,
      sku: entry.product.sku,
      name: entry.product.name,
      slug: entry.product.slug,
      unit: entry.product.unit,
      stockQuantityMilli: availableMilli,
      emoji: productMeta[entry.product.slug]?.emoji ?? "🛒",
    }));
  return {
    todayOrderCount: orders.filter((order) => order.createdAt >= todayStart).length,
    todaySalesCents: orders
      .filter((order) => order.createdAt >= todayStart && isRevenueStatus(order.status))
      .reduce((sum, order) => sum + order.totalCents, 0),
    pendingOrderCount,
    last30SalesCents: revenueCents,
    last30OrderCount: revenueOrders.length,
    averageTicketCents: revenueOrders.length ? Math.round(revenueCents / revenueOrders.length) : 0,
    lowStockProducts,
    recentOrders: allOrders.map((order) => ({
      ...order,
      createdAt: order.createdAt.toISOString(),
    })),
    topProducts: aggregateProducts(orders),
    activePromotionCount,
  };
}

export async function getAdminReportData(periodDays: 7 | 30 | 90): Promise<AdminReportData> {
  const now = new Date();
  const rangeStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const store = await prisma.store.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!store) {
    return {
      periodDays,
      orderCount: 0,
      salesCents: 0,
      averageTicketCents: 0,
      cancellationCount: 0,
      cancellationRate: 0,
      topProducts: [],
      stockoutProducts: [],
      lowStockCount: 0,
      averageSeparationMinutes: null,
      onTimeRate: null,
      promotionPerformance: [],
      dailySales: [],
    };
  }
  const [orders, inventory, promotions] = await Promise.all([
    loadOrders(rangeStart, store.id),
    prisma.inventory.findMany({
      where: { storeId: store.id, product: { active: true } },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            slug: true,
            unit: true,
          },
        },
      },
    }),
    prisma.promotion.findMany({
      where: { storeId: store.id, startsAt: { lte: now }, endsAt: { gte: rangeStart } },
      include: { product: { select: { id: true, sku: true, name: true } } },
    }),
  ]);
  const validOrders = orders.filter((order) => isRevenueStatus(order.status));
  const totalSales = validOrders.reduce((sum, order) => sum + order.totalCents, 0);
  const cancellationCount = orders.filter((order) => order.status === "CANCELLED").length;
  const separationMinutes: number[] = [];
  for (const order of validOrders) {
    const confirmed = order.statusHistory.find((entry) => entry.toStatus === "CONFIRMED");
    const separating = order.statusHistory.find((entry) => entry.toStatus === "SEPARATING");
    if (confirmed && separating) {
      const minutes = (separating.createdAt.getTime() - confirmed.createdAt.getTime()) / 60_000;
      if (minutes >= 0) separationMinutes.push(minutes);
    }
  }
  const completedOrders = orders.filter((order) => order.status === "COMPLETED");
  const withinDay = completedOrders.filter((order) => {
    const completed = order.statusHistory.find((entry) => entry.toStatus === "COMPLETED");
    return completed && completed.createdAt.getTime() - order.createdAt.getTime() <= 86_400_000;
  }).length;
  const days = Math.min(periodDays, 14);
  const dailySales = Array.from({ length: days }, (_, index) => {
    const day = new Date(startOfStoreDay(now).getTime() - (days - index - 1) * 86_400_000);
    const nextDay = new Date(day.getTime() + 86_400_000);
    const dayOrders = validOrders.filter((order) => order.createdAt >= day && order.createdAt < nextDay);
    return {
      isoDate: day.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "America/Sao_Paulo" }).format(day),
      salesCents: dayOrders.reduce((sum, order) => sum + order.totalCents, 0),
      orderCount: dayOrders.length,
    };
  });
  const promotionPerformance = promotions.map((promotion) => {
    const lines = validOrders.flatMap((order) =>
      order.createdAt >= promotion.startsAt && order.createdAt <= promotion.endsAt
        ? order.items.filter((item) =>
            item.productId === promotion.productId &&
            item.unitPriceCents === promotion.promotionalPriceCents,
          )
        : [],
    );
    return {
      id: promotion.id,
      sku: promotion.product.sku,
      productName: promotion.product.name,
      quantityMilli: lines.reduce((sum, item) => sum + item.quantity, 0),
      revenueCents: lines.reduce((sum, item) => sum + item.subtotalCents, 0),
      orderCount: new Set(
        validOrders
          .filter((order) =>
            order.createdAt >= promotion.startsAt && order.createdAt <= promotion.endsAt &&
            order.items.some((item) => item.productId === promotion.productId && item.unitPriceCents === promotion.promotionalPriceCents),
          )
          .map((order) => order.id),
      ).size,
    };
  }).filter((promotion) => promotion.orderCount > 0);
  const stockoutProducts = inventory
    // Mesma blindagem do dashboard: reserva órfã não pode gerar quantidade
    // negativa (formatQuantity lança DomainError e a página quebraria).
    .map((entry) => ({
      entry,
      availableMilli: Math.max(0, entry.onHand - entry.reserved),
    }))
    .filter(({ entry, availableMilli }) => availableMilli <= entry.reorderPoint)
    .map(({ entry, availableMilli }) => ({
      id: entry.product.id,
      name: entry.product.name,
      unit: entry.product.unit,
      stockQuantityMilli: availableMilli,
      minQuantityMilli: entry.reorderPoint,
    }));

  return {
    periodDays,
    orderCount: validOrders.length,
    salesCents: totalSales,
    averageTicketCents: validOrders.length ? Math.round(totalSales / validOrders.length) : 0,
    cancellationCount,
    cancellationRate: orders.length ? Math.round((cancellationCount / orders.length) * 100) : 0,
    topProducts: aggregateProducts(orders),
    stockoutProducts,
    lowStockCount: inventory.filter((entry) => Math.max(0, entry.onHand - entry.reserved) <= LOW_STOCK_THRESHOLD_MILLI).length,
    averageSeparationMinutes: separationMinutes.length
      ? Math.round(separationMinutes.reduce((sum, value) => sum + value, 0) / separationMinutes.length)
      : null,
    onTimeRate: completedOrders.length ? Math.round((withinDay / completedOrders.length) * 100) : null,
    promotionPerformance,
    dailySales,
  };
}
