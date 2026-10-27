import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@motta/ui";
import { CatalogStoreView } from "@/components/catalog/catalog-store-view";
import { CatalogMaintenance } from "@/components/catalog/catalog-maintenance";
import { findCategory } from "@/lib/catalog-core";
import { getStoreCatalog } from "@/lib/catalog-db";
import {
  parseCatalogQuery,
  type RawSearchParams,
} from "@/lib/catalog-query";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await getStoreCatalog();
  const category = findCategory(catalog?.categories ?? [], slug);
  if (!category) return { title: "Departamento não encontrado" };

  return {
    title: category.name,
    description: `${category.description} Catálogo fictício do Mercado Motta Jaraguá.`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const catalog = await getStoreCatalog();
  if (!catalog) {
    return (
      <Container className="py-10 sm:py-16">
        <CatalogMaintenance />
      </Container>
    );
  }

  const category = findCategory(catalog.categories, slug);
  if (!category) notFound();

  const parsed = parseCatalogQuery(await searchParams, {
    categories: catalog.categories,
    category: slug,
  });
  const query = { ...parsed, category: slug };

  return (
    <CatalogStoreView
      basePath={`/categoria/${slug}`}
      categoryBasePath="/catalogo"
      query={query}
      products={catalog.products}
      categories={catalog.categories}
      eyebrow={category.tagline}
      title={category.name}
      description={category.description}
      breadcrumb={[
        { label: "Catálogo", href: "/catalogo" },
        { label: category.name },
      ]}
    />
  );
}
