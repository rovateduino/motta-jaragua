import Link from "next/link";
import { Badge, Card, CardBody, PriceTag } from "@motta/ui";
import {
  formatBRL,
  formatQuantity,
  formatUnitPriceSuffix,
} from "@motta/domain";
import {
  getCategoryLabel,
  getDefaultQuantityMilli,
  getDiscountPercentage,
  getMaxQuantityMilli,
  getStockLabel,
  isLowStock,
  isProductAvailable,
  resolveProductImageUrl,
  type CatalogCategory,
  type PricedCatalogProduct,
} from "@/lib/catalog-core";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";

export function ProductCard({
  product,
  categories,
  className,
}: {
  product: PricedCatalogProduct;
  /** Departamentos do banco; opcional para telas que já exibem a categoria. */
  categories?: readonly CatalogCategory[];
  className?: string;
}) {
  const discount = getDiscountPercentage(product);
  const available = isProductAvailable(product);
  const defaultQuantity = getDefaultQuantityMilli(product);
  const maxQuantity = getMaxQuantityMilli(product);
  const addLabel = "Adicionar";
  const imageUrl = resolveProductImageUrl(product);

  return (
    <Card
      className={`group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg ${className ?? ""}`}
    >
      <Link
        href={`/produto/${product.slug}`}
        aria-label={`Ver detalhes de ${product.name}`}
        className="relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br sm:h-40"
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- sem serviço de storage/otimização ainda; URLs públicas externas.
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <>
            <span className={`absolute inset-0 bg-gradient-to-br ${product.imageTone}`} aria-hidden="true" />
            <span
              aria-hidden="true"
              className="relative text-6xl transition-transform duration-300 group-hover:scale-105 sm:text-7xl"
            >
              {product.emoji}
            </span>
          </>
        )}
        <span className="absolute left-3 top-3 flex flex-wrap gap-1">
          {discount !== null && discount > 0 ? (
            <Badge variant="offer">-{discount}%</Badge>
          ) : null}
          {isLowStock(product) ? <Badge variant="danger">Últimas</Badge> : null}
        </span>
        {imageUrl ? null : (
          <span className="absolute bottom-2 right-3 text-[10px] font-semibold uppercase tracking-wide text-motta-gray-500">
            Ilustração
          </span>
        )}
      </Link>

      <CardBody className="flex flex-1 flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-motta-gray-500">
          {product.brand ? `${product.brand} · ` : ""}{getCategoryLabel(categories ?? [], product.categorySlug)}
        </p>
        <h3 className="min-h-10 text-sm font-bold leading-snug text-motta-ink">
          <Link
            href={`/produto/${product.slug}`}
            className="line-clamp-2 transition-colors hover:text-motta-red"
          >
            {product.name}
          </Link>
        </h3>
        <p className="text-[11px] text-motta-gray-500">{product.packageLabel}</p>

        <div className="mt-auto pt-1">
          <PriceTag
            price={formatBRL(product.priceCents)}
            originalPrice={
              product.originalPriceCents !== undefined
                ? formatBRL(product.originalPriceCents)
                : undefined
            }
            unitLabel={formatUnitPriceSuffix(product.unit)}
            size="md"
          />
          <p className={`mt-1 text-[11px] font-medium ${available ? "text-motta-gray-500" : "text-motta-red"}`}>
            {getStockLabel(product)}
          </p>
          <AddToCartButton
            productId={product.id}
            productName={product.name}
            quantityMilli={defaultQuantity}
            available={available}
            label={addLabel}
            className="mt-2 w-full"
            size="sm"
          />
        </div>
      </CardBody>
      <span className="sr-only">
        Quantidade máxima por pedido: {formatQuantity(maxQuantity, product.unit)}.
      </span>
    </Card>
  );
}
