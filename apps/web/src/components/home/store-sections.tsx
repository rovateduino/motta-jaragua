import Link from "next/link";
import { ArrowRightIcon, SectionHeading } from "@motta/ui";
import { ProductCard } from "@/components/catalog/product-card";
import {
  hasPromotion,
  type CatalogCategory,
  type PricedCatalogProduct,
} from "@/lib/catalog-core";

/**
 * Vitrines da home (ofertas + produtos para casa). Recebe o catálogo já
 * precificado do banco (lib/catalog-db.ts) por props do servidor.
 */
export function HomeStoreSections({
  products,
  categories,
}: {
  products: readonly PricedCatalogProduct[];
  categories: readonly CatalogCategory[];
}) {
  const homeOffers = products.filter(hasPromotion).slice(0, 4);
  const homeProducts = products
    .filter((product) => !hasPromotion(product))
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 4);

  return (
    <>
      <section
        id="ofertas"
        aria-labelledby="ofertas-title"
        className="mt-12 scroll-mt-32 sm:mt-16"
      >
        <SectionHeading
          id="ofertas-title"
          eyebrow="Economize mais"
          title="Ofertas imperdíveis"
          description="Confira os produtos com preços promocionais desta semana."
          action={
            <Link
              href="/ofertas"
              className="inline-flex items-center gap-1 text-sm font-bold text-motta-red hover:underline hover:underline-offset-4"
            >
              Ver todas
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {homeOffers.map((product) => (
            <ProductCard key={product.id} product={product} categories={categories} />
          ))}
        </div>
      </section>

      <section aria-labelledby="casa-title" className="mt-12 sm:mt-16">
        <SectionHeading
          id="casa-title"
          eyebrow="Para o dia a dia"
          title="Produtos para sua casa"
          action={
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-1 text-sm font-bold text-motta-red hover:underline hover:underline-offset-4"
            >
              Ver catálogo
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {homeProducts.map((product) => (
            <ProductCard key={product.id} product={product} categories={categories} />
          ))}
        </div>
      </section>
    </>
  );
}
