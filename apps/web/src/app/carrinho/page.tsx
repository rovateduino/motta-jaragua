import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { getStoreSettings } from "@/lib/orders-db";

export const metadata: Metadata = {
  title: "Carrinho",
  description:
    "Revise os produtos selecionados antes de finalizar seu pedido no Mercado Motta Jaraguá.",
  robots: { index: false, follow: false },
};

// A faixa de frete grátis vem do banco (configurações do painel), então a
// página não pode ser pré-renderizada no build.
export const dynamic = "force-dynamic";

export default async function CarrinhoPage() {
  const settings = await getStoreSettings();

  return (
    <CartView
      freeShippingThresholdCents={settings?.freeShippingThresholdCents ?? 0}
    />
  );
}
