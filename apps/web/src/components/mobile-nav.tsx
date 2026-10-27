"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CartIcon,
  ClipboardListIcon,
  GridIcon,
  HomeIcon,
  TagIcon,
} from "@motta/ui";
import { useCart } from "@/components/cart/cart-provider";

const items = [
  { label: "Início", href: "/", icon: HomeIcon, match: (path: string) => path === "/" },
  {
    label: "Ofertas",
    href: "/ofertas",
    icon: TagIcon,
    match: (path: string) => path === "/ofertas",
  },
  {
    label: "Catálogo",
    href: "/catalogo",
    icon: GridIcon,
    match: (path: string) =>
      path === "/catalogo" || path.startsWith("/categoria/") || path.startsWith("/produto/"),
  },
  {
    label: "Carrinho",
    href: "/carrinho",
    icon: CartIcon,
    match: (path: string) => path === "/carrinho",
    showCartCount: true,
  },
  {
    label: "Pedidos",
    href: "/pedidos",
    icon: ClipboardListIcon,
    match: (path: string) => path === "/pedidos" || path.startsWith("/pedidos/"),
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const { lineCount, hydrated } = useCart();

  return (
    <nav
      aria-label="Navegação rápida"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-motta-gray-200 bg-white/95 backdrop-blur md:hidden safe-bottom"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-semibold hover:text-motta-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-motta-red ${
                  active ? "text-motta-red" : "text-motta-gray-700"
                }`}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {item.showCartCount && hydrated && lineCount > 0 ? (
                    <span
                      aria-hidden="true"
                      className="absolute -right-2.5 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-motta-red px-1 text-[9px] font-bold text-white"
                    >
                      {lineCount > 99 ? "99+" : lineCount}
                    </span>
                  ) : null}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
