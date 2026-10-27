"use client";

import { useState } from "react";
import Link from "next/link";
import {
  calculateLineSubtotalCents,
  formatBRL,
  formatQuantity,
  formatUnitPriceSuffix,
} from "@motta/domain";
import { Badge, PriceTag } from "@motta/ui";
import {
  getDefaultQuantityMilli,
  getDiscountPercentage,
  getMaxQuantityMilli,
  getStockLabel,
  isProductAvailable,
  type PricedCatalogProduct,
} from "@/lib/catalog-core";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { QuantityStepper } from "./quantity-stepper";

export function ProductPurchasePanel({
  product,
}: {
  product: PricedCatalogProduct;
}) {
  const available = isProductAvailable(product);
  const maxQuantity = getMaxQuantityMilli(product);
  const [quantity, setQuantity] = useState(() => getDefaultQuantityMilli(product));
  const discount = getDiscountPercentage(product);
  const subtotalCents = available
    ? calculateLineSubtotalCents(product.priceCents, quantity)
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <PriceTag
          price={formatBRL(product.priceCents)}
          originalPrice={
            product.originalPriceCents !== undefined
              ? formatBRL(product.originalPriceCents)
              : undefined
          }
          unitLabel={formatUnitPriceSuffix(product.unit)}
          size="lg"
        />
        {discount !== null && discount > 0 ? (
          <Badge variant="offer">Economize {discount}%</Badge>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-motta-gray-500">{product.packageLabel}</span>
        <span aria-hidden="true" className="text-motta-gray-300">
          |
        </span>
        <span
          className={
            available ? "font-semibold text-green-700" : "font-semibold text-motta-red"
          }
        >
          {getStockLabel(product)}
        </span>
      </div>

      {available ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <QuantityStepper
              value={quantity}
              min={product.minQuantityMilli}
              max={maxQuantity}
              step={product.stepQuantityMilli}
              unit={product.unit}
              productName={product.name}
              onChange={setQuantity}
            />
            <span className="text-xs text-motta-gray-500">
              Máximo por pedido: {formatQuantity(maxQuantity, product.unit)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-motta-gray-200 bg-motta-gray-50 px-4 py-3">
            <span className="text-sm font-medium text-motta-gray-700">
              Subtotal desta quantidade
            </span>
            <strong className="text-lg font-extrabold text-motta-ink">
              {formatBRL(subtotalCents)}
            </strong>
          </div>
        </>
      ) : (
        <div
          role="status"
          className="rounded-xl border border-motta-red/20 bg-red-50 px-4 py-3 text-sm text-motta-red-dark"
        >
          Este produto está indisponível no catálogo de demonstração.
        </div>
      )}

      <AddToCartButton
        productId={product.id}
        productName={product.name}
        quantityMilli={quantity}
        available={available}
        label="Adicionar ao carrinho"
        size="lg"
        variant="primary"
        className="w-full"
      />

      <p className="text-center text-xs leading-relaxed text-motta-gray-500">
        Quantidade e preço são demonstrativos. Você poderá revisar tudo no{" "}
        <Link href="/carrinho" className="font-semibold text-motta-red underline-offset-2 hover:underline">
          carrinho
        </Link>
        . Nenhuma cobrança é realizada.
      </p>
    </div>
  );
}
