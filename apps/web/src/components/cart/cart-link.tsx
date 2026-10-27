"use client";

import Link from "next/link";
import { CartIcon, cn } from "@motta/ui";
import { useCart } from "./cart-provider";

export function CartLink({ className }: { className?: string }) {
  const { lineCount, hydrated } = useCart();
  const visibleCount = hydrated ? lineCount : 0;

  return (
    <Link
      href="/carrinho"
      aria-label={`Carrinho de compras, ${visibleCount} ${visibleCount === 1 ? "produto" : "produtos"}`}
      className={cn(
        "relative inline-flex h-10 items-center gap-2 rounded-xl px-2.5 text-motta-ink transition-colors hover:bg-motta-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-motta-red focus-visible:ring-offset-2",
        className,
      )}
    >
      <span className="relative">
        <CartIcon className="h-5 w-5" />
        {visibleCount > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-motta-red px-1 text-[10px] font-bold text-white"
          >
            {visibleCount > 99 ? "99+" : visibleCount}
          </span>
        ) : null}
      </span>
      <span className="hidden text-xs font-semibold lg:inline">Carrinho</span>
    </Link>
  );
}
