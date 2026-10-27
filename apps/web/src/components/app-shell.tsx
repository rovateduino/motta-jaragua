"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DemoNotice } from "@motta/ui";
import { MobileNav } from "@/components/mobile-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function AppShell({
  children,
  demo,
}: {
  children: ReactNode;
  demo: boolean;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/painel") || pathname.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      {demo ? <DemoNotice /> : null}
      <SiteHeader />
      <main id="conteudo" className="min-h-[60vh] pb-20 md:pb-0">
        {children}
      </main>
      <SiteFooter />
      <MobileNav />
    </>
  );
}
