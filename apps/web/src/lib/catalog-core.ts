import {
  discountPercentage,
  isPromotionActive,
  resolveEffectivePriceCents,
  type SaleUnit,
} from "@motta/domain";

/**
 * Núcleo do catálogo da loja pública: tipos e regras puras de preço, estoque
 * e disponibilidade. Não referencia nenhuma fonte de dados; a loja e o painel
 * consomem estes formatos a partir do PostgreSQL.
 */

export interface CatalogCategory {
  readonly slug: string;
  readonly name: string;
  readonly icon: string;
  readonly tagline: string;
  readonly description: string;
  readonly imageTone: string;
}

export interface CatalogProduct {
  readonly id: string;
  readonly sku: string;
  readonly slug: string;
  readonly name: string;
  readonly brand: string;
  readonly categorySlug: string;
  readonly unit: SaleUnit;
  readonly packageLabel: string;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly basePriceCents: number;
  readonly stockQuantityMilli: number;
  readonly maxOrderQuantityMilli?: number;
  readonly stepQuantityMilli: number;
  readonly minQuantityMilli: number;
  readonly emoji: string;
  readonly imageTone: string;
  readonly popularity: number;
}

export interface PricedCatalogProduct extends CatalogProduct {
  /** Preço efetivo considerando a promoção vigente. */
  readonly priceCents: number;
  /** Preço base, presente apenas quando há promoção vigente. */
  readonly originalPriceCents?: number;
  readonly promotion?: {
    readonly id: string;
    readonly conditions: string;
    readonly endsAt: string;
    readonly maxQuantityPerOrderMilli?: number;
  };
}

export type CatalogSearchProduct = PricedCatalogProduct & {
  readonly categoryName: string;
};

/** Promoção candidata a desconto, com os metadados exibidos na vitrine. */
export interface SelectedPromotion {
  readonly id: string;
  readonly promotionalPriceCents: number;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly active: boolean;
  readonly conditions?: string | null;
  readonly maxQuantityPerOrderMilli?: number | null;
}

/**
 * Aplica a promoção vigente sobre o preço base do produto. Só há desconto se a
 * janela estiver aberta para `now`, a promoção estiver ativa e o preço
 * promocional for realmente menor que a base (dados inválidos caem no preço
 * base em vez de quebrar a página).
 */
export function priceProductWithPromotion(
  product: CatalogProduct,
  promotion: SelectedPromotion | null,
  now: Date = new Date(),
): PricedCatalogProduct {
  if (
    !promotion ||
    promotion.promotionalPriceCents >= product.basePriceCents ||
    !isPromotionActive(promotion, now)
  ) {
    return { ...product, priceCents: product.basePriceCents };
  }

  return {
    ...product,
    priceCents: resolveEffectivePriceCents({
      basePriceCents: product.basePriceCents,
      promotion,
      now,
    }),
    originalPriceCents: product.basePriceCents,
    promotion: {
      id: promotion.id,
      conditions: promotion.conditions ?? "",
      endsAt: promotion.endsAt.toISOString(),
      ...(promotion.maxQuantityPerOrderMilli === null ||
      promotion.maxQuantityPerOrderMilli === undefined
        ? {}
        : { maxQuantityPerOrderMilli: promotion.maxQuantityPerOrderMilli }),
    },
  };
}

export function getMaxQuantityMilli(product: PricedCatalogProduct): number {
  const absoluteMax = product.maxOrderQuantityMilli ?? product.stockQuantityMilli;
  const promotionMax =
    product.promotion?.maxQuantityPerOrderMilli ?? product.stockQuantityMilli;
  return Math.min(product.stockQuantityMilli, absoluteMax, promotionMax);
}

export function isProductAvailable(product: PricedCatalogProduct): boolean {
  return getMaxQuantityMilli(product) >= product.minQuantityMilli;
}

export function getDefaultQuantityMilli(product: PricedCatalogProduct): number {
  return Math.min(product.minQuantityMilli, getMaxQuantityMilli(product));
}

export function hasPromotion(product: PricedCatalogProduct): boolean {
  return (
    product.originalPriceCents !== undefined &&
    product.originalPriceCents > product.priceCents
  );
}

export function getDiscountPercentage(
  product: PricedCatalogProduct,
): number | null {
  if (!hasPromotion(product) || product.originalPriceCents === undefined) return null;
  return discountPercentage(product.originalPriceCents, product.priceCents);
}

export function isLowStock(product: PricedCatalogProduct): boolean {
  return isProductAvailable(product) && product.stockQuantityMilli <= 10000;
}

export function getStockLabel(product: PricedCatalogProduct): string {
  if (!isProductAvailable(product)) return "Indisponível";
  if (isLowStock(product)) return "Últimas unidades";
  return "Disponível";
}

export function findCategory(
  categories: readonly CatalogCategory[],
  slug: string | null | undefined,
): CatalogCategory | undefined {
  if (!slug) return undefined;
  return categories.find((category) => category.slug === slug);
}

export function getCategoryLabel(
  categories: readonly CatalogCategory[],
  slug: string,
): string {
  return findCategory(categories, slug)?.name ?? "Departamento";
}

/** Produtos relacionados: mesmo departamento primeiro, depois popularidade. */
export function selectRelatedProducts(
  products: readonly PricedCatalogProduct[],
  product: PricedCatalogProduct,
  limit = 4,
): PricedCatalogProduct[] {
  return products
    .filter((candidate) => candidate.id !== product.id)
    .sort((a, b) => {
      const sameCategoryA = a.categorySlug === product.categorySlug ? 1 : 0;
      const sameCategoryB = b.categorySlug === product.categorySlug ? 1 : 0;
      if (sameCategoryA !== sameCategoryB) return sameCategoryB - sameCategoryA;
      return b.popularity - a.popularity;
    })
    .slice(0, limit);
}
