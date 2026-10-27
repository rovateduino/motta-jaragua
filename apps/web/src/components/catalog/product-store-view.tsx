import Link from "next/link";
import {
  Badge,
  buttonStyles,
  ChevronRightIcon,
  Container,
  HeadsetIcon,
  StoreIcon,
  TruckIcon,
} from "@motta/ui";
import {
  findCategory,
  getCategoryLabel,
  getDiscountPercentage,
  hasPromotion,
  isLowStock,
  isProductAvailable,
  resolveProductImageUrl,
  type CatalogCategory,
  type PricedCatalogProduct,
} from "@/lib/catalog-core";
import { appUrl } from "@/lib/env";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductPurchasePanel } from "@/components/catalog/product-purchase-panel";

const trustItems = [
  {
    icon: TruckIcon,
    title: "Entrega e retirada",
    description: "Consulte as condições disponíveis ao finalizar o pedido.",
  },
  {
    icon: StoreIcon,
    title: "Compra prática",
    description: "Escolha seus produtos e acompanhe seus pedidos pela sua conta.",
  },
  {
    icon: HeadsetIcon,
    title: "Atendimento próximo",
    description: "Consulte os dados de contato da loja no rodapé.",
  },
];

interface ProductStoreViewProps {
  /** Produto precificado do banco; `null` quando o slug não existe. */
  product: PricedCatalogProduct | null;
  /** Departamentos ativos do banco, para breadcrumb e categoria. */
  categories: readonly CatalogCategory[];
  /** Produtos relacionados já selecionados no servidor. */
  related: readonly PricedCatalogProduct[];
}

export function ProductStoreView({
  product,
  categories,
  related,
}: ProductStoreViewProps) {
  if (!product) {
    return (
      <Container className="py-10 sm:py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-motta-gray-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-black tracking-tight text-motta-ink">
            Produto não encontrado
          </h1>
          <p className="mt-2 text-sm text-motta-gray-500">
            Este produto pode ter sido desativado ou removido do catálogo.
          </p>
          <Link
            href="/catalogo"
            className={buttonStyles({ variant: "primary", size: "md" })}
          >
            Voltar ao catálogo
          </Link>
        </div>
      </Container>
    );
  }

  const category = findCategory(categories, product.categorySlug);
  const discount = getDiscountPercentage(product);
  const imageUrl = resolveProductImageUrl(product);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    category: getCategoryLabel(categories, product.categorySlug),
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: (product.priceCents / 100).toFixed(2),
      availability: isProductAvailable(product)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${appUrl}/produto/${product.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container className="py-8 sm:py-10">
        <nav aria-label="Você está aqui" className="mb-5 text-xs text-motta-gray-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-motta-red hover:underline">
                Início
              </Link>
            </li>
            <li className="flex items-center gap-1.5">
              <ChevronRightIcon className="h-3 w-3 text-motta-gray-300" />
              <Link href="/catalogo" className="hover:text-motta-red hover:underline">
                Catálogo
              </Link>
            </li>
            {category ? (
              <li className="flex items-center gap-1.5">
                <ChevronRightIcon className="h-3 w-3 text-motta-gray-300" />
                <Link
                  href={`/categoria/${category.slug}`}
                  className="hover:text-motta-red hover:underline"
                >
                  {category.name}
                </Link>
              </li>
            ) : null}
            <li className="flex items-center gap-1.5">
              <ChevronRightIcon className="h-3 w-3 text-motta-gray-300" />
              <span aria-current="page" className="font-semibold text-motta-ink">
                {product.name}
              </span>
            </li>
          </ol>
        </nav>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
          <div>
            <div
              role={imageUrl ? undefined : "img"}
              aria-label={imageUrl ? undefined : `Ilustração de ${product.name}`}
              className={`relative flex h-72 items-center justify-center overflow-hidden rounded-3xl border border-motta-gray-200 bg-gradient-to-br sm:h-96 ${product.imageTone}`}
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- sem serviço de storage/otimização ainda; URLs públicas externas.
                <img
                  src={imageUrl}
                  alt={product.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span aria-hidden="true" className="text-[9rem] leading-none sm:text-[12rem]">
                  {product.emoji}
                </span>
              )}
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                {discount !== null && discount > 0 ? (
                  <Badge variant="offer">-{discount}%</Badge>
                ) : null}
                {isLowStock(product) ? <Badge variant="danger">Últimas unidades</Badge> : null}
              </div>
              {imageUrl ? null : (
                <span className="absolute bottom-3 right-4 text-[10px] font-semibold uppercase tracking-wide text-motta-gray-500">
                  Ilustração
                </span>
              )}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {trustItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-xl border border-motta-gray-200 bg-white p-3"
                  >
                    <Icon className="h-5 w-5 text-motta-red" />
                    <p className="mt-2 text-xs font-bold text-motta-ink">{item.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-motta-gray-500">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Link
                href={`/categoria/${product.categorySlug}`}
                className="font-bold uppercase tracking-widest text-motta-red hover:underline"
              >
                {getCategoryLabel(categories, product.categorySlug)}
              </Link>
              {product.brand ? (
                <>
                  <span className="text-motta-gray-300">·</span>
                  <span className="text-motta-gray-500">{product.brand}</span>
                </>
              ) : null}
            </div>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-motta-ink sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-1 text-xs text-motta-gray-500">
              Código do produto: {product.sku}
            </p>

            <p className="mt-4 text-sm leading-relaxed text-motta-gray-700">
              {product.description}
            </p>

            {hasPromotion(product) && product.promotion ? (
              <p className="mt-3 inline-flex rounded-lg bg-motta-yellow/40 px-3 py-1.5 text-xs font-semibold text-motta-ink">
                Oferta válida até{" "}
                {new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(
                  new Date(product.promotion.endsAt),
                )}
                . {product.promotion.conditions}
              </p>
            ) : null}

            <div className="mt-6 border-t border-motta-gray-200 pt-6">
              <ProductPurchasePanel product={product} />
            </div>

          </div>
        </div>

        {related.length > 0 ? (
          <section aria-labelledby="relacionados-title" className="mt-12 sm:mt-16">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-motta-red">
                  Você também pode gostar
                </p>
                <h2
                  id="relacionados-title"
                  className="mt-1 text-2xl font-extrabold tracking-tight text-motta-ink"
                >
                  Produtos relacionados
                </h2>
              </div>
              <Link
                href={`/categoria/${product.categorySlug}`}
                className="text-sm font-bold text-motta-red underline-offset-4 hover:underline"
              >
                Ver departamento
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  categories={categories}
                />
              ))}
            </div>
          </section>
        ) : null}
      </Container>
    </>
  );
}
