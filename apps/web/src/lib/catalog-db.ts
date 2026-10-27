import "server-only";
import { cache } from "react";
import { prisma } from "@motta/db";
import {
  isPromotionActive,
  normalizeSearchText,
  type SaleUnit,
} from "@motta/domain";
import {
  priceProductWithPromotion,
  type CatalogCategory,
  type CatalogProduct,
  type PricedCatalogProduct,
  type SelectedPromotion,
} from "./catalog-core";
import { categoryMeta, productMeta } from "./catalog-meta";

/**
 * Acesso a dados do catálogo da loja pública via Prisma/PostgreSQL.
 *
 * As páginas públicas (/, /catalogo, /ofertas, /produto/[slug] e
 * /categoria/[slug]) leem daqui. Quando o banco falha, não há loja ativa ou o
 * catálogo está vazio, `getStoreCatalog` devolve `null` e as páginas exibem o
 * aviso de "Catálogo em manutenção" em vez de quebrar.
 */

export interface StoreCatalog {
  readonly storeId: string;
  readonly categories: readonly CatalogCategory[];
  /** Produtos já precificados com a promoção vigente no momento da busca. */
  readonly products: readonly PricedCatalogProduct[];
}

/**
 * Formas estruturais das linhas do banco. Evitam acoplar a camada de
 * apresentação aos tipos gerados do Prisma e continuam válidas por
 * compatibilidade estrutural com o que o `findMany` devolve.
 */
interface CategoryRow {
  readonly slug: string;
  readonly name: string;
  readonly icon: string | null;
}

interface PromotionRow {
  readonly id: string;
  readonly promotionalPriceCents: number;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly active: boolean;
  readonly conditions: string | null;
  readonly maxQuantityPerOrder: number | null;
}

interface ProductRow {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly brand: string | null;
  readonly unit: SaleUnit;
  readonly category: CategoryRow;
  readonly prices: ReadonlyArray<{ readonly basePriceCents: number }>;
  readonly inventory: ReadonlyArray<{ readonly onHand: number }>;
  readonly promotions: readonly PromotionRow[];
}

const packageLabels: Readonly<Record<SaleUnit, string>> = {
  UNIT: "Unidade",
  KG: "Vendido por kg",
  G: "Peso variável",
  L: "Litro",
  ML: "Mililitro",
  PACK: "Kit",
};

/** Milésimos por passo de compra: 500 (500 g) no kg, 1 unidade nos demais. */
function quantityStep(unit: SaleUnit): number {
  return unit === "KG" || unit === "G" ? 500 : 1000;
}

function toCatalogCategory(row: CategoryRow): CatalogCategory {
  const meta = categoryMeta[row.slug];
  return {
    slug: row.slug,
    name: row.name,
    icon: row.icon ?? "🛒",
    tagline: meta?.tagline ?? `Conheça ${row.name}`,
    description:
      meta?.description ?? `Produtos de ${row.name} no Mercado Motta Jaraguá.`,
    imageTone: meta?.imageTone ?? "from-stone-100 to-white",
  };
}

/**
 * Escolhe a melhor promoção vigente: ativa, dentro da janela e com preço
 * realmente menor que a base. Se houver empate, vale a de menor preço.
 */
function pickPromotion(
  promotions: readonly PromotionRow[],
  basePriceCents: number,
  now: Date,
): SelectedPromotion | null {
  let best: SelectedPromotion | null = null;

  for (const row of promotions) {
    if (!row.active) continue;
    if (
      row.promotionalPriceCents <= 0 ||
      row.promotionalPriceCents >= basePriceCents
    ) {
      continue;
    }

    const candidate: SelectedPromotion = {
      id: row.id,
      promotionalPriceCents: row.promotionalPriceCents,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      active: row.active,
      conditions: row.conditions,
      maxQuantityPerOrderMilli: row.maxQuantityPerOrder,
    };

    if (!isPromotionActive(candidate, now)) continue;
    if (!best || candidate.promotionalPriceCents < best.promotionalPriceCents) {
      best = candidate;
    }
  }

  return best;
}

function toCatalogProduct(row: ProductRow, now: Date): PricedCatalogProduct {
  const meta = productMeta[row.slug];
  const step = quantityStep(row.unit);
  const basePriceCents = row.prices[0]?.basePriceCents ?? 0;

  const product: CatalogProduct = {
    id: row.id,
    sku: row.sku,
    slug: row.slug,
    name: row.name,
    brand: row.brand ?? "",
    categorySlug: row.category.slug,
    unit: row.unit,
    packageLabel: meta?.packageLabel ?? packageLabels[row.unit],
    description: row.description ?? "",
    keywords: normalizeSearchText(`${row.name} ${row.brand ?? ""}`)
      .split(" ")
      .filter(Boolean),
    basePriceCents,
    stockQuantityMilli: row.inventory[0]?.onHand ?? 0,
    ...(meta?.maxOrderQuantityMilli === undefined
      ? {}
      : { maxOrderQuantityMilli: meta.maxOrderQuantityMilli }),
    stepQuantityMilli: step,
    minQuantityMilli: step,
    emoji: meta?.emoji ?? row.category.icon ?? "🛒",
    imageTone: meta?.imageTone ?? "from-stone-100 to-white",
    popularity: meta?.popularity ?? 0,
  };

  return priceProductWithPromotion(
    product,
    pickPromotion(row.promotions, basePriceCents, now),
    now,
  );
}

/**
 * Carrega o catálogo ativo da loja em uma única consulta (com as relações de
 * preço, estoque, promoção e departamento). Deduplicada por requisição via
 * `cache` do React: layout e página compartilham o mesmo resultado.
 *
 * Devolve `null` quando não há banco configurado, a consulta falha, não existe
 * loja ativa ou o catálogo está vazio — nesses casos a vitrine mostra o aviso
 * de manutenção.
 */
export const getStoreCatalog = cache(
  async (): Promise<StoreCatalog | null> => {
    if (!process.env.DATABASE_URL) return null;
    const now = new Date();

    try {
      const store = await prisma.store.findFirst({
        where: { active: true },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      if (!store) return null;

      const [categoryRows, productRows] = await Promise.all([
        prisma.category.findMany({
          where: { active: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          select: { slug: true, name: true, icon: true },
        }),
        prisma.product.findMany({
          where: { active: true, category: { active: true } },
          orderBy: { name: "asc" },
          include: {
            category: { select: { slug: true, name: true, icon: true } },
            prices: {
              where: { storeId: store.id, active: true },
              select: { basePriceCents: true },
              take: 1,
            },
            inventory: {
              where: { storeId: store.id },
              select: { onHand: true },
              take: 1,
            },
            promotions: {
              where: { storeId: store.id },
              select: {
                id: true,
                promotionalPriceCents: true,
                startsAt: true,
                endsAt: true,
                active: true,
                conditions: true,
                maxQuantityPerOrder: true,
              },
            },
          },
        }),
      ]);

      if (categoryRows.length === 0 || productRows.length === 0) return null;

      return {
        storeId: store.id,
        categories: categoryRows.map(toCatalogCategory),
        products: productRows.map((row) => toCatalogProduct(row, now)),
      };
    } catch (error) {
      console.error("Falha ao carregar o catálogo do banco:", error);
      return null;
    }
  },
);

/** Busca um produto ativo pelo slug dentro do catálogo carregado. */
export function findStoreProduct(
  catalog: StoreCatalog,
  slug: string,
): PricedCatalogProduct | undefined {
  return catalog.products.find((product) => product.slug === slug);
}
