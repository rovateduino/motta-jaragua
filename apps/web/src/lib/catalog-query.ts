import { rankProducts, searchScore, type CatalogSort } from "@motta/domain";
import {
  hasPromotion,
  type CatalogCategory,
  type CatalogSearchProduct,
  type PricedCatalogProduct,
} from "./catalog-core";

export const CATALOG_PAGE_SIZE = 12;

export const CATALOG_SORT_OPTIONS: ReadonlyArray<{ value: CatalogSort; label: string }> = [
  { value: "relevance", label: "Mais relevantes" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
  { value: "name", label: "Nome de A a Z" },
];

export interface CatalogQuery {
  readonly q: string;
  readonly category: string | null;
  readonly offers: boolean;
  readonly sort: CatalogSort;
  readonly page: number;
  readonly pageSize: number;
}

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseSort(value: string | undefined): CatalogSort {
  const match = CATALOG_SORT_OPTIONS.find((option) => option.value === value);
  return match?.value ?? "relevance";
}

export interface CatalogParseDefaults {
  /** Departamentos válidos para validar o parâmetro `categoria`. */
  readonly categories: readonly CatalogCategory[];
  readonly offers?: boolean;
  readonly category?: string | null;
}

export function parseCatalogQuery(
  raw: RawSearchParams,
  defaults: CatalogParseDefaults,
): CatalogQuery {
  const categoryParam = first(raw.categoria)?.trim() ?? defaults.category ?? "";
  const categoryExists = defaults.categories.some(
    (category) => category.slug === categoryParam,
  );
  const pageParam = Number.parseInt(first(raw.pagina) ?? "1", 10);

  return {
    q: (first(raw.q) ?? "").trim().slice(0, 80),
    category: categoryParam && categoryExists ? categoryParam : null,
    offers: defaults.offers === true ? true : first(raw.ofertas) === "1",
    sort: parseSort(first(raw.ordem)),
    page: Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1,
    pageSize: CATALOG_PAGE_SIZE,
  };
}

export interface CatalogResult {
  readonly items: readonly PricedCatalogProduct[];
  readonly total: number;
  readonly page: number;
  readonly totalPages: number;
  readonly categoryCounts: Readonly<Record<string, number>>;
  readonly offersCount: number;
}

function withCategoryName(
  product: PricedCatalogProduct,
  categories: readonly CatalogCategory[],
): CatalogSearchProduct {
  const category = categories.find(
    (item) => item.slug === product.categorySlug,
  );
  return { ...product, categoryName: category?.name ?? "Departamento" };
}

/**
 * Busca, filtros, contagens e paginação do catálogo. Opera sobre a lista já
 * carregada do banco (`lib/catalog-db.ts`) mantendo a busca sem acento do
 * domínio — nenhuma fonte de dados é importada aqui.
 */
export function queryCatalog(
  query: CatalogQuery,
  products: readonly PricedCatalogProduct[],
  categories: readonly CatalogCategory[],
): CatalogResult {
  const searchable = products.map((product) =>
    withCategoryName(product, categories),
  );
  const textMatches = searchable.filter(
    (product) => searchScore(product, query.q) >= 0,
  );

  const categoryCounts: Record<string, number> = {};
  const categoryProducts = query.offers
    ? textMatches.filter(hasPromotion)
    : textMatches;
  for (const category of categories) {
    categoryCounts[category.slug] = categoryProducts.filter(
      (product) => product.categorySlug === category.slug,
    ).length;
  }

  const filtered = textMatches.filter((product) => {
    if (query.category && product.categorySlug !== query.category) return false;
    if (query.offers && !hasPromotion(product)) return false;
    return true;
  });

  const ranked = rankProducts(filtered, query.q, query.sort);
  const total = ranked.length;
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(query.page, totalPages);
  const start = (page - 1) * query.pageSize;

  return {
    items: ranked.slice(start, start + query.pageSize),
    total,
    page,
    totalPages,
    categoryCounts,
    offersCount: textMatches.filter(hasPromotion).length,
  };
}

export interface CatalogHrefOverrides {
  readonly q?: string;
  readonly category?: string | null;
  readonly offers?: boolean;
  readonly sort?: CatalogSort;
  readonly page?: number;
}

export function buildCatalogHref(
  basePath: string,
  query: CatalogQuery,
  overrides: CatalogHrefOverrides = {},
): string {
  const params = new URLSearchParams();
  const q = overrides.q ?? query.q;
  const category = overrides.category === undefined ? query.category : overrides.category;
  const offers = overrides.offers ?? query.offers;
  const sort = overrides.sort ?? query.sort;
  const page = overrides.page ?? query.page;

  if (q) params.set("q", q);
  if (category) params.set("categoria", category);
  if (offers) params.set("ofertas", "1");
  if (sort !== "relevance") params.set("ordem", sort);
  if (page > 1) params.set("pagina", String(page));

  const search = params.toString();
  return search ? `${basePath}?${search}` : basePath;
}
