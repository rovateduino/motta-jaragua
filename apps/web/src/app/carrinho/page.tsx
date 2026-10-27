import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Carrinho",
  description:
    "Revise os produtos selecionados antes de finalizar seu pedido no Mercado Motta Jaraguá.",
  robots: { index: false, follow: false },
};

export default function CarrinhoPage() {
  return <CartView />;
}
