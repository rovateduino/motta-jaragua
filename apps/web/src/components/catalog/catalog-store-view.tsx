import { CatalogView } from "@/components/catalog/catalog-view";
import type { CatalogCategory, PricedCatalogProduct } from "@/lib/catalog-core";
import { queryCatalog, type CatalogQuery } from "@/lib/catalog-query";

interface CatalogStoreViewProps {
  basePath: string;
  categoryBasePath?: string;
  query: CatalogQuery;
  /** Produtos precificados vindos do banco (lib/catalog-db.ts). */
  products: readonly PricedCatalogProduct[];
  /** Departamentos ativos do banco, para filtros e chips. */
  categories: readonly CatalogCategory[];
  eyebrow: string;
  title: string;
  description: string;
  breadcrumb?: Array<{ label: string; href?: string }>;
}

/**
 * Busca, filtros e paginação acontecem no servidor sobre o catálogo carregado
 * do banco; a apresentação permanece em `CatalogView`.
 */
export function CatalogStoreView({
  products,
  categories,
  basePath,
  categoryBasePath,
  query,
  eyebrow,
  title,
  description,
  breadcrumb,
}: CatalogStoreViewProps) {
  const result = queryCatalog(query, products, categories);

  return (
    <CatalogView
      basePath={basePath}
      {...(categoryBasePath ? { categoryBasePath } : {})}
      query={query}
      result={result}
      categories={categories}
      eyebrow={eyebrow}
      title={title}
      description={description}
      {...(breadcrumb ? { breadcrumb } : {})}
    />
  );
}
