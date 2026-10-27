"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@motta/db";
import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  verifyPassword,
} from "./password";
import {
  adminBootstrapSchema,
  adminIdsSchema,
  adminLoginSchema,
  createAdminSchema,
  customerLoginSchema,
  customerSignupSchema,
  fieldErrorsFromZod,
  safeRedirectPath,
  setAdminActiveSchema,
  updateAdminRolesSchema,
  type AuthActionState,
} from "./validation";
import type { AdminActionResult } from "@/lib/admin-actions";
import {
  clearLoginFailures,
  loginRetryAfterSeconds,
  recordLoginFailure,
} from "./rate-limit";
import { isLegacyDemoAdminBlocked } from "./demo-accounts";
import {
  endAdminSession,
  endCustomerSession,
  startAdminSession,
  startCustomerSession,
  requireAdminAction,
} from "./session";

const GENERIC_LOGIN_ERROR = "E-mail ou senha inválidos.";

class AdminActionError extends Error {}

async function loginRateLimitKey(email: string): Promise<string> {
  const requestHeaders = await headers();
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "local";
  return `${ip}:${email}`;
}

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function blockedLoginResponse(key: string): Promise<AuthActionState | null> {
  const retryAfter = loginRetryAfterSeconds(key);
  if (retryAfter <= 0) return null;

  const minutes = Math.max(1, Math.ceil(retryAfter / 60));
  return {
    error: `Muitas tentativas. Tente novamente em ${minutes} minuto(s).`,
  };
}

export async function loginCustomerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = customerLoginSchema.safeParse({
    email: getString(formData, "email"),
    password: getString(formData, "password"),
  });

  if (!parsed.success) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  const rateLimitKey = await loginRateLimitKey(parsed.data.email);
  const blocked = await blockedLoginResponse(rateLimitKey);
  if (blocked) return blocked;

  const customer = await prisma.customer.findUnique({
    where: { email: parsed.data.email },
  });
  const passwordValid = await verifyPassword(
    customer?.passwordHash ?? DUMMY_PASSWORD_HASH,
    parsed.data.password,
  );

  if (!customer || !customer.passwordHash || !passwordValid || customer.anonymizedAt) {
    recordLoginFailure(rateLimitKey);
    return { error: GENERIC_LOGIN_ERROR };
  }

  clearLoginFailures(rateLimitKey);
  await startCustomerSession(customer.id);
  redirect(safeRedirectPath(formData.get("next"), "/conta"));
}

export async function loginAdminAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = adminLoginSchema.safeParse({
    email: getString(formData, "email"),
    password: getString(formData, "password"),
  });

  if (!parsed.success) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  // Contas demo do seed antigo nunca autenticam em produção, mesmo que o
  // registro tenha sido reativado no banco (defesa em profundidade).
  if (isLegacyDemoAdminBlocked(parsed.data.email)) {
    recordLoginFailure(await loginRateLimitKey(parsed.data.email));
    return { error: GENERIC_LOGIN_ERROR };
  }

  const rateLimitKey = await loginRateLimitKey(parsed.data.email);
  const blocked = await blockedLoginResponse(rateLimitKey);
  if (blocked) return blocked;

  const admin = await prisma.adminUser.findUnique({
    where: { email: parsed.data.email },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: { select: { permissionId: true } },
            },
          },
        },
      },
    },
  });
  const passwordValid = await verifyPassword(
    admin?.passwordHash ?? DUMMY_PASSWORD_HASH,
    parsed.data.password,
  );
  const hasPermissions = Boolean(
    admin?.roles.some((role) => role.role.permissions.length > 0),
  );

  if (!admin || !admin.active || !passwordValid || !hasPermissions) {
    recordLoginFailure(rateLimitKey);
    return {
      error: admin?.active === false ? "Este acesso administrativo está inativo." : GENERIC_LOGIN_ERROR,
    };
  }

  clearLoginFailures(rateLimitKey);
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });
  await startAdminSession(admin.id);
  redirect(safeRedirectPath(formData.get("next"), "/painel", "/painel"));
}

export async function signupCustomerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = customerSignupSchema.safeParse({
    name: getString(formData, "name"),
    email: getString(formData, "email"),
    phone: getString(formData, "phone"),
    password: getString(formData, "password"),
    passwordConfirmation: getString(formData, "passwordConfirmation"),
    marketingConsent: formData.get("marketingConsent") === "on",
    terms: formData.get("terms") === "on",
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        passwordHash: await hashPassword(parsed.data.password),
        marketingConsentAt: parsed.data.marketingConsent ? new Date() : null,
      },
    });

    await startCustomerSession(customer.id);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return {
        fieldErrors: {
          email: "Já existe uma conta com este e-mail. Tente entrar.",
        },
      };
    }

    console.error("Falha ao criar conta de cliente", error);
    return { error: "Não foi possível criar sua conta agora. Tente novamente." };
  }

  redirect("/conta");
}

export async function bootstrapAdminAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const adminCount = await prisma.adminUser.count();
  if (adminCount > 0) {
    return { error: "O cadastro inicial já foi concluído. Entre com sua conta administrativa." };
  }

  const parsed = adminBootstrapSchema.safeParse({
    name: getString(formData, "name"),
    email: getString(formData, "email"),
    password: getString(formData, "password"),
    passwordConfirmation: getString(formData, "passwordConfirmation"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  if (!adminRole) {
    return { error: "O papel ADMIN não foi configurado. Execute o seed do banco." };
  }

  try {
    const admin = await prisma.adminUser.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
        roles: { create: { roleId: adminRole.id } },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorType: "ADMIN",
        actorAdminId: admin.id,
        action: "admin.bootstrap",
        entityType: "AdminUser",
        entityId: admin.id,
        after: { email: admin.email, role: "ADMIN" },
      },
    });

    await startAdminSession(admin.id);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { fieldErrors: { email: "Já existe uma conta com este e-mail." } };
    }

    console.error("Falha no cadastro inicial do administrador", error);
    return { error: "Não foi possível concluir o cadastro inicial." };
  }

  redirect("/painel");
}

export async function createAdminAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const actor = await requireAdminAction("users.manage");

  const parsed = createAdminSchema.safeParse({
    name: getString(formData, "name"),
    email: getString(formData, "email"),
    password: getString(formData, "password"),
    roleIds: formData.getAll("roleIds").filter((value): value is string => typeof value === "string"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const roles = await prisma.role.findMany({
    where: { id: { in: parsed.data.roleIds } },
    select: { id: true, name: true },
  });

  if (roles.length !== new Set(parsed.data.roleIds).size) {
    return { fieldErrors: { roleIds: "Um ou mais papéis selecionados são inválidos." } };
  }

  try {
    const admin = await prisma.$transaction(async (transaction) => {
      const created = await transaction.adminUser.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          passwordHash: await hashPassword(parsed.data.password),
          roles: {
            create: roles.map((role) => ({ roleId: role.id })),
          },
        },
      });

      await transaction.auditLog.create({
        data: {
          actorType: "ADMIN",
          actorAdminId: actor.id,
          action: "admin.created",
          entityType: "AdminUser",
          entityId: created.id,
          after: {
            email: created.email,
            roles: roles.map((role) => role.name),
          },
        },
      });

      return created;
    });

    revalidatePath("/painel/usuarios");
    return { success: `Acesso administrativo de ${admin.name} criado.` };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { fieldErrors: { email: "Já existe um administrador com este e-mail." } };
    }

    console.error("Falha ao criar administrador", error);
    return { error: "Não foi possível criar o acesso administrativo." };
  }
}

/**
 * Ativa ou desativa um acesso administrativo na própria transação.
 *
 * A desativação revoga as sessões abertas do usuário, impede login e preserva
 * o registro (e todo o histórico de auditoria) em vez de apagar a conta.
 */
async function setAdminActiveRecord(
  actorId: string,
  targetId: string,
  active: boolean,
) {
  return prisma.$transaction(async (transaction) => {
    const target = await transaction.adminUser.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
        roles: { select: { role: { select: { name: true } } } },
      },
    });
    if (!target) {
      throw new AdminActionError("Acesso administrativo não encontrado.");
    }
    if (target.active === active) {
      throw new AdminActionError(
        active
          ? `O acesso de ${target.name} já está ativo.`
          : `O acesso de ${target.name} já está inativo.`,
      );
    }

    await transaction.adminUser.update({
      where: { id: target.id },
      data: { active },
    });
    if (!active) {
      await transaction.authSession.deleteMany({
        where: { adminUserId: target.id },
      });
    }

    await transaction.auditLog.create({
      data: {
        actorType: "ADMIN",
        actorAdminId: actorId,
        action: active ? "admin.activated" : "admin.deactivated",
        entityType: "AdminUser",
        entityId: target.id,
        before: {
          active: target.active,
          email: target.email,
          roles: target.roles.map(({ role }) => role.name),
        },
        after: { active },
      },
    });

    return target;
  });
}

/**
 * Desativação em massa de acessos administrativos. Nunca exclui registros,
 * para preservar o histórico de auditoria. Cada usuário roda na própria
 * transação, então uma falha isolada não impede os demais. O próprio usuário
 * logado é sempre ignorado, mesmo que o id chegue pelo formulário.
 */
export async function deactivateAdminsAction(
  ids: string[],
): Promise<AdminActionResult> {
  const actor = await requireAdminAction("users.manage");
  const parsed = adminIdsSchema.safeParse(ids);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Selecione ao menos um usuário para desativar.",
    };
  }

  const uniqueIds = [...new Set(parsed.data)];
  const skippedSelf = uniqueIds.includes(actor.id);
  const targets = uniqueIds.filter((id) => id !== actor.id);
  if (targets.length === 0) {
    return {
      ok: false,
      message: "Você não pode desativar o próprio acesso.",
    };
  }

  const failures: string[] = [];
  let deactivated = 0;

  for (const id of targets) {
    try {
      await setAdminActiveRecord(actor.id, id, false);
      deactivated += 1;
    } catch (error) {
      failures.push(
        error instanceof AdminActionError
          ? error.message
          : "Falha inesperada ao desativar um dos usuários.",
      );
    }
  }

  if (deactivated === 0) {
    return {
      ok: false,
      message: failures[0] ?? "Nenhum acesso foi desativado.",
    };
  }

  revalidatePath("/painel/usuarios");
  const selfNote = skippedSelf
    ? " Seu próprio acesso foi mantido ativo."
    : "";

  if (failures.length === 0) {
    return {
      ok: true,
      message: `${deactivated} ${deactivated === 1 ? "acesso desativado" : "acessos desativados"}.${selfNote}`,
    };
  }

  const detail = failures.slice(0, 3).join(" ");
  const rest = failures.length > 3 ? ` (+${failures.length - 3} outro(s))` : "";
  return {
    ok: false,
    message: `${deactivated} de ${targets.length} desativados. ${detail}${rest}${selfNote}`,
  };
}

/** Ativa ou desativa um único acesso administrativo pelo botão da lista. */
export async function setAdminActiveAction(
  input: unknown,
): Promise<AdminActionResult> {
  const actor = await requireAdminAction("users.manage");
  const parsed = setAdminActiveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Usuário inválido." };
  }

  if (!parsed.data.active && parsed.data.id === actor.id) {
    return {
      ok: false,
      message: "Você não pode desativar o próprio acesso.",
    };
  }

  try {
    const target = await setAdminActiveRecord(
      actor.id,
      parsed.data.id,
      parsed.data.active,
    );
    revalidatePath("/painel/usuarios");
    return {
      ok: true,
      message: `${target.name} ${parsed.data.active ? "ativado" : "desativado"}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof AdminActionError
          ? error.message
          : "Não foi possível alterar o acesso administrativo.",
    };
  }
}

/**
 * Substitui os papéis de um acesso administrativo sem recriar a conta.
 *
 * A sessão atual lê as permissões do banco a cada requisição, então a mudança
 * passa a valer imediatamente. Para evitar um bloqueio acidental, o próprio
 * usuário não pode remover de si a permissão `users.manage`.
 */
export async function updateAdminRolesAction(
  input: unknown,
): Promise<AdminActionResult> {
  const actor = await requireAdminAction("users.manage");
  const parsed = updateAdminRolesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Papéis inválidos.",
    };
  }

  const uniqueRoleIds = [...new Set(parsed.data.roleIds)];
  const roles = await prisma.role.findMany({
    where: { id: { in: uniqueRoleIds } },
    select: {
      id: true,
      name: true,
      permissions: {
        select: { permission: { select: { key: true } } },
      },
    },
  });
  if (roles.length !== uniqueRoleIds.length) {
    return {
      ok: false,
      message: "Um ou mais papéis selecionados são inválidos.",
    };
  }

  if (
    actor.id === parsed.data.id &&
    !roles.some((role) =>
      role.permissions.some(({ permission }) => permission.key === "users.manage"),
    )
  ) {
    return {
      ok: false,
      message: "Você não pode remover a própria permissão de gerenciar usuários.",
    };
  }

  try {
    const target = await prisma.$transaction(async (transaction) => {
      const before = await transaction.adminUser.findUnique({
        where: { id: parsed.data.id },
        select: {
          id: true,
          name: true,
          email: true,
          roles: { select: { role: { select: { name: true } } } },
        },
      });
      if (!before) {
        throw new AdminActionError("Acesso administrativo não encontrado.");
      }

      await transaction.adminUserRole.deleteMany({
        where: { adminUserId: before.id },
      });
      for (const roleId of uniqueRoleIds) {
        await transaction.adminUserRole.create({
          data: { adminUserId: before.id, roleId },
        });
      }

      await transaction.auditLog.create({
        data: {
          actorType: "ADMIN",
          actorAdminId: actor.id,
          action: "admin.roles.updated",
          entityType: "AdminUser",
          entityId: before.id,
          before: {
            email: before.email,
            roles: before.roles.map(({ role }) => role.name),
          },
          after: {
            email: before.email,
            roles: roles.map((role) => role.name),
          },
        },
      });

      return before;
    });

    revalidatePath("/painel/usuarios");
    return { ok: true, message: `Papéis de ${target.name} atualizados.` };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof AdminActionError
          ? error.message
          : "Não foi possível atualizar os papéis do usuário.",
    };
  }
}

export async function logoutCustomerAction(): Promise<void> {
  await endCustomerSession();
  redirect("/");
}

export async function logoutAdminAction(): Promise<void> {
  await endAdminSession();
  redirect("/admin/entrar");
}
