"use client";

import Link from "next/link";
import {
  formatBRL,
  formatQuantity,
  formatUnitPriceSuffix,
} from "@motta/domain";
import {
  ArrowRightIcon,
  buttonStyles,
  Card,
  CardBody,
  CartIcon,
  Container,
  TrashIcon,
} from "@motta/ui";
import { useCart } from "./cart-provider";
import { QuantityStepper } from "@/components/catalog/quantity-stepper";
import { getMaxQuantityMilli, resolveProductImageUrl } from "@/lib/catalog-core";
import { demoCheckoutRules } from "@/lib/demo-content";

export function CartView() {
  const {
    items,
    hydrated,
    lineCount,
    subtotalCents,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  if (!hydrated) {
    return (
      <Container className="py-10">
        <div
          aria-busy="true"
          aria-live="polite"
          className="mx-auto max-w-2xl rounded-2xl border border-motta-gray-200 bg-white p-8 text-center text-sm text-motta-gray-500"
        >
          Carregando seu carrinho…
        </div>
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container className="py-10 sm:py-16">
        <Card className="mx-auto max-w-2xl text-center">
          <CardBody className="px-6 py-12">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-motta-red/10 text-motta-red">
              <CartIcon className="h-8 w-8" />
            </span>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-motta-ink sm:text-3xl">
              Seu carrinho está vazio
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-motta-gray-500">
              Explore o catálogo demonstrativo, escolha produtos e monte seu carrinho.
              Nenhuma cobrança é realizada neste ambiente.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/catalogo" className={buttonStyles({ variant: "primary" })}>
                Ver catálogo
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link href="/ofertas" className={buttonStyles({ variant: "outline" })}>
                Ver ofertas
              </Link>
            </div>
          </CardBody>
        </Card>
      </Container>
    );
  }

  const missingForFreeShipping = Math.max(
    0,
    demoCheckoutRules.freeShippingThresholdCents - subtotalCents,
  );

  return (
    <Container className="py-8 sm:py-10">
      <nav aria-label="Você está aqui" className="mb-4 text-xs text-motta-gray-500">
        <Link href="/" className="hover:text-motta-red hover:underline">
          Início
        </Link>
        <span className="mx-1.5">/</span>
        <span aria-current="page" className="font-semibold text-motta-ink">
          Carrinho
        </span>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-motta-red">
            Revise sua compra
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-motta-ink sm:text-4xl">
            Seu carrinho
          </h1>
          <p className="mt-1 text-sm text-motta-gray-500">
            {lineCount === 1 ? "1 produto" : `${lineCount} produtos`} no carrinho
          </p>
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-motta-gray-500 underline-offset-2 hover:text-motta-red hover:underline"
          onClick={() => {
            if (window.confirm("Remover todos os itens do carrinho?")) clearCart();
          }}
        >
          Limpar carrinho
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <ul className="space-y-3">
          {items.map((item) => {
            const maxQuantity = getMaxQuantityMilli(item.product);
            const imageUrl = resolveProductImageUrl(item.product);

            return (
              <li key={item.product.id}>
                <Card>
                  <CardBody className="grid grid-cols-[4rem_minmax(0,1fr)] items-start gap-3 sm:flex sm:items-center sm:gap-4">
                    <Link
                      href={`/produto/${item.product.slug}`}
                      aria-label={`Ver ${item.product.name}`}
                      className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br text-3xl sm:h-20 sm:w-20 sm:text-4xl ${item.product.imageTone}`}
                    >
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- sem serviço de storage/otimização ainda; URLs públicas externas.
                        <img
                          src={imageUrl}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span aria-hidden="true">{item.product.emoji}</span>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      {item.product.brand ? <p className="text-[11px] font-semibold uppercase tracking-wide text-motta-gray-500">{item.product.brand}</p> : null}
                      <Link
                        href={`/produto/${item.product.slug}`}
                        className="mt-0.5 block text-sm font-bold leading-snug text-motta-ink hover:text-motta-red"
                      >
                        {item.product.name}
                      </Link>
                      <p className="mt-1 text-xs text-motta-gray-500">
                        {formatBRL(item.product.priceCents)}{" "}
                        {formatUnitPriceSuffix(item.product.unit)}
                      </p>
                    </div>

                    <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 sm:ml-auto sm:col-span-1 sm:flex-col sm:items-end">
                      <QuantityStepper
                        value={item.quantityMilli}
                        min={item.product.minQuantityMilli}
                        max={maxQuantity}
                        step={item.product.stepQuantityMilli}
                        unit={item.product.unit}
                        productName={item.product.name}
                        onChange={(next) => updateQuantity(item.product.id, next)}
                        size="sm"
                      />
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-motta-ink">
                          {formatBRL(item.lineSubtotalCents)}
                        </p>
                        <p className="text-[11px] text-motta-gray-500">
                          {formatQuantity(item.quantityMilli, item.product.unit)} ×{" "}
                          {formatBRL(item.product.priceCents)}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeItem(item.product.id)}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-motta-gray-500 hover:text-motta-red"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                          Remover
                        </button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>

        <Card className="lg:sticky lg:top-36">
          <CardBody className="space-y-3">
            <h2 className="text-lg font-extrabold text-motta-ink">Resumo</h2>

            <div className="flex items-center justify-between text-sm">
              <span className="text-motta-gray-700">Subtotal</span>
              <strong className="text-motta-ink">{formatBRL(subtotalCents)}</strong>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-motta-gray-700">Entrega</span>
              <span className="font-semibold text-motta-gray-500">A calcular</span>
            </div>

            <div className="rounded-lg bg-motta-gray-50 px-3 py-2 text-[11px] leading-relaxed text-motta-gray-500">
              {missingForFreeShipping > 0 ? (
                <>
                  Faltam <strong>{formatBRL(missingForFreeShipping)}</strong> para a
                  faixa demonstrativa de frete grátis.
                </>
              ) : (
                <>Faixa demonstrativa de frete grátis atingida.</>
              )}{" "}
              A regra real será confirmada com o Mercado Motta.
            </div>

            <div className="flex items-end justify-between border-t border-motta-gray-200 pt-3">
              <span className="text-sm font-bold text-motta-ink">Total parcial</span>
              <span className="text-2xl font-black text-motta-ink">
                {formatBRL(subtotalCents)}
              </span>
            </div>

            <Link
              href="/checkout"
              className={buttonStyles({ variant: "primary", fullWidth: true })}
            >
              Continuar para o checkout
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link
              href="/catalogo"
              className={buttonStyles({ variant: "outline", fullWidth: true })}
            >
              Continuar comprando
            </Link>

            <p className="text-center text-[11px] leading-relaxed text-motta-gray-500">
              Carrinho salvo apenas neste navegador. Nenhum pedido real é criado e
              nenhuma cobrança é realizada.
            </p>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
}
