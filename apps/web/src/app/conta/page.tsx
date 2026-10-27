import type { Metadata } from "next";
import Link from "next/link";
import { buttonStyles, Card, CardBody, LogOutIcon, UserIcon } from "@motta/ui";
import { logoutCustomerAction } from "@/lib/auth/actions";
import { requireCustomer } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Minha conta",
  description: "Gerencie sua conta e acompanhe seus pedidos.",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const customer = await requireCustomer("/conta");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-motta-red">
            Minha conta
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-motta-ink">
            Olá, {customer.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-motta-gray-500">
            Sua sessão está ativa e protegida neste navegador.
          </p>
        </div>
        <form action={logoutCustomerAction}>
          <button className={buttonStyles({ variant: "outline" })} type="submit">
            <LogOutIcon className="h-4 w-4" />
            Sair
          </button>
        </form>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardBody className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-motta-ink">
              <UserIcon className="h-5 w-5 text-motta-red" />
              Seus dados
            </h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-motta-gray-500">
                  Nome
                </dt>
                <dd className="font-semibold text-motta-ink">{customer.name}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-motta-gray-500">
                  E-mail
                </dt>
                <dd className="font-semibold text-motta-ink">{customer.email}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-motta-gray-500">
                  Telefone
                </dt>
                <dd className="font-semibold text-motta-ink">
                  {customer.phone ?? "Não informado"}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <h2 className="text-lg font-extrabold text-motta-ink">Atalhos</h2>
            <Link
              href="/pedidos"
              className={buttonStyles({ variant: "primary", fullWidth: true })}
            >
              Meus pedidos
            </Link>
            <Link
              href="/catalogo"
              className={buttonStyles({ variant: "outline", fullWidth: true })}
            >
              Continuar comprando
            </Link>
            <p className="text-[11px] leading-relaxed text-motta-gray-500">
              Seus pedidos são consultados com segurança no banco e ficam
              disponíveis em qualquer sessão da sua conta.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
