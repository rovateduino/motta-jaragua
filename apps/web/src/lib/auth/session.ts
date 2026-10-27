import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@motta/db";

export const CUSTOMER_SESSION_COOKIE = "motta_customer_session";
export const ADMIN_SESSION_COOKIE = "motta_admin_session";

const CUSTOMER_SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const ADMIN_SESSION_MS = 8 * 60 * 60 * 1000;

type SessionKind = "customer" | "admin";

export interface CurrentCustomer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface CurrentAdmin {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
}

function sessionConfig(kind: SessionKind) {
  return kind === "admin"
    ? {
        cookieName: ADMIN_SESSION_COOKIE,
        durationMs: ADMIN_SESSION_MS,
      }
    : {
        cookieName: CUSTOMER_SESSION_COOKIE,
        durationMs: CUSTOMER_SESSION_MS,
      };
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function requestMetadata(): Promise<{ ipAddress: string | null; userAgent: string | null }> {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip");
  const userAgent = requestHeaders.get("user-agent");

  return {
    ipAddress: ipAddress || null,
    userAgent: userAgent ? userAgent.slice(0, 300) : null,
  };
}

async function startSession(
  kind: SessionKind,
  subject: { customerId: string } | { adminUserId: string },
): Promise<void> {
  const config = sessionConfig(kind);
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + config.durationMs);
  const metadata = await requestMetadata();

  await prisma.authSession.create({
    data: {
      tokenHash: hashToken(token),
      expiresAt,
      ...subject,
      ...metadata,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(config.cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export function startCustomerSession(customerId: string): Promise<void> {
  return startSession("customer", { customerId });
}

export function startAdminSession(adminUserId: string): Promise<void> {
  return startSession("admin", { adminUserId });
}

async function deleteSessionFromCookie(kind: SessionKind): Promise<void> {
  const config = sessionConfig(kind);
  const cookieStore = await cookies();
  const token = cookieStore.get(config.cookieName)?.value;

  if (token) {
    await prisma.authSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  }

  cookieStore.delete(config.cookieName);
}

export function endCustomerSession(): Promise<void> {
  return deleteSessionFromCookie("customer");
}

export function endAdminSession(): Promise<void> {
  return deleteSessionFromCookie("admin");
}

async function readSession(kind: SessionKind) {
  const config = sessionConfig(kind);
  const cookieStore = await cookies();
  const token = cookieStore.get(config.cookieName)?.value;
  if (!token) return null;

  const session = await prisma.authSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      customer: true,
      adminUser: {
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!session || session.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  if (kind === "customer") {
    if (!session.customer || session.customer.anonymizedAt) return null;
    return {
      customer: {
        id: session.customer.id,
        name: session.customer.name,
        email: session.customer.email,
        phone: session.customer.phone,
      } satisfies CurrentCustomer,
    };
  }

  if (!session.adminUser || !session.adminUser.active) return null;

  const roles = new Set<string>();
  const permissions = new Set<string>();

  for (const userRole of session.adminUser.roles) {
    roles.add(userRole.role.name);
    for (const rolePermission of userRole.role.permissions) {
      permissions.add(rolePermission.permission.key);
    }
  }

  return {
    admin: {
      id: session.adminUser.id,
      name: session.adminUser.name,
      email: session.adminUser.email,
      roles: [...roles].sort(),
      permissions: [...permissions].sort(),
    } satisfies CurrentAdmin,
  };
}

export const getCurrentCustomer = cache(async (): Promise<CurrentCustomer | null> => {
  const session = await readSession("customer");
  return session?.customer ?? null;
});

export const getCurrentAdmin = cache(async (): Promise<CurrentAdmin | null> => {
  const session = await readSession("admin");
  return session?.admin ?? null;
});

export function hasPermission(admin: CurrentAdmin, permission: string): boolean {
  return admin.permissions.includes(permission);
}

export async function requireCustomer(nextPath = "/conta"): Promise<CurrentCustomer> {
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect(`/entrar?next=${encodeURIComponent(nextPath)}`);
  }
  return customer;
}

export async function requireAdminPage(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/entrar?next=/painel");
  }
  return admin;
}

export async function requireAdminPermission(permission: string): Promise<CurrentAdmin> {
  const admin = await requireAdminPage();
  if (!hasPermission(admin, permission)) {
    redirect(`/painel/sem-permissao?permissao=${encodeURIComponent(permission)}`);
  }
  return admin;
}

export async function requireAdminAction(permission: string): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin || !hasPermission(admin, permission)) {
    redirect("/painel/sem-permissao");
  }
  return admin;
}
