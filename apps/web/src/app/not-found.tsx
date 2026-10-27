import Link from "next/link";
import { buttonStyles, Container } from "@motta/ui";

export default function NotFound() {
  return (
    <Container className="py-16 text-center sm:py-24">
      <p className="text-xs font-bold uppercase tracking-widest text-motta-red">
        Erro 404
      </p>
      <h1 className="mt-2 text-3xl font-black italic text-motta-ink sm:text-4xl">
        Página não encontrada
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-motta-gray-500">
        O endereço acessado não existe nesta versão da loja. Volte ao início para
        continuar navegando.
      </p>
      <Link href="/" className={`${buttonStyles({ variant: "primary" })} mt-6`}>
        Voltar para a loja
      </Link>
    </Container>
  );
}
