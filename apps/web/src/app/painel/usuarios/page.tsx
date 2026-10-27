import type { Metadata } from "next";
import { prisma } from "@motta/db";
import { AdminUsersView } from "@/components/admin/admin-users-view";
import type { AssignableRole } from "@/components/auth/create-admin-form";
import type { AdminUserRecord } from "@/lib/admin-types";
import { requireAdminPermission } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Usuários e papéis",
  description: "Gestão de acessos administrativos e permissões por papel.",
  robots: { index: false, follow: false },
};

export default async function AdminUsersPage() {
  const currentAdmin = await requireAdminPermission("users.manage");

  const [roles, admins] = await Promise.all([
    prisma.role.findMany({
      orderBy: { name: "asc" },
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

  const adminRecords: AdminUserRecord[] = admins.map((admin) => ({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    active: admin.active,
    lastLoginAt: admin.lastLoginAt?.toISOString() ?? null,
    roleIds: admin.roles.map(({ role }) => role.id),
    roleNames: admin.roles.map(({ role }) => role.name),
  }));

  return (
    <AdminUsersView
      admins={adminRecords}
      roles={assignableRoles}
      currentAdminId={currentAdmin.id}
      canWrite
    />
  );
}
