import { isPromotionActive, type PromotionWindow } from "@motta/domain";

/**
 * Promoções FICTÍCIAS da loja demo, com janela de vigência real.
 *
 * As datas são fixas para que as regras de ativação e expiração possam ser
 * testadas: existem campanhas ativas, agendadas, expiradas e inativas. Nenhum
 * valor é comercial.
 */
export interface DemoPromotion extends PromotionWindow {
  readonly id: string;
  readonly sku: string;
  readonly conditions: string;
  readonly maxQuantityPerOrderMilli?: number;
}

const demoPromotions: readonly DemoPromotion[] = [
  {
    id: "promo-demo-arr-001",
    sku: "ARR-001",
    promotionalPriceCents: 2190,
    startsAt: new Date("2026-10-01T00:00:00-03:00"),
    endsAt: new Date("2027-12-31T23:59:59-03:00"),
    active: true,
    maxQuantityPerOrderMilli: 5000,
    conditions: "Oferta demonstrativa limitada a 5 unidades por pedido.",
  },
  {
    id: "promo-demo-pat-001",
    sku: "PAT-001",
    promotionalPriceCents: 7990,
    startsAt: new Date("2026-10-01T00:00:00-03:00"),
    endsAt: new Date("2027-12-31T23:59:59-03:00"),
    active: true,
    maxQuantityPerOrderMilli: 3000,
    conditions: "Oferta demonstrativa limitada a 3 kg por pedido.",
  },
  {
    id: "promo-demo-ref-001",
    sku: "REF-001",
    promotionalPriceCents: 749,
    startsAt: new Date("2026-10-01T00:00:00-03:00"),
    endsAt: new Date("2027-12-31T23:59:59-03:00"),
    active: true,
    maxQuantityPerOrderMilli: 6000,
    conditions: "Oferta demonstrativa limitada a 6 unidades por pedido.",
  },
  {
    id: "promo-demo-det-001",
    sku: "DET-001",
    promotionalPriceCents: 249,
    startsAt: new Date("2026-10-01T00:00:00-03:00"),
    endsAt: new Date("2027-12-31T23:59:59-03:00"),
    active: true,
    conditions: "Oferta demonstrativa enquanto durar o estoque fictício.",
  },
  {
    id: "promo-demo-lei-001",
    sku: "LEI-001",
    promotionalPriceCents: 479,
    startsAt: new Date("2026-10-01T00:00:00-03:00"),
    endsAt: new Date("2027-12-31T23:59:59-03:00"),
    active: true,
    maxQuantityPerOrderMilli: 12000,
    conditions: "Oferta demonstrativa limitada a 12 unidades por pedido.",
  },
  {
    id: "promo-demo-fei-001",
    sku: "FEI-001",
    promotionalPriceCents: 690,
    startsAt: new Date("2028-01-01T00:00:00-03:00"),
    endsAt: new Date("2028-12-31T23:59:59-03:00"),
    active: true,
    maxQuantityPerOrderMilli: 5000,
    conditions: "Campanha demonstrativa agendada; ainda não está vigente.",
  },
  {
    id: "promo-demo-caf-001",
    sku: "CAF-001",
    promotionalPriceCents: 1690,
    startsAt: new Date("2025-01-01T00:00:00-03:00"),
    endsAt: new Date("2025-12-31T23:59:59-03:00"),
    active: true,
    conditions: "Campanha demonstrativa expirada; deve ser ignorada pela loja.",
  },
  {
    id: "promo-demo-suc-001",
    sku: "SUC-001",
    promotionalPriceCents: 1190,
    startsAt: new Date("2026-01-01T00:00:00-03:00"),
    endsAt: new Date("2027-12-31T23:59:59-03:00"),
    active: false,
    conditions: "Campanha demonstrativa desativada manualmente.",
  },
];

const promotionBySku = new Map(
  demoPromotions.map((promotion) => [promotion.sku, promotion]),
);

export function getPromotionBySku(sku: string): DemoPromotion | undefined {
  return promotionBySku.get(sku);
}

/** Retorna somente a promoção vigente (ativa, iniciada e não expirada). */
export function getActivePromotion(
  sku: string,
  now: Date = new Date(),
): DemoPromotion | null {
  const promotion = promotionBySku.get(sku);
  if (!promotion) return null;
  return isPromotionActive(promotion, now) ? promotion : null;
}

export function getDemoPromotions(): readonly DemoPromotion[] {
  return demoPromotions;
}
