import { describe, expect, it } from "vitest";
import { normalizeSearchText, rankProducts, searchScore } from "./search";

const products = [
  {
    name: "Arroz Tipo 1 5kg",
    brand: "Vale Verde",
    categoryName: "Mercearia",
    description: "Arroz branco longo fino",
    keywords: ["grão", "panela"],
    priceCents: 2190,
    popularity: 90,
  },
  {
    name: "Feijão Carioca 1kg",
    brand: "Serra Alta",
    categoryName: "Mercearia",
    priceCents: 790,
    popularity: 70,
  },
  {
    name: "Banana Prata",
    categoryName: "Hortifruti",
    description: "Fruta fresca vendida por kg",
    priceCents: 599,
    popularity: 95,
  },
  {
    name: "Café Torrado e Moído 500g",
    brand: "Serra Alta",
    categoryName: "Mercearia",
    priceCents: 1890,
    popularity: 80,
  },
];

describe("busca de catálogo", () => {
  it("normaliza acentos, caixa e pontuação", () => {
    expect(normalizeSearchText("  Café  Torrado e Moído ")).toBe("cafe torrado e moido");
  });

  it("encontra por nome, marca e categoria sem acento", () => {
    expect(rankProducts(products, "cafe").map((product) => product.name)).toEqual([
      "Café Torrado e Moído 500g",
    ]);
    expect(rankProducts(products, "serra").map((product) => product.name)).toEqual([
      "Café Torrado e Moído 500g",
      "Feijão Carioca 1kg",
    ]);
    expect(rankProducts(products, "hortifruti").map((product) => product.name)).toEqual([
      "Banana Prata",
    ]);
  });

  it("exige todos os termos e ranqueia por relevância", () => {
    expect(rankProducts(products, "arroz 5kg")).toHaveLength(1);
    expect(rankProducts(products, "arroz inexistente")).toHaveLength(0);
    expect(rankProducts(products, "", "relevance")[0]?.name).toBe("Banana Prata");
  });

  it("ordena por preço e nome", () => {
    expect(rankProducts(products, "", "price_asc").map((product) => product.priceCents)).toEqual([
      599, 790, 1890, 2190,
    ]);
    expect(rankProducts(products, "serra", "name").map((product) => product.name)).toEqual([
      "Café Torrado e Moído 500g",
      "Feijão Carioca 1kg",
    ]);
  });

  it("pontua negativamente quando não há correspondência", () => {
    expect(searchScore(products[0]!, "banana")).toBe(-1);
  });
});
