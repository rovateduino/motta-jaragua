import "server-only";

import { prisma } from "@motta/db";
import {
  LOW_STOCK_THRESHOLD_MILLI,
  type AdminCategoryRecord,
  type AdminCustomerRecord,
  type AdminDeliveryData,
  type AdminProductRecord,
  type AdminPromotionRecord,
  type AdminStoreSettings,
} from "./admin-types";
import { productMeta } from "./catalog-meta";
import { getStoreSettings } from "./orders-db";

export { LOW_STOCK_THRESHOLD_MILLI } from "./admin-types";
export type {
  AdminCategoryRecord,
  AdminCustomerRecord,
  AdminDeliveryData,
  AdminProductRecord,
  AdminPromotionRecord,
  AdminStoreSettings,
} from "./admin-types";

export async function getAdminCatalogData(): Promise<{
  products: AdminProductRecord[];
  categories: AdminCategoryRecord[];
}> {
  const store = await prisma.store.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!store) return { products: [], categories: [] };

  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, slug: true, name: true },
    }),
    prisma.product.findMany({
      where: {
        OR: [
          { prices: { some: { storeId: store.id } } },
          { inventory: { some: { storeId: store.id } } },
        ],
      },
      orderBy: { name: "asc" },
      include: {
        category: { select: { id: true, slug: true, name: true } },
        prices: { where: { storeId: store.id }, select: { basePriceCents: true } },
        inventory: {
          where: { storeId: store.id },
          include: {
            movements: {
              orderBy: { createdAt: "desc" },
              take: 6,
              select: { id: true, delta: true, note: true, createdAt: true },
            },
          },
        },
      },
    }),
  ]);

  return {
    categories,
    products: products.map((product) => {
      const meta = productMeta[product.slug];
      const inventory = product.inventory[0];
      return {
        id: product.id,
        sku: product.sku,
        slug: product.slug,
        name: product.name,
        brand: product.brand ?? "",
        description: product.description ?? "",
        categoryId: product.categoryId,
        categorySlug: product.category.slug,
        categoryName: product.category.name,
        unit: product.unit,
        basePriceCents: product.prices[0]?.basePriceCents ?? 0,
        stockQuantityMilli: inventory?.onHand ?? 0,
        reservedQuantityMilli: inventory?.reserved ?? 0,
        active: product.active,
        emoji: meta?.emoji ?? product.category.name.slice(0, 2),
        packageLabel: meta?.packageLabel ?? product.unit,
        movements: (inventory?.movements ?? []).map((movement) => ({
          id: movement.id,
          delta: movement.delta,
          note: movement.note,
          createdAt: movement.createdAt.toISOString(),
        })),
      };
    }),
  };
}

export async function getAdminPromotionsData(): Promise<{
  products: AdminProductRecord[];
  promotions: AdminPromotionRecord[];
}> {
  const [catalog, store] = await Promise.all([
    getAdminCatalogData(),
    prisma.store.findFirst({
      where: { active: true },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    }),
  ]);
  if (!store) return { products: catalog.products, promotions: [] };

  const promotions = await prisma.promotion.findMany({
    where: { storeId: store.id },
    orderBy: [{ endsAt: "desc" }, { createdAt: "desc" }],
    include: {
      product: {
        select: {
          id: true,
          sku: true,
          slug: true,
          name: true,
          category: { select: { name: true } },
        },
      },
    },
  });
  const productById = new Map(catalog.products.map((product) => [product.id, product]));

  return {
    products: catalog.products,
    promotions: promotions.map((promotion) => {
      const product = productById.get(promotion.productId);
      return {
        id: promotion.id,
        productId: promotion.productId,
        sku: promotion.product.sku,
        productName: promotion.product.name,
        slug: promotion.product.slug,
        emoji: product?.emoji ?? "🏷️",
        basePriceCents: product?.basePriceCents ?? 0,
        promotionalPriceCents: promotion.promotionalPriceCents,
        startsAt: promotion.startsAt.toISOString(),
        endsAt: promotion.endsAt.toISOString(),
        active: promotion.active,
        conditions: promotion.conditions ?? "",
        maxQuantityPerOrderMilli: promotion.maxQuantityPerOrder,
      };
    }),
  };
}

export async function getAdminCustomers(): Promise<AdminCustomerRecord[]> {
  const store = await prisma.store.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!store) return [];
  const customers = await prisma.customer.findMany({
    where: { anonymizedAt: null, orders: { some: { storeId: store.id } } },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      orders: {
        where: { storeId: store.id },
        orderBy: { createdAt: "desc" },
        select: {
          orderNumber: true,
          totalCents: true,
          status: true,
          fulfillmentType: true,
          createdAt: true,
        },
      },
    },
  });

  return customers.map((customer) => {
    const revenueOrders = customer.orders.filter(
      (order) => order.status !== "CANCELLED" && order.status !== "REFUNDED",
    );
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone ?? "",
      orderCount: customer.orders.length,
      totalSpentCents: revenueOrders.reduce((sum, order) => sum + order.totalCents, 0),
      deliveryCount: customer.orders.filter((order) => order.fulfillmentType === "DELIVERY").length,
      pickupCount: customer.orders.filter((order) => order.fulfillmentType === "PICKUP").length,
      lastOrderAt: customer.orders[0]?.createdAt.toISOString() ?? null,
      lastOrderNumber: customer.orders[0]?.orderNumber ?? null,
    };
  });
}

export async function getAdminDeliveryData(): Promise<AdminDeliveryData> {
  const store = await prisma.store.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!store) return { settings: null, orders: [] };
  const [settings, orders] = await Promise.all([
    getStoreSettings(),
    prisma.order.findMany({
      where: { storeId: store.id, fulfillmentType: "DELIVERY" },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        contactName: true,
        totalCents: true,
        addressSnapshot: true,
        statusHistory: {
          orderBy: { createdAt: "asc" },
          select: { toStatus: true, createdAt: true },
        },
      },
    }),
  ]);

  return {
    settings,
    orders: orders.map((order) => {
      const address =
        typeof order.addressSnapshot === "object" && order.addressSnapshot !== null
          ? (order.addressSnapshot as Record<string, unknown>)
          : {};
      return {
        ...order,
        createdAt: order.createdAt.toISOString(),
        district: typeof address.district === "string" ? address.district : "",
        street: typeof address.street === "string" ? address.street : "",
        number: typeof address.number === "string" ? address.number : "",
        statusHistory: order.statusHistory.map((entry) => ({
          status: entry.toStatus,
          at: entry.createdAt.toISOString(),
        })),
      };
    }),
  };
}

export async function getAdminStoreSettings(): Promise<AdminStoreSettings | null> {
  const store = await prisma.store.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });
  if (!store) return null;

  const rows = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          "delivery.enabled",
          "pickup.enabled",
          "delivery.feeCents",
          "delivery.freeAboveCents",
          "order.minimumCents",
        ],
      },
    },
    select: { key: true, value: true },
  });
  const values = new Map(rows.map((row) => [row.key, row.value]));
  const numberValue = (key: string) => {
    const value = values.get(key);
    return typeof value === "number" ? value : 0;
  };
  const booleanValue = (key: string) => {
    const value = values.get(key);
    return typeof value === "boolean" ? value : true;
  };

  return {
    storeId: store.id,
    name: store.name,
    addressLine: store.addressLine,
    district: store.district,
    city: store.city,
    state: store.state,
    zipCode: store.zipCode,
    phone: store.phone ?? "",
    deliveryEnabled: booleanValue("delivery.enabled"),
    pickupEnabled: booleanValue("pickup.enabled"),
    deliveryFeeCents: numberValue("delivery.feeCents"),
    freeShippingThresholdCents: numberValue("delivery.freeAboveCents"),
    minimumOrderCents: numberValue("order.minimumCents"),
  };
}

export async function getAdminShellMetrics() {
  const now = new Date();
  const [store, settings] = await Promise.all([
    prisma.store.findFirst({
      where: { active: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
    getStoreSettings(),
  ]);
  if (!store) {
    return {
      storeName: "Mercado Motta Jaraguá",
      lowStockCount: 0,
      activePromotionCount: 0,
    };
  }
  const [inventory, activePromotionCount] = await Promise.all([
    prisma.inventory.findMany({
      where: { storeId: store.id, product: { active: true } },
      select: { onHand: true, reserved: true },
    }),
    prisma.promotion.count({
      where: {
        storeId: store.id,
        active: true,
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
    }),
  ]);
  return {
    storeName: settings?.storeName ?? store.name,
    lowStockCount: inventory.filter(
      (entry) => entry.onHand - entry.reserved <= LOW_STOCK_THRESHOLD_MILLI,
    ).length,
    activePromotionCount,
  };
}
