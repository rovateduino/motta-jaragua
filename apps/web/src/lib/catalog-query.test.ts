import { describe, expect, it } from "vitest";
import {
  buildCatalogHref,
  parseCatalogQuery,
  queryCatalog,
  CATALOG_PAGE_SIZE,
} from "./catalog-query";
import { catalogCategories, getPricedProducts } from "./catalog";

const DEMO_NOW = new Date("2026-10-24T12:00:00-03:00");
const products = getPricedProducts(DEMO_NOW);
const categories = catalogCategories;

function query(raw: Parameters<typeof parseCatalogQuery>[0]) {
  return queryCatalog(
    parseCatalogQuery(raw, { categories }),
    products,
    categories,
  );
}

describe("consulta do catálogo", () => {
  it("interpreta filtros, ordenação e página", () => {
    const query = parseCatalogQuery(
      {
        q: "  café ",
        categoria: "mercearia",
        ofertas: "1",
        ordem: "price_asc",
        pagina: "2",
      },
      { categories },
    );

    expect(query.q).toBe("café");
    expect(query.category).toBe("mercearia");
    expect(query.offers).toBe(true);
    expect(query.sort).toBe("price_asc");
    expect(query.page).toBe(2);
  });

  it("ignora categoria, ordenação e página inválidas", () => {
    const query = parseCatalogQuery(
      {
        categoria: "nao-existe",
        ordem: "aleatoria",
        pagina: "-4",
      },
      { categories },
    );

    expect(query.category).toBeNull();
    expect(query.sort).toBe("relevance");
    expect(query.page).toBe(1);
  });

  it("busca sem acento e por marca", () => {
    const result = query({ q: "cafe serra" });
    expect(result.items.map((product) => product.slug)).toContain(
      "cafe-torrado-e-moido-500g",
    );
  });

  it("filtra por departamento e ofertas", () => {
    const result = query({ categoria: "acougue-e-aves", ofertas: "1" });

    expect(result.items.length).toBeGreaterThan(0);
    for (const product of result.items) {
      expect(product.categorySlug).toBe("acougue-e-aves");
      expect(product.originalPriceCents).toBeDefined();
    }
  });

  it("não lista promoções expiradas, agendadas ou inativas", () => {
    const offers = query({ ofertas: "1" });
    const slugs = offers.items.map((product) => product.slug);

    expect(slugs).not.toContain("feijao-carioca-1kg");
    expect(slugs).not.toContain("cafe-torrado-e-moido-500g");
    expect(slugs).not.toContain("suco-de-uva-integral-1l");
    expect(slugs).toContain("picanha-bovina");
  });

  it("calcula contagens por departamento apenas entre ofertas quando ativo", () => {
    const allProducts = query({});
    const offers = query({ ofertas: "1" });
    const offerCategoryTotal = Object.values(offers.categoryCounts).reduce(
      (sum, count) => sum + count,
      0,
    );

    expect(offerCategoryTotal).toBe(offers.offersCount);
    expect(offerCategoryTotal).toBe(offers.total);
    expect(offerCategoryTotal).toBeLessThan(allProducts.total);
  });

  it("conta departamentos e ofertas a partir do texto buscado", () => {
    const result = query({ q: "arroz" });
    expect(result.categoryCounts.mercearia).toBe(1);
    expect(result.offersCount).toBe(1);
  });

  it("pagina resultados e limita a página ao total", () => {
    const first = query({});
    expect(first.items).toHaveLength(CATALOG_PAGE_SIZE);
    expect(first.totalPages).toBeGreaterThan(1);

    const last = query({ pagina: "99" });
    expect(last.page).toBe(last.totalPages);
    expect(last.items.length).toBeGreaterThan(0);
  });

  it("gera URLs preservando filtros e omitindo padrões", () => {
    const query = parseCatalogQuery({ q: "arroz", pagina: "2" }, { categories });
    expect(buildCatalogHref("/catalogo", query)).toBe(
      "/catalogo?q=arroz&pagina=2",
    );
    expect(buildCatalogHref("/catalogo", query, { category: "mercearia", page: 1 })).toBe(
      "/catalogo?q=arroz&categoria=mercearia",
    );
    expect(
      buildCatalogHref("/ofertas", parseCatalogQuery({}, { categories, offers: true })),
    ).toBe("/ofertas?ofertas=1");
  });
});
