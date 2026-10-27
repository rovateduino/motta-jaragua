import { describe, expect, it } from "vitest";
import { getMaxQuantityMilli, getPricedProductBySlug } from "./catalog";
import { getActivePromotion, getDemoPromotions } from "./promotions";

const DURING = new Date("2026-10-24T12:00:00-03:00");

describe("promoções demo", () => {
  it("considera ativa apenas a campanha dentro da janela", () => {
    expect(getActivePromotion("ARR-001", DURING)?.promotionalPriceCents).toBe(2190);
    expect(getActivePromotion("FEI-001", DURING)).toBeNull();
    expect(getActivePromotion("CAF-001", DURING)).toBeNull();
    expect(getActivePromotion("SUC-001", DURING)).toBeNull();
  });

  it("não aplica promoção antes do início, depois do fim ou inativa", () => {
    const before = new Date("2026-09-30T23:59:59-03:00");
    const after = new Date("2028-01-01T00:00:00-03:00");

    expect(getActivePromotion("ARR-001", before)).toBeNull();
    expect(getActivePromotion("ARR-001", after)).toBeNull();
    expect(getActivePromotion("SUC-001", DURING)).toBeNull();

    expect(getPricedProductBySlug("arroz-tipo-1-5kg", before)?.priceCents).toBe(2490);
    expect(getPricedProductBySlug("arroz-tipo-1-5kg", after)?.priceCents).toBe(2490);
    expect(getPricedProductBySlug("suco-de-uva-integral-1l", DURING)?.priceCents).toBe(
      1290,
    );
  });

  it("expõe todas as campanhas fictícias com janelas válidas", () => {
    for (const promotion of getDemoPromotions()) {
      expect(promotion.endsAt.getTime()).toBeGreaterThan(promotion.startsAt.getTime());
      expect(promotion.promotionalPriceCents).toBeGreaterThan(0);
    }
  });

  it("aplica o limite por pedido somente enquanto a promoção vale", () => {
    const during = getPricedProductBySlug("arroz-tipo-1-5kg", DURING);
    const after = getPricedProductBySlug(
      "arroz-tipo-1-5kg",
      new Date("2028-01-01T00:00:00-03:00"),
    );

    expect(during).toBeDefined();
    expect(after).toBeDefined();
    expect(during ? getMaxQuantityMilli(during) : 0).toBe(5000);
    expect(after ? getMaxQuantityMilli(after) : 0).toBe(48000);
  });
});
