"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangleIcon,
  ChartIcon,
  ClipboardListIcon,
  ExternalLinkIcon,
  GridIcon,
  LogOutIcon,
  PackageIcon,
  SettingsIcon,
  ShieldCheckIcon,
  TagIcon,
  TruckIcon,
  UsersIcon,
} from "@motta/ui";
import { logoutAdminAction } from "@/lib/auth/actions";

interface AdminShellUser {
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
}

const navItems = [
  {
    label: "Dashboard",
    href: "/painel",
    icon: GridIcon,
    exact: true,
    permission: "orders.read",
  },
  {
    label: "Pedidos",
    href: "/painel/pedidos",
    icon: ClipboardListIcon,
    permission: "orders.read",
  },
  {
    label: "Produtos e estoque",
    href: "/painel/produtos",
    icon: PackageIcon,
    permission: "products.read",
  },
  {
    label: "Ofertas e preços",
    href: "/painel/ofertas",
    icon: TagIcon,
    permission: "promotions.write",
  },
  {
    label: "Clientes",
    href: "/painel/clientes",
    icon: UsersIcon,
    permission: "customers.read",
  },
  {
    label: "Entregas",
    href: "/painel/entregas",
    icon: TruckIcon,
    permission: "orders.read",
  },
  {
    label: "Relatórios",
    href: "/painel/relatorios",
    icon: ChartIcon,
    permission: "reports.read",
  },
  {
    label: "Configurações",
    href: "/painel/configuracoes",
    icon: SettingsIcon,
    permission: "settings.write",
  },
  {
    label: "Usuários e papéis",
    href: "/painel/usuarios",
    icon: ShieldCheckIcon,
    permission: "users.manage",
  },
] as const;

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
  children,
  admin,
  pendingOrders,
  metrics,
}: {
  children: ReactNode;
  admin: AdminShellUser;
  pendingOrders: number;
  metrics: {
    readonly storeName: string;
    readonly lowStockCount: number;
    readonly activePromotionCount: number;
  };
}) {
  const pathname = usePathname();
  const visibleNavItems = navItems.filter((item) =>
    admin.permissions.includes(item.permission),
  );
  const initials = admin.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const badgeFor = (href: string): number | null => {
    if (href === "/painel/pedidos") return pendingOrders;
    if (href === "/painel/produtos") return metrics.lowStockCount;
    if (href === "/painel/ofertas") return metrics.activePromotionCount;
    return null;
  };

  return (
    <div className="min-h-screen bg-motta-gray-50 lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <aside className="hidden border-r border-white/10 bg-motta-ink text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="border-b border-white/10 px-5 py-6">
          <Link href="/painel" className="block leading-none">
            <span className="text-[10px] font-bold tracking-[0.32em] text-white/60">
              MERCADO
            </span>
            <span className="mt-1 block text-3xl font-black italic tracking-tight text-white">
              MOTTA
            </span>
            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-motta-yellow">
              Painel
            </span>
          </Link>
          <p className="mt-3 truncate text-[11px] text-white/50">{metrics.storeName}</p>
        </div>

        <nav
          aria-label="Navegação do painel"
          className="flex-1 overflow-y-auto px-3 py-4"
        >
          <ul className="space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(
                pathname,
                item.href,
                "exact" in item && item.exact,
              );
              const badge = badgeFor(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-motta-yellow ${
                      active
                        ? "bg-motta-red text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {badge !== null && badge > 0 ? (
                      <span
                        className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                          active ? "bg-white text-motta-red" : "bg-white/15 text-white"
                        }`}
                      >
                        {badge > 99 ? "99+" : badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="rounded-xl bg-white/5 px-3 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-motta-yellow text-xs font-black text-motta-ink">
                {initials || "M"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">{admin.name}</p>
                <p
                  className="truncate text-[10px] text-white/55"
                  title={admin.email}
                >
                  {admin.roles.join(" · ") || "Sem papel"}
                </p>
              </div>
              <form action={logoutAdminAction}>
                <button
                  type="submit"
                  aria-label="Sair do painel"
                  title="Sair do painel"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-motta-yellow"
                >
                  <LogOutIcon className="h-4 w-4" />
                </button>
              </form>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-white/80">
              <ShieldCheckIcon className="h-3 w-3" />
              Sessão autenticada
            </p>
          </div>
          <Link
            href="/"
            className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white/65 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ExternalLinkIcon className="h-4 w-4" />
            Ver loja
          </Link>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-motta-gray-200 bg-white/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <Link href="/painel" className="flex items-center gap-2">
              <span className="text-xl font-black italic tracking-tight text-motta-red">
                MOTTA
              </span>
              <span className="rounded-md bg-motta-ink px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-motta-yellow">
                Painel
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-xs font-bold text-motta-gray-700"
              >
                Ver loja
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </Link>
              <form action={logoutAdminAction}>
                <button
                  type="submit"
                  aria-label="Sair do painel"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-motta-gray-700 hover:bg-motta-gray-100"
                >
                  <LogOutIcon className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
          <nav
            aria-label="Navegação do painel"
            className="border-t border-motta-gray-200"
          >
            <ul className="hide-scrollbar flex gap-1 overflow-x-auto px-2 py-2">
              {visibleNavItems.map((item) => {
                const active = isActive(
                  pathname,
                  item.href,
                  "exact" in item && item.exact,
                );
                const Icon = item.icon;
                return (
                  <li key={item.href} className="shrink-0">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold ${
                        active
                          ? "bg-motta-red text-white"
                          : "text-motta-gray-700 hover:bg-motta-gray-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </header>

        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 sm:px-6 lg:px-8">
          <p className="flex items-start gap-2 text-[11px] leading-relaxed text-amber-900 sm:items-center">
            <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" />
            <span>
              <strong className="font-black uppercase tracking-wide">
                Sessão autenticada · dados do banco.
              </strong>{" "}
              Produtos, ofertas, pedidos e indicadores são persistidos no PostgreSQL.
              Pagamentos e integrações externas ainda não estão conectados.
            </span>
          </p>
        </div>

        <main id="conteudo" className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
