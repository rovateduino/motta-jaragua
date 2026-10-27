import type { Metadata } from "next";
import { prisma } from "@motta/db";
import { Badge, Card, CardBody } from "@motta/ui";
import {
  CreateAdminForm,
  type AssignableRole,
} from "@/components/auth/create-admin-form";
import { requireAdminPermission } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Usuários e papéis",
  description: "Gestão de acessos administrativos e permissões por papel.",
  robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default async function AdminUsersPage() {
  await requireAdminPermission("users.manage");

  const [roles, admins] = await Promise.all([
    prisma.role.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { permissions: true } } },
    }),
    prisma.adminUser.findMany({
      orderBy: [{ active: "desc" }, { name: "asc" }],
      include: { roles: { include: { role: true } } },
    }),
  ]);

  const assignableRoles: AssignableRole[] = roles.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
  }));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-motta-red">
          Segurança
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-motta-ink sm:text-3xl">
          Usuários e papéis
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-motta-gray-500">
          Crie acessos administrativos e defina o menor conjunto de permissões
          necessário para cada colaborador.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)] xl:items-start">
        <Card>
          <CardBody className="space-y-4">
            <div>
              <h2 className="text-lg font-extrabold text-motta-ink">
                Novo acesso administrativo
              </h2>
              <p className="text-xs leading-relaxed text-motta-gray-500">
                A senha é armazenada com hash Argon2id e nunca é exibida novamente.
              </p>
            </div>
            <CreateAdminForm roles={assignableRoles} />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <div>
              <h2 className="text-lg font-extrabold text-motta-ink">Equipe</h2>
              <p className="text-xs text-motta-gray-500">
                {admins.length} acesso(s) administrativo(s) cadastrado(s).
              </p>
            </div>
            <ul className="divide-y divide-motta-gray-200">
              {admins.map((admin) => (
                <li key={admin.id} className="space-y-1.5 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-motta-ink">
                        {admin.name}
                      </p>
                      <p className="truncate text-[11px] text-motta-gray-500">
                        {admin.email}
                      </p>
                    </div>
                    <Badge variant={admin.active ? "success" : "danger"}>
                      {admin.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {admin.roles.length > 0 ? (
                      admin.roles.map(({ role }) => (
                        <span
                          key={role.id}
                          className="rounded-md bg-motta-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-motta-gray-700"
                        >
                          {role.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] font-semibold text-motta-red">
                        Sem papel atribuído
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-motta-gray-500">
                    Último login:{" "}
                    {admin.lastLoginAt
                      ? dateFormatter.format(admin.lastLoginAt)
                      : "nunca"}
                  </p>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody className="space-y-2">
          <h2 className="text-lg font-extrabold text-motta-ink">Papéis disponíveis</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <div
                key={role.id}
                className="rounded-xl border border-motta-gray-200 px-3 py-2.5"
              >
                <p className="text-xs font-black uppercase tracking-wide text-motta-ink">
                  {role.name}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-motta-gray-500">
                  {role.description ?? "Sem descrição."} · {role._count.permissions}{" "}
                  permissão(ões)
                </p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
