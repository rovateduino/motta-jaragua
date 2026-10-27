import type { OrderStatus, SaleUnit } from "@motta/domain";

export const LOW_STOCK_THRESHOLD_MILLI = 10_000;

export type PromotionState = "ACTIVE" | "SCHEDULED" | "EXPIRED" | "INACTIVE";

export interface AdminProductRecord {
  readonly id: string;
  readonly sku: string;
  readonly slug: string;
  readonly name: string;
  readonly brand: string;
  readonly description: string;
  readonly categoryId: string;
  readonly categorySlug: string;
  readonly categoryName: string;
  readonly unit: SaleUnit;
  readonly imageUrl: string;
  readonly basePriceCents: number;
  readonly stockQuantityMilli: number;
  readonly reservedQuantityMilli: number;
  readonly active: boolean;
  readonly emoji: string;
  readonly packageLabel: string;
  readonly movements: readonly {
    readonly id: string;
    readonly delta: number;
    readonly note: string | null;
    readonly createdAt: string;
  }[];
}

export interface AdminPromotionRecord {
  readonly id: string;
  readonly productId: string;
  readonly sku: string;
  readonly productName: string;
  readonly slug: string;
  readonly emoji: string;
  readonly basePriceCents: number;
  readonly promotionalPriceCents: number;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly active: boolean;
  readonly conditions: string;
  readonly maxQuantityPerOrderMilli: number | null;
}

export interface AdminCategoryRecord {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
}

export interface AdminUserRecord {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly active: boolean;
  readonly lastLoginAt: string | null;
  readonly roleIds: readonly string[];
  readonly roleNames: readonly string[];
}

export interface AdminCustomerRecord {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly orderCount: number;
  readonly totalSpentCents: number;
  readonly deliveryCount: number;
  readonly pickupCount: number;
  readonly lastOrderAt: string | null;
  readonly lastOrderNumber: string | null;
}

export interface AdminStoreSettings {
  readonly storeId: string;
  readonly name: string;
  readonly addressLine: string;
  readonly district: string;
  readonly city: string;
  readonly state: string;
  readonly zipCode: string;
  readonly phone: string;
  readonly deliveryEnabled: boolean;
  readonly pickupEnabled: boolean;
  readonly deliveryFeeCents: number;
  readonly freeShippingThresholdCents: number;
  readonly minimumOrderCents: number;
}

export interface AdminDeliveryData {
  readonly settings: {
    readonly storeName: string;
    readonly deliveryEnabled: boolean;
    readonly minimumOrderCents: number;
  } | null;
  readonly orders: readonly {
    readonly id: string;
    readonly orderNumber: string;
    readonly status: OrderStatus;
    readonly createdAt: string;
    readonly contactName: string;
    readonly totalCents: number;
    readonly district: string;
    readonly street: string;
    readonly number: string;
    readonly statusHistory: readonly {
      readonly status: OrderStatus;
      readonly at: string;
    }[];
  }[];
}

export interface AdminTopProduct {
  readonly productId: string;
  readonly name: string;
  readonly quantityMilli: number;
  readonly unit: SaleUnit;
  readonly revenueCents: number;
  readonly orderCount: number;
}

export interface AdminDashboardData {
  readonly todayOrderCount: number;
  readonly todaySalesCents: number;
  readonly pendingOrderCount: number;
  readonly last30SalesCents: number;
  readonly last30OrderCount: number;
  readonly averageTicketCents: number;
  readonly lowStockProducts: readonly {
    readonly id: string;
    readonly sku: string;
    readonly name: string;
    readonly slug: string;
    readonly unit: SaleUnit;
    readonly stockQuantityMilli: number;
    readonly emoji: string;
  }[];
  readonly recentOrders: readonly {
    readonly id: string;
    readonly orderNumber: string;
    readonly status: OrderStatus;
    readonly createdAt: string;
    readonly contactName: string;
    readonly totalCents: number;
  }[];
  readonly topProducts: readonly AdminTopProduct[];
  readonly activePromotionCount: number;
}

export interface AdminReportData {
  readonly periodDays: 7 | 30 | 90;
  readonly orderCount: number;
  readonly salesCents: number;
  readonly averageTicketCents: number;
  readonly cancellationCount: number;
  readonly cancellationRate: number;
  readonly topProducts: readonly AdminTopProduct[];
  readonly stockoutProducts: readonly {
    readonly id: string;
    readonly name: string;
    readonly unit: SaleUnit;
    readonly stockQuantityMilli: number;
    readonly minQuantityMilli: number;
  }[];
  readonly lowStockCount: number;
  readonly averageSeparationMinutes: number | null;
  readonly onTimeRate: number | null;
  readonly promotionPerformance: readonly {
    readonly id: string;
    readonly sku: string;
    readonly productName: string;
    readonly quantityMilli: number;
    readonly revenueCents: number;
    readonly orderCount: number;
  }[];
  readonly dailySales: readonly {
    readonly isoDate: string;
    readonly label: string;
    readonly salesCents: number;
    readonly orderCount: number;
  }[];
}
