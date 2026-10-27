import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRightIcon,
  buttonStyles,
  Card,
  CardBody,
  Container,
} from "@motta/ui";

export const metadata: Metadata = {
  title: "Em construção",
  robots: { index: false, follow: false },
};

const resourceLabels: Record<string, string> = {
  checkout: "Finalizar pedido",
  pedidos: "Meus pedidos",
  conta: "Minha conta",
  cep: "Consulta de CEP e cobertura",
  entrega: "Entrega e retirada",
  atendimento: "Atendimento",
  "painel-administrativo": "Painel administrativo",
  institucional: "Informações institucionais",
  "trabalhe-conosco": "Trabalhe conosco",
  privacidade: "Política de privacidade",
  termos: "Termos de uso",
  lgpd: "Canal LGPD",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ConstructionPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const resource = first(params.recurso) ?? "recurso";
  if (resource === "checkout") redirect("/checkout");
  if (resource === "pedidos") redirect("/pedidos");

  const query = first(params.q);
  const name = first(params.nome);
  const title = resourceLabels[resource] ?? "Esta área";

  return (
    <Container className="py-10 sm:py-16">
      <Card className="mx-auto max-w-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-motta-red to-motta-red-dark px-6 py-8 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-motta-yellow">
            Mercado Motta Jaraguá
          </p>
          <h1 className="mt-2 text-3xl font-black uppercase italic sm:text-4xl">
            Em construção
          </h1>
          <p className="mt-2 text-sm text-white/80">
            {title}
            {name ? ` — ${name}` : ""}
          </p>
        </div>
        <CardBody className="space-y-4">
          <p className="text-sm leading-relaxed text-motta-gray-700">
            Esta funcionalidade ainda não está disponível. Estamos preparando esta
            área para oferecer a melhor experiência de compra.
          </p>

          {query ? (
            <div className="rounded-xl border border-motta-gray-200 bg-motta-gray-50 p-3 text-sm text-motta-gray-700">
              Você buscou por <strong className="text-motta-ink">“{query}”</strong>. A
              busca está disponível no{" "}
              <Link href="/catalogo" className="font-semibold text-motta-red hover:underline">
                catálogo
              </Link>
              .
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/" className={buttonStyles({ variant: "primary" })}>
              Voltar para a loja
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link
              href="/ofertas"
              className={buttonStyles({ variant: "outline" })}
            >
              Ver ofertas
            </Link>
          </div>
        </CardBody>
      </Card>
    </Container>
  );
}
