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
  adminLoginSchema,
  createAdminSchema,
  customerLoginSchema,
  customerSignupSchema,
  fieldErrorsFromZod,
  safeRedirectPath,
  type AuthActionState,
} from "./validation";
import {
  clearLoginFailures,
  loginRetryAfterSeconds,
  recordLoginFailure,
} from "./rate-limit";
import {
  endAdminSession,
  endCustomerSession,
  startAdminSession,
  startCustomerSession,
  requireAdminAction,
} from "./session";

const GENERIC_LOGIN_ERROR = "E-mail ou senha inválidos.";

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

export async function logoutCustomerAction(): Promise<void> {
  await endCustomerSession();
  redirect("/");
}

export async function logoutAdminAction(): Promise<void> {
  await endAdminSession();
  redirect("/admin/entrar");
}
