import type { Metadata } from "next";
import { Container } from "@motta/ui";
import { ProductStoreView } from "@/components/catalog/product-store-view";
import { CatalogMaintenance } from "@/components/catalog/catalog-maintenance";
import { selectRelatedProducts } from "@/lib/catalog-core";
import { findStoreProduct, getStoreCatalog } from "@/lib/catalog-db";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await getStoreCatalog();
  const product = catalog ? findStoreProduct(catalog, slug) : undefined;
  if (!product) return { title: "Produto não encontrado" };

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const catalog = await getStoreCatalog();
  if (!catalog) {
    return (
      <Container className="py-10 sm:py-16">
        <CatalogMaintenance />
      </Container>
    );
  }

  const product = findStoreProduct(catalog, slug) ?? null;
  const related = product
    ? selectRelatedProducts(catalog.products, product)
    : [];

  return (
    <ProductStoreView
      product={product}
      categories={catalog.categories}
      related={related}
    />
  );
}
