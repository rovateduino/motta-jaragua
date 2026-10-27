import type { Metadata } from "next";
import Link from "next/link";
import { buttonStyles, Card, CardBody, LockIcon } from "@motta/ui";
import { getCurrentAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Acesso negado",
  robots: { index: false, follow: false },
};

const permissionLabels: Record<string, string> = {
  "orders.read": "consultar pedidos",
  "orders.update": "atualizar pedidos",
  "products.read": "consultar produtos",
  "products.write": "editar produtos",
  "inventory.write": "ajustar estoque",
  "promotions.write": "gerenciar ofertas",
  "customers.read": "consultar clientes",
  "customers.manage": "editar e anonimizar clientes",
  "reports.read": "consultar relatórios",
  "settings.write": "alterar configurações",
  "users.manage": "gerenciar usuários",
  "audit.read": "consultar auditoria",
};

interface AccessDeniedPageProps {
  searchParams: Promise<{ permissao?: string | string[] }>;
}

export default async function AccessDeniedPage({
  searchParams,
}: AccessDeniedPageProps) {
  const admin = await getCurrentAdmin();
  const params = await searchParams;
  const permission = Array.isArray(params.permissao)
    ? params.permissao[0]
    : params.permissao;
  const label = permission ? permissionLabels[permission] : undefined;

  return (
    <Card>
      <CardBody className="mx-auto max-w-xl px-6 py-12 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-motta-red/10 text-motta-red">
          <LockIcon className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-2xl font-black tracking-tight text-motta-ink">
          Acesso não permitido
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-motta-gray-500">
          {admin
            ? `A conta ${admin.email} está autenticada, mas o papel ${admin.roles.join(", ") || "atual"} não permite ${label ?? "abrir esta área"}.`
            : "Sua sessão não possui permissão para abrir esta área."}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-motta-gray-500">
          Solicite a um administrador a inclusão do papel adequado. A tentativa de
          acesso permanece bloqueada no servidor.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/painel" className={buttonStyles({ variant: "primary" })}>
            Voltar ao dashboard
          </Link>
          <Link href="/" className={buttonStyles({ variant: "outline" })}>
            Ir para a loja
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
