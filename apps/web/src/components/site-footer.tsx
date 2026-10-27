import Link from "next/link";
import { Badge, Container } from "@motta/ui";
import { footerColumns } from "@/lib/site";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-12 bg-motta-ink text-white">
      <Container className="py-10">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Logo inverted />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              Plataforma de compras online do Mercado Motta Jaraguá. Projeto em
              desenvolvimento, com identidade regional e foco em uma experiência
              simples para toda a família.
            </p>
            <div className="mt-4">
              <Badge variant="demo" className="border border-white/60 bg-white/10 text-white">
                Ambiente de demonstração
              </Badge>
            </div>
            <p className="mt-3 text-xs text-white/50">
              Endereço, telefone, horários e canais oficiais serão publicados após
              confirmação do Mercado Motta.
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h2 className="text-xs font-bold uppercase tracking-widest text-motta-yellow">
                {column.title}
              </h2>
              <ul className="mt-3 space-y-2">
                {column.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/75 transition-colors hover:text-white hover:underline hover:underline-offset-2"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs leading-relaxed text-white/50">
          <p>
            Os preços, produtos e promoções exibidos nesta versão são fictícios e
            não representam ofertas comerciais. Nenhuma cobrança é realizada e
            nenhum pedido real é enviado.
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} Mercado Motta Jaraguá. Todos os direitos
            reservados. Conteúdo de demonstração.
          </p>
        </div>
      </Container>
    </footer>
  );
}
