import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { CartProvider } from "@/components/cart/cart-provider";
import { AppShell } from "@/components/app-shell";
import { getStoreCatalog } from "@/lib/catalog-db";
import { getStoreSettings } from "@/lib/orders-db";
import { appName, appUrl, isDemo } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: `${appName} — Perto de você`,
    template: `%s • ${appName}`,
  },
  description:
    "Compre online no Mercado Motta Jaraguá: ofertas, departamentos, entrega e retirada.",
  applicationName: appName,
  robots: isDemo ? { index: false, follow: false } : { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: appName,
    title: `${appName} — Perto de você`,
    description:
      "Ofertas e departamentos do Mercado Motta Jaraguá em um só lugar.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#D71920",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const [catalog, storeSettings] = await Promise.all([
    getStoreCatalog(),
    getStoreSettings(),
  ]);

  return (
    <html lang="pt-BR">
      <body>
        <a href="#conteudo" className="skip-link">
          Ir para o conteúdo
        </a>
        <CartProvider products={catalog?.products ?? null}>
          <AppShell storeSettings={storeSettings}>{children}</AppShell>
        </CartProvider>
      </body>
    </html>
  );
}
