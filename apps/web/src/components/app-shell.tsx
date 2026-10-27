"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MobileNav } from "@/components/mobile-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { StoreSettings } from "@/lib/orders-db";

export function AppShell({
  children,
  storeSettings,
}: {
  children: ReactNode;
  storeSettings: StoreSettings | null;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/painel") || pathname.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <SiteHeader storeSettings={storeSettings} />
      <main id="conteudo" className="min-h-[60vh] pb-20 md:pb-0">
        {children}
      </main>
      <SiteFooter storeSettings={storeSettings} />
      <MobileNav />
    </>
  );
}
