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
  title: "Ofertas da semana",
  description:
    "Ofertas fictícias do Mercado Motta Jaraguá para demonstração da loja. Nenhum preço é comercial.",
};

export default async function OfertasPage({
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

  const parsed = parseCatalogQuery(await searchParams, {
    categories: catalog.categories,
    offers: true,
  });
  const query = { ...parsed, offers: true };
  const category = findCategory(catalog.categories, query.category);

  return (
    <CatalogStoreView
      basePath="/ofertas"
      categoryBasePath="/ofertas"
      query={query}
      products={catalog.products}
      categories={catalog.categories}
      eyebrow="Economize mais"
      title={category ? `Ofertas em ${category.name}` : "Ofertas da semana"}
      description="Seleção fictícia de produtos com preço promocional para validar a experiência de compra. As ofertas não são comerciais."
      breadcrumb={[
        { label: "Ofertas", href: category ? "/ofertas" : undefined },
        ...(category ? [{ label: category.name }] : []),
      ]}
    />
  );
}
