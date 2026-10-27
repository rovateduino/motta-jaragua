import type { ReactNode } from "react";
import Link from "next/link";
import {
  ChevronRightIcon,
  Container,
  MapPinIcon,
  UserIcon,
} from "@motta/ui";
import { constructionHref, primaryNav } from "@/lib/site";
import type { StoreSettings } from "@/lib/orders-db";
import { CartLink } from "@/components/cart/cart-link";
import { Logo } from "./logo";
import { SearchBox } from "./search-box";

function IconLink({
  href,
  label,
  children,
  showLabel = false,
}: {
  href: string;
  label: string;
  children: ReactNode;
  showLabel?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex h-10 items-center gap-2 rounded-xl px-2.5 text-motta-ink transition-colors hover:bg-motta-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-motta-red focus-visible:ring-offset-2"
    >
      {children}
      {showLabel ? <span className="hidden text-xs font-semibold lg:inline">{label}</span> : null}
    </Link>
  );
}

export function SiteHeader({
  storeSettings,
}: {
  storeSettings: StoreSettings | null;
}) {
  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="bg-motta-red text-white">
        <Container className="flex h-8 items-center justify-between gap-3 text-[11px] font-medium sm:text-xs">
          <p className="flex min-w-0 items-center gap-1.5">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {storeSettings
                ? `${storeSettings.city} • ${storeSettings.state}`
                : "Mercado Motta Jaraguá"}
            </span>
          </p>
          <div className="flex shrink-0 items-center gap-4">
            <Link
              href={constructionHref("cep")}
              className="underline-offset-2 hover:underline"
            >
              Consultar CEP
            </Link>
            <Link
              href="/admin"
              className="hidden underline-offset-2 hover:underline sm:inline"
            >
              Painel administrativo
            </Link>
          </div>
        </Container>
      </div>

      <Container className="flex items-center gap-2 py-2 sm:gap-5 sm:py-3">
        <Logo className="shrink-0 origin-left scale-90 sm:scale-100" />

        <div className="hidden flex-1 md:block">
          <SearchBox id="busca-desktop" />
        </div>

        <nav aria-label="Conta e carrinho" className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <IconLink href="/conta" label="Minha conta" showLabel>
            <UserIcon className="h-5 w-5" />
          </IconLink>
          <IconLink href="/admin" label="Painel administrativo">
            <span className="text-xs font-bold uppercase tracking-wide">Painel</span>
          </IconLink>
          <CartLink />
        </nav>
      </Container>

      <div className="border-t border-motta-gray-200 py-2 md:hidden">
        <Container>
          <SearchBox id="busca-mobile" />
        </Container>
      </div>

      <nav aria-label="Menu principal" className="hidden bg-motta-ink text-white md:block">
        <Container>
          <ul className="hide-scrollbar flex items-center gap-1 overflow-x-auto">
            {primaryNav.map((item, index) => (
              <li key={item.label} className="shrink-0">
                <Link
                  href={item.href}
                  className="inline-flex h-10 items-center gap-1 whitespace-nowrap px-3 text-xs font-semibold transition-colors hover:text-motta-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-motta-yellow"
                >
                  {index === 0 ? <ChevronRightIcon className="h-3.5 w-3.5 text-motta-yellow" /> : null}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </nav>
    </header>
  );
}
