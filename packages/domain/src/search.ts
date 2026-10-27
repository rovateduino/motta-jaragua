export type CatalogSort = "relevance" | "price_asc" | "price_desc" | "name";

export interface SearchableProduct {
  readonly name: string;
  readonly brand?: string | null;
  readonly description?: string | null;
  readonly categoryName?: string | null;
  readonly keywords?: readonly string[];
  readonly priceCents: number;
  readonly popularity?: number;
}

const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function fieldScore(value: string | null | undefined, term: string, weight: number): number {
  if (!value) return 0;
  const normalized = normalizeSearchText(value);
  if (!normalized.includes(term)) return 0;

  const words = normalized.split(" ");
  if (normalized.startsWith(term)) return weight * 2;
  if (words.some((word) => word.startsWith(term))) return Math.round(weight * 1.5);
  return weight;
}

/**
 * Pontua o produto para os termos da busca. Retorna -1 quando algum termo não
 * casa com nenhum campo. Busca vazia pontua 0.
 */
export function searchScore(product: SearchableProduct, query: string): number {
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery === "") return 0;

  const terms = normalizedQuery.split(" ").filter(Boolean);
  let total = 0;

  for (const term of terms) {
    const termScore =
      fieldScore(product.name, term, 50) +
      fieldScore(product.brand, term, 30) +
      fieldScore(product.categoryName, term, 25) +
      fieldScore(product.keywords?.join(" "), term, 20) +
      fieldScore(product.description, term, 10);

    if (termScore === 0) return -1;
    total += termScore;
  }

  return total;
}

/** Filtra pelos termos e ordena o catálogo conforme a opção escolhida. */
export function rankProducts<T extends SearchableProduct>(
  products: readonly T[],
  query: string,
  sort: CatalogSort = "relevance",
): T[] {
  const scored = products
    .map((product) => ({ product, score: searchScore(product, query) }))
    .filter((entry) => entry.score >= 0);

  scored.sort((a, b) => {
    switch (sort) {
      case "price_asc":
        return a.product.priceCents - b.product.priceCents;
      case "price_desc":
        return b.product.priceCents - a.product.priceCents;
      case "name":
        return collator.compare(a.product.name, b.product.name);
      case "relevance":
      default:
        if (b.score !== a.score) return b.score - a.score;
        if ((b.product.popularity ?? 0) !== (a.product.popularity ?? 0)) {
          return (b.product.popularity ?? 0) - (a.product.popularity ?? 0);
        }
        return collator.compare(a.product.name, b.product.name);
    }
  });

  return scored.map((entry) => entry.product);
}
