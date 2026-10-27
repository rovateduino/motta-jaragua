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
    "Confira as ofertas da semana do Mercado Motta Jaraguá.",
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
      description="Confira os produtos com preços promocionais e aproveite as ofertas da semana."
      breadcrumb={[
        { label: "Ofertas", href: category ? "/ofertas" : undefined },
        ...(category ? [{ label: category.name }] : []),
      ]}
    />
  );
}
