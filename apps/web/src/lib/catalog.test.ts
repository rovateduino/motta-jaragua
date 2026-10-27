import { describe, expect, it } from "vitest";
import {
  catalogCategories,
  catalogProducts,
  getCatalogOffers,
  getDefaultQuantityMilli,
  getMaxQuantityMilli,
  getPricedProductBySlug,
  getPricedProducts,
  hasPromotion,
} from "./catalog";

const DEMO_NOW = new Date("2026-10-24T12:00:00-03:00");

describe("catálogo demo", () => {
  it("não tem ids, slugs ou SKUs duplicados", () => {
    expect(new Set(catalogProducts.map((product) => product.id)).size).toBe(
      catalogProducts.length,
    );
    expect(new Set(catalogProducts.map((product) => product.slug)).size).toBe(
      catalogProducts.length,
    );
    expect(new Set(catalogProducts.map((product) => product.sku)).size).toBe(
      catalogProducts.length,
    );
  });

  it("liga todos os produtos a um departamento existente", () => {
    const categorySlugs = new Set(catalogCategories.map((category) => category.slug));
    for (const product of catalogProducts) {
      expect(categorySlugs.has(product.categorySlug)).toBe(true);
    }
  });

  it("mantém preços, estoque e limites de quantidade válidos", () => {
    for (const product of getPricedProducts(DEMO_NOW)) {
      expect(product.priceCents).toBeGreaterThan(0);
      expect(product.basePriceCents).toBeGreaterThan(0);
      expect(product.stockQuantityMilli).toBeGreaterThan(0);
      expect(product.stepQuantityMilli).toBeGreaterThan(0);
      expect(product.minQuantityMilli).toBeGreaterThan(0);
      expect(getMaxQuantityMilli(product)).toBeGreaterThanOrEqual(
        product.minQuantityMilli,
      );
      expect(getDefaultQuantityMilli(product) % product.stepQuantityMilli).toBe(0);

      if (hasPromotion(product)) {
        expect(product.originalPriceCents).toBeGreaterThan(product.priceCents);
      }
    }
  });

  it("aplica promoções vigentes e ignora as demais", () => {
    const offers = getCatalogOffers(DEMO_NOW);
    expect(offers.map((product) => product.sku).sort()).toEqual([
      "ARR-001",
      "DET-001",
      "LEI-001",
      "PAT-001",
      "REF-001",
    ]);

    expect(getPricedProductBySlug("feijao-carioca-1kg", DEMO_NOW)).toMatchObject({
      priceCents: 790,
    });
    expect(
      getPricedProductBySlug("cafe-torrado-e-moido-500g", DEMO_NOW),
    ).toMatchObject({ priceCents: 1890 });
    expect(getPricedProductBySlug("suco-de-uva-integral-1l", DEMO_NOW)).toMatchObject({
      priceCents: 1290,
    });
  });

  it("encontra produtos por slug", () => {
    expect(getPricedProductBySlug("arroz-tipo-1-5kg", DEMO_NOW)?.name).toBe(
      "Arroz Tipo 1 5kg",
    );
    expect(getPricedProductBySlug("inexistente", DEMO_NOW)).toBeUndefined();
  });
});
