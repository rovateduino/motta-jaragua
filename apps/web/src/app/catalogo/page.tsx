import type { Metadata } from "next";
import { Container } from "@motta/ui";
import { CatalogStoreView } from "@/components/catalog/catalog-store-view";
import { CatalogMaintenance } from "@/components/catalog/catalog-maintenance";
import { findCategory } from "@/lib/catalog-core";
import { getStoreCatalog } from "@/lib/catalog-db";
import {
  parseCatalogQuery,
  type RawSearchParams,
} from "@/lib/catalog-query";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catálogo completo",
  description:
    "Explore os departamentos e produtos do Mercado Motta Jaraguá.",
};

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const catalog = await getStoreCatalog();
  if (!catalog) {
    return (
      <Container className="py-10 sm:py-16">
        <CatalogMaintenance />
      </Container>
    );
  }

  const query = parseCatalogQuery(await searchParams, {
    categories: catalog.categories,
  });
  const category = findCategory(catalog.categories, query.category);

  const title = query.q
    ? `Resultados para “${query.q}”`
    : (category?.name ?? "Catálogo completo");
  const eyebrow = query.q ? "Busca" : (category?.tagline ?? "Todos os departamentos");
  const description = query.q
    ? "Resultados da busca no catálogo. Refine por departamento ou use a opção de somente ofertas."
    : (category?.description ??
      "Do hortifruti ao pet shop: navegue pelo catálogo e monte seu carrinho.");

  return (
    <CatalogStoreView
      basePath="/catalogo"
      categoryBasePath="/catalogo"
      query={query}
      products={catalog.products}
      categories={catalog.categories}
      eyebrow={eyebrow}
      title={title}
      description={description}
      breadcrumb={[
        { label: "Catálogo", href: category || query.q ? "/catalogo" : undefined },
        ...(category ? [{ label: category.name }] : []),
        ...(query.q ? [{ label: "Busca" }] : []),
      ]}
    />
  );
}
