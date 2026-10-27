import Link from "next/link";
import {
  Badge,
  buttonStyles,
  Button,
  ChevronLeftIcon,
  ChevronRightIcon,
  Container,
  Input,
  SlidersIcon,
  TagIcon,
} from "@motta/ui";
import type { CatalogCategory } from "@/lib/catalog-core";
import {
  buildCatalogHref,
  CATALOG_SORT_OPTIONS,
  type CatalogQuery,
  type CatalogResult,
} from "@/lib/catalog-query";
import { ProductCard } from "./product-card";

interface CatalogViewProps {
  basePath: string;
  categoryBasePath?: string;
  query: CatalogQuery;
  result: CatalogResult;
  /** Departamentos ativos vindos do banco, para filtros e chips. */
  categories: readonly CatalogCategory[];
  eyebrow: string;
  title: string;
  description: string;
  breadcrumb?: Array<{ label: string; href?: string }>;
}

interface FilterPanelProps {
  query: CatalogQuery;
  result: CatalogResult;
  basePath: string;
  categoryBasePath: string;
  categories: readonly CatalogCategory[];
}

function FilterPanel({
  query,
  result,
  basePath,
  categoryBasePath,
  categories,
}: FilterPanelProps) {
  const categoryHref = (slug: string | null) =>
    buildCatalogHref(categoryBasePath, query, { category: slug, page: 1 });

  const offersHref = buildCatalogHref(basePath, query, {
    offers: !query.offers,
    page: 1,
  });
  const onOffersPage = basePath === "/ofertas";
  const totalInSearch = onOffersPage
    ? result.offersCount
    : Object.values(result.categoryCounts).reduce((sum, count) => sum + count, 0);
  const hasFilters = query.q !== "" || query.category !== null || (query.offers && !onOffersPage);
  const clearHref = buildCatalogHref(basePath, query, {
    q: "",
    category: null,
    offers: false,
    page: 1,
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-motta-gray-500">
          Departamentos
        </h2>
        <ul className="mt-2 space-y-0.5">
          <li>
            <Link
              href={categoryHref(null)}
              aria-current={query.category === null ? "page" : undefined}
              className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors ${
                query.category === null
                  ? "bg-motta-red/10 font-bold text-motta-red"
                  : "text-motta-gray-700 hover:bg-motta-gray-100 hover:text-motta-ink"
              }`}
            >
              <span>Todos os departamentos</span>
              <span className="text-xs text-motta-gray-500">{totalInSearch}</span>
            </Link>
          </li>
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={categoryHref(category.slug)}
                aria-current={query.category === category.slug ? "page" : undefined}
                className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                  query.category === category.slug
                    ? "bg-motta-red/10 font-bold text-motta-red"
                    : "text-motta-gray-700 hover:bg-motta-gray-100 hover:text-motta-ink"
                }`}
              >
                <span className="truncate">{category.name}</span>
                <span className="text-xs text-motta-gray-500">
                  {result.categoryCounts[category.slug] ?? 0}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-motta-gray-200 pt-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-motta-gray-500">
          Ofertas
        </h2>
        <Link
          href={onOffersPage ? "/catalogo" : offersHref}
          aria-current={!onOffersPage && query.offers ? "true" : undefined}
          className={`mt-2 flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors ${
            !onOffersPage && query.offers
              ? "bg-motta-yellow/40 font-bold text-motta-ink"
              : "text-motta-gray-700 hover:bg-motta-gray-100 hover:text-motta-ink"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <TagIcon className="h-4 w-4 text-motta-red" />
            {onOffersPage ? "Ver catálogo completo" : "Somente ofertas"}
          </span>
          <Badge variant="offer">{result.offersCount}</Badge>
        </Link>
      </div>

      {hasFilters ? (
        <Link
          href={clearHref}
          className="block rounded-lg border border-dashed border-motta-gray-300 px-3 py-2 text-center text-xs font-semibold text-motta-gray-700 transition-colors hover:border-motta-red hover:text-motta-red"
        >
          Limpar busca e filtros
        </Link>
      ) : null}
    </div>
  );
}

function SortForm({ query, basePath }: { query: CatalogQuery; basePath: string }) {
  return (
    <form method="get" action={basePath} className="flex items-center gap-2">
      {query.q ? <input type="hidden" name="q" value={query.q} /> : null}
      {query.category ? (
        <input type="hidden" name="categoria" value={query.category} />
      ) : null}
      {query.offers ? <input type="hidden" name="ofertas" value="1" /> : null}
      <label className="flex items-center gap-2 text-xs font-semibold text-motta-gray-700">
        <span className="hidden sm:inline">Ordenar por</span>
        <select
          name="ordem"
          defaultValue={query.sort}
          className="h-9 rounded-lg border border-motta-gray-300 bg-white px-2 text-xs font-semibold text-motta-ink focus-visible:border-motta-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-motta-red/30"
        >
          {CATALOG_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" size="sm" variant="outline">
        Aplicar
      </Button>
    </form>
  );
}

function ActiveFilters({
  query,
  basePath,
  categories,
}: {
  query: CatalogQuery;
  basePath: string;
  categories: readonly CatalogCategory[];
}) {
  const chips: Array<{ label: string; href: string }> = [];

  if (query.q) {
    chips.push({
      label: `Busca: ${query.q}`,
      href: buildCatalogHref(basePath, query, { q: "", page: 1 }),
    });
  }
  if (query.category) {
    const category = categories.find((item) => item.slug === query.category);
    chips.push({
      label: category?.name ?? query.category,
      href: buildCatalogHref(basePath, query, { category: null, page: 1 }),
    });
  }
  if (query.offers && basePath !== "/ofertas") {
    chips.push({
      label: "Somente ofertas",
      href: buildCatalogHref(basePath, query, { offers: false, page: 1 }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-motta-gray-500">Filtros ativos:</span>
      {chips.map((chip) => (
        <Link
          key={chip.label}
          href={chip.href}
          className="inline-flex items-center gap-1 rounded-full border border-motta-gray-300 bg-white px-3 py-1 text-xs font-semibold text-motta-gray-700 transition-colors hover:border-motta-red hover:text-motta-red"
        >
          {chip.label}
          <span aria-hidden="true">×</span>
        </Link>
      ))}
      <Link
        href={buildCatalogHref(basePath, query, {
          q: "",
          category: null,
          offers: false,
          page: 1,
        })}
        className="text-xs font-bold text-motta-red underline-offset-2 hover:underline"
      >
        Limpar tudo
      </Link>
    </div>
  );
}

function Pagination({
  query,
  result,
  basePath,
}: {
  query: CatalogQuery;
  result: CatalogResult;
  basePath: string;
}) {
  if (result.totalPages <= 1) return null;

  const pages = Array.from({ length: result.totalPages }, (_, index) => index + 1).filter(
    (page) =>
      page === 1 ||
      page === result.totalPages ||
      Math.abs(page - result.page) <= 1,
  );

  return (
    <nav aria-label="Paginação do catálogo" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      {result.page > 1 ? (
        <Link
          href={buildCatalogHref(basePath, query, { page: result.page - 1 })}
          rel="prev"
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-motta-gray-300 bg-white px-3 text-xs font-semibold text-motta-gray-700 hover:border-motta-red hover:text-motta-red"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Anterior
        </Link>
      ) : null}

      {pages.map((page, index) => {
        const previous = pages[index - 1];
        const hasGap = previous !== undefined && page - previous > 1;
        return (
          <span key={page} className="inline-flex items-center gap-1.5">
            {hasGap ? <span className="px-1 text-motta-gray-500">…</span> : null}
            <Link
              href={buildCatalogHref(basePath, query, { page })}
              aria-current={page === result.page ? "page" : undefined}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-bold ${
                page === result.page
                  ? "border-motta-red bg-motta-red text-white"
                  : "border-motta-gray-300 bg-white text-motta-gray-700 hover:border-motta-red hover:text-motta-red"
              }`}
            >
              {page}
            </Link>
          </span>
        );
      })}

      {result.page < result.totalPages ? (
        <Link
          href={buildCatalogHref(basePath, query, { page: result.page + 1 })}
          rel="next"
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-motta-gray-300 bg-white px-3 text-xs font-semibold text-motta-gray-700 hover:border-motta-red hover:text-motta-red"
        >
          Próxima
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      ) : null}
    </nav>
  );
}

export function CatalogView({
  basePath,
  categoryBasePath = "/catalogo",
  query,
  result,
  categories,
  eyebrow,
  title,
  description,
  breadcrumb,
}: CatalogViewProps) {
  const countLabel =
    result.total === 1 ? "1 produto encontrado" : `${result.total} produtos encontrados`;

  return (
    <Container className="py-8 sm:py-10">
      {breadcrumb && breadcrumb.length > 0 ? (
        <nav aria-label="Você está aqui" className="mb-4 text-xs text-motta-gray-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-motta-red hover:underline">
                Início
              </Link>
            </li>
            {breadcrumb.map((item) => (
              <li key={item.label} className="flex items-center gap-1.5">
                <ChevronRightIcon className="h-3 w-3 text-motta-gray-300" />
                {item.href ? (
                  <Link href={item.href} className="hover:text-motta-red hover:underline">
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="font-semibold text-motta-ink">
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <p className="text-xs font-bold uppercase tracking-widest text-motta-red">{eyebrow}</p>
      <h1 className="mt-1 text-3xl font-black tracking-tight text-motta-ink sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-motta-gray-500">
        {description}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-36 rounded-2xl border border-motta-gray-200 bg-white p-4 shadow-card">
            <FilterPanel
              query={query}
              result={result}
              basePath={basePath}
              categoryBasePath={categoryBasePath}
              categories={categories}
            />
          </div>
        </aside>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-motta-ink" aria-live="polite">
              {countLabel}
              {query.q ? (
                <span className="font-normal text-motta-gray-500"> para “{query.q}”</span>
              ) : null}
            </p>
            <div className="hidden sm:block">
              <SortForm query={query} basePath={basePath} />
            </div>
          </div>

          <div className="mt-3 space-y-3">
            <ActiveFilters
              query={query}
              basePath={basePath}
              categories={categories}
            />

            <details className="rounded-xl border border-motta-gray-200 bg-white p-3 lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-bold text-motta-ink">
                <span className="inline-flex items-center gap-2">
                  <SlidersIcon className="h-4 w-4 text-motta-red" />
                  Busca, filtros e ordenação
                </span>
                <Badge variant="neutral">{result.total}</Badge>
              </summary>
              <div className="mt-4 space-y-5">
                <form method="get" action={basePath} role="search" className="flex gap-2">
                  {query.category ? (
                    <input type="hidden" name="categoria" value={query.category} />
                  ) : null}
                  {query.offers ? <input type="hidden" name="ofertas" value="1" /> : null}
                  <div className="min-w-0 flex-1">
                    <Input
                      name="q"
                      type="search"
                      defaultValue={query.q}
                      placeholder="Buscar no catálogo"
                      aria-label="Buscar no catálogo"
                    />
                  </div>
                  <Button type="submit" size="md" variant="primary">
                    Buscar
                  </Button>
                </form>
                <FilterPanel
                  query={query}
                  result={result}
                  basePath={basePath}
                  categoryBasePath={categoryBasePath}
                  categories={categories}
                />
                <div className="border-t border-motta-gray-200 pt-4">
                  <SortForm query={query} basePath={basePath} />
                </div>
              </div>
            </details>
          </div>

          {result.items.length > 0 ? (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {result.items.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    categories={categories}
                  />
                ))}
              </div>
              <Pagination query={query} result={result} basePath={basePath} />
            </>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-motta-gray-300 bg-white px-6 py-12 text-center">
              <p className="text-lg font-extrabold text-motta-ink">
                Nenhum produto encontrado
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-motta-gray-500">
                Tente outro termo, remova o filtro de departamento ou desative a opção
                de somente ofertas.
              </p>
              <Link
                href={buildCatalogHref(basePath, query, {
                  q: "",
                  category: null,
                  offers: false,
                  page: 1,
                })}
                className={`${buttonStyles({ variant: "primary" })} mt-5`}
              >
                Ver todo o catálogo
              </Link>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
