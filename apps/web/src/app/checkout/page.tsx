import type { Metadata } from "next";
import Link from "next/link";
import { buttonStyles, Card, CardBody, Container } from "@motta/ui";
import { CheckoutView } from "@/components/checkout/checkout-view";
import { getStoreSettings, listPickupSlots } from "@/lib/orders-db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Finalizar pedido",
  description:
    "Escolha entrega ou retirada no Mercado Motta Jaraguá. Seu pedido será registrado no banco.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const settings = await getStoreSettings();

  if (!settings) {
    return (
      <Container className="py-10 sm:py-16">
        <Card className="mx-auto max-w-2xl text-center">
          <CardBody className="px-6 py-12">
            <h1 className="text-2xl font-black tracking-tight text-motta-ink">
              Checkout indisponível
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-motta-gray-500">
              Não conseguimos carregar as regras da loja agora. Sem elas não é possível
              calcular frete e pedido mínimo com segurança.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/carrinho" className={buttonStyles({ variant: "primary" })}>
                Voltar ao carrinho
              </Link>
              <Link href="/" className={buttonStyles({ variant: "outline" })}>
                Ir para a loja
              </Link>
            </div>
          </CardBody>
        </Card>
      </Container>
    );
  }

  const pickupSlots = await listPickupSlots(settings.storeId);

  return (
    <CheckoutView
      rules={settings}
      pickupSlots={pickupSlots}
      storeLocation={{ city: settings.city, state: settings.state }}
    />
  );
}
