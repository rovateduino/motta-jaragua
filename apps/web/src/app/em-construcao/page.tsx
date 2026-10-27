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

const resourceLabels: Record<string, { label: string; phase: string }> = {
  checkout: { label: "Checkout demonstrativo", phase: "Fase 2" },
  pedidos: { label: "Meus pedidos", phase: "Fase 2 / Fase 4" },
  conta: { label: "Minha conta", phase: "Fase 4" },
  cep: { label: "Consulta de CEP e cobertura", phase: "Fase 2 / Fase 5" },
  entrega: { label: "Entrega e retirada", phase: "Fase 5" },
  atendimento: { label: "Atendimento", phase: "Fase 2" },
  "painel-administrativo": { label: "Painel administrativo", phase: "Fase 3" },
  institucional: { label: "Informações institucionais", phase: "A definir" },
  "trabalhe-conosco": { label: "Trabalhe conosco", phase: "A definir" },
  privacidade: { label: "Política de privacidade", phase: "Revisão jurídica" },
  termos: { label: "Termos de uso", phase: "Revisão jurídica" },
  lgpd: { label: "Canal LGPD", phase: "Revisão jurídica" },
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
  const details = resourceLabels[resource];

  const title = details?.label ?? "Esta área";
  const phase = details?.phase ?? "Próximas fases";

  return (
    <Container className="py-10 sm:py-16">
      <Card className="mx-auto max-w-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-motta-red to-motta-red-dark px-6 py-8 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-motta-yellow">
            {phase}
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
            Esta funcionalidade ainda não faz parte desta versão demonstrativa. A
            navegação está preparada, mas nenhuma ação comercial é simulada como se
            fosse real neste momento.
          </p>

          {query ? (
            <div className="rounded-xl border border-motta-gray-200 bg-motta-gray-50 p-3 text-sm text-motta-gray-700">
              Você buscou por <strong className="text-motta-ink">“{query}”</strong>. A
              busca está disponível no{" "}
              <Link href="/catalogo" className="font-semibold text-motta-red hover:underline">
                catálogo demonstrativo
              </Link>
              .
            </div>
          ) : null}

          <div className="rounded-xl border border-dashed border-motta-gray-300 p-3 text-xs leading-relaxed text-motta-gray-500">
            <strong className="font-bold text-motta-ink">Modo demonstração:</strong>{" "}
            dados fictícios, sem cobrança e sem envio real de pedidos.
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/" className={buttonStyles({ variant: "primary" })}>
              Voltar para a loja
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link
              href="/ofertas"
              className={buttonStyles({ variant: "outline" })}
            >
              Ver ofertas demonstrativas
            </Link>
          </div>
        </CardBody>
      </Card>
    </Container>
  );
}
